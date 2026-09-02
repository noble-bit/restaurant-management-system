from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .exceptions import MenuItemNotActive, MenuItemOutOfStock
from .permissions import CanPlaceOrder
from .serializers import OrderSerializer, PlaceOrderSerializer
from .services import place_order


class PlaceOrderView(APIView):
    """
    POST /orders/ - Endpoint to place a new order.
    
    Validates request payload, invokes place_order service, and returns
    the created Order serialized via OrderSerializer.
    """
    permission_classes = [CanPlaceOrder]

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
