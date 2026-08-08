from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.finance.views import (
    AssetViewSet,
    BudgetViewSet,
    BudgetVsActualView,
    ContributionViewSet,
    DebtViewSet,
    ExpenseViewSet,
    FinanceDashboardView,
    FinancialGoalViewSet,
    IncomeViewSet,
    SavingGoalViewSet,
)

app_name = "finance"

income_router = DefaultRouter()
income_router.register(r"", IncomeViewSet, basename="income")

expense_router = DefaultRouter()
expense_router.register(r"", ExpenseViewSet, basename="expense")

contribution_router = DefaultRouter()
contribution_router.register(r"", ContributionViewSet, basename="contribution")

savings_router = DefaultRouter()
savings_router.register(r"", SavingGoalViewSet, basename="saving-goal")

budget_router = DefaultRouter()
budget_router.register(r"", BudgetViewSet, basename="budget")

asset_router = DefaultRouter()
asset_router.register(r"", AssetViewSet, basename="asset")

debt_router = DefaultRouter()
debt_router.register(r"", DebtViewSet, basename="debt")

goal_router = DefaultRouter()
goal_router.register(r"", FinancialGoalViewSet, basename="financial-goal")

urlpatterns = [
    path("dashboard/", FinanceDashboardView.as_view(), name="finance-dashboard"),
    path("budget-vs-actual/", BudgetVsActualView.as_view(), name="budget-vs-actual"),
]

# Nested route helpers included from config/urls.py via these named modules
income_urlpatterns = [
    path("", include(income_router.urls)),
]
expense_urlpatterns = [
    path("", include(expense_router.urls)),
]
contribution_urlpatterns = [
    path("", include(contribution_router.urls)),
]
savings_urlpatterns = [
    path("", include(savings_router.urls)),
]
budget_urlpatterns = [
    path("", include(budget_router.urls)),
]
asset_urlpatterns = [
    path("", include(asset_router.urls)),
]
debt_urlpatterns = [
    path("", include(debt_router.urls)),
]
goal_urlpatterns = [
    path("", include(goal_router.urls)),
]
