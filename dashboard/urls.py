from django.urls import path
from . import views

app_name = "dashboard"

urlpatterns = [
    path("", views.HomeRedirectView.as_view(), name="home"),
    path("user/", views.UserDashboardView.as_view(), name="user"),
    path("admin/", views.AdminDashboardView.as_view(), name="admin"),
    path("gallery/", views.GalleryView.as_view(), name="gallery"),
]
