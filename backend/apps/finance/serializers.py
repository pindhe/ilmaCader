from rest_framework import serializers

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


class IncomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Income
        fields = (
            "id",
            "family",
            "title",
            "amount",
            "currency",
            "source",
            "person",
            "category",
            "date",
            "description",
            "attachment",
            "created_by",
            "created_at",
            "updated_at",
            "is_deleted",
        )
        read_only_fields = (
            "id",
            "family",
            "created_by",
            "created_at",
            "updated_at",
            "is_deleted",
        )


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = (
            "id",
            "family",
            "title",
            "amount",
            "currency",
            "category",
            "paid_by",
            "date",
            "description",
            "receipt",
            "created_by",
            "created_at",
            "updated_at",
            "is_deleted",
        )
        read_only_fields = (
            "id",
            "family",
            "created_by",
            "created_at",
            "updated_at",
            "is_deleted",
        )


class ContributionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contribution
        fields = (
            "id",
            "family",
            "member",
            "amount",
            "date",
            "contribution_type",
            "purpose",
            "payment_method",
            "reference_number",
            "notes",
            "created_by",
            "created_at",
            "updated_at",
            "is_deleted",
        )
        read_only_fields = (
            "id",
            "family",
            "created_by",
            "created_at",
            "updated_at",
            "is_deleted",
        )


class SavingGoalSerializer(serializers.ModelSerializer):
    progress = serializers.FloatField(read_only=True)

    class Meta:
        model = SavingGoal
        fields = (
            "id",
            "family",
            "title",
            "target_amount",
            "current_amount",
            "deadline",
            "responsible_member",
            "description",
            "is_active",
            "progress",
            "created_at",
            "updated_at",
            "is_deleted",
        )
        read_only_fields = (
            "id",
            "family",
            "progress",
            "created_at",
            "updated_at",
            "is_deleted",
        )


class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = (
            "id",
            "family",
            "category",
            "amount",
            "period",
            "year",
            "month",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "family", "created_at", "updated_at")


class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = (
            "id",
            "family",
            "name",
            "asset_type",
            "owner",
            "purchase_date",
            "purchase_price",
            "current_value",
            "location",
            "description",
            "document",
            "status",
            "created_at",
            "updated_at",
            "is_deleted",
        )
        read_only_fields = (
            "id",
            "family",
            "created_at",
            "updated_at",
            "is_deleted",
        )


class DebtSerializer(serializers.ModelSerializer):
    class Meta:
        model = Debt
        fields = (
            "id",
            "family",
            "name",
            "creditor",
            "amount",
            "remaining_balance",
            "interest",
            "due_date",
            "responsible_member",
            "status",
            "notes",
            "created_at",
            "updated_at",
            "is_deleted",
        )
        read_only_fields = (
            "id",
            "family",
            "created_at",
            "updated_at",
            "is_deleted",
        )


class FinancialGoalSerializer(serializers.ModelSerializer):
    progress = serializers.FloatField(read_only=True)

    class Meta:
        model = FinancialGoal
        fields = (
            "id",
            "family",
            "name",
            "description",
            "target_amount",
            "current_amount",
            "deadline",
            "priority",
            "status",
            "responsible_members",
            "progress",
            "created_at",
            "updated_at",
            "is_deleted",
        )
        read_only_fields = (
            "id",
            "family",
            "progress",
            "created_at",
            "updated_at",
            "is_deleted",
        )
