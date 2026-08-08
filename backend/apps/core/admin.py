from django.contrib import admin

from apps.core.models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("action", "module", "user", "family", "ip_address", "created_at")
    list_filter = ("module", "created_at")
    search_fields = ("action", "module", "user__email", "user__full_name", "family__name")
    autocomplete_fields = ("user", "family")
    readonly_fields = (
        "id",
        "user",
        "family",
        "action",
        "module",
        "details",
        "ip_address",
        "user_agent",
        "created_at",
        "updated_at",
    )
    ordering = ("-created_at",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
