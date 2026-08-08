from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.core.models import ActivityLog
from apps.core.permissions import IsSuperAdmin, user_has_min_role
from apps.core.serializers import ActivityLogSerializer, PlatformSettingsSerializer
from apps.core.utils import api_response
from apps.families.models import PlatformSettings


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["module", "user", "family"]
    search_fields = ["action", "module"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = ActivityLog.objects.select_related("user", "family")
        family_id = (
            self.kwargs.get("family_id")
            or self.request.query_params.get("family")
        )
        user = self.request.user
        if family_id:
            if not user_has_min_role(user, family_id, "viewer"):
                return qs.none()
            return qs.filter(family_id=family_id)
        if user.role == "super_admin" or user.is_superuser:
            return qs
        membership_ids = user.memberships.filter(is_active=True).values_list(
            "family_id", flat=True
        )
        return qs.filter(family_id__in=membership_ids)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page or queryset, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return api_response(True, "Activity logs retrieved.", serializer.data)

    def retrieve(self, request, *args, **kwargs):
        return api_response(
            True, "Activity log retrieved.", self.get_serializer(self.get_object()).data
        )


class PlatformSettingsViewSet(viewsets.ModelViewSet):
    """Super-admin platform configuration (optional companion to user settings on /api/auth/me/)."""

    queryset = PlatformSettings.objects.all()
    serializer_class = PlatformSettingsSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    lookup_field = "key"
    search_fields = ["key", "description"]
    ordering = ["key"]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page or queryset, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return api_response(True, "Platform settings retrieved.", serializer.data)

    def retrieve(self, request, *args, **kwargs):
        return api_response(
            True, "Platform setting retrieved.", self.get_serializer(self.get_object()).data
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        setting = serializer.save()
        return api_response(
            True,
            "Platform setting created.",
            self.get_serializer(setting).data,
            status_code=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        setting = self.get_object()
        serializer = self.get_serializer(setting, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        setting = serializer.save()
        return api_response(True, "Platform setting updated.", self.get_serializer(setting).data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        setting = self.get_object()
        setting.delete()
        return api_response(True, "Platform setting deleted.")
