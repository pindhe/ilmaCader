from django.contrib import admin

from apps.documents.models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "family",
        "category",
        "member",
        "expiration_date",
        "uploaded_by",
        "is_deleted",
        "created_at",
    )
    list_filter = ("category", "is_deleted", "expiration_date")
    search_fields = ("title", "notes", "family__name", "member__full_name")
    autocomplete_fields = ("family", "member", "uploaded_by")
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")
    ordering = ("-created_at",)
