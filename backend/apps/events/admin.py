from django.contrib import admin

from apps.events.models import Announcement, Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "family",
        "event_type",
        "date",
        "time",
        "location",
        "organizer",
        "is_deleted",
        "created_at",
    )
    list_filter = ("event_type", "date", "is_deleted")
    search_fields = ("name", "location", "description", "family__name")
    autocomplete_fields = ("family", "organizer", "created_by")
    filter_horizontal = ("participants",)
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")
    ordering = ("date", "time")


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "family",
        "priority",
        "audience",
        "author",
        "is_published",
        "is_deleted",
        "created_at",
    )
    list_filter = ("priority", "is_published", "is_deleted", "audience")
    search_fields = ("title", "message", "family__name")
    autocomplete_fields = ("family", "author")
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")
    ordering = ("-created_at",)
