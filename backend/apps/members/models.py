import uuid

from django.db import models

from apps.core.models import SoftDeleteModel, TimeStampedModel


class FamilyMember(TimeStampedModel, SoftDeleteModel):
    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"

    class FamilyRole(models.TextChoices):
        FATHER = "father", "Father"
        MOTHER = "mother", "Mother"
        SON = "son", "Son"
        DAUGHTER = "daughter", "Daughter"
        GRANDFATHER = "grandfather", "Grandfather"
        GRANDMOTHER = "grandmother", "Grandmother"
        UNCLE = "uncle", "Uncle"
        AUNT = "aunt", "Aunt"
        COUSIN = "cousin", "Cousin"
        GUARDIAN = "guardian", "Guardian"
        OTHER = "other", "Other"

    class MaritalStatus(models.TextChoices):
        SINGLE = "single", "Single"
        MARRIED = "married", "Married"
        DIVORCED = "divorced", "Divorced"
        WIDOWED = "widowed", "Widowed"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        "families.Family", on_delete=models.CASCADE, related_name="members"
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="member_profiles",
    )
    full_name = models.CharField(max_length=255)
    profile_photo = models.ImageField(upload_to="members/", blank=True, null=True)
    gender = models.CharField(max_length=20, choices=Gender.choices, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    occupation = models.CharField(max_length=150, blank=True)
    education = models.CharField(max_length=150, blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    marital_status = models.CharField(
        max_length=20, choices=MaritalStatus.choices, blank=True
    )
    blood_type = models.CharField(max_length=10, blank=True)
    emergency_contact = models.CharField(max_length=255, blank=True)
    biography = models.TextField(blank=True)
    joined_date = models.DateField(null=True, blank=True)
    family_role = models.CharField(
        max_length=30, choices=FamilyRole.choices, default=FamilyRole.OTHER
    )
    is_archived = models.BooleanField(default=False)

    class Meta:
        ordering = ["full_name"]
        indexes = [
            models.Index(fields=["family", "is_archived"]),
            models.Index(fields=["family", "family_role"]),
        ]

    def __str__(self):
        return self.full_name


class Relationship(TimeStampedModel):
    class RelationType(models.TextChoices):
        PARENT = "parent", "Parent"
        CHILD = "child", "Child"
        SPOUSE = "spouse", "Spouse"
        SIBLING = "sibling", "Sibling"
        GRANDPARENT = "grandparent", "Grandparent"
        GRANDCHILD = "grandchild", "Grandchild"
        UNCLE_AUNT = "uncle_aunt", "Uncle/Aunt"
        NIECE_NEPHEW = "niece_nephew", "Niece/Nephew"
        COUSIN = "cousin", "Cousin"
        GUARDIAN = "guardian", "Guardian"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        "families.Family", on_delete=models.CASCADE, related_name="relationships"
    )
    from_member = models.ForeignKey(
        FamilyMember, on_delete=models.CASCADE, related_name="relationships_from"
    )
    to_member = models.ForeignKey(
        FamilyMember, on_delete=models.CASCADE, related_name="relationships_to"
    )
    relation_type = models.CharField(max_length=30, choices=RelationType.choices)
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ("from_member", "to_member", "relation_type")

    def __str__(self):
        return f"{self.from_member} → {self.to_member} ({self.relation_type})"
