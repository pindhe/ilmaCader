from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from dashboard.views import AdminDashboardView, HomeRedirectView, UserDashboardView

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("", RedirectView.as_view(pattern_name="accounts:login", permanent=False)),
    path("", include("accounts.urls")),
    path("dashboard/", HomeRedirectView.as_view(), name="dashboard_home"),
    path("dashboard/user/", UserDashboardView.as_view(), name="user_dashboard"),
    path("admin-dashboard/", AdminDashboardView.as_view(), name="admin_dashboard"),
    path("dashboard/", include("dashboard.urls")),
    path("", include("families.urls")),
    path("documents/", include("documents.urls")),
    path("reports/", include("reports.urls")),
    path("notifications/", include("notifications.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
