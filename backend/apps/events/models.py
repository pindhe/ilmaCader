import uuid

from django.db import models

from apps.core.models import SoftDeleteModel, TimeStampedModel


class Event(TimeStampedModel, SoftDeleteModel):
    class EventType(models.TextChoices):
        WEDDING = "wedding", "Wedding"
        BIRTHDAY = "birthday", "Birthday"
        GRADUATION = "graduation", "Graduation"
        MEETING = "meeting", "Family Meeting"
        RELIGIOUS = "religious", "Religious Celebration"
        TRIP = "trip", "Trip"
        ANNIVERSARY = "anniversary", "Anniversary"
        MEMORIAL = "memorial", "Memorial"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        "families.Family", on_delete=models.CASCADE, related_name="events"
    )
    name = models.CharField(max_length=255)
    event_type = models.CharField(max_length=30, choices=EventType.choices, default=EventType.OTHER)
    date = models.DateField(db_index=True)
    time = models.TimeField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    organizer = models.ForeignKey(
        "members.FamilyMember",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="organized_events",
    )
    description = models.TextField(blank=True)
    participants = models.ManyToManyField(
        "members.FamilyMember", blank=True, related_name="events"
    )
    image = models.ImageField(upload_to="events/", blank=True, null=True)
    attachment = models.FileField(upload_to="events/attachments/", blank=True, null=True)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="created_events"
    )

    class Meta:
        ordering = ["date", "time"]


class Announcement(TimeStampedModel, SoftDeleteModel):
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        NORMAL = "normal", "Normal"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        "families.Family", on_delete=models.CASCADE, related_name="announcements"
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    image = models.ImageField(upload_to="announcements/", blank=True, null=True)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.NORMAL)
    audience = models.CharField(max_length=100, default="all")
    author = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="announcements"
    )
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
