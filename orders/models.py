from decimal import Decimal
from django.conf import settings
from django.db import models


class Order(models.Model):
    """
    Represents a customer order placed by a staff member.
    """
    class StatusChoices(models.TextChoices):
        PENDING = "pending", "Pending"
        PREPARING = "preparing", "Preparing"
        READY = "ready", "Ready"
        SERVED = "served", "Served"
        PAID = "paid", "Paid"
        CANCELLED = "cancelled", "Cancelled"

    class OrderType(models.TextChoices):
        DINE_IN = "dine_in", "Dine In"
        TAKEOUT = "takeout", "Takeout"
        DELIVERY = "delivery", "Delivery"

    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.PENDING)
    order_type = models.CharField(max_length=20, choices=OrderType.choices, default=OrderType.DINE_IN)
    table_number = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_price(self):
        """Calculates total price across all ordered items."""
        return sum((item.price_at_order * item.quantity for item in self.items.all()), Decimal("0.00"))

    def __str__(self):
        return f"Order #{self.id} ({self.status})"


class OrderItem(models.Model):
    """
    Line item belonging to an Order with price_at_order snapshot.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey("menu.MenuItem", on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    price_at_order = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name} (Order #{self.order_id})"
