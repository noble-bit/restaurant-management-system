from django.urls import path, include
from .views import UserViewSet
from .views import StaffListCreateView


app_name = "accounts"

urlpatterns = [
    # --- Staff management (yours, permission-gated) ---
    path("staff/", StaffListCreateView.as_view(), name="staff-list-create"),

    # --- Self-service (djoser's UserViewSet, cherry-picked actions only) ---
    path("auth/users/me/", UserViewSet.as_view({
        "get": "me", "put": "me", "patch": "me",
    }), name="user-me"),

    path("auth/users/set_password/", UserViewSet.as_view({
        "post": "set_password",
    }), name="set-password"),

    # --- Login/refresh/verify (safe to include fully — no account creation here) ---
    path("auth/", include("djoser.urls.jwt")),
]