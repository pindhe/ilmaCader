from rest_framework import serializers

from apps.events.models import Announcement, Event


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = (
            "id",
            "family",
            "name",
            "event_type",
            "date",
            "time",
            "location",
            "organizer",
            "description",
            "participants",
            "image",
            "attachment",
            "created_by",
            "created_at",
            "updated_at",
            "is_deleted",
        )
        read_only_fields = (
            "id",
            "family",
            "created_by",
            "created_at",
            "updated_at",
            "is_deleted",
        )


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = (
            "id",
            "family",
            "title",
            "message",
            "image",
            "priority",
            "audience",
            "author",
            "is_published",
            "created_at",
            "updated_at",
            "is_deleted",
        )
        read_only_fields = (
            "id",
            "family",
            "author",
            "created_at",
            "updated_at",
            "is_deleted",
        )
