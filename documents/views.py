from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views.generic import CreateView, ListView, View

from accounts.mixins import AdministratorRequiredMixin
from core.models import AuditLog
from core.utils import log_action
from families.models import FamilyProfile
from notifications.models import Notification
from .forms import DocumentUploadForm
from .models import Document


class DocumentListView(LoginRequiredMixin, ListView):
    model = Document
    template_name = "documents/document_list.html"
    context_object_name = "documents"
    paginate_by = 20

    def get_queryset(self):
        qs = Document.objects.select_related("user")
        if self.request.user.is_administrator:
            q = self.request.GET.get("q", "").strip()
            if q:
                qs = qs.filter(user__username__icontains=q) | qs.filter(title__icontains=q)
            return qs
        return qs.filter(user=self.request.user)


class DocumentUploadView(LoginRequiredMixin, CreateView):
    model = Document
    form_class = DocumentUploadForm
    template_name = "documents/document_upload.html"
    success_url = reverse_lazy("documents:list")

    def form_valid(self, form):
        form.instance.user = self.request.user
        profile = FamilyProfile.objects.filter(user=self.request.user).first()
        form.instance.profile = profile
        response = super().form_valid(form)
        log_action(
            self.request,
            AuditLog.Action.UPLOAD,
            f"Uploaded document {self.object}",
            "Document",
            self.object.pk,
        )
        Notification.objects.create(
            user=self.request.user,
            title="Document Uploaded",
            message=f"Your document '{self.object}' was uploaded successfully.",
            category=Notification.Category.DOCUMENT,
        )
        messages.success(self.request, "Document uploaded.")
        return response


class DocumentDeleteView(LoginRequiredMixin, View):
    def post(self, request, pk):
        doc = get_object_or_404(Document, pk=pk)
        if not request.user.is_administrator and doc.user != request.user:
            raise PermissionDenied
        # Users cannot delete per business rules — only admin
        if not request.user.is_administrator:
            raise PermissionDenied("Users cannot delete records.")
        label = str(doc)
        doc.file.delete(save=False)
        doc.delete()
        log_action(request, AuditLog.Action.DELETE, f"Deleted document {label}", "Document", pk)
        messages.success(request, "Document deleted.")
        return redirect("documents:list")


class AdminDocumentListView(AdministratorRequiredMixin, ListView):
    model = Document
    template_name = "documents/document_list.html"
    context_object_name = "documents"
    paginate_by = 30
