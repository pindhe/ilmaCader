from django.conf import settings
from django.db import models
from django.utils import timezone


class FamilyProfile(models.Model):
    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING = "pending", "Pending Approval"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="family_profile",
    )
    first_name = models.CharField(max_length=100, blank=True)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    gender = models.CharField(max_length=20, choices=Gender.choices, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    national_id = models.CharField(max_length=50, blank=True)
    birth_certificate_number = models.CharField(max_length=50, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    photo = models.ImageField(upload_to="profiles/", blank=True, null=True)
    occupation = models.CharField(max_length=120, blank=True)
    education = models.CharField(max_length=120, blank=True)
    blood_group = models.CharField(max_length=10, blank=True)
    nationality = models.CharField(max_length=80, blank=True)
    religion = models.CharField(max_length=80, blank=True)
    address = models.TextField(blank=True)
    region = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    completion_percent = models.PositiveSmallIntegerField(default=0)
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_profiles",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        name = " ".join(p for p in [self.first_name, self.last_name] if p)
        return name or f"Profile of {self.user.username}"

    def full_name(self):
        return " ".join(p for p in [self.first_name, self.middle_name, self.last_name] if p)

    def recalculate_completion(self):
        fields = [
            self.first_name,
            self.last_name,
            self.gender,
            self.date_of_birth,
            self.national_id,
            self.phone,
            self.email,
            self.occupation,
            self.education,
            self.nationality,
            self.address,
            self.region,
            self.district,
            self.city,
        ]
        filled = sum(1 for f in fields if f)
        percent = int((filled / len(fields)) * 100)
        self.completion_percent = percent
        return percent

    def submit_for_approval(self):
        self.status = self.Status.PENDING
        self.submitted_at = timezone.now()
        self.recalculate_completion()
        self.save()

    def approve(self, admin_user):
        self.status = self.Status.APPROVED
        self.approved_at = timezone.now()
        self.approved_by = admin_user
        self.save()


class Parent(models.Model):
    class AliveStatus(models.TextChoices):
        ALIVE = "alive", "Alive"
        DECEASED = "deceased", "Deceased"
        UNKNOWN = "unknown", "Unknown"

    profile = models.OneToOneField(FamilyProfile, on_delete=models.CASCADE, related_name="parents")
    father_name = models.CharField(max_length=150, blank=True)
    mother_name = models.CharField(max_length=150, blank=True)
    father_occupation = models.CharField(max_length=120, blank=True)
    mother_occupation = models.CharField(max_length=120, blank=True)
    father_phone = models.CharField(max_length=30, blank=True)
    mother_phone = models.CharField(max_length=30, blank=True)
    father_alive = models.CharField(max_length=20, choices=AliveStatus.choices, default=AliveStatus.UNKNOWN)
    mother_alive = models.CharField(max_length=20, choices=AliveStatus.choices, default=AliveStatus.UNKNOWN)

    def __str__(self):
        return f"Parents of {self.profile}"


class Spouse(models.Model):
    profile = models.OneToOneField(FamilyProfile, on_delete=models.CASCADE, related_name="spouse")
    name = models.CharField(max_length=150, blank=True)
    marriage_date = models.DateField(null=True, blank=True)
    occupation = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=30, blank=True)

    def __str__(self):
        return self.name or f"Spouse of {self.profile}"


class Child(models.Model):
    profile = models.ForeignKey(FamilyProfile, on_delete=models.CASCADE, related_name="children")
    name = models.CharField(max_length=150)
    gender = models.CharField(max_length=20, choices=FamilyProfile.Gender.choices, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    school = models.CharField(max_length=150, blank=True)

    class Meta:
        ordering = ["birth_date", "name"]
        verbose_name_plural = "Children"

    def __str__(self):
        return self.name


class Health(models.Model):
    profile = models.OneToOneField(FamilyProfile, on_delete=models.CASCADE, related_name="health")
    blood_group = models.CharField(max_length=10, blank=True)
    medical_conditions = models.TextField(blank=True)
    disabilities = models.TextField(blank=True)
    insurance = models.CharField(max_length=150, blank=True)
    doctor = models.CharField(max_length=150, blank=True)

    def __str__(self):
        return f"Health — {self.profile}"


class Employment(models.Model):
    class EmploymentStatus(models.TextChoices):
        EMPLOYED = "employed", "Employed"
        SELF_EMPLOYED = "self_employed", "Self Employed"
        UNEMPLOYED = "unemployed", "Unemployed"
        RETIRED = "retired", "Retired"
        STUDENT = "student", "Student"

    profile = models.OneToOneField(FamilyProfile, on_delete=models.CASCADE, related_name="employment")
    company = models.CharField(max_length=150, blank=True)
    position = models.CharField(max_length=120, blank=True)
    salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    employment_status = models.CharField(
        max_length=30, choices=EmploymentStatus.choices, blank=True
    )
    years_worked = models.PositiveSmallIntegerField(null=True, blank=True)

    def __str__(self):
        return f"Employment — {self.profile}"


class Property(models.Model):
    profile = models.OneToOneField(FamilyProfile, on_delete=models.CASCADE, related_name="property")
    house = models.CharField(max_length=255, blank=True)
    land = models.CharField(max_length=255, blank=True)
    vehicle = models.CharField(max_length=255, blank=True)
    business = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name_plural = "Properties"

    def __str__(self):
        return f"Property — {self.profile}"
