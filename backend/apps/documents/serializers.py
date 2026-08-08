import os

from django.conf import settings
from rest_framework import serializers

from apps.documents.models import Document


class DocumentSerializer(serializers.ModelSerializer):
    status = serializers.CharField(read_only=True)
    member_name = serializers.CharField(source="member.full_name", read_only=True, default=None)
    uploaded_by_name = serializers.CharField(
        source="uploaded_by.full_name", read_only=True, default=None
    )
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = (
            "id",
            "family",
            "title",
            "category",
            "file",
            "file_url",
            "member",
            "member_name",
            "expiration_date",
            "notes",
            "status",
            "uploaded_by",
            "uploaded_by_name",
            "is_deleted",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "family",
            "uploaded_by",
            "is_deleted",
            "created_at",
            "updated_at",
        )

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url

    def validate_file(self, value):
        if not value:
            raise serializers.ValidationError("File is required.")
        ext = os.path.splitext(value.name)[1].lower()
        allowed = getattr(settings, "ALLOWED_UPLOAD_EXTENSIONS", set())
        if allowed and ext not in allowed:
            raise serializers.ValidationError(
                f"File type '{ext}' is not allowed. Allowed: {', '.join(sorted(allowed))}."
            )
        max_size = getattr(settings, "FILE_UPLOAD_MAX_MEMORY_SIZE", 10 * 1024 * 1024)
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File exceeds maximum size of {max_size // (1024 * 1024)}MB."
            )
        return value

    def validate_member(self, value):
        if value is None:
            return value
        family = self.initial_data.get("family") or (
            self.instance.family_id if self.instance else None
        )
        request = self.context.get("request")
        if not family and request:
            family = request.query_params.get("family") or request.data.get("family")
        if family and str(value.family_id) != str(family):
            raise serializers.ValidationError("Member must belong to the same family.")
        return value
