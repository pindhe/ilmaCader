from django.contrib import admin
from .models import AuditLog, SiteSettings


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ("site_name", "support_email", "updated_at")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "user", "action", "model_name", "message")
    list_filter = ("action", "created_at")
    search_fields = ("message", "model_name", "user__username")
    readonly_fields = ("created_at",)
