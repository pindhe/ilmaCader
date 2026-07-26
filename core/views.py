from django.contrib import messages
from django.db.models import Count
from django.shortcuts import get_object_or_404, redirect
from django.views.generic import ListView, View

from accounts.mixins import AdministratorRequiredMixin
from core.models import AuditLog
from core.utils import log_action
from .forms import CategoryForm
from .models import Category


class CategoryListView(AdministratorRequiredMixin, ListView):
    model = Category
    template_name = "core/category_list.html"
    context_object_name = "categories"
    paginate_by = 20

    def get_queryset(self):
        qs = Category.objects.annotate(member_count=Count("users")).all()
        q = self.request.GET.get("q", "").strip()
        kind = self.request.GET.get("kind", "").strip()
        status = self.request.GET.get("status", "").strip()
        if q:
            from django.db.models import Q

            qs = qs.filter(Q(name__icontains=q) | Q(description__icontains=q))
        if kind:
            qs = qs.filter(kind=kind)
        if status == "active":
            qs = qs.filter(is_active=True)
        elif status == "inactive":
            qs = qs.filter(is_active=False)
        return qs

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        all_cats = Category.objects.all()
        ctx["create_form"] = kwargs.get("create_form") or CategoryForm()
        ctx["open_create_modal"] = bool(
            kwargs.get("open_create_modal")
            or self.request.GET.get("new")
            or (self.request.method == "POST" and self.request.POST.get("action") == "create_category")
        )
        ctx["total_categories"] = all_cats.count()
        ctx["family_count"] = all_cats.filter(kind=Category.Kind.FAMILY).count()
        ctx["document_count"] = all_cats.filter(kind=Category.Kind.DOCUMENT).count()
        ctx["active_count"] = all_cats.filter(is_active=True).count()
        return ctx

    def post(self, request, *args, **kwargs):
        action = request.POST.get("action")
        if action == "create_category":
            form = CategoryForm(request.POST)
            if form.is_valid():
                obj = form.save()
                log_action(
                    request,
                    AuditLog.Action.CREATE,
                    f"Created family head {obj.name}",
                    "Category",
                    obj.pk,
                )
                messages.success(request, f"Family head “{obj.name}” created.")
                return redirect("core:category_list")
            self.object_list = self.get_queryset()
            return self.render_to_response(
                self.get_context_data(
                    object_list=self.object_list,
                    create_form=form,
                    open_create_modal=True,
                )
            )
        return redirect("core:category_list")


class CategoryUpdateView(AdministratorRequiredMixin, View):
    def post(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        data = request.POST.copy()
        if "is_active" not in data:
            data["is_active"] = False
        form = CategoryForm(data, instance=category)
        if form.is_valid():
            form.save()
            log_action(
                request,
                AuditLog.Action.UPDATE,
                f"Updated family head {category.name}",
                "Category",
                pk,
            )
            messages.success(request, "Family head updated.")
        else:
            messages.error(request, "Could not update family head. Check the fields.")
        return redirect("core:category_list")


class CategoryToggleView(AdministratorRequiredMixin, View):
    def post(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        category.is_active = not category.is_active
        category.save(update_fields=["is_active", "updated_at"])
        state = "activated" if category.is_active else "deactivated"
        log_action(request, AuditLog.Action.UPDATE, f"Family head {category.name} {state}", "Category", pk)
        messages.success(request, f"Family head {state}.")
        return redirect("core:category_list")


class CategoryDeleteView(AdministratorRequiredMixin, View):
    def post(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        name = category.name
        category.delete()
        log_action(request, AuditLog.Action.DELETE, f"Deleted family head {name}", "Category", pk)
        messages.success(request, f"Family head “{name}” deleted.")
        return redirect("core:category_list")
