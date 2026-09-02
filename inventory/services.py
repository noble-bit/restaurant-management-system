from django.db import transaction
from inventory.exceptions import IngredientNotFound, InsufficientStockError

from .models import Ingredient, StockMovement


def _apply_adjustment(ingredient, quantity_delta, reason, staff):
    """Assumes `ingredient` is already locked (select_for_update) by the caller."""
    new_quantity = ingredient.quantity_on_hand + quantity_delta

    if new_quantity < 0:
        raise InsufficientStockError(ingredient, -quantity_delta)


    ingredient.quantity_on_hand = new_quantity

    if ingredient.is_low_stock_alerted and new_quantity >= ingredient.reorder_threshold:
        ingredient.is_low_stock_alerted = False

    ingredient.save()

    StockMovement.objects.create(
        ingredient=ingredient,
        quantity_delta=quantity_delta,
        reason=reason,
        staff=staff,
    )

    return ingredient


@transaction.atomic
def adjust_stock(ingredient_id, quantity_delta, reason, staff):
    try:
        ingredient = Ingredient.objects.select_for_update().get(id=ingredient_id)
    except Ingredient.DoesNotExist:
        raise IngredientNotFound(f"No ingredient with id={ingredient_id}")

    return _apply_adjustment(ingredient, quantity_delta, reason, staff)


def restock(ingredient_id, quantity, staff):
    return adjust_stock(
        ingredient_id,
        quantity_delta=quantity,
        reason=StockMovement.ReasonChoices.RESTOCK,
        staff=staff,
    )


@transaction.atomic
def deduct_stock_bulk(ingredient_quantities, staff, reason=StockMovement.ReasonChoices.ORDER_DEDUCTION):
    ingredients_id = sorted(ingredient_quantities.keys())
    ingredients = Ingredient.objects.select_for_update().filter(id__in=ingredients_id)
    ingredients_by_id = {ing.id: ing for ing in ingredients}

    #validation: ensure all ingredients exist and have sufficient stock
    for ingredient_id, needed_quantity in ingredient_quantities.items():
        ingredient = ingredients_by_id[ingredient_id]

        if ingredient.quantity_on_hand < needed_quantity:
            raise InsufficientStockError(ingredient, needed_quantity)

    updated = []
    for ingredient_id, needed_quantity in ingredient_quantities.items():
            ingredient = ingredients_by_id[ingredient_id]
            updated.append(_apply_adjustment(ingredient, -needed_quantity, reason, staff))

    return updated

def reverse_order_deduction(ingredient_quantities, staff):
    ...
