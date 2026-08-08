from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import LoginHistory, User
from apps.accounts.serializers import UserSerializer
from apps.core.models import ActivityLog
from apps.core.permissions import IsSuperAdmin
from apps.families.models import Family
from apps.families.serializers import FamilySerializer
from apps.finance.models import Expense, Income
from apps.members.models import FamilyMember


class AdminStatsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        today = timezone.now().date()
        month_start = today.replace(day=1)
        data = {
            "families": Family.objects.filter(is_deleted=False).count(),
            "active_families": Family.objects.filter(is_deleted=False, is_active=True).count(),
            "users": User.objects.filter(is_active=True).count(),
            "active_users": User.objects.filter(is_active=True, is_suspended=False).count(),
            "new_registrations": User.objects.filter(date_joined__date__gte=month_start).count(),
            "members": FamilyMember.objects.filter(is_deleted=False, is_archived=False).count(),
            "transactions": Income.objects.filter(is_deleted=False).count()
            + Expense.objects.filter(is_deleted=False).count(),
            "storage_usage": "N/A",
            "security_events": LoginHistory.objects.filter(successful=False).count(),
            "recent_activity": list(
                ActivityLog.objects.order_by("-created_at")[:10].values(
                    "action", "module", "created_at", "user_id"
                )
            ),
        }
        return Response({"success": True, "message": "Admin stats", "data": data})


class AdminUsersView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        users = User.objects.all().order_by("-date_joined")
        return Response(
            {
                "success": True,
                "message": "Users",
                "data": UserSerializer(users, many=True, context={"request": request}).data,
            }
        )

    def patch(self, request):
        user_id = request.data.get("id")
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response(
                {"success": False, "message": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if "is_suspended" in request.data:
            user.is_suspended = bool(request.data["is_suspended"])
        if "role" in request.data:
            user.role = request.data["role"]
        if "is_active" in request.data:
            user.is_active = bool(request.data["is_active"])
        user.save()
        return Response(
            {
                "success": True,
                "message": "User updated",
                "data": UserSerializer(user, context={"request": request}).data,
            }
        )


class AdminFamiliesView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        families = Family.objects.filter(is_deleted=False).order_by("-created_at")
        return Response(
            {
                "success": True,
                "message": "Families",
                "data": FamilySerializer(families, many=True, context={"request": request}).data,
            }
        )
