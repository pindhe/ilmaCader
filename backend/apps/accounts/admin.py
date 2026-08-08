from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from apps.accounts.models import EmailVerificationToken, LoginHistory, PasswordResetToken, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("email",)
    list_display = (
        "email",
        "full_name",
        "role",
        "email_verified",
        "is_suspended",
        "is_staff",
        "is_active",
        "date_joined",
    )
    list_filter = ("role", "email_verified", "is_suspended", "is_staff", "is_active")
    search_fields = ("email", "full_name", "phone", "username")
    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        (
            "Profile",
            {
                "fields": (
                    "full_name",
                    "phone",
                    "role",
                    "avatar",
                    "preferred_language",
                    "preferred_currency",
                    "theme",
                )
            },
        ),
        (
            "Status",
            {
                "fields": (
                    "email_verified",
                    "is_suspended",
                    "two_factor_enabled",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                )
            },
        ),
        ("Permissions", {"fields": ("groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "password1", "password2", "role"),
            },
        ),
    )


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "token", "expires_at", "used", "created_at")
    list_filter = ("used",)
    search_fields = ("user__email", "token")
    readonly_fields = ("token", "created_at", "updated_at")


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "token", "expires_at", "used", "created_at")
    list_filter = ("used",)
    search_fields = ("user__email", "token")
    readonly_fields = ("token", "created_at", "updated_at")


@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "ip_address", "successful", "created_at")
    list_filter = ("successful",)
    search_fields = ("user__email", "ip_address", "user_agent")
    readonly_fields = ("created_at", "updated_at")
