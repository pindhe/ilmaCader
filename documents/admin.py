from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "doc_type", "user", "uploaded_at")
    list_filter = ("doc_type",)
    search_fields = ("title", "user__username")
