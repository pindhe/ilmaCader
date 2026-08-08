import csv
import io
from collections import defaultdict
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.core.permissions import user_has_min_role
from apps.core.utils import api_response
from apps.documents.models import Document
from apps.events.models import Announcement, Event
from apps.finance.models import (
    Asset,
    Contribution,
    Debt,
    Expense,
    FinancialGoal,
    Income,
    SavingGoal,
)
from apps.members.models import FamilyMember
from apps.tasks.models import Task


def _require_family_access(request, min_role="viewer"):
    family_id = request.query_params.get("family") or request.data.get("family")
    if not family_id:
        return None, api_response(
            False, "family query param is required.", status_code=400
        )
    if not user_has_min_role(request.user, family_id, min_role):
        return None, api_response(False, "Permission denied.", status_code=403)
    return family_id, None


def _age_bucket(dob, today):
    if not dob:
        return "unknown"
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    if age < 18:
        return "0-17"
    if age < 30:
        return "18-29"
    if age < 45:
        return "30-44"
    if age < 60:
        return "45-59"
    return "60+"


def _decimal(value):
    if value is None:
        return Decimal("0")
    return value if isinstance(value, Decimal) else Decimal(str(value))


class FinancialReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        family_id, error = _require_family_access(request)
        if error:
            return error

        incomes = Income.objects.filter(family_id=family_id, is_deleted=False)
        expenses = Expense.objects.filter(family_id=family_id, is_deleted=False)
        contributions = Contribution.objects.filter(family_id=family_id, is_deleted=False)
        savings = SavingGoal.objects.filter(family_id=family_id, is_deleted=False)

        total_income = incomes.aggregate(total=Sum("amount"))["total"] or 0
        total_expense = expenses.aggregate(total=Sum("amount"))["total"] or 0
        total_contributions = contributions.aggregate(total=Sum("amount"))["total"] or 0
        total_savings = savings.aggregate(total=Sum("current_amount"))["total"] or 0

        income_by_category = list(
            incomes.values("category").annotate(total=Sum("amount")).order_by("-total")
        )
        expense_by_category = list(
            expenses.values("category").annotate(total=Sum("amount")).order_by("-total")
        )

        return api_response(
            True,
            "Financial report retrieved.",
            {
                "total_income": total_income,
                "total_expense": total_expense,
                "net": _decimal(total_income) - _decimal(total_expense),
                "total_contributions": total_contributions,
                "total_savings": total_savings,
                "income_by_category": income_by_category,
                "expense_by_category": expense_by_category,
                "income_count": incomes.count(),
                "expense_count": expenses.count(),
            },
        )


class FamilyReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        family_id, error = _require_family_access(request)
        if error:
            return error

        members = FamilyMember.objects.filter(
            family_id=family_id, is_deleted=False, is_archived=False
        )
        today = timezone.now().date()

        gender = list(members.values("gender").annotate(count=Count("id")).order_by("-count"))
        location = list(
            members.values("city", "country").annotate(count=Count("id")).order_by("-count")
        )
        occupation = list(
            members.exclude(occupation="")
            .values("occupation")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        age_distribution = defaultdict(int)
        for member in members.only("date_of_birth"):
            age_distribution[_age_bucket(member.date_of_birth, today)] += 1

        return api_response(
            True,
            "Family report retrieved.",
            {
                "total_members": members.count(),
                "age_distribution": dict(age_distribution),
                "gender_distribution": gender,
                "location_distribution": location,
                "occupation_distribution": occupation,
            },
        )


class AssetReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        family_id, error = _require_family_access(request)
        if error:
            return error

        assets = Asset.objects.filter(family_id=family_id, is_deleted=False)
        total_value = assets.aggregate(total=Sum("current_value"))["total"] or 0
        by_type = list(
            assets.values("asset_type").annotate(
                count=Count("id"), total_value=Sum("current_value")
            ).order_by("-total_value")
        )
        by_status = list(
            assets.values("status").annotate(
                count=Count("id"), total_value=Sum("current_value")
            )
        )

        return api_response(
            True,
            "Asset report retrieved.",
            {
                "total_assets": assets.count(),
                "total_value": total_value,
                "by_type": by_type,
                "by_status": by_status,
            },
        )


class GoalReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        family_id, error = _require_family_access(request)
        if error:
            return error

        financial_goals = FinancialGoal.objects.filter(family_id=family_id, is_deleted=False)
        saving_goals = SavingGoal.objects.filter(family_id=family_id, is_deleted=False)

        fg_data = [
            {
                "id": str(g.id),
                "name": g.name,
                "target_amount": g.target_amount,
                "current_amount": g.current_amount,
                "progress": g.progress,
                "status": g.status,
                "priority": g.priority,
                "deadline": g.deadline,
            }
            for g in financial_goals
        ]
        sg_data = [
            {
                "id": str(g.id),
                "title": g.title,
                "target_amount": g.target_amount,
                "current_amount": g.current_amount,
                "progress": g.progress,
                "is_active": g.is_active,
                "deadline": g.deadline,
            }
            for g in saving_goals
        ]

        return api_response(
            True,
            "Goal report retrieved.",
            {
                "financial_goals": fg_data,
                "saving_goals": sg_data,
                "active_financial_goals": financial_goals.filter(
                    status=FinancialGoal.Status.ACTIVE
                ).count(),
                "active_saving_goals": saving_goals.filter(is_active=True).count(),
            },
        )


class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        family_id, error = _require_family_access(request)
        if error:
            return error

        incomes = Income.objects.filter(family_id=family_id, is_deleted=False)
        expenses = Expense.objects.filter(family_id=family_id, is_deleted=False)
        contributions = Contribution.objects.filter(family_id=family_id, is_deleted=False)
        assets = Asset.objects.filter(family_id=family_id, is_deleted=False)
        debts = Debt.objects.filter(family_id=family_id, is_deleted=False)
        savings = SavingGoal.objects.filter(family_id=family_id, is_deleted=False)

        income_monthly = {
            row["month"].strftime("%Y-%m"): row["total"]
            for row in incomes.annotate(month=TruncMonth("date"))
            .values("month")
            .annotate(total=Sum("amount"))
            .order_by("month")
            if row["month"]
        }
        expense_monthly = {
            row["month"].strftime("%Y-%m"): row["total"]
            for row in expenses.annotate(month=TruncMonth("date"))
            .values("month")
            .annotate(total=Sum("amount"))
            .order_by("month")
            if row["month"]
        }
        months = sorted(set(income_monthly) | set(expense_monthly))
        income_vs_expenses = [
            {
                "month": m,
                "income": income_monthly.get(m, 0),
                "expenses": expense_monthly.get(m, 0),
            }
            for m in months
        ]

        expense_categories = list(
            expenses.values("category").annotate(total=Sum("amount")).order_by("-total")
        )
        savings_growth = list(
            savings.values("title", "current_amount", "target_amount", "is_active")
        )
        contribution_totals = list(
            contributions.values("contribution_type")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("-total")
        )
        asset_value = assets.aggregate(
            total_current=Sum("current_value"), total_purchase=Sum("purchase_price")
        )
        debt_progress = [
            {
                "id": str(d.id),
                "name": d.name,
                "amount": d.amount,
                "remaining_balance": d.remaining_balance,
                "progress": float(
                    ((_decimal(d.amount) - _decimal(d.remaining_balance)) / _decimal(d.amount) * 100)
                    if d.amount
                    else 0
                ),
                "status": d.status,
            }
            for d in debts
        ]

        return api_response(
            True,
            "Analytics retrieved.",
            {
                "income_vs_expenses": income_vs_expenses,
                "expense_categories": expense_categories,
                "savings_growth": savings_growth,
                "contributions": contribution_totals,
                "asset_value": {
                    "current": asset_value.get("total_current") or 0,
                    "purchase": asset_value.get("total_purchase") or 0,
                },
                "debt_progress": debt_progress,
            },
        )


class ExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        family_id, error = _require_family_access(request)
        if error:
            return error

        export_type = request.query_params.get("type", "financial")
        fmt = request.query_params.get("format", "csv").lower()

        rows, headers, filename = self._build_rows(family_id, export_type)
        if fmt == "excel":
            return self._excel_response(rows, headers, filename)
        if fmt == "pdf":
            return self._pdf_response(rows, headers, filename)
        return self._csv_response(rows, headers, filename)

    def _build_rows(self, family_id, export_type):
        if export_type == "family":
            members = FamilyMember.objects.filter(
                family_id=family_id, is_deleted=False
            ).values_list(
                "full_name", "gender", "date_of_birth", "city", "country", "occupation", "family_role"
            )
            headers = [
                "Full Name",
                "Gender",
                "Date of Birth",
                "City",
                "Country",
                "Occupation",
                "Family Role",
            ]
            return list(members), headers, "family_report"

        if export_type == "assets":
            assets = Asset.objects.filter(family_id=family_id, is_deleted=False).values_list(
                "name", "asset_type", "current_value", "purchase_price", "status", "location"
            )
            headers = [
                "Name",
                "Type",
                "Current Value",
                "Purchase Price",
                "Status",
                "Location",
            ]
            return list(assets), headers, "assets_report"

        if export_type == "goals":
            goals = FinancialGoal.objects.filter(
                family_id=family_id, is_deleted=False
            ).values_list("name", "target_amount", "current_amount", "status", "priority", "deadline")
            headers = [
                "Name",
                "Target Amount",
                "Current Amount",
                "Status",
                "Priority",
                "Deadline",
            ]
            return list(goals), headers, "goals_report"

        # financial (default)
        incomes = Income.objects.filter(family_id=family_id, is_deleted=False).values_list(
            "title", "amount", "category", "date", "currency"
        )
        expenses = Expense.objects.filter(family_id=family_id, is_deleted=False).values_list(
            "title", "amount", "category", "date", "currency"
        )
        rows = [("income", *row) for row in incomes] + [("expense", *row) for row in expenses]
        headers = ["Type", "Title", "Amount", "Category", "Date", "Currency"]
        return rows, headers, "financial_report"

    def _csv_response(self, rows, headers, filename):
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(headers)
        for row in rows:
            writer.writerow(row)
        response = HttpResponse(buffer.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{filename}.csv"'
        return response

    def _excel_response(self, rows, headers, filename):
        try:
            from openpyxl import Workbook
        except ImportError:
            return self._csv_response(rows, headers, filename)

        wb = Workbook()
        ws = wb.active
        ws.title = "Report"
        ws.append(headers)
        for row in rows:
            ws.append(list(row))
        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        response = HttpResponse(
            buffer.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}.xlsx"'
        return response

    def _pdf_response(self, rows, headers, filename):
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.pdfgen import canvas
        except ImportError:
            return self._csv_response(rows, headers, filename)

        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        y = height - 40
        c.setFont("Helvetica-Bold", 12)
        c.drawString(40, y, filename.replace("_", " ").title())
        y -= 24
        c.setFont("Helvetica", 9)
        c.drawString(40, y, " | ".join(str(h) for h in headers))
        y -= 16
        for row in rows[:80]:
            line = " | ".join(str(cell) if cell is not None else "" for cell in row)
            if y < 40:
                c.showPage()
                c.setFont("Helvetica", 9)
                y = height - 40
            c.drawString(40, y, line[:110])
            y -= 12
        c.save()
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}.pdf"'
        return response


class GlobalSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        family_id = request.query_params.get("family")
        if not q:
            return api_response(
                False, "q query param is required.", status_code=400
            )
        if family_id and not user_has_min_role(request.user, family_id, "viewer"):
            return api_response(False, "Permission denied.", status_code=403)

        def scoped(qs, family_field="family_id"):
            if family_id:
                return qs.filter(**{family_field: family_id})
            user = request.user
            if user.role == "super_admin" or user.is_superuser:
                return qs
            membership_ids = user.memberships.filter(is_active=True).values_list(
                "family_id", flat=True
            )
            return qs.filter(**{f"{family_field}__in": membership_ids})

        members = scoped(
            FamilyMember.objects.filter(is_deleted=False).filter(
                Q(full_name__icontains=q)
                | Q(email__icontains=q)
                | Q(phone__icontains=q)
                | Q(occupation__icontains=q)
            )
        )[:10]
        documents = scoped(
            Document.objects.filter(is_deleted=False).filter(
                Q(title__icontains=q) | Q(notes__icontains=q) | Q(category__icontains=q)
            )
        )[:10]
        tasks = scoped(
            Task.objects.filter(is_deleted=False).filter(
                Q(title__icontains=q) | Q(description__icontains=q)
            )
        )[:10]
        events = scoped(
            Event.objects.filter(is_deleted=False).filter(
                Q(name__icontains=q) | Q(description__icontains=q) | Q(location__icontains=q)
            )
        )[:10]
        announcements = scoped(
            Announcement.objects.filter(is_deleted=False).filter(
                Q(title__icontains=q) | Q(message__icontains=q)
            )
        )[:10]

        return api_response(
            True,
            "Search results retrieved.",
            {
                "query": q,
                "members": [
                    {"id": str(m.id), "label": m.full_name, "type": "member"} for m in members
                ],
                "documents": [
                    {"id": str(d.id), "label": d.title, "type": "document"} for d in documents
                ],
                "tasks": [{"id": str(t.id), "label": t.title, "type": "task"} for t in tasks],
                "events": [{"id": str(e.id), "label": e.name, "type": "event"} for e in events],
                "announcements": [
                    {"id": str(a.id), "label": a.title, "type": "announcement"}
                    for a in announcements
                ],
            },
        )
