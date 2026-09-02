from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("accounts.urls")),
    path("api/v1/", include("inventory.urls")),
    path("api/v1/", include("menu.urls")),
    path("api/v1/", include("orders.urls")),
]
