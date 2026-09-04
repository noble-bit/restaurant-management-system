from django.urls import path
from .views import (
    OrderDetailView,
    OrderListView,
    PlaceOrderView,
    UpdateOrderStatusView,
)

app_name = "orders"


def order_list_or_create_view(request, *args, **kwargs):
    if request.method == "POST":
        return PlaceOrderView.as_view()(request, *args, **kwargs)
    return OrderListView.as_view()(request, *args, **kwargs)


urlpatterns = [
    path("orders/", order_list_or_create_view, name="order-list-create"),
    path("orders/<int:pk>/", OrderDetailView.as_view(), name="order-detail"),
    path("orders/<int:pk>/status/", UpdateOrderStatusView.as_view(), name="order-status-update"),
]
