from django.db import models
from django.core.validators import MinValueValidator
from inventory.models import Ingredient


class MenuCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    category = models.ForeignKey(MenuCategory, on_delete=models.PROTECT, related_name="menu_items")
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])

   
    is_active = models.BooleanField(default=True)  # manual on/off switch (soft delete + manager toggle)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def is_available(self):
       
        if not self.is_active:
            return False

        recipe_rows = list(self.ingredients.all())  # uses related_name="ingredients"
        if not recipe_rows:
            return False

        return all(
            row.ingredient.quantity_on_hand >= row.quantity_required
            for row in recipe_rows
        )


class MenuItemIngredient(models.Model):
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name="ingredients")
    ingredient = models.ForeignKey(Ingredient, on_delete=models.PROTECT)
    quantity_required = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])

    class Meta:
        unique_together = ("menu_item", "ingredient")