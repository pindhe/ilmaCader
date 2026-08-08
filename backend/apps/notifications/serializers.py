from rest_framework import serializers

from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            "id",
            "family",
            "user",
            "title",
            "message",
            "notification_type",
            "link",
            "is_read",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "family",
            "user",
            "title",
            "message",
            "notification_type",
            "link",
            "created_at",
            "updated_at",
        )
