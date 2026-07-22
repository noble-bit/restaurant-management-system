from django.db import transaction
from .models import Ingredient, StockMovement

@transaction.atomic
def adjust_stock(quantity_delta, reason, ingredient, staff):
    try:
        ingredients = Ingredient.objects.select_for_update().get(id=ingredient.id)
    except Ingredient.DoesNotExist:
        raise ValueError("Ingredient update failed.")

    
    new_quantity = ingredients.quantity_on_hand + quantity_delta
    
    if new_quantity < 0:
        raise ValueError("Insufficient stock for the operation.")
    
    ingredients.quantity_on_hand = new_quantity
    ingredients.save()

    StockMovement.objects.create(
            ingredient=ingredients,
            quantity_delta=quantity_delta,
            reason=reason,
            staff=staff
        )
    
    return ingredients

def restock(ingredient, quantity, staff):
    return adjust_stock(ingredient, quantity_delta=quantity, reason="restock", staff=staff)
