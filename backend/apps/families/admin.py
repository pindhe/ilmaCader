from django.contrib import admin

from apps.families.models import Family, FamilyMembership, PlatformSettings


class FamilyMembershipInline(admin.TabularInline):
    model = FamilyMembership
    extra = 0
    autocomplete_fields = ("user",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "family_id",
        "city",
        "country",
        "currency",
        "is_active",
        "is_deleted",
        "created_at",
    )
    list_filter = ("is_active", "is_deleted", "country", "currency")
    search_fields = ("name", "family_id", "email", "phone", "city")
    readonly_fields = ("id", "family_id", "created_at", "updated_at", "deleted_at")
    inlines = [FamilyMembershipInline]
    ordering = ("name",)


@admin.register(FamilyMembership)
class FamilyMembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "family", "role", "is_active", "created_at")
    list_filter = ("role", "is_active")
    search_fields = ("user__email", "user__full_name", "family__name", "family__family_id")
    autocomplete_fields = ("user", "family")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    list_display = ("key", "description", "updated_at")
    search_fields = ("key", "description")
    readonly_fields = ("created_at", "updated_at")
