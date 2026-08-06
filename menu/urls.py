from rest_framework.routers import DefaultRouter
from .views import MenuCategoryViewSet, MenuItemViewSet

app_name = "menu"

router = DefaultRouter()
router.register("categories", MenuCategoryViewSet, basename="menucategory")
router.register("items", MenuItemViewSet, basename="menuitem")

urlpatterns = router.urls