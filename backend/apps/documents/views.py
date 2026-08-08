from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.core.mixins import FamilyScopedQuerysetMixin, SoftDeleteMixin
from apps.core.ownership import get_user_member, scope_to_own_member
from apps.core.permissions import IsFamilyContributor, user_has_min_role
from apps.core.utils import api_response, log_activity, notify_family_members
from apps.documents.models import Document
from apps.documents.serializers import DocumentSerializer


class DocumentViewSet(FamilyScopedQuerysetMixin, SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = Document.objects.select_related("family", "member", "uploaded_by")
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated, IsFamilyContributor]
    require_role = "viewer"
    filterset_fields = ["category", "member", "family"]
    search_fields = ["title", "notes", "category", "member__full_name"]
    ordering_fields = ["title", "category", "expiration_date", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        qs = scope_to_own_member(qs, self.request.user, self.get_family_id(), "member")
        status_param = self.request.query_params.get("status")
        if status_param:
            today = timezone.now().date()
            soon = today + timedelta(days=30)
            if status_param == "expired":
                qs = qs.filter(expiration_date__lt=today)
            elif status_param == "expiring_soon":
                qs = qs.filter(expiration_date__gte=today, expiration_date__lte=soon)
            elif status_param == "valid":
                qs = qs.filter(Q(expiration_date__isnull=True) | Q(expiration_date__gt=soon))
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page or queryset, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return api_response(True, "Documents retrieved.", serializer.data)

    def retrieve(self, request, *args, **kwargs):
        return api_response(True, "Document retrieved.", self.get_serializer(self.get_object()).data)

    def create(self, request, *args, **kwargs):
        family_id = self.get_family_id()
        if not family_id:
            return api_response(
                False,
                "family query param or body field is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if not user_has_min_role(request.user, family_id, "family_member"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member = get_user_member(request.user, family_id)
        save_kwargs = {"family_id": family_id, "uploaded_by": request.user}
        if not user_has_min_role(request.user, family_id, "admin"):
            if not member:
                return api_response(
                    False,
                    "No member profile linked to this account.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            save_kwargs["member"] = member
        elif member and not request.data.get("member"):
            save_kwargs["member"] = member
        document = serializer.save(**save_kwargs)
        log_activity(
            request,
            "Uploaded document",
            module="documents",
            family=document.family,
            details={"id": str(document.id), "title": document.title},
        )
        notify_family_members(
            document.family,
            "New document uploaded",
            f'"{document.title}" was uploaded.',
            notification_type="document",
            link=f"/documents/{document.id}",
            exclude_user=request.user,
        )
        return api_response(
            True,
            "Document uploaded.",
            self.get_serializer(document).data,
            status_code=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        document = self.get_object()
        if not user_has_min_role(request.user, document.family_id, "family_member"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(document, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        document = serializer.save(family=document.family)
        log_activity(
            request,
            "Updated document",
            module="documents",
            family=document.family,
            details={"id": str(document.id)},
        )
        return api_response(True, "Document updated.", self.get_serializer(document).data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        document = self.get_object()
        if not user_has_min_role(request.user, document.family_id, "family_admin"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
