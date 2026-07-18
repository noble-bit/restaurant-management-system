from rest_framework import generics, status
from .serializers import StaffCreateSerializer
from .permissions import IsOwnerOrManager
from .models import Staff
from djoser.views import UserViewSet as DjoserUserViewSet


class StaffListCreateView(generics.ListCreateAPIView):
    queryset = Staff.objects.all()
    serializer_class = StaffCreateSerializer
    permission_classes = [IsOwnerOrManager]   



class UserViewSet(DjoserUserViewSet):
    def set_password(self, request, *args, **kwargs):
        response = super().set_password(request, *args, **kwargs)
        if response.status_code == 204:
            request.user.must_change_password = False
            request.user.save(update_fields=["must_change_password"])
        return response

