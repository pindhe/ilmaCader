from django.urls import path

from apps.reports.views import (
    AnalyticsView,
    AssetReportView,
    ExportView,
    FamilyReportView,
    FinancialReportView,
    GlobalSearchView,
    GoalReportView,
)

app_name = "reports"

urlpatterns = [
    path("financial/", FinancialReportView.as_view(), name="financial"),
    path("family/", FamilyReportView.as_view(), name="family"),
    path("assets/", AssetReportView.as_view(), name="assets"),
    path("goals/", GoalReportView.as_view(), name="goals"),
    path("export/", ExportView.as_view(), name="export"),
]

analytics_urlpatterns = [
    path("", AnalyticsView.as_view(), name="analytics"),
]

search_urlpatterns = [
    path("", GlobalSearchView.as_view(), name="search"),
]
