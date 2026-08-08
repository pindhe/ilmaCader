from django.contrib import admin

from apps.members.models import FamilyMember, Relationship


@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "family",
        "family_role",
        "gender",
        "email",
        "phone",
        "is_archived",
        "is_deleted",
        "created_at",
    )
    list_filter = ("family_role", "gender", "marital_status", "is_archived", "is_deleted", "country")
    search_fields = ("full_name", "email", "phone", "family__name", "family__family_id")
    autocomplete_fields = ("family", "user")
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")
    ordering = ("full_name",)


@admin.register(Relationship)
class RelationshipAdmin(admin.ModelAdmin):
    list_display = ("from_member", "relation_type", "to_member", "family", "created_at")
    list_filter = ("relation_type",)
    search_fields = (
        "from_member__full_name",
        "to_member__full_name",
        "family__name",
        "notes",
    )
    autocomplete_fields = ("family", "from_member", "to_member")
    readonly_fields = ("id", "created_at", "updated_at")
