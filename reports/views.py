from io import BytesIO

from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render
from django.template.loader import render_to_string

from accounts.mixins import AdministratorRequiredMixin
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView

from families.models import FamilyProfile
from documents.models import Document


def _pdf_from_html(html: str) -> bytes:
    try:
        from xhtml2pdf import pisa

        result = BytesIO()
        pisa.CreatePDF(html, dest=result)
        return result.getvalue()
    except Exception:
        # Minimal fallback
        return html.encode("utf-8")


@login_required
def profile_pdf(request, pk=None):
    if pk and request.user.is_administrator:
        profile = get_object_or_404(FamilyProfile, pk=pk)
    else:
        profile = get_object_or_404(FamilyProfile, user=request.user)
        if not request.user.is_administrator and profile.user != request.user:
            raise PermissionDenied

    from pathlib import Path
    from django.conf import settings
    from core.models import SiteSettings

    site = SiteSettings.get_solo()
    logo_path = Path(settings.MEDIA_ROOT) / "logo.jpg"
    if site.logo:
        candidate = Path(site.logo.path)
        if candidate.exists():
            logo_path = candidate
    logo_url = logo_path.as_uri() if logo_path.exists() else ""

    html = render_to_string(
        "reports/profile_pdf.html",
        {
            "profile": profile,
            "user": profile.user,
            "logo_url": logo_url,
            "site_name": site.site_name or "ilmaCader",
        },
        request=request,
    )
    pdf = _pdf_from_html(html)
    response = HttpResponse(pdf, content_type="application/pdf")
    filename = f"profile_{profile.user.username}.pdf"
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


@login_required
def profile_print(request, pk=None):
    if pk and request.user.is_administrator:
        profile = get_object_or_404(FamilyProfile, pk=pk)
    else:
        profile = get_object_or_404(FamilyProfile, user=request.user)
    return render(request, "reports/profile_print.html", {"profile": profile})


class ReportsHomeView(LoginRequiredMixin, TemplateView):
    template_name = "reports/home.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        user = self.request.user
        if user.is_administrator:
            ctx["families"] = FamilyProfile.objects.select_related("user").all()[:100]
        else:
            ctx["profile"] = FamilyProfile.objects.filter(user=user).first()
        return ctx


class AdminSummaryReportView(AdministratorRequiredMixin, TemplateView):
    template_name = "reports/admin_summary.html"

    def get_context_data(self, **kwargs):
        from accounts.models import CustomUser

        ctx = super().get_context_data(**kwargs)
        ctx["total_users"] = CustomUser.objects.count()
        ctx["total_families"] = FamilyProfile.objects.count()
        ctx["pending"] = FamilyProfile.objects.filter(status=FamilyProfile.Status.PENDING).count()
        ctx["approved"] = FamilyProfile.objects.filter(status=FamilyProfile.Status.APPROVED).count()
        ctx["documents"] = Document.objects.count()
        ctx["families"] = FamilyProfile.objects.select_related("user").all()
        return ctx
