from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.core.views import ActivityLogViewSet, PlatformSettingsViewSet

app_name = "core"

activity_router = DefaultRouter()
activity_router.register(r"", ActivityLogViewSet, basename="activity")

settings_router = DefaultRouter()
settings_router.register(r"", PlatformSettingsViewSet, basename="platform-settings")

activity_urlpatterns = [
    path("", include(activity_router.urls)),
]

settings_urlpatterns = [
    path("", include(settings_router.urls)),
]
