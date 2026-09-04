import django_filters
from .models import Order


class OrderFilter(django_filters.FilterSet):
    status = django_filters.BaseInFilter(field_name="status")  # supports ?status=pending,preparing

    class Meta:
        model = Order
        fields = ["status", "order_type"]
