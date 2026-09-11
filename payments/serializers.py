# payments/serializers.py
from rest_framework import serializers
from .models import Payment


class ProcessPaymentSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=Payment.Method.choices)


class PaymentSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source="order.id", read_only=True)
    processed_by_name = serializers.CharField(source="processed_by.username", read_only=True)

    class Meta:
        model = Payment
        fields = ["id", "order_id", "amount", "method", "status", "processed_by_name", "created_at"]
        read_only_fields = fields