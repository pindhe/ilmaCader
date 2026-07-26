from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "role", "category", "is_active_account", "is_staff", "date_joined")
    list_filter = ("role", "category", "is_active_account", "is_staff")
    fieldsets = UserAdmin.fieldsets + (
        ("ilmaCader", {"fields": ("role", "category", "phone", "is_active_account", "must_change_password", "created_by")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("ilmaCader", {"fields": ("role", "category", "phone", "is_active_account")}),
    )
    search_fields = ("username", "first_name", "last_name", "email")
    autocomplete_fields = ("category", "created_by")
