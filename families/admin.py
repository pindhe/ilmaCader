from django.contrib import admin
from .models import FamilyProfile, Parent, Spouse, Child, Health, Employment, Property


class ParentInline(admin.StackedInline):
    model = Parent
    extra = 0


class SpouseInline(admin.StackedInline):
    model = Spouse
    extra = 0


class ChildInline(admin.TabularInline):
    model = Child
    extra = 0


class HealthInline(admin.StackedInline):
    model = Health
    extra = 0


class EmploymentInline(admin.StackedInline):
    model = Employment
    extra = 0


class PropertyInline(admin.StackedInline):
    model = Property
    extra = 0


@admin.register(FamilyProfile)
class FamilyProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "first_name", "last_name", "status", "completion_percent", "updated_at")
    list_filter = ("status", "gender")
    search_fields = ("first_name", "last_name", "national_id", "user__username")
    inlines = [ParentInline, SpouseInline, ChildInline, HealthInline, EmploymentInline, PropertyInline]
