# payments/views.py
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.exceptions import InvalidStatusTransition, OrderPermissionDenied
from orders.models import Order

from .serializers import PaymentSerializer, ProcessPaymentSerializer
from .services import process_payment


class ProcessPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # role check happens inside update_order_status, same reasoning as UpdateOrderStatusView

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk)

        serializer = ProcessPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payment = process_payment(
                order=order,
                method=serializer.validated_data["method"],
                staff=request.user,
            )
        except InvalidStatusTransition as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except OrderPermissionDenied as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

