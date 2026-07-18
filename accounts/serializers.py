from rest_framework import serializers
from django.contrib.auth.hashers import make_password
import secrets
from .models import Staff
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from djoser.serializers import SetPasswordSerializer as DjoserSetPasswordSerializer

class StaffCreateSerializer(serializers.ModelSerializer):
    # DRF will automatically look for 'temp_password' on the instance
    temp_password = serializers.CharField(read_only=True)

    class Meta:
        model = Staff
        fields = ["id", "username", "email", "first_name", "last_name", "role", "phone_number", "hire_date", "must_change_password", "temp_password"]

    def create(self, validated_data):
        temp_password = secrets.token_urlsafe(12)
        validated_data["password"] = make_password(temp_password)
        validated_data["must_change_password"] = True
        
        instance = super().create(validated_data)
        
        instance.temp_password = temp_password 
        return instance

    

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = ["id", "username", "email", "first_name", "last_name", "role", "phone_number", "hire_date", "must_change_password"]
        read_only_fields = ["role", "must_change_password"]
        
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["must_change_password"] = self.user.must_change_password
        data["role"] = self.user.role
        return data



class SetPasswordSerializer(DjoserSetPasswordSerializer):
    def save(self, **kwargs):
        user = super().save(**kwargs)
        user.must_change_password = False
        user.save(update_fields=["must_change_password"])
        return user
    