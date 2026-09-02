from rest_framework import serializers
from .models import Order, OrderItem


class PlaceOrderItemSerializer(serializers.Serializer):
    """
    Serializer for individual order line items within order placement payload.
    """
    menu_item_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, default=1)
    note = serializers.CharField(required=False, allow_blank=True, default="")


class PlaceOrderSerializer(serializers.Serializer):
    """
    Plain Serializer for validating order creation request payloads.
    """
    items = PlaceOrderItemSerializer(many=True, allow_empty=False)
    order_type = serializers.ChoiceField(
        choices=Order.OrderType.choices, default=Order.OrderType.DINE_IN
    )
    table_number = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        order_type = attrs.get("order_type", Order.OrderType.DINE_IN)
        table_number = attrs.get("table_number", "").strip()

        # Enforce table_number for DINE_IN order type
        if order_type == Order.OrderType.DINE_IN and not table_number:
            raise serializers.ValidationError(
                {"table_number": "Table number is required for dine-in orders."}
            )

        attrs["table_number"] = table_number
        return attrs


class OrderItemSerializer(serializers.ModelSerializer):
    """
    Read-only ModelSerializer for OrderItem output representation.
    """
    menu_item_name = serializers.CharField(source="menu_item.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "menu_item",
            "menu_item_name",
            "quantity",
            "price_at_order",
            "note",
        ]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    """
    Read-only ModelSerializer for complete Order output representation.
    """
    staff_name = serializers.CharField(source="staff.username", read_only=True)
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "staff",
            "staff_name",
            "status",
            "order_type",
            "table_number",
            "total_price",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
