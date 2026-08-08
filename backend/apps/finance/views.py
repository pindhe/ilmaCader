from calendar import monthrange
from datetime import date
from decimal import Decimal

from dateutil.relativedelta import relativedelta
from django.db.models import Q, Sum
from django.db.models.functions import TruncMonth
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from rest_framework.exceptions import PermissionDenied

from apps.core.mixins import FamilyScopedQuerysetMixin, SoftDeleteMixin
from apps.core.ownership import attach_owner_on_create, scope_to_own_member
from apps.core.permissions import IsFamilyContributor, ReadOnlyOrFamilyAdmin, user_has_min_role
from apps.core.utils import api_response, notify_family_members
from apps.families.models import Family
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
from apps.finance.serializers import (
    AssetSerializer,
    BudgetSerializer,
    ContributionSerializer,
    DebtSerializer,
    ExpenseSerializer,
    FinancialGoalSerializer,
    IncomeSerializer,
    SavingGoalSerializer,
)


class IncomeViewSet(FamilyScopedQuerysetMixin, SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = Income.objects.select_related("family", "person", "created_by")
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated, IsFamilyContributor]
    require_role = "viewer"
    filterset_fields = ["family", "category", "currency", "person", "date"]
    search_fields = ["title", "source", "description"]
    ordering_fields = ["date", "amount", "created_at", "title"]
    ordering = ["-date", "-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        return scope_to_own_member(qs, self.request.user, self.get_family_id(), "person")

    def perform_create(self, serializer):
        try:
            instance = attach_owner_on_create(
                serializer, self.request.user, self.get_family_id(), "person"
            )
        except PermissionError as exc:
            raise PermissionDenied(str(exc)) from exc
        notify_family_members(
            instance.family,
            "New income recorded",
            f"{instance.title}: {instance.amount} {instance.currency}",
            notification_type="income",
            link=f"/income/{instance.id}",
            exclude_user=self.request.user,
        )
        return instance


class ExpenseViewSet(FamilyScopedQuerysetMixin, SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = Expense.objects.select_related("family", "paid_by", "created_by")
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, IsFamilyContributor]
    require_role = "viewer"
    filterset_fields = ["family", "category", "currency", "paid_by", "date"]
    search_fields = ["title", "description"]
    ordering_fields = ["date", "amount", "created_at", "title"]
    ordering = ["-date", "-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        return scope_to_own_member(qs, self.request.user, self.get_family_id(), "paid_by")

    def perform_create(self, serializer):
        try:
            instance = attach_owner_on_create(
                serializer, self.request.user, self.get_family_id(), "paid_by"
            )
        except PermissionError as exc:
            raise PermissionDenied(str(exc)) from exc
        notify_family_members(
            instance.family,
            "New expense recorded",
            f"{instance.title}: {instance.amount} {instance.currency}",
            notification_type="expense",
            link=f"/expenses/{instance.id}",
            exclude_user=self.request.user,
        )
        return instance


class ContributionViewSet(FamilyScopedQuerysetMixin, SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = Contribution.objects.select_related("family", "member", "created_by")
    serializer_class = ContributionSerializer
    permission_classes = [IsAuthenticated, IsFamilyContributor]
    require_role = "viewer"
    filterset_fields = ["family", "member", "payment_method", "contribution_type", "date"]
    search_fields = ["purpose", "reference_number", "notes", "contribution_type"]
    ordering_fields = ["date", "amount", "created_at"]
    ordering = ["-date", "-created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        return scope_to_own_member(qs, self.request.user, self.get_family_id(), "member")

    def perform_create(self, serializer):
        try:
            instance = attach_owner_on_create(
                serializer, self.request.user, self.get_family_id(), "member"
            )
        except PermissionError as exc:
            raise PermissionDenied(str(exc)) from exc
        notify_family_members(
            instance.family,
            "New contribution recorded",
            f"Contribution of {instance.amount} on {instance.date}",
            notification_type="contribution",
            link=f"/contributions/{instance.id}",
            exclude_user=self.request.user,
        )
        return instance


class SavingGoalViewSet(FamilyScopedQuerysetMixin, SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = SavingGoal.objects.select_related("family", "responsible_member")
    serializer_class = SavingGoalSerializer
    permission_classes = [IsAuthenticated, ReadOnlyOrFamilyAdmin]
    require_role = "viewer"
    filterset_fields = ["family", "is_active", "responsible_member", "deadline"]
    search_fields = ["title", "description"]
    ordering_fields = ["deadline", "target_amount", "current_amount", "created_at", "title"]
    ordering = ["-created_at"]

    def perform_create(self, serializer):
        instance = super().perform_create(serializer)
        notify_family_members(
            instance.family,
            "New saving goal created",
            f"{instance.title} — target {instance.target_amount}",
            notification_type="goal",
            link=f"/savings/{instance.id}",
            exclude_user=self.request.user,
        )
        return instance


class BudgetViewSet(FamilyScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Budget.objects.select_related("family")
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated, ReadOnlyOrFamilyAdmin]
    require_role = "viewer"
    filterset_fields = ["family", "category", "period", "year", "month"]
    search_fields = ["category"]
    ordering_fields = ["category", "year", "month", "amount"]
    ordering = ["category"]


class AssetViewSet(FamilyScopedQuerysetMixin, SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = Asset.objects.select_related("family", "owner")
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated, ReadOnlyOrFamilyAdmin]
    require_role = "viewer"
    filterset_fields = ["family", "asset_type", "status", "owner"]
    search_fields = ["name", "location", "description"]
    ordering_fields = ["current_value", "purchase_date", "name", "created_at"]
    ordering = ["-current_value"]


class DebtViewSet(FamilyScopedQuerysetMixin, SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = Debt.objects.select_related("family", "responsible_member")
    serializer_class = DebtSerializer
    permission_classes = [IsAuthenticated, ReadOnlyOrFamilyAdmin]
    require_role = "viewer"
    filterset_fields = ["family", "status", "responsible_member", "due_date"]
    search_fields = ["name", "creditor", "notes"]
    ordering_fields = ["due_date", "amount", "remaining_balance", "status", "created_at"]
    ordering = ["status", "due_date"]


class FinancialGoalViewSet(FamilyScopedQuerysetMixin, SoftDeleteMixin, viewsets.ModelViewSet):
    queryset = FinancialGoal.objects.select_related("family").prefetch_related(
        "responsible_members"
    )
    serializer_class = FinancialGoalSerializer
    permission_classes = [IsAuthenticated, ReadOnlyOrFamilyAdmin]
    require_role = "viewer"
    filterset_fields = ["family", "priority", "status", "deadline"]
    search_fields = ["name", "description"]
    ordering_fields = ["deadline", "priority", "target_amount", "created_at", "name"]
    ordering = ["-created_at"]

    def perform_create(self, serializer):
        instance = super().perform_create(serializer)
        notify_family_members(
            instance.family,
            "New financial goal created",
            f"{instance.name} — target {instance.target_amount}",
            notification_type="goal",
            link=f"/goals/{instance.id}",
            exclude_user=self.request.user,
        )
        return instance


class FinanceDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        family_id = request.query_params.get("family")
        if not family_id:
            return api_response(
                False,
                "family query param is required.",
                status_code=400,
            )
        if not user_has_min_role(request.user, family_id, "viewer"):
            return api_response(False, "Permission denied.", status_code=403)

        family = get_object_or_404(Family, id=family_id, is_deleted=False)
        today = timezone.now().date()
        month_start = today.replace(day=1)
        month_end = today.replace(day=monthrange(today.year, today.month)[1])

        incomes = Income.objects.filter(family=family, is_deleted=False)
        expenses = Expense.objects.filter(family=family, is_deleted=False)

        total_income = incomes.aggregate(total=Sum("amount")).get("total") or Decimal("0")
        total_expenses = expenses.aggregate(total=Sum("amount")).get("total") or Decimal("0")
        monthly_income = (
            incomes.filter(date__gte=month_start, date__lte=month_end)
            .aggregate(total=Sum("amount"))
            .get("total")
            or Decimal("0")
        )
        monthly_expenses = (
            expenses.filter(date__gte=month_start, date__lte=month_end)
            .aggregate(total=Sum("amount"))
            .get("total")
            or Decimal("0")
        )
        total_savings = (
            SavingGoal.objects.filter(family=family, is_deleted=False)
            .aggregate(total=Sum("current_amount"))
            .get("total")
            or Decimal("0")
        )
        total_assets = (
            Asset.objects.filter(family=family, is_deleted=False, status=Asset.Status.ACTIVE)
            .aggregate(total=Sum("current_value"))
            .get("total")
            or Decimal("0")
        )
        total_debts = (
            Debt.objects.filter(family=family, is_deleted=False, status=Debt.Status.ACTIVE)
            .aggregate(total=Sum("remaining_balance"))
            .get("total")
            or Decimal("0")
        )
        total_contributions = (
            Contribution.objects.filter(family=family, is_deleted=False)
            .aggregate(total=Sum("amount"))
            .get("total")
            or Decimal("0")
        )

        income_by_category = list(
            incomes.values("category").annotate(total=Sum("amount")).order_by("-total")
        )
        expense_by_category = list(
            expenses.values("category").annotate(total=Sum("amount")).order_by("-total")
        )

        cashflow_start = (month_start - relativedelta(months=11)).replace(day=1)
        income_monthly = {}
        for row in (
            incomes.filter(date__gte=cashflow_start)
            .annotate(month=TruncMonth("date"))
            .values("month")
            .annotate(total=Sum("amount"))
        ):
            if not row["month"]:
                continue
            key = row["month"].date() if hasattr(row["month"], "date") else row["month"]
            income_monthly[key] = row["total"]

        expense_monthly = {}
        for row in (
            expenses.filter(date__gte=cashflow_start)
            .annotate(month=TruncMonth("date"))
            .values("month")
            .annotate(total=Sum("amount"))
        ):
            if not row["month"]:
                continue
            key = row["month"].date() if hasattr(row["month"], "date") else row["month"]
            expense_monthly[key] = row["total"]

        monthly_cashflow = []
        cursor = cashflow_start
        for _ in range(12):
            inc = income_monthly.get(cursor, Decimal("0")) or Decimal("0")
            exp = expense_monthly.get(cursor, Decimal("0")) or Decimal("0")
            monthly_cashflow.append(
                {
                    "year": cursor.year,
                    "month": cursor.month,
                    "label": cursor.strftime("%Y-%m"),
                    "income": inc,
                    "expenses": exp,
                    "net": inc - exp,
                }
            )
            cursor = (cursor + relativedelta(months=1)).replace(day=1)

        return api_response(
            True,
            "Finance dashboard retrieved.",
            {
                "family_id": str(family.id),
                "totals": {
                    "income": total_income,
                    "expenses": total_expenses,
                    "net": total_income - total_expenses,
                    "monthly_income": monthly_income,
                    "monthly_expenses": monthly_expenses,
                    "monthly_net": monthly_income - monthly_expenses,
                    "savings": total_savings,
                    "assets": total_assets,
                    "debts": total_debts,
                    "contributions": total_contributions,
                },
                "by_category": {
                    "income": income_by_category,
                    "expenses": expense_by_category,
                },
                "monthly_cashflow": monthly_cashflow,
            },
        )


class BudgetVsActualView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        family_id = request.query_params.get("family")
        if not family_id:
            return api_response(
                False,
                "family query param is required.",
                status_code=400,
            )
        if not user_has_min_role(request.user, family_id, "viewer"):
            return api_response(False, "Permission denied.", status_code=403)

        family = get_object_or_404(Family, id=family_id, is_deleted=False)
        today = timezone.now().date()
        year = int(request.query_params.get("year", today.year))
        month_param = request.query_params.get("month")
        month = int(month_param) if month_param else today.month

        budgets = Budget.objects.filter(family=family, year=year).filter(
            Q(period=Budget.Period.YEARLY)
            | Q(period=Budget.Period.MONTHLY, month=month)
        )

        start = date(year, month, 1)
        end = date(year, month, monthrange(year, month)[1])

        actual_by_category = {
            row["category"]: row["total"] or Decimal("0")
            for row in Expense.objects.filter(
                family=family,
                is_deleted=False,
                date__gte=start,
                date__lte=end,
            )
            .values("category")
            .annotate(total=Sum("amount"))
        }

        items = []
        for budget in budgets.order_by("category"):
            actual = actual_by_category.get(budget.category, Decimal("0"))
            variance = budget.amount - actual
            pct = float(actual / budget.amount * 100) if budget.amount else 0
            items.append(
                {
                    "budget_id": str(budget.id),
                    "category": budget.category,
                    "period": budget.period,
                    "year": budget.year,
                    "month": budget.month,
                    "budgeted": budget.amount,
                    "actual": actual,
                    "variance": variance,
                    "percent_used": round(pct, 2),
                    "over_budget": actual > budget.amount,
                }
            )

        total_budgeted = sum((i["budgeted"] for i in items), Decimal("0"))
        total_actual = sum((i["actual"] for i in items), Decimal("0"))

        return api_response(
            True,
            "Budget vs actual retrieved.",
            {
                "family_id": str(family.id),
                "year": year,
                "month": month,
                "items": items,
                "summary": {
                    "total_budgeted": total_budgeted,
                    "total_actual": total_actual,
                    "variance": total_budgeted - total_actual,
                },
            },
        )
