from django.contrib import messages
from django.contrib.auth import login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import (
    LoginView,
    PasswordResetView,
    PasswordResetDoneView,
    PasswordResetConfirmView,
    PasswordResetCompleteView,
)
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse_lazy
from django.views.generic import ListView, UpdateView, View

from core.models import AuditLog, SiteSettings
from core.utils import log_action
from .forms import (
    AdminSetPasswordForm,
    LoginForm,
    PasswordResetRequestForm,
    ProfilePasswordChangeForm,
    UserCreateForm,
    UserEditForm,
)
from .mixins import AdministratorRequiredMixin
from .models import CustomUser


class CustomLoginView(LoginView):
    template_name = "accounts/login.html"
    authentication_form = LoginForm
    redirect_authenticated_user = True

    def form_valid(self, form):
        remember = form.cleaned_data.get("remember_me")
        if not remember:
            self.request.session.set_expiry(0)
        else:
            self.request.session.set_expiry(60 * 60 * 24 * 14)
        response = super().form_valid(form)
        log_action(self.request, AuditLog.Action.LOGIN, f"User {self.request.user.username} logged in")
        return response

    def get_success_url(self):
        user = self.request.user
        if user.is_administrator:
            return reverse_lazy("dashboard:admin")
        return reverse_lazy("dashboard:home")


class LogoutView(View):
    def post(self, request):
        if request.user.is_authenticated:
            log_action(request, AuditLog.Action.LOGOUT, f"User {request.user.username} logged out")
        logout(request)
        messages.info(request, "You have been logged out.")
        return redirect("accounts:login")

    def get(self, request):
        return self.post(request)


class CustomPasswordResetView(PasswordResetView):
    template_name = "accounts/password_reset.html"
    email_template_name = "accounts/password_reset_email.txt"
    subject_template_name = "accounts/password_reset_subject.txt"
    form_class = PasswordResetRequestForm
    success_url = reverse_lazy("accounts:password_reset_done")


class CustomPasswordResetDoneView(PasswordResetDoneView):
    template_name = "accounts/password_reset_done.html"


class CustomPasswordResetConfirmView(PasswordResetConfirmView):
    template_name = "accounts/password_reset_confirm.html"
    success_url = reverse_lazy("accounts:password_reset_complete")


class CustomPasswordResetCompleteView(PasswordResetCompleteView):
    template_name = "accounts/password_reset_complete.html"


class UserListView(AdministratorRequiredMixin, ListView):
    model = CustomUser
    template_name = "accounts/user_list.html"
    context_object_name = "users"
    paginate_by = 20

    def get_queryset(self):
        qs = CustomUser.objects.select_related("category").all()
        q = self.request.GET.get("q", "").strip()
        role = self.request.GET.get("role", "").strip()
        status = self.request.GET.get("status", "").strip()
        category = self.request.GET.get("category", "").strip()
        if q:
            from django.db.models import Q

            qs = qs.filter(
                Q(username__icontains=q)
                | Q(first_name__icontains=q)
                | Q(last_name__icontains=q)
                | Q(email__icontains=q)
                | Q(phone__icontains=q)
                | Q(category__name__icontains=q)
            )
        if role in (CustomUser.Role.ADMIN, CustomUser.Role.USER):
            qs = qs.filter(role=role)
        if status == "active":
            qs = qs.filter(is_active_account=True)
        elif status == "inactive":
            qs = qs.filter(is_active_account=False)
        if category.isdigit():
            qs = qs.filter(category_id=int(category))
        return qs

    def get_context_data(self, **kwargs):
        from core.models import Category

        ctx = super().get_context_data(**kwargs)
        all_users = CustomUser.objects.all()
        ctx["create_form"] = kwargs.get("create_form") or UserCreateForm()
        ctx["open_create_modal"] = bool(
            kwargs.get("open_create_modal")
            or self.request.GET.get("new")
            or (self.request.method == "POST" and "create_user" in self.request.POST)
        )
        ctx["total_users"] = all_users.count()
        ctx["admin_count"] = all_users.filter(role=CustomUser.Role.ADMIN).count()
        ctx["user_count"] = all_users.filter(role=CustomUser.Role.USER).count()
        ctx["active_count"] = all_users.filter(is_active_account=True).count()
        ctx["inactive_count"] = all_users.filter(is_active_account=False).count()
        ctx["categories"] = Category.objects.filter(is_active=True).order_by("name")
        return ctx

    def post(self, request, *args, **kwargs):
        if request.POST.get("action") != "create_user":
            return redirect("accounts:user_list")

        form = UserCreateForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.created_by = request.user
            user.save()
            log_action(
                request,
                AuditLog.Action.CREATE,
                f"Created user {user.username}",
                "CustomUser",
                user.pk,
            )
            messages.success(request, f"User “{user.username}” created successfully.")
            return redirect("accounts:user_list")

        self.object_list = self.get_queryset()
        context = self.get_context_data(
            object_list=self.object_list,
            create_form=form,
            open_create_modal=True,
        )
        return self.render_to_response(context)


class UserCreateView(AdministratorRequiredMixin, View):
    """Legacy create URL opens the users page modal."""

    def get(self, request):
        return redirect("/users/?new=1")

    def post(self, request):
        return redirect("/users/?new=1")


class UserUpdateView(AdministratorRequiredMixin, UpdateView):
    model = CustomUser
    form_class = UserEditForm
    template_name = "accounts/user_form.html"
    success_url = reverse_lazy("accounts:user_list")

    def form_valid(self, form):
        response = super().form_valid(form)
        log_action(
            self.request,
            AuditLog.Action.UPDATE,
            f"Updated user {self.object.username}",
            "CustomUser",
            self.object.pk,
        )
        messages.success(self.request, "User updated.")
        return response


class UserDeleteView(AdministratorRequiredMixin, View):
    def post(self, request, pk):
        user = get_object_or_404(CustomUser, pk=pk)
        if user == request.user:
            messages.error(request, "You cannot delete your own account.")
            return redirect("accounts:user_list")
        username = user.username
        user.delete()
        log_action(request, AuditLog.Action.DELETE, f"Deleted user {username}", "CustomUser", pk)
        messages.success(request, f"User {username} deleted.")
        return redirect("accounts:user_list")


class UserToggleActiveView(AdministratorRequiredMixin, View):
    def post(self, request, pk):
        user = get_object_or_404(CustomUser, pk=pk)
        if user == request.user:
            messages.error(request, "You cannot deactivate your own account.")
            return redirect("accounts:user_list")
        user.is_active_account = not user.is_active_account
        user.save()
        state = "activated" if user.is_active_account else "deactivated"
        log_action(request, AuditLog.Action.UPDATE, f"User {user.username} {state}", "CustomUser", pk)
        messages.success(request, f"User {state}.")
        return redirect("accounts:user_list")


class AdminResetPasswordView(AdministratorRequiredMixin, View):
    def get(self, request, pk):
        user = get_object_or_404(CustomUser, pk=pk)
        form = AdminSetPasswordForm(user)
        return render(request, "accounts/admin_reset_password.html", {"form": form, "target_user": user})

    def post(self, request, pk):
        user = get_object_or_404(CustomUser, pk=pk)
        form = AdminSetPasswordForm(user, request.POST)
        if form.is_valid():
            form.save()
            log_action(
                request,
                AuditLog.Action.RESET_PASSWORD,
                f"Admin reset password for {user.username}",
                "CustomUser",
                pk,
            )
            messages.success(request, "Password reset successfully.")
            return redirect("accounts:user_list")
        return render(request, "accounts/admin_reset_password.html", {"form": form, "target_user": user})


@login_required
def change_password(request):
    if request.method == "POST":
        form = ProfilePasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            messages.success(request, "Password changed.")
            return redirect("dashboard:home")
    else:
        form = ProfilePasswordChangeForm(request.user)
    return render(request, "accounts/change_password.html", {"form": form})


class SiteSettingsView(AdministratorRequiredMixin, View):
    def get(self, request):
        settings_obj = SiteSettings.get_solo()
        return render(request, "accounts/site_settings.html", {"settings_obj": settings_obj})

    def post(self, request):
        settings_obj = SiteSettings.get_solo()
        settings_obj.site_name = request.POST.get("site_name", settings_obj.site_name)
        settings_obj.tagline = request.POST.get("tagline", settings_obj.tagline)
        settings_obj.support_email = request.POST.get("support_email", settings_obj.support_email)
        if request.FILES.get("logo"):
            settings_obj.logo = request.FILES["logo"]
        settings_obj.save()
        log_action(request, AuditLog.Action.UPDATE, "Updated website settings", "SiteSettings", 1)
        messages.success(request, "Settings saved.")
        return redirect("accounts:site_settings")
