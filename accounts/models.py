from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Administrator"
        USER = "user", "User"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    phone = models.CharField(max_length=30, blank=True)
    category = models.ForeignKey(
        "core.Category",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )
    is_active_account = models.BooleanField(default=True, help_text="Soft active flag managed by admin.")
    must_change_password = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_users",
    )

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return self.get_full_name() or self.username

    @property
    def is_administrator(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    def save(self, *args, **kwargs):
        # Keep Django's is_active in sync with admin toggle
        if not self.is_superuser:
            self.is_active = self.is_active_account
        if self.role == self.Role.ADMIN:
            self.is_staff = True
        super().save(*args, **kwargs)
