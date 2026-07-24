from rest_framework.decorators import action

from .models import Ingredient, StockMovement
from .serializers import IngredientSerializer, StockMovementSerializer, RestockSerializer
from accounts.permissions import IsOwnerOrManager, IsChef, IsStaffUser
from rest_framework import viewsets
from .services import restock

class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.filter(is_active=True)
    serializer_class = IngredientSerializer
    permission_classes = [IsOwnerOrManager | IsChef]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=["get"])
    def low_stock(self, request):
        low_stock_ingredients = [i for i in self.get_queryset() if i.is_low_stock]
        serializer = self.get_serializer(low_stock_ingredients, many=True)

        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def restock(self, request, pk=None):
        ingredient = self.get_object()
        serializer = RestockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated_ingredients = restock(
                ingredient_id=ingredient.id,
                quantity=serializer.validated_data["quantity"],
                staff = request.user
            )
        except ValueError as e:
                        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(IngredientSerializer(updated_ingredients).data, status=status.HTTP_200_OK)


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsStaffUser]






