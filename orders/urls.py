from django.urls import path
from .views import (
    OrderDetailView,
    OrderListView,
    PlaceOrderView,
    UpdateOrderStatusView,
)

app_name = "orders"


urlpatterns = [
    path("orders/", PlaceOrderView.as_view(), name="order-list-create"),
    path("orders/<int:pk>/", OrderDetailView.as_view(), name="order-detail"),
    path("orders/<int:pk>/status/", UpdateOrderStatusView.as_view(), name="order-status-update"),
]

