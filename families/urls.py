from django.urls import path
from . import views

app_name = "families"

urlpatterns = [
    path("family/", views.my_family, name="mine"),
    path("family/edit/", views.FamilyEditView.as_view(), name="edit"),
    path("family/submit/", views.submit_family, name="submit"),
    path("family/search/", views.search_own, name="search_own"),
    path("families/", views.FamilyListView.as_view(), name="list"),
    path("families/<int:pk>/", views.FamilyDetailView.as_view(), name="detail"),
    path("families/<int:pk>/edit/", views.FamilyEditView.as_view(), name="admin_edit"),
    path("families/<int:pk>/approve/", views.ApproveFamilyView.as_view(), name="approve"),
    path("families/<int:pk>/delete/", views.DeleteFamilyView.as_view(), name="delete"),
]
