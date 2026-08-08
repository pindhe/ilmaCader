import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel


class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = "super_admin", "Super Admin"
        FAMILY_ADMIN = "family_admin", "Family Admin"
        FAMILY_MEMBER = "family_member", "Family Member"
        VIEWER = "viewer", "Viewer"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True)
    role = models.CharField(
        max_length=32, choices=Role.choices, default=Role.FAMILY_MEMBER, db_index=True
    )
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    preferred_language = models.CharField(max_length=10, default="en")
    preferred_currency = models.CharField(max_length=10, default="USD")
    theme = models.CharField(max_length=20, default="system")
    email_verified = models.BooleanField(default=False)
    is_suspended = models.BooleanField(default=False)
    two_factor_enabled = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "full_name"]

    class Meta:
        ordering = ["full_name"]

    def __str__(self):
        return self.full_name or self.email

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)


class EmailVerificationToken(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="email_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    def is_valid(self):
        return not self.used and self.expires_at > timezone.now()


class PasswordResetToken(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reset_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    def is_valid(self):
        return not self.used and self.expires_at > timezone.now()


class LoginHistory(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="login_history")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    successful = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
