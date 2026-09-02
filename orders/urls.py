from django.urls import path
from .views import PlaceOrderView

app_name = "orders"

urlpatterns = [
    path("orders/", PlaceOrderView.as_view(), name="order-place"),
]
