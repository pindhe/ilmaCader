import os
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


def validate_upload(file):
    ext = os.path.splitext(file.name)[1].lower()
    allowed = getattr(settings, "ALLOWED_UPLOAD_EXTENSIONS", {".pdf", ".jpg", ".jpeg", ".png"})
    if ext not in allowed:
        raise ValidationError(f"File type {ext} is not allowed.")
    if file.size > 10 * 1024 * 1024:
        raise ValidationError("File size must be under 10MB.")


class Document(models.Model):
    class DocType(models.TextChoices):
        NATIONAL_ID = "national_id", "National ID"
        BIRTH_CERT = "birth_certificate", "Birth Certificate"
        PASSPORT = "passport", "Passport"
        MARRIAGE = "marriage_certificate", "Marriage Certificate"
        EDUCATION = "education_certificate", "Education Certificate"
        MEDICAL = "medical_report", "Medical Report"
        FAMILY_PHOTO = "family_photo", "Family Photo"
        OTHER = "other", "Other / PDF"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="documents")
    profile = models.ForeignKey(
        "families.FamilyProfile",
        on_delete=models.CASCADE,
        related_name="documents",
        null=True,
        blank=True,
    )
    doc_type = models.CharField(max_length=40, choices=DocType.choices, default=DocType.OTHER)
    title = models.CharField(max_length=150, blank=True)
    file = models.FileField(upload_to="documents/%Y/%m/", validators=[validate_upload])
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.title or self.get_doc_type_display()

    def save(self, *args, **kwargs):
        if not self.title:
            self.title = self.get_doc_type_display()
        super().save(*args, **kwargs)
