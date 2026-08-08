import uuid

from django.db import models

from apps.core.models import TimeStampedModel


class Notification(TimeStampedModel):
    class NotificationType(models.TextChoices):
        MEMBER = "member", "Family Member"
        INCOME = "income", "Income"
        EXPENSE = "expense", "Expense"
        CONTRIBUTION = "contribution", "Contribution"
        EVENT = "event", "Event"
        TASK = "task", "Task"
        DOCUMENT = "document", "Document"
        ANNOUNCEMENT = "announcement", "Announcement"
        GOAL = "goal", "Goal"
        SYSTEM = "system", "System"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        "families.Family",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=30, choices=NotificationType.choices, default=NotificationType.SYSTEM
    )
    link = models.CharField(max_length=500, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ["-created_at"]
