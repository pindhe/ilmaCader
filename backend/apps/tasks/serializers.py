from rest_framework import serializers

from apps.tasks.models import Task


class TaskSerializer(serializers.ModelSerializer):
    assigned_member_name = serializers.CharField(
        source="assigned_member.full_name", read_only=True, default=None
    )
    created_by_name = serializers.CharField(
        source="created_by.full_name", read_only=True, default=None
    )

    class Meta:
        model = Task
        fields = (
            "id",
            "family",
            "title",
            "description",
            "assigned_member",
            "assigned_member_name",
            "priority",
            "due_date",
            "status",
            "created_by",
            "created_by_name",
            "is_deleted",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "family",
            "created_by",
            "is_deleted",
            "created_at",
            "updated_at",
        )

    def validate_assigned_member(self, value):
        if value is None:
            return value
        request = self.context.get("request")
        family = self.initial_data.get("family") or (
            self.instance.family_id if self.instance else None
        )
        if not family and request:
            family = request.query_params.get("family") or request.data.get("family")
        if family and str(value.family_id) != str(family):
            raise serializers.ValidationError("Assigned member must belong to the same family.")
        return value
