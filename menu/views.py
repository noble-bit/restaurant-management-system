from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action

from .models import MenuCategory, MenuItem, MenuItemIngredient
from .serializers import MenuCategorySerializer, MenuItemSerializer, MenuItemIngredientSerializer
from accounts.permissions import IsOwnerOrManager, IsChef


class MenuCategoryViewSet(viewsets.ModelViewSet):
    queryset = MenuCategory.objects.all().order_by("display_order")
    serializer_class = MenuCategorySerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [IsOwnerOrManager | IsChef]
        else:
            permission_classes = [IsOwnerOrManager]
        return [p() for p in permission_classes]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
        

class MenuItemViewSet(viewsets.ModelViewSet):
    serializer_class = MenuItemSerializer

    def get_queryset(self):
        
        return (
            MenuItem.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related("ingredients__ingredient")
        )

    def get_permissions(self):
        if self.action in ["list", "retrieve", "available"]:
            permission_classes = [IsOwnerOrManager | IsChef]
        else:
            permission_classes = [IsOwnerOrManager]
        return [p() for p in permission_classes]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=["get"])
    def available(self, request):
        
        items = [item for item in self.get_queryset() if item.is_available]
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get", "post"])
    def recipe(self, request, pk=None):
        menu_item = self.get_object()

        if request.method == "GET":
            serializer = MenuItemIngredientSerializer(menu_item.ingredients.all(), many=True)
            return Response(serializer.data)

        
        serializer = MenuItemIngredientSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(menu_item=menu_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path="recipe/(?P<ri_id>[^/.]+)")
    def remove_recipe_ingredient(self, request, pk=None, ri_id=None):
        menu_item = self.get_object()
        deleted, _ = menu_item.ingredients.filter(id=ri_id).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)