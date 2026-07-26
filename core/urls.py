from django.urls import path
from . import views

app_name = "core"

urlpatterns = [
    path("categories/", views.CategoryListView.as_view(), name="category_list"),
    path("categories/<int:pk>/edit/", views.CategoryUpdateView.as_view(), name="category_edit"),
    path("categories/<int:pk>/toggle/", views.CategoryToggleView.as_view(), name="category_toggle"),
    path("categories/<int:pk>/delete/", views.CategoryDeleteView.as_view(), name="category_delete"),
]
