from django.urls import path
from .views import ProcessPaymentView

app_name = "payments"

urlpatterns = [
    path("orders/<int:pk>/pay/", ProcessPaymentView.as_view(), name="process-payment"),
]