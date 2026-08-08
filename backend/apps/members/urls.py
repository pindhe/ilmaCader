from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.members.views import FamilyMemberViewSet, FamilyTreeView, RelationshipViewSet

app_name = "members"

member_router = DefaultRouter()
member_router.register(r"", FamilyMemberViewSet, basename="member")

relationship_router = DefaultRouter()
relationship_router.register(r"", RelationshipViewSet, basename="relationship")

urlpatterns = [
    path("tree/", FamilyTreeView.as_view(), name="family-tree"),
    path("relationships/", include(relationship_router.urls)),
    path("", include(member_router.urls)),
]
