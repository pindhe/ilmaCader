from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.events.views import AnnouncementViewSet, CalendarView, EventViewSet

app_name = "events"

event_router = DefaultRouter()
event_router.register(r"", EventViewSet, basename="event")

announcement_router = DefaultRouter()
announcement_router.register(r"", AnnouncementViewSet, basename="announcement")

urlpatterns = [
    path("calendar/", CalendarView.as_view(), name="calendar"),
    path("", include(event_router.urls)),
]

announcement_urlpatterns = [
    path("", include(announcement_router.urls)),
]
