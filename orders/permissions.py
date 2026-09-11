from rest_framework.permissions import BasePermission


class CanPlaceOrder(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("waiter", "manager", "owner")
        )


