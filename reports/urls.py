from django.urls import path
from . import views

app_name = "reports"

urlpatterns = [
    path("", views.ReportsHomeView.as_view(), name="home"),
    path("summary/", views.AdminSummaryReportView.as_view(), name="summary"),
    path("pdf/", views.profile_pdf, name="my_pdf"),
    path("pdf/<int:pk>/", views.profile_pdf, name="pdf"),
    path("print/", views.profile_print, name="my_print"),
    path("print/<int:pk>/", views.profile_print, name="print"),
]
