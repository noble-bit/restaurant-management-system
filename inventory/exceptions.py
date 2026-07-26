# inventory/exceptions.py
class IngredientNotFound(Exception):
    pass

class InsufficientStockError(Exception):
    def __init__(self, ingredient, requested):
        self.ingredient = ingredient
        self.requested = requested
        super().__init__(
            f"Insufficient stock for {ingredient.name}: "
            f"have {ingredient.quantity_on_hand}, need {requested}."
        )

