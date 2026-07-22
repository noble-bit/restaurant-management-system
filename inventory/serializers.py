from restframework import serializers
from .models import Ingredient, StockMovement

class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = "__all__"

class IngredientSerializer(serializers.ModelSerializer):
    staff = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Ingredient
        fields = "__all__"
        read_only_fields = ["quantity_on_hand"]

