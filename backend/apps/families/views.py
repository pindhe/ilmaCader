from calendar import monthrange
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import ReadOnlyOrFamilyAdmin, user_has_min_role
from apps.core.utils import log_activity, notify_family_members
from apps.families.models import Family, FamilyMembership
from apps.families.serializers import (
    FamilyCreateUpdateSerializer,
    FamilyMembershipSerializer,
    FamilyProfileSerializer,
    FamilySerializer,
)
from apps.core.models import ActivityLog
from apps.documents.models import Document
from apps.events.models import Announcement, Event
from apps.finance.models import Asset, Contribution, Debt, Expense, FinancialGoal, Income, SavingGoal
from apps.members.models import FamilyMember, Relationship
from apps.tasks.models import Task


def api_response(success, message, data=None, status_code=status.HTTP_200_OK, errors=None):
    payload = {"success": success, "message": message, "data": data if data is not None else {}}
    if errors is not None:
        payload["errors"] = errors
    return Response(payload, status=status_code)


def _month_bounds(now=None):
    now = now or timezone.now()
    start = now.date().replace(day=1)
    end = now.date().replace(day=monthrange(now.year, now.month)[1])
    return start, end


class FamilyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "put", "patch", "head", "options"]
    search_fields = ["name", "family_id", "city", "country"]
    ordering_fields = ["name", "created_at", "date_established"]
    ordering = ["name"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return FamilyCreateUpdateSerializer
        return FamilySerializer

    def get_queryset(self):
        user = self.request.user
        qs = Family.objects.filter(is_deleted=False)
        if user.role == "super_admin" or user.is_superuser:
            return qs
        family_ids = user.memberships.filter(is_active=True).values_list("family_id", flat=True)
        return qs.filter(id__in=family_ids)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = FamilySerializer(page or queryset, many=True, context={"request": request})
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return api_response(True, "Families retrieved.", serializer.data)

    def retrieve(self, request, *args, **kwargs):
        family = self.get_object()
        if not user_has_min_role(request.user, family.id, "viewer"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)
        return api_response(
            True,
            "Family retrieved.",
            FamilySerializer(family, context={"request": request}).data,
        )

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        family = serializer.save(created_by=request.user)
        FamilyMembership.objects.get_or_create(
            family=family,
            user=request.user,
            defaults={"role": FamilyMembership.Role.ADMIN, "is_active": True},
        )
        log_activity(
            request,
            "Created family",
            module="families",
            family=family,
            details={"id": str(family.id)},
        )
        notify_family_members(
            family,
            "New family created",
            f"{family.name} is ready to use.",
            notification_type="system",
            exclude_user=request.user,
        )
        return api_response(
            True,
            "Family created.",
            FamilySerializer(family, context={"request": request}).data,
            status_code=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        family = self.get_object()
        if not user_has_min_role(request.user, family.id, "family_admin"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(family, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        family = serializer.save()
        log_activity(
            request,
            "Updated family",
            module="families",
            family=family,
            details={"id": str(family.id)},
        )
        return api_response(
            True,
            "Family updated.",
            FamilySerializer(family, context={"request": request}).data,
        )

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)


class MembershipViewSet(viewsets.ModelViewSet):
    serializer_class = FamilyMembershipSerializer
    permission_classes = [IsAuthenticated, ReadOnlyOrFamilyAdmin]
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]
    filterset_fields = ["role", "is_active"]
    search_fields = ["user__full_name", "user__email"]
    ordering_fields = ["created_at", "role"]
    ordering = ["-created_at"]

    def get_family_id(self):
        return (
            self.kwargs.get("family_id")
            or self.request.query_params.get("family")
            or self.request.data.get("family")
        )

    def get_queryset(self):
        qs = FamilyMembership.objects.select_related("user", "family")
        family_id = self.get_family_id()
        user = self.request.user
        if family_id:
            if not user_has_min_role(user, family_id, "viewer"):
                return qs.none()
            return qs.filter(family_id=family_id)
        if user.role == "super_admin" or user.is_superuser:
            return qs
        return qs.filter(family_id__in=user.memberships.filter(is_active=True).values_list("family_id", flat=True))

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page or queryset, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return api_response(True, "Memberships retrieved.", serializer.data)

    def retrieve(self, request, *args, **kwargs):
        return api_response(True, "Membership retrieved.", self.get_serializer(self.get_object()).data)

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
        user_id = serializer.validated_data.pop("user_id", None) or request.data.get("user_id")
        if not user_id:
            return api_response(
                False,
                "user_id is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        membership = serializer.save(family_id=family_id, user_id=user_id)
        log_activity(
            request,
            "Added family membership",
            module="families",
            family=membership.family,
            details={"id": str(membership.id), "user_id": str(user_id)},
        )
        return api_response(
            True,
            "Membership created.",
            self.get_serializer(membership).data,
            status_code=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        membership = self.get_object()
        if not user_has_min_role(request.user, membership.family_id, "family_admin"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(membership, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        membership = serializer.save()
        return api_response(True, "Membership updated.", self.get_serializer(membership).data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        membership = self.get_object()
        if not user_has_min_role(request.user, membership.family_id, "family_admin"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)
        membership.is_active = False
        membership.save(update_fields=["is_active", "updated_at"])
        log_activity(
            request,
            "Deactivated family membership",
            module="families",
            family=membership.family,
            details={"id": str(membership.id)},
        )
        return api_response(True, "Membership deactivated.")


class DashboardStatsView(APIView):
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
        start, end = _month_bounds()

        member_count = FamilyMember.objects.filter(
            family=family, is_deleted=False, is_archived=False
        ).count()
        monthly_income = (
            Income.objects.filter(
                family=family, is_deleted=False, date__gte=start, date__lte=end
            ).aggregate(total=Sum("amount")).get("total")
            or Decimal("0")
        )
        monthly_expenses = (
            Expense.objects.filter(
                family=family, is_deleted=False, date__gte=start, date__lte=end
            ).aggregate(total=Sum("amount")).get("total")
            or Decimal("0")
        )
        savings = (
            SavingGoal.objects.filter(family=family, is_deleted=False)
            .aggregate(total=Sum("current_amount"))
            .get("total")
            or Decimal("0")
        )
        assets = (
            Asset.objects.filter(
                family=family, is_deleted=False, status=Asset.Status.ACTIVE
            )
            .aggregate(total=Sum("current_value"))
            .get("total")
            or Decimal("0")
        )
        active_goals = FinancialGoal.objects.filter(
            family=family, is_deleted=False, status=FinancialGoal.Status.ACTIVE
        ).count()
        debts = (
            Debt.objects.filter(
                family=family, is_deleted=False, status=Debt.Status.ACTIVE
            )
            .aggregate(total=Sum("remaining_balance"))
            .get("total")
            or Decimal("0")
        )
        contributions = (
            Contribution.objects.filter(
                family=family, is_deleted=False, date__gte=start, date__lte=end
            )
            .aggregate(total=Sum("amount"))
            .get("total")
            or Decimal("0")
        )
        pending_tasks = Task.objects.filter(
            family=family,
            is_deleted=False,
            status__in=[Task.Status.PENDING, Task.Status.IN_PROGRESS],
        ).count()
        upcoming_events = Event.objects.filter(
            family=family, is_deleted=False, date__gte=timezone.now().date()
        ).count()
        documents_count = Document.objects.filter(family=family, is_deleted=False).count()
        announcements_count = Announcement.objects.filter(
            family=family, is_deleted=False, is_published=True
        ).count()
        net_cashflow = monthly_income - monthly_expenses
        net_worth = assets - debts

        recent_activity = list(
            ActivityLog.objects.filter(family=family)
            .select_related("user")
            .order_by("-created_at")[:8]
            .values("id", "action", "module", "created_at", "user__full_name")
        )
        recent_tasks = list(
            Task.objects.filter(family=family, is_deleted=False)
            .select_related("assigned_member")
            .order_by("due_date", "-created_at")[:6]
            .values(
                "id",
                "title",
                "status",
                "priority",
                "due_date",
                "assigned_member__full_name",
            )
        )
        upcoming_events_list = list(
            Event.objects.filter(
                family=family, is_deleted=False, date__gte=timezone.now().date()
            )
            .order_by("date", "time")[:6]
            .values("id", "name", "event_type", "date", "location")
        )

        return api_response(
            True,
            "Dashboard stats retrieved.",
            {
                "family_id": str(family.id),
                "family_name": family.name,
                "family_code": family.family_id,
                "member_count": member_count,
                "monthly_income": monthly_income,
                "monthly_expenses": monthly_expenses,
                "monthly_contributions": contributions,
                "savings": savings,
                "assets": assets,
                "debts": debts,
                "net_cashflow": net_cashflow,
                "net_worth": net_worth,
                "active_goals": active_goals,
                "pending_tasks": pending_tasks,
                "upcoming_events": upcoming_events,
                "documents_count": documents_count,
                "announcements_count": announcements_count,
                "recent_activity": recent_activity,
                "recent_tasks": recent_tasks,
                "upcoming_events_list": upcoming_events_list,
            },
        )


class FamilyProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        family_id = pk or request.query_params.get("family")
        if not family_id:
            return api_response(
                False,
                "family id is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if not user_has_min_role(request.user, family_id, "viewer"):
            return api_response(False, "Permission denied.", status_code=status.HTTP_403_FORBIDDEN)

        family = get_object_or_404(Family, id=family_id, is_deleted=False)
        data = {
            "profile": FamilyProfileSerializer(family, context={"request": request}).data,
        }

        tabs_param = request.query_params.get("tabs", "")
        tabs = {t.strip().lower() for t in tabs_param.split(",") if t.strip()} if tabs_param else set()

        if not tabs or "overview" in tabs:
            start, end = _month_bounds()
            data["overview"] = {
                "member_count": data["profile"]["member_count"],
                "total_assets": data["profile"]["total_assets"],
                "total_savings": data["profile"]["total_savings"],
                "active_goals": data["profile"]["active_goals"],
                "monthly_income": (
                    Income.objects.filter(
                        family=family, is_deleted=False, date__gte=start, date__lte=end
                    ).aggregate(total=Sum("amount")).get("total")
                    or 0
                ),
                "monthly_expenses": (
                    Expense.objects.filter(
                        family=family, is_deleted=False, date__gte=start, date__lte=end
                    ).aggregate(total=Sum("amount")).get("total")
                    or 0
                ),
            }

        if "members" in tabs:
            members = FamilyMember.objects.filter(
                family=family, is_deleted=False, is_archived=False
            ).order_by("full_name")
            data["members"] = [
                {
                    "id": str(m.id),
                    "full_name": m.full_name,
                    "family_role": m.family_role,
                    "profile_photo": m.profile_photo.url if m.profile_photo else None,
                    "email": m.email,
                    "phone": m.phone,
                }
                for m in members
            ]

        if "tree" in tabs:
            relationships = Relationship.objects.filter(family=family).select_related(
                "from_member", "to_member"
            )
            members = FamilyMember.objects.filter(family=family, is_deleted=False, is_archived=False)
            data["tree"] = {
                "nodes": [
                    {
                        "id": str(m.id),
                        "label": m.full_name,
                        "family_role": m.family_role,
                        "gender": m.gender,
                        "profile_photo": m.profile_photo.url if m.profile_photo else None,
                    }
                    for m in members
                ],
                "edges": [
                    {
                        "id": str(r.id),
                        "source": str(r.from_member_id),
                        "target": str(r.to_member_id),
                        "relation_type": r.relation_type,
                    }
                    for r in relationships
                ],
            }

        if "finances" in tabs:
            data["finances"] = {
                "savings": list(
                    SavingGoal.objects.filter(family=family, is_deleted=False).values(
                        "id", "title", "target_amount", "current_amount", "is_active"
                    )[:20]
                ),
                "assets": list(
                    Asset.objects.filter(family=family, is_deleted=False).values(
                        "id", "name", "asset_type", "current_value", "status"
                    )[:20]
                ),
                "goals": list(
                    FinancialGoal.objects.filter(family=family, is_deleted=False).values(
                        "id", "name", "target_amount", "current_amount", "status", "priority"
                    )[:20]
                ),
            }

        if "events" in tabs:
            from apps.events.models import Event

            data["events"] = list(
                Event.objects.filter(family=family, is_deleted=False)
                .order_by("-date")
                .values("id", "name", "event_type", "date", "location")[:20]
            )

        if "documents" in tabs:
            from apps.documents.models import Document

            data["documents"] = list(
                Document.objects.filter(family=family, is_deleted=False)
                .order_by("-created_at")
                .values("id", "title", "category", "expiration_date", "created_at")[:20]
            )

        if "activity" in tabs:
            from apps.core.models import ActivityLog

            data["activity"] = list(
                ActivityLog.objects.filter(family=family)
                .order_by("-created_at")
                .values("id", "action", "module", "created_at", "user_id")[:30]
            )

        return api_response(True, "Family profile retrieved.", data)
