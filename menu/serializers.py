from rest_framework import serializers
from django.db import transaction
from .models import MenuCategory, MenuItem, MenuItemIngredient
from inventory.models import Ingredient
from inventory.serializers import IngredientSerializer 

class MenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = "__all__"


class MenuItemIngredientSerializer(serializers.ModelSerializer):
    # READ: full ingredient detail (name, unit, etc.)
    ingredient = IngredientSerializer(read_only=True)
    # WRITE: client sends just the ingredient's id
    ingredient_id = serializers.PrimaryKeyRelatedField(
        queryset=Ingredient.objects.all(),
        source="ingredient",
        write_only=True
    )

    class Meta:
        model = MenuItemIngredient
        fields = ["ingredient", "ingredient_id", "quantity_required"]


class MenuItemSerializer(serializers.ModelSerializer):
    # READ: full category detail
    category = MenuCategorySerializer(read_only=True)
    # WRITE: client sends just the category's id
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=MenuCategory.objects.all(),
        source="category",
        write_only=True
    )
    # nested recipe rows — read AND write, matches related_name="ingredients" on the model
    ingredients = MenuItemIngredientSerializer(many=True)

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "category",
            "category_id",
            "name",
            "description",
            "price",
            "is_available",
            "ingredients",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_ingredients(self, value):
        if not value:
            raise serializers.ValidationError("A menu item must have at least one ingredient.")
        return value

    def create(self, validated_data):
        ingredients_data = validated_data.pop("ingredients")
        with transaction.atomic():
            menu_item = MenuItem.objects.create(**validated_data)
            MenuItemIngredient.objects.bulk_create([
                MenuItemIngredient(menu_item=menu_item, **ingredient_data)
                for ingredient_data in ingredients_data
            ])
        return menu_item

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop("ingredients", None)

        with transaction.atomic():
            # update plain MenuItem fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            # if ingredients were sent, replace the recipe entirely
            if ingredients_data is not None:
                instance.ingredients.all().delete()
                MenuItemIngredient.objects.bulk_create([
                    MenuItemIngredient(menu_item=instance, **ingredient_data)
                    for ingredient_data in ingredients_data
                ])

        return instance