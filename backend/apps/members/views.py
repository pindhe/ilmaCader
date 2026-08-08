from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.mixins import FamilyScopedQuerysetMixin, SoftDeleteMixin
from apps.core.permissions import ReadOnlyOrFamilyAdmin, user_has_min_role
from apps.core.utils import log_activity
from apps.families.models import Family
from apps.members.models import FamilyMember, Relationship
from apps.members.serializers import FamilyMemberSerializer, RelationshipSerializer


def api_response(success, message, data=None, status_code=status.HTTP_200_OK, errors=None):
    payload = {"success": success, "message": message, "data": data if data is not None else {}}
    if errors is not None:
        payload["errors"] = errors
    return Response(payload, status=status_code)


class FamilyMemberViewSet(FamilyScopedQuerysetMixin, SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = FamilyMember.objects.select_related("family", "user")
    serializer_class = FamilyMemberSerializer
    permission_classes = [IsAuthenticated, ReadOnlyOrFamilyAdmin]
    require_role = "viewer"
    filterset_fields = ["family_role", "gender", "marital_status", "is_archived", "city", "country"]
    search_fields = ["full_name", "email", "phone", "occupation", "city"]
    ordering_fields = ["full_name", "joined_date", "created_at", "family_role"]
    ordering = ["full_name"]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page or queryset, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return api_response(True, "Members retrieved.", serializer.data)

    def retrieve(self, request, *args, **kwargs):
        return api_response(True, "Member retrieved.", self.get_serializer(self.get_object()).data)

    def create(self, request, *args, **kwargs):
        family_id = self.get_family_id()
        if not family_id:
            return api_response(
                False,
                "family query param or body field is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if not user_has_min_role(request.user, family_id, "family_admin"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member = serializer.save(family_id=family_id)
        log_activity(
            request,
            "Created family member",
            module="members",
            family=member.family,
            details={"id": str(member.id)},
        )
        return api_response(
            True,
            "Member created.",
            self.get_serializer(member).data,
            status_code=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        member = self.get_object()
        if not user_has_min_role(request.user, member.family_id, "family_admin"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(member, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        # Keep family scoped — don't allow moving across families via update
        member = serializer.save(family=member.family)
        log_activity(
            request,
            "Updated family member",
            module="members",
            family=member.family,
            details={"id": str(member.id)},
        )
        return api_response(True, "Member updated.", self.get_serializer(member).data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        member = self.get_object()
        if not user_has_min_role(request.user, member.family_id, "family_admin"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        member = self.get_object()
        if not user_has_min_role(request.user, member.family_id, "family_admin"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)
        response = super().archive(request, pk=pk)
        log_activity(
            request,
            "Archived family member",
            module="members",
            family=member.family,
            details={"id": str(member.id)},
        )
        return response

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        member = self.get_object()
        if not user_has_min_role(request.user, member.family_id, "family_admin"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)
        response = super().restore(request, pk=pk)
        log_activity(
            request,
            "Restored family member",
            module="members",
            family=member.family,
            details={"id": str(member.id)},
        )
        return response


class RelationshipViewSet(viewsets.ModelViewSet):
    serializer_class = RelationshipSerializer
    permission_classes = [IsAuthenticated, ReadOnlyOrFamilyAdmin]
    filterset_fields = ["relation_type", "from_member", "to_member"]
    search_fields = ["from_member__full_name", "to_member__full_name", "notes"]
    ordering_fields = ["created_at", "relation_type"]
    ordering = ["-created_at"]

    def get_family_id(self):
        return (
            self.kwargs.get("family_id")
            or self.request.query_params.get("family")
            or self.request.data.get("family")
        )

    def get_queryset(self):
        qs = Relationship.objects.select_related("from_member", "to_member", "family")
        family_id = self.get_family_id()
        user = self.request.user
        if family_id:
            if not user_has_min_role(user, family_id, "viewer"):
                return qs.none()
            return qs.filter(family_id=family_id)
        if user.role == "super_admin" or user.is_superuser:
            return qs
        membership_ids = user.memberships.filter(is_active=True).values_list("family_id", flat=True)
        return qs.filter(family_id__in=membership_ids)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page or queryset, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return api_response(True, "Relationships retrieved.", serializer.data)

    def retrieve(self, request, *args, **kwargs):
        return api_response(
            True, "Relationship retrieved.", self.get_serializer(self.get_object()).data
        )

    def create(self, request, *args, **kwargs):
        family_id = self.get_family_id()
        if not family_id:
            return api_response(
                False,
                "family query param or body field is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if not user_has_min_role(request.user, family_id, "family_admin"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data["family"] = family_id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        relationship = serializer.save(family_id=family_id)
        log_activity(
            request,
            "Created relationship",
            module="members",
            family=relationship.family,
            details={"id": str(relationship.id)},
        )
        return api_response(
            True,
            "Relationship created.",
            self.get_serializer(relationship).data,
            status_code=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        relationship = self.get_object()
        if not user_has_min_role(request.user, relationship.family_id, "family_admin"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(relationship, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        relationship = serializer.save(family=relationship.family)
        return api_response(
            True, "Relationship updated.", self.get_serializer(relationship).data
        )

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        relationship = self.get_object()
        if not user_has_min_role(request.user, relationship.family_id, "family_admin"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)
        family = relationship.family
        pk = str(relationship.pk)
        relationship.delete()
        log_activity(
            request,
            "Deleted relationship",
            module="members",
            family=family,
            details={"id": pk},
        )
        return api_response(True, "Relationship deleted.")


class FamilyTreeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        family_id = request.query_params.get("family")
        if not family_id:
            return api_response(
                False,
                "family query param is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if not user_has_min_role(request.user, family_id, "viewer"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)

        family = get_object_or_404(Family, id=family_id, is_deleted=False)
        members = FamilyMember.objects.filter(
            family=family, is_deleted=False, is_archived=False
        ).order_by("full_name")
        relationships = Relationship.objects.filter(family=family).select_related(
            "from_member", "to_member"
        )

        nodes = [
            {
                "id": str(m.id),
                "label": m.full_name,
                "full_name": m.full_name,
                "family_role": m.family_role,
                "gender": m.gender,
                "date_of_birth": m.date_of_birth,
                "profile_photo": request.build_absolute_uri(m.profile_photo.url)
                if m.profile_photo
                else None,
            }
            for m in members
        ]
        edges = [
            {
                "id": str(r.id),
                "source": str(r.from_member_id),
                "target": str(r.to_member_id),
                "relation_type": r.relation_type,
                "label": r.get_relation_type_display(),
                "notes": r.notes,
            }
            for r in relationships
            if not r.from_member.is_deleted
            and not r.to_member.is_deleted
            and not r.from_member.is_archived
            and not r.to_member.is_archived
        ]

        return api_response(
            True,
            "Family tree retrieved.",
            {
                "family_id": str(family.id),
                "family_name": family.name,
                "nodes": nodes,
                "edges": edges,
            },
        )
