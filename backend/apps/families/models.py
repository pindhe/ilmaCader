import uuid

from django.conf import settings
from django.db import models
from django.db.models import Max
from django.utils import timezone

from apps.core.models import SoftDeleteModel, TimeStampedModel


class Family(TimeStampedModel, SoftDeleteModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family_id = models.CharField(max_length=32, unique=True, editable=False, db_index=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="family_logos/", blank=True, null=True)
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    motto = models.CharField(max_length=255, blank=True)
    date_established = models.DateField(null=True, blank=True)
    currency = models.CharField(max_length=10, default="USD")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_families",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "families"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.family_id})"

    def save(self, *args, **kwargs):
        if not self.family_id:
            self.family_id = self._generate_family_id()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_family_id():
        year = timezone.now().year
        prefix = f"FAM-{year}-"
        last = (
            Family.objects.filter(family_id__startswith=prefix)
            .aggregate(Max("family_id"))
            .get("family_id__max")
        )
        if last:
            try:
                seq = int(last.split("-")[-1]) + 1
            except ValueError:
                seq = 1
        else:
            seq = 1
        return f"{prefix}{seq:05d}"


class FamilyMembership(TimeStampedModel):
    class Role(models.TextChoices):
        FAMILY_ADMIN = "family_admin", "Family Admin"
        FAMILY_MEMBER = "family_member", "Family Member"
        VIEWER = "viewer", "Viewer"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships"
    )
    role = models.CharField(max_length=32, choices=Role.choices, default=Role.FAMILY_MEMBER)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("family", "user")
        indexes = [models.Index(fields=["user", "is_active"])]

    def __str__(self):
        return f"{self.user} @ {self.family} ({self.role})"


class PlatformSettings(TimeStampedModel):
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField(default=dict)
    description = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.key
