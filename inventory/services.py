from django.db import transaction

from .models import Ingredient, StockMovement


def _apply_adjustment(ingredient, quantity_delta, reason, staff):
    """Assumes `ingredient` is already locked (select_for_update) by the caller."""
    new_quantity = ingredient.quantity_on_hand + quantity_delta

    if new_quantity < 0:
        raise ValueError(
            f"Insufficient stock for {ingredient.name}: "
            f"have {ingredient.quantity_on_hand}, need {-quantity_delta}."
        )

    ingredient.quantity_on_hand = new_quantity
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
        raise ValueError("Ingredient update failed.")

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
    ...


def reverse_order_deduction(ingredient_quantities, staff):
    ...