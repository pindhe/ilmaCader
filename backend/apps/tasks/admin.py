from django.contrib import admin

from apps.tasks.models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "family",
        "status",
        "priority",
        "assigned_member",
        "due_date",
        "created_by",
        "is_deleted",
        "created_at",
    )
    list_filter = ("status", "priority", "is_deleted", "due_date")
    search_fields = ("title", "description", "family__name", "assigned_member__full_name")
    autocomplete_fields = ("family", "assigned_member", "created_by")
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")
    ordering = ("status", "due_date")
