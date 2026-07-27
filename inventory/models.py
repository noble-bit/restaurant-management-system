from django.db import models
from django.conf import settings

class Ingredient(models.Model):
    
    class UnitOfMeasure(models.TextChoices):
        GRAMS = "g", "Grams"
        KILOGRAMS = "kg", "Kilograms"
        LITERS = "l", "Liters"
        MILLILITERS = "ml", "Milliliters"
        PIECES = "pcs", "Pieces"
    
    name = models.CharField(max_length=100, unique=True)
    quantity_on_hand = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit_of_measure = models.CharField(max_length=3, choices=UnitOfMeasure.choices, default=UnitOfMeasure.GRAMS)
    reorder_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    is_low_stock_alerted = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    @property
    def is_low_stock(self):
        return self.quantity_on_hand < self.reorder_threshold


class StockMovement(models.Model):
    class ReasonChoices(models.TextChoices):
        RESTOCK = "restock", "Restock"
        ORDER_DEDUCTION = "order_deduction", "Order Deduction"
        WASTE = "waste", "Waste"
        CORRECTION = "correction", "Correction"
    
    ingredient = models.ForeignKey(Ingredient, on_delete=models.PROTECT, related_name="stock_movements")
    quantity_delta = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=20, choices=ReasonChoices.choices)
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.ingredient.name} {self.quantity_delta} ({self.reason})"
    