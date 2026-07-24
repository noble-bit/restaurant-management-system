from rest_framework.permissions import BasePermission

class IsOwnerOrManager(BasePermission):

    def has_permission(self, request, view):
        # Allow access if the user is a manager or owner
        return bool(
            request.user and request.user.is_authenticated and (request.user.role == "manager" or request.user.role == "owner")
        )

class IsChef(BasePermission):

    def has_permission(self, request, view):
        # Allow access if the user is a chef
        return bool(
            request.user and request.user.is_authenticated and request.user.role == "chef"
        )


class IsStaffUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
    