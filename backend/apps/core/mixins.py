from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import user_has_min_role
from apps.core.utils import log_activity


class FamilyScopedQuerysetMixin:
    family_field = "family"
    require_role = "viewer"

    def get_family_id(self):
        return (
            self.kwargs.get("family_id")
            or self.request.query_params.get("family")
            or self.request.data.get("family")
        )

    def get_queryset(self):
        qs = super().get_queryset()
        family_id = self.get_family_id()
        if family_id:
            if not user_has_min_role(self.request.user, family_id, self.require_role):
                return qs.none()
            filters = {self.family_field: family_id}
            if hasattr(qs.model, "is_deleted"):
                filters["is_deleted"] = False
            return qs.filter(**filters)
        # Super admins can list across families when no family filter provided
        if self.request.user.role == "super_admin" or self.request.user.is_superuser:
            if hasattr(qs.model, "is_deleted"):
                return qs.filter(is_deleted=False)
            return qs
        membership_ids = self.request.user.memberships.filter(is_active=True).values_list(
            "family_id", flat=True
        )
        filters = {f"{self.family_field}__in": membership_ids}
        if hasattr(qs.model, "is_deleted"):
            filters["is_deleted"] = False
        return qs.filter(**filters)

    def perform_create(self, serializer):
        family_id = self.get_family_id()
        kwargs = {}
        if family_id and "family" in getattr(serializer.Meta.model, "_meta").fields_map or True:
            if "family" in [f.name for f in serializer.Meta.model._meta.fields]:
                kwargs["family_id"] = family_id
        if "created_by" in [f.name for f in serializer.Meta.model._meta.fields]:
            kwargs["created_by"] = self.request.user
        instance = serializer.save(**kwargs)
        log_activity(
            self.request,
            f"Created {serializer.Meta.model.__name__}",
            module=serializer.Meta.model._meta.app_label,
            family=getattr(instance, "family", None),
            details={"id": str(instance.pk)},
        )
        return instance


class SoftDeleteMixin:
    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        obj = self.get_object()
        obj.is_deleted = True
        obj.deleted_at = timezone.now()
        if hasattr(obj, "is_archived"):
            obj.is_archived = True
        obj.save()
        return Response({"success": True, "message": "Record archived."})

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        obj = self.get_object()
        obj.is_deleted = False
        obj.deleted_at = None
        if hasattr(obj, "is_archived"):
            obj.is_archived = False
        obj.save()
        return Response({"success": True, "message": "Record restored."})

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.is_deleted = True
        obj.deleted_at = timezone.now()
        obj.save()
        return Response(
            {"success": True, "message": "Record deleted."},
            status=status.HTTP_200_OK,
        )
