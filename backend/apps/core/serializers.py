from rest_framework import serializers

from apps.core.models import ActivityLog
from apps.families.models import PlatformSettings


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True, default=None)
    family_name = serializers.CharField(source="family.name", read_only=True, default=None)

    class Meta:
        model = ActivityLog
        fields = (
            "id",
            "user",
            "user_name",
            "family",
            "family_name",
            "action",
            "module",
            "details",
            "ip_address",
            "user_agent",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = ("id", "key", "value", "description", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")
