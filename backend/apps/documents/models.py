import uuid
from datetime import timedelta

from django.db import models
from django.utils import timezone

from apps.core.models import SoftDeleteModel, TimeStampedModel


class Document(TimeStampedModel, SoftDeleteModel):
    class Category(models.TextChoices):
        BIRTH_CERTIFICATE = "birth_certificate", "Birth Certificate"
        ID = "id", "ID"
        PASSPORT = "passport", "Passport"
        MARRIAGE_CERTIFICATE = "marriage_certificate", "Marriage Certificate"
        EDUCATION = "education", "Education Certificate"
        PROPERTY = "property", "Property Document"
        MEDICAL = "medical", "Medical Document"
        FINANCIAL = "financial", "Financial Document"
        LEGAL = "legal", "Legal Document"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        "families.Family", on_delete=models.CASCADE, related_name="documents"
    )
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=40, choices=Category.choices, default=Category.OTHER)
    file = models.FileField(upload_to="documents/")
    member = models.ForeignKey(
        "members.FamilyMember",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    expiration_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="uploaded_documents"
    )

    class Meta:
        ordering = ["-created_at"]

    @property
    def status(self):
        if not self.expiration_date:
            return "valid"
        today = timezone.now().date()
        if self.expiration_date < today:
            return "expired"
        if self.expiration_date <= today + timedelta(days=30):
            return "expiring_soon"
        return "valid"
