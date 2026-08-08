from django.contrib import admin

from apps.notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "user",
        "family",
        "notification_type",
        "is_read",
        "created_at",
    )
    list_filter = ("notification_type", "is_read", "created_at")
    search_fields = ("title", "message", "user__email", "user__full_name", "family__name")
    autocomplete_fields = ("user", "family")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)
