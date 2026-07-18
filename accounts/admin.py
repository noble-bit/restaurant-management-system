from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Staff

@admin.register(Staff)
class StaffAdmin(UserAdmin):
    list_display = ("username", "email", "role", "is_active")
    list_filter = ("role", "is_active")
    fieldsets = UserAdmin.fieldsets + (
        ("Restaurant info", {"fields": ("role", "phone_number", "hire_date", "must_change_password")}),
    )
    