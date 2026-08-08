from django.db.models import Sum
from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.families.models import Family, FamilyMembership
from apps.finance.models import Asset, FinancialGoal, SavingGoal


class FamilySerializer(serializers.ModelSerializer):
    class Meta:
        model = Family
        fields = (
            "id",
            "family_id",
            "name",
            "description",
            "logo",
            "country",
            "city",
            "address",
            "phone",
            "email",
            "motto",
            "date_established",
            "currency",
            "created_by",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "family_id", "created_by", "created_at", "updated_at")


class FamilyCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Family
        fields = (
            "name",
            "description",
            "logo",
            "country",
            "city",
            "address",
            "phone",
            "email",
            "motto",
            "date_established",
            "currency",
            "is_active",
        )


class FamilyMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    family_name = serializers.CharField(source="family.name", read_only=True)

    class Meta:
        model = FamilyMembership
        fields = (
            "id",
            "family",
            "family_name",
            "user",
            "user_id",
            "role",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "family", "created_at", "updated_at")


class FamilyProfileSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    total_assets = serializers.SerializerMethodField()
    total_savings = serializers.SerializerMethodField()
    active_goals = serializers.SerializerMethodField()

    class Meta:
        model = Family
        fields = (
            "id",
            "family_id",
            "name",
            "description",
            "logo",
            "country",
            "city",
            "address",
            "phone",
            "email",
            "motto",
            "date_established",
            "currency",
            "is_active",
            "member_count",
            "total_assets",
            "total_savings",
            "active_goals",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_member_count(self, obj):
        return obj.members.filter(is_deleted=False, is_archived=False).count()

    def get_total_assets(self, obj):
        total = (
            Asset.objects.filter(family=obj, is_deleted=False, status=Asset.Status.ACTIVE)
            .aggregate(total=Sum("current_value"))
            .get("total")
        )
        return total or 0

    def get_total_savings(self, obj):
        total = (
            SavingGoal.objects.filter(family=obj, is_deleted=False)
            .aggregate(total=Sum("current_amount"))
            .get("total")
        )
        return total or 0

    def get_active_goals(self, obj):
        return FinancialGoal.objects.filter(
            family=obj, is_deleted=False, status=FinancialGoal.Status.ACTIVE
        ).count()
