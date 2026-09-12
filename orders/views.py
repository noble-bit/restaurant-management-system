from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .exceptions import (
    InvalidStatusTransition,
    MenuItemNotActive,
    MenuItemOutOfStock,
    OrderPermissionDenied,
)
from .filters import OrderFilter
from .models import Order
from .permissions import CanPlaceOrder
from .serializers import OrderSerializer, PlaceOrderSerializer
from .services import place_order, update_order_status
from payments.models import Payment
from payments.serializers import PaymentInfoSerializer


class PlaceOrderView(generics.ListCreateAPIView):
    """
    GET /orders/ - List all orders filtered by status and order_type.
    POST /orders/ - Endpoint to place a new order.
    """
    queryset = Order.objects.all().order_by("-created_at")
    serializer_class = OrderSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = OrderFilter

    def get_permissions(self):
        if self.request.method == "POST":
            return [CanPlaceOrder()]
        return [permissions.IsAuthenticated()]

    def post(self, request, *args, **kwargs):
        serializer = PlaceOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = place_order(staff=request.user, validated_data=serializer.validated_data)
        except MenuItemNotActive as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except MenuItemOutOfStock as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)

        output_serializer = OrderSerializer(order)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


OrderListView = PlaceOrderView



class OrderDetailView(generics.RetrieveAPIView):
    """
    GET /orders/{id}/ - Retrieve detail of a single order.
    """
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]


class OrderPaymentInfoView(generics.RetrieveAPIView):
    """
    GET /orders/{id}/payment/ - Retrieve payment detail of a single order.
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentInfoSerializer
    permission_classes = [permissions.IsAuthenticated]

    lookup_field = "order_id"
    lookup_url_kwarg = "pk"
    
class UpdateOrderStatusView(APIView):
    """
    PATCH /orders/{id}/status/ - Update order status.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk, *args, **kwargs):
        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get("status")

        try:
            updated_order = update_order_status(order=order, new_status=new_status, staff=request.user)
        except InvalidStatusTransition as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except OrderPermissionDenied as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        output_serializer = OrderSerializer(updated_order)
        return Response(output_serializer.data, status=status.HTTP_200_OK)
