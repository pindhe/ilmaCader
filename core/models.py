from django.conf import settings
from django.db import models
from django.utils import timezone


class SiteSettings(models.Model):
    site_name = models.CharField(max_length=120, default="ilmaCader")
    tagline = models.CharField(max_length=255, blank=True, default="Family Data Center")
    support_email = models.EmailField(blank=True, default="support@ilmacader.local")
    logo = models.ImageField(upload_to="site/", blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Site settings"

    def __str__(self):
        return self.site_name

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = "create", "Create"
        UPDATE = "update", "Update"
        DELETE = "delete", "Delete"
        LOGIN = "login", "Login"
        LOGOUT = "logout", "Logout"
        UPLOAD = "upload", "Upload"
        APPROVE = "approve", "Approve"
        RESET_PASSWORD = "reset_password", "Reset Password"
        VIEW = "view", "View"
        OTHER = "other", "Other"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=32, choices=Action.choices, default=Action.OTHER)
    model_name = models.CharField(max_length=100, blank=True)
    object_id = models.CharField(max_length=64, blank=True)
    message = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} — {self.message[:60]}"


class Category(models.Model):
    class Kind(models.TextChoices):
        FAMILY = "family", "Family Head"
        DOCUMENT = "document", "Document"
        GENERAL = "general", "General"

    name = models.CharField(
        max_length=120,
        unique=True,
        help_text="Family head name (e.g. each brother's name as head of their family).",
    )
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.FAMILY)
    description = models.TextField(blank=True, help_text="Optional notes about this family group.")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Family Head"
        verbose_name_plural = "Family Heads"

    def __str__(self):
        return self.name
