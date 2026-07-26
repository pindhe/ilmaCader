from datetime import date

from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Count, Q
from django.db.models.functions import ExtractYear
from django.shortcuts import redirect
from django.views.generic import TemplateView

from accounts.mixins import AdministratorRequiredMixin
from accounts.models import CustomUser
from core.models import AuditLog
from documents.models import Document
from families.models import FamilyProfile


class HomeRedirectView(LoginRequiredMixin, TemplateView):
    def get(self, request, *args, **kwargs):
        if request.user.is_administrator:
            return redirect("dashboard:admin")
        return redirect("dashboard:user")


class UserDashboardView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard/user_dashboard.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        user = self.request.user
        profile = getattr(user, "family_profile", None)
        if profile is None:
            profile, _ = FamilyProfile.objects.get_or_create(user=user)
        docs = Document.objects.filter(user=user)
        ctx.update(
            {
                "profile": profile,
                "doc_count": docs.count(),
                "notifications": user.notifications.all()[:8],
            }
        )
        return ctx


class AdminDashboardView(AdministratorRequiredMixin, TemplateView):
    template_name = "dashboard/admin_dashboard.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        profiles = FamilyProfile.objects.all()
        today = date.today()

        gender_stats = list(
            profiles.exclude(gender="").values("gender").annotate(total=Count("id")).order_by("gender")
        )

        age_buckets = {"0-17": 0, "18-30": 0, "31-50": 0, "51+": 0, "Unknown": 0}
        for dob in profiles.exclude(date_of_birth=None).values_list("date_of_birth", flat=True):
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            if age < 18:
                age_buckets["0-17"] += 1
            elif age <= 30:
                age_buckets["18-30"] += 1
            elif age <= 50:
                age_buckets["31-50"] += 1
            else:
                age_buckets["51+"] += 1
        age_buckets["Unknown"] = profiles.filter(date_of_birth=None).count()

        status_stats = list(profiles.values("status").annotate(total=Count("id")))

        ctx.update(
            {
                "total_users": CustomUser.objects.count(),
                "total_families": profiles.count(),
                "completed_profiles": profiles.filter(completion_percent__gte=80).count(),
                "pending_profiles": profiles.filter(status=FamilyProfile.Status.PENDING).count(),
                "approved_profiles": profiles.filter(status=FamilyProfile.Status.APPROVED).count(),
                "uploaded_documents": Document.objects.count(),
                "gender_stats": gender_stats,
                "age_buckets": age_buckets,
                "status_stats": status_stats,
                "latest_users": CustomUser.objects.order_by("-date_joined")[:8],
                "latest_activities": AuditLog.objects.select_related("user")[:12],
                "pending_families": profiles.filter(status=FamilyProfile.Status.PENDING)
                .select_related("user")
                .order_by("-submitted_at", "-updated_at")[:6],
                "active_users": CustomUser.objects.filter(is_active_account=True).count(),
            }
        )
        return ctx
