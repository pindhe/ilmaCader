from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.documents.views import DocumentViewSet

app_name = "documents"

router = DefaultRouter()
router.register(r"", DocumentViewSet, basename="document")

urlpatterns = [
    path("", include(router.urls)),
]
