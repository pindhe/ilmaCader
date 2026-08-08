from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.families.views import (
    DashboardStatsView,
    FamilyProfileView,
    FamilyViewSet,
    MembershipViewSet,
)

app_name = "families"

membership_router = DefaultRouter()
membership_router.register(r"", MembershipViewSet, basename="membership")

family_list = FamilyViewSet.as_view({"get": "list", "post": "create"})
family_detail = FamilyViewSet.as_view(
    {"get": "retrieve", "put": "update", "patch": "partial_update"}
)

urlpatterns = [
    path("dashboard-stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("profile/<uuid:pk>/", FamilyProfileView.as_view(), name="family-profile"),
    path("profile/", FamilyProfileView.as_view(), name="family-profile-query"),
    path("memberships/", include(membership_router.urls)),
    path("", family_list, name="family-list"),
    path("<uuid:pk>/", family_detail, name="family-detail"),
]
