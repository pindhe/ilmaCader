from django.contrib import admin

from apps.finance.models import (
    Asset,
    Budget,
    Contribution,
    Debt,
    Expense,
    FinancialGoal,
    Income,
    SavingGoal,
)


@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "family",
        "amount",
        "currency",
        "category",
        "date",
        "person",
        "is_deleted",
        "created_at",
    )
    list_filter = ("category", "currency", "is_deleted", "date")
    search_fields = ("title", "source", "description", "family__name")
    autocomplete_fields = ("family", "person", "created_by")
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")
    ordering = ("-date", "-created_at")


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "family",
        "amount",
        "currency",
        "category",
        "date",
        "paid_by",
        "is_deleted",
        "created_at",
    )
    list_filter = ("category", "currency", "is_deleted", "date")
    search_fields = ("title", "description", "family__name")
    autocomplete_fields = ("family", "paid_by", "created_by")
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")
    ordering = ("-date", "-created_at")


@admin.register(Contribution)
class ContributionAdmin(admin.ModelAdmin):
    list_display = (
        "family",
        "member",
        "amount",
        "date",
        "contribution_type",
        "payment_method",
        "is_deleted",
        "created_at",
    )
    list_filter = ("payment_method", "contribution_type", "is_deleted", "date")
    search_fields = ("purpose", "reference_number", "notes", "family__name", "member__full_name")
    autocomplete_fields = ("family", "member", "created_by")
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")
    ordering = ("-date", "-created_at")


@admin.register(SavingGoal)
class SavingGoalAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "family",
        "target_amount",
        "current_amount",
        "deadline",
        "is_active",
        "is_deleted",
        "created_at",
    )
    list_filter = ("is_active", "is_deleted", "deadline")
    search_fields = ("title", "description", "family__name")
    autocomplete_fields = ("family", "responsible_member")
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")
    ordering = ("-created_at",)


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ("category", "family", "amount", "period", "year", "month", "created_at")
    list_filter = ("period", "year", "month", "category")
    search_fields = ("category", "family__name")
    autocomplete_fields = ("family",)
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("category",)


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "family",
        "asset_type",
        "current_value",
        "status",
        "owner",
        "is_deleted",
        "created_at",
    )
    list_filter = ("asset_type", "status", "is_deleted")
    search_fields = ("name", "location", "description", "family__name")
    autocomplete_fields = ("family", "owner")
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")
    ordering = ("-current_value",)


@admin.register(Debt)
class DebtAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "family",
        "creditor",
        "amount",
        "remaining_balance",
        "status",
        "due_date",
        "is_deleted",
    )
    list_filter = ("status", "is_deleted", "due_date")
    search_fields = ("name", "creditor", "notes", "family__name")
    autocomplete_fields = ("family", "responsible_member")
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")
    ordering = ("status", "due_date")


@admin.register(FinancialGoal)
class FinancialGoalAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "family",
        "target_amount",
        "current_amount",
        "priority",
        "status",
        "deadline",
        "is_deleted",
    )
    list_filter = ("priority", "status", "is_deleted", "deadline")
    search_fields = ("name", "description", "family__name")
    autocomplete_fields = ("family",)
    filter_horizontal = ("responsible_members",)
    readonly_fields = ("id", "created_at", "updated_at", "deleted_at")
    ordering = ("-created_at",)
