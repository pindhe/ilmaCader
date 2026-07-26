from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import PermissionDenied
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.views.generic import DetailView, ListView, View

from accounts.mixins import AdministratorRequiredMixin
from core.models import AuditLog
from core.utils import log_action
from notifications.models import Notification
from .forms import (
    ChildFormSet,
    EmploymentForm,
    FamilyProfileForm,
    HealthForm,
    ParentForm,
    PropertyForm,
    SpouseForm,
)
from .models import FamilyProfile


def get_user_profile(user):
    profile, _ = FamilyProfile.objects.get_or_create(user=user)
    return profile


class FamilyListView(AdministratorRequiredMixin, ListView):
    model = FamilyProfile
    template_name = "families/family_list.html"
    context_object_name = "families"
    paginate_by = 20

    def get_queryset(self):
        qs = FamilyProfile.objects.select_related("user", "user__category").all()
        q = self.request.GET.get("q", "").strip()
        status = self.request.GET.get("status", "").strip()
        gender = self.request.GET.get("gender", "").strip()
        category = self.request.GET.get("category", "").strip()
        region = self.request.GET.get("region", "").strip()

        if q:
            qs = qs.filter(
                Q(first_name__icontains=q)
                | Q(middle_name__icontains=q)
                | Q(last_name__icontains=q)
                | Q(national_id__icontains=q)
                | Q(user__username__icontains=q)
                | Q(phone__icontains=q)
                | Q(email__icontains=q)
                | Q(city__icontains=q)
                | Q(district__icontains=q)
                | Q(region__icontains=q)
                | Q(user__category__name__icontains=q)
            )
        if status:
            qs = qs.filter(status=status)
        if gender:
            qs = qs.filter(gender=gender)
        if category.isdigit():
            qs = qs.filter(user__category_id=int(category))
        if region:
            qs = qs.filter(region__icontains=region)
        return qs

    def get_context_data(self, **kwargs):
        from core.models import Category

        ctx = super().get_context_data(**kwargs)
        all_profiles = FamilyProfile.objects.all()
        ctx["total_families"] = all_profiles.count()
        ctx["draft_count"] = all_profiles.filter(status=FamilyProfile.Status.DRAFT).count()
        ctx["pending_count"] = all_profiles.filter(status=FamilyProfile.Status.PENDING).count()
        ctx["approved_count"] = all_profiles.filter(status=FamilyProfile.Status.APPROVED).count()
        ctx["rejected_count"] = all_profiles.filter(status=FamilyProfile.Status.REJECTED).count()
        ctx["completed_count"] = all_profiles.filter(completion_percent__gte=80).count()
        ctx["categories"] = Category.objects.filter(is_active=True).order_by("name")
        ctx["regions"] = (
            FamilyProfile.objects.exclude(region="")
            .values_list("region", flat=True)
            .distinct()
            .order_by("region")[:50]
        )
        return ctx


class FamilyDetailView(LoginRequiredMixin, DetailView):
    model = FamilyProfile
    template_name = "families/family_detail.html"
    context_object_name = "profile"

    def get_object(self, queryset=None):
        obj = super().get_object(queryset)
        if not self.request.user.is_administrator and obj.user != self.request.user:
            raise PermissionDenied
        return obj


class FamilyEditView(LoginRequiredMixin, View):
    template_name = "families/family_form.html"

    def get_profile(self, request, pk=None):
        if request.user.is_administrator and pk:
            return get_object_or_404(FamilyProfile, pk=pk)
        return get_user_profile(request.user)

    def get(self, request, pk=None):
        profile = self.get_profile(request, pk)
        if not request.user.is_administrator and profile.user != request.user:
            raise PermissionDenied
        context = self._forms(profile)
        context["profile"] = profile
        context.update(self._gate_flags(profile))
        return render(request, self.template_name, context)

    def post(self, request, pk=None):
        profile = self.get_profile(request, pk)
        if not request.user.is_administrator and profile.user != request.user:
            raise PermissionDenied

        from .models import Parent, Spouse, Health, Employment, Property

        parent, _ = Parent.objects.get_or_create(profile=profile)
        spouse, _ = Spouse.objects.get_or_create(profile=profile)
        health, _ = Health.objects.get_or_create(profile=profile)
        employment, _ = Employment.objects.get_or_create(profile=profile)
        prop, _ = Property.objects.get_or_create(profile=profile)

        profile_form = FamilyProfileForm(request.POST, request.FILES, instance=profile)
        parent_form = ParentForm(request.POST, instance=parent)
        spouse_form = SpouseForm(request.POST, instance=spouse)
        health_form = HealthForm(request.POST, instance=health)
        employment_form = EmploymentForm(request.POST, instance=employment)
        property_form = PropertyForm(request.POST, instance=prop)
        child_formset = ChildFormSet(request.POST, instance=profile)

        forms_ok = all(
            [
                profile_form.is_valid(),
                parent_form.is_valid(),
                spouse_form.is_valid(),
                health_form.is_valid(),
                employment_form.is_valid(),
                property_form.is_valid(),
                child_formset.is_valid(),
            ]
        )

        if forms_ok:
            profile = profile_form.save(commit=False)
            profile.recalculate_completion()
            if profile.status == FamilyProfile.Status.APPROVED and not request.user.is_administrator:
                profile.status = FamilyProfile.Status.DRAFT
            profile.save()

            parent = parent_form.save(commit=False)
            parent.profile = profile
            parent.save()

            spouse = spouse_form.save(commit=False)
            spouse.profile = profile
            spouse.save()

            health = health_form.save(commit=False)
            health.profile = profile
            health.save()

            employment = employment_form.save(commit=False)
            employment.profile = profile
            employment.save()

            prop = property_form.save(commit=False)
            prop.profile = profile
            prop.save()

            child_formset.instance = profile
            child_formset.save()

            log_action(
                request,
                AuditLog.Action.UPDATE,
                f"Updated family profile for {profile.user.username}",
                "FamilyProfile",
                profile.pk,
            )
            Notification.objects.create(
                user=profile.user,
                title="Profile Updated",
                message="Your family profile information was updated.",
                category=Notification.Category.PROFILE,
            )
            messages.success(request, "Family information saved.")
            if request.user.is_administrator:
                return redirect("families:detail", pk=profile.pk)
            return redirect("families:mine")

        messages.error(request, "Please correct the errors below.")
        ctx = {
            "profile": profile,
            "profile_form": profile_form,
            "parent_form": parent_form,
            "spouse_form": spouse_form,
            "health_form": health_form,
            "employment_form": employment_form,
            "property_form": property_form,
            "child_formset": child_formset,
        }
        ctx.update(self._gate_flags(profile, spouse_form=spouse_form, child_formset=child_formset))
        return render(request, self.template_name, ctx)

    def _gate_flags(self, profile, spouse_form=None, child_formset=None):
        from django.core.exceptions import ObjectDoesNotExist

        has_spouse = False
        if spouse_form is not None and spouse_form.errors:
            has_spouse = True
        else:
            try:
                spouse = profile.spouse
                if spouse and spouse.name:
                    has_spouse = True
            except ObjectDoesNotExist:
                pass

        has_children = False
        if child_formset is not None and (child_formset.errors or child_formset.non_form_errors()):
            has_children = True
        elif profile.children.exists():
            has_children = True

        return {
            "has_spouse_initial": has_spouse,
            "has_children_initial": has_children,
        }

    def _forms(self, profile):
        from .models import Parent, Spouse, Health, Employment, Property

        parent, _ = Parent.objects.get_or_create(profile=profile)
        spouse, _ = Spouse.objects.get_or_create(profile=profile)
        health, _ = Health.objects.get_or_create(profile=profile)
        employment, _ = Employment.objects.get_or_create(profile=profile)
        prop, _ = Property.objects.get_or_create(profile=profile)
        return {
            "profile_form": FamilyProfileForm(instance=profile),
            "parent_form": ParentForm(instance=parent),
            "spouse_form": SpouseForm(instance=spouse),
            "health_form": HealthForm(instance=health),
            "employment_form": EmploymentForm(instance=employment),
            "property_form": PropertyForm(instance=prop),
            "child_formset": ChildFormSet(instance=profile),
        }


@login_required
def my_family(request):
    profile = get_user_profile(request.user)
    return render(request, "families/family_detail.html", {"profile": profile, "is_own": True})


@login_required
def submit_family(request):
    profile = get_user_profile(request.user)
    if request.method == "POST":
        profile.submit_for_approval()
        log_action(
            request,
            AuditLog.Action.UPDATE,
            f"Submitted profile for approval",
            "FamilyProfile",
            profile.pk,
        )
        Notification.objects.create(
            user=profile.user,
            title="Form Submitted",
            message="Your family information was submitted for approval.",
            category=Notification.Category.PROFILE,
        )
        # Notify admins
        from accounts.models import CustomUser

        for admin in CustomUser.objects.filter(role=CustomUser.Role.ADMIN, is_active=True):
            Notification.objects.create(
                user=admin,
                title="Profile Pending Approval",
                message=f"{request.user.username} submitted a family profile for approval.",
                category=Notification.Category.APPROVAL,
            )
        messages.success(request, "Submitted for approval.")
    return redirect("families:mine")


class ApproveFamilyView(AdministratorRequiredMixin, View):
    def post(self, request, pk):
        profile = get_object_or_404(FamilyProfile, pk=pk)
        action = request.POST.get("action")
        if action == "approve":
            profile.approve(request.user)
            log_action(request, AuditLog.Action.APPROVE, f"Approved profile {profile}", "FamilyProfile", pk)
            Notification.objects.create(
                user=profile.user,
                title="Form Approved",
                message="Your family information form was approved.",
                category=Notification.Category.APPROVAL,
            )
            messages.success(request, "Profile approved.")
        elif action == "reject":
            profile.status = FamilyProfile.Status.REJECTED
            profile.save(update_fields=["status", "updated_at"])
            Notification.objects.create(
                user=profile.user,
                title="Form Rejected",
                message="Your family information form was rejected. Please update and resubmit.",
                category=Notification.Category.APPROVAL,
            )
            messages.info(request, "Profile rejected.")
        return redirect("families:detail", pk=pk)


class DeleteFamilyView(AdministratorRequiredMixin, View):
    def post(self, request, pk):
        profile = get_object_or_404(FamilyProfile, pk=pk)
        user_label = profile.user.username
        profile.delete()
        log_action(request, AuditLog.Action.DELETE, f"Deleted family profile of {user_label}", "FamilyProfile", pk)
        messages.success(request, "Family record deleted.")
        return redirect("families:list")


@login_required
def search_own(request):
    profile = get_user_profile(request.user)
    q = request.GET.get("q", "").strip().lower()
    matches = []
    if q:
        blob = " ".join(
            [
                profile.full_name(),
                profile.national_id,
                profile.phone,
                profile.email,
                profile.region,
                profile.district,
                profile.city,
            ]
        ).lower()
        if q in blob:
            matches.append(profile)
    return render(request, "families/search.html", {"q": q, "matches": matches, "own_only": True})
