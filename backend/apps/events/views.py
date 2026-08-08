from calendar import monthrange
from datetime import date, timedelta

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.core.mixins import FamilyScopedQuerysetMixin, SoftDeleteMixin
from apps.core.permissions import ReadOnlyOrFamilyAdmin, user_has_min_role
from apps.core.utils import api_response, log_activity, notify_family_members
from apps.events.models import Announcement, Event
from apps.events.serializers import AnnouncementSerializer, EventSerializer
from apps.families.models import Family


class EventViewSet(FamilyScopedQuerysetMixin, SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = Event.objects.select_related("family", "organizer", "created_by").prefetch_related(
        "participants"
    )
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated, ReadOnlyOrFamilyAdmin]
    require_role = "viewer"
    filterset_fields = ["family", "event_type", "date", "organizer"]
    search_fields = ["name", "location", "description"]
    ordering_fields = ["date", "time", "name", "created_at"]
    ordering = ["date", "time"]

    def perform_create(self, serializer):
        instance = super().perform_create(serializer)
        notify_family_members(
            instance.family,
            "New event created",
            f"{instance.name} on {instance.date}",
            notification_type="event",
            link=f"/events/{instance.id}",
            exclude_user=self.request.user,
        )
        return instance


class AnnouncementViewSet(FamilyScopedQuerysetMixin, SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = Announcement.objects.select_related("family", "author")
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated, ReadOnlyOrFamilyAdmin]
    require_role = "viewer"
    filterset_fields = ["family", "priority", "audience", "is_published"]
    search_fields = ["title", "message", "audience"]
    ordering_fields = ["created_at", "priority", "title"]
    ordering = ["-created_at"]

    def perform_create(self, serializer):
        family_id = self.get_family_id()
        kwargs = {}
        if family_id:
            kwargs["family_id"] = family_id
        kwargs["author"] = self.request.user
        instance = serializer.save(**kwargs)
        log_activity(
            self.request,
            "Created Announcement",
            module="events",
            family=instance.family,
            details={"id": str(instance.pk)},
        )
        if instance.is_published:
            notify_family_members(
                instance.family,
                "New announcement",
                instance.title,
                notification_type="announcement",
                link=f"/announcements/{instance.id}",
                exclude_user=self.request.user,
            )
        return instance


class CalendarView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        family_id = request.query_params.get("family")
        if not family_id:
            return api_response(
                False,
                "family query param is required.",
                status_code=400,
            )
        if not user_has_min_role(request.user, family_id, "viewer"):
            return api_response(False, "Permission denied.", status_code=403)

        family = get_object_or_404(Family, id=family_id, is_deleted=False)
        today = timezone.now().date()
        view_mode = (request.query_params.get("view") or "month").lower()
        year = int(request.query_params.get("year", today.year))
        month = int(request.query_params.get("month", today.month))
        day = int(request.query_params.get("day", today.day))

        if view_mode not in {"month", "week", "day"}:
            return api_response(
                False,
                "view must be one of: month, week, day.",
                status_code=400,
            )

        try:
            anchor = date(year, month, day)
        except ValueError:
            return api_response(False, "Invalid year/month/day.", status_code=400)

        if view_mode == "day":
            start = end = anchor
        elif view_mode == "week":
            # Monday-start week
            start = anchor - timedelta(days=anchor.weekday())
            end = start + timedelta(days=6)
        else:
            start = date(year, month, 1)
            end = date(year, month, monthrange(year, month)[1])

        events = (
            Event.objects.filter(
                family=family,
                is_deleted=False,
                date__gte=start,
                date__lte=end,
            )
            .select_related("organizer", "created_by")
            .prefetch_related("participants")
            .order_by("date", "time")
        )
        serializer = EventSerializer(events, many=True, context={"request": request})

        return api_response(
            True,
            "Calendar events retrieved.",
            {
                "family_id": str(family.id),
                "view": view_mode,
                "year": year,
                "month": month,
                "day": day,
                "start": start.isoformat(),
                "end": end.isoformat(),
                "events": serializer.data,
            },
        )
