"""
URL configuration for config project.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from apps.core.urls import activity_urlpatterns, settings_urlpatterns
from apps.events.urls import announcement_urlpatterns
from apps.finance.urls import (
    asset_urlpatterns,
    budget_urlpatterns,
    contribution_urlpatterns,
    debt_urlpatterns,
    expense_urlpatterns,
    goal_urlpatterns,
    income_urlpatterns,
    savings_urlpatterns,
)
from apps.reports.urls import analytics_urlpatterns, search_urlpatterns

from apps.accounts.admin_api import AdminFamiliesView, AdminStatsView, AdminUsersView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("api/admin/users/", AdminUsersView.as_view(), name="admin-users"),
    path("api/admin/families/", AdminFamiliesView.as_view(), name="admin-families"),
    path("api/families/", include("apps.families.urls")),
    path("api/members/", include("apps.members.urls")),
    path("api/income/", include((income_urlpatterns, "income"))),
    path("api/expenses/", include((expense_urlpatterns, "expenses"))),
    path("api/contributions/", include((contribution_urlpatterns, "contributions"))),
    path("api/savings/", include((savings_urlpatterns, "savings"))),
    path("api/budgets/", include((budget_urlpatterns, "budgets"))),
    path("api/assets/", include((asset_urlpatterns, "assets"))),
    path("api/debts/", include((debt_urlpatterns, "debts"))),
    path("api/goals/", include((goal_urlpatterns, "goals"))),
    path("api/finance/", include("apps.finance.urls")),
    path("api/documents/", include("apps.documents.urls")),
    path("api/tasks/", include("apps.tasks.urls")),
    path("api/events/", include("apps.events.urls")),
    path("api/announcements/", include((announcement_urlpatterns, "announcements"))),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/reports/", include("apps.reports.urls")),
    path("api/analytics/", include((analytics_urlpatterns, "analytics"))),
    path("api/search/", include((search_urlpatterns, "search"))),
    path("api/activity/", include((activity_urlpatterns, "activity"))),
    path("api/settings/", include((settings_urlpatterns, "settings"))),
]

# Serve uploaded media (on Render free disk is ephemeral — use S3 later for permanence)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
