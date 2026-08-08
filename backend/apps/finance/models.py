import uuid

from django.db import models

from apps.core.models import SoftDeleteModel, TimeStampedModel


class Income(TimeStampedModel, SoftDeleteModel):
    class Category(models.TextChoices):
        SALARY = "salary", "Salary"
        BUSINESS = "business", "Business"
        FREELANCE = "freelance", "Freelance"
        RENTAL = "rental", "Rental"
        INVESTMENT = "investment", "Investment"
        DONATION = "donation", "Donation"
        GIFT = "gift", "Gift"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        "families.Family", on_delete=models.CASCADE, related_name="incomes"
    )
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")
    source = models.CharField(max_length=255, blank=True)
    person = models.ForeignKey(
        "members.FamilyMember",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incomes",
    )
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.OTHER)
    date = models.DateField(db_index=True)
    description = models.TextField(blank=True)
    attachment = models.FileField(upload_to="finance/income/", blank=True, null=True)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="created_incomes"
    )

    class Meta:
        ordering = ["-date", "-created_at"]


class Expense(TimeStampedModel, SoftDeleteModel):
    class Category(models.TextChoices):
        FOOD = "food", "Food"
        RENT = "rent", "Rent"
        EDUCATION = "education", "Education"
        HEALTHCARE = "healthcare", "Healthcare"
        TRANSPORT = "transport", "Transport"
        ELECTRICITY = "electricity", "Electricity"
        WATER = "water", "Water"
        INTERNET = "internet", "Internet"
        CLOTHING = "clothing", "Clothing"
        TRAVEL = "travel", "Travel"
        FAMILY_EVENTS = "family_events", "Family Events"
        EMERGENCY = "emergency", "Emergency"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        "families.Family", on_delete=models.CASCADE, related_name="expenses"
    )
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.OTHER)
    paid_by = models.ForeignKey(
        "members.FamilyMember",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses",
    )
    date = models.DateField(db_index=True)
    description = models.TextField(blank=True)
    receipt = models.FileField(upload_to="finance/expenses/", blank=True, null=True)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="created_expenses"
    )

    class Meta:
        ordering = ["-date", "-created_at"]


class Contribution(TimeStampedModel, SoftDeleteModel):
    class PaymentMethod(models.TextChoices):
        CASH = "cash", "Cash"
        BANK = "bank", "Bank"
        MOBILE_MONEY = "mobile_money", "Mobile Money"
        ONLINE = "online", "Online Payment"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        "families.Family", on_delete=models.CASCADE, related_name="contributions"
    )
    member = models.ForeignKey(
        "members.FamilyMember",
        on_delete=models.SET_NULL,
        null=True,
        related_name="contributions",
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    date = models.DateField(db_index=True)
    contribution_type = models.CharField(max_length=100, blank=True)
    purpose = models.CharField(max_length=255, blank=True)
    payment_method = models.CharField(
        max_length=30, choices=PaymentMethod.choices, default=PaymentMethod.CASH
    )
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_contributions",
    )

    class Meta:
        ordering = ["-date", "-created_at"]


class SavingGoal(TimeStampedModel, SoftDeleteModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        "families.Family", on_delete=models.CASCADE, related_name="saving_goals"
    )
    title = models.CharField(max_length=255)
    target_amount = models.DecimalField(max_digits=14, decimal_places=2)
    current_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    deadline = models.DateField(null=True, blank=True)
    responsible_member = models.ForeignKey(
        "members.FamilyMember",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="saving_goals",
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def progress(self):
        if self.target_amount <= 0:
            return 0
        return min(100, float(self.current_amount / self.target_amount * 100))


class Budget(TimeStampedModel):
    class Period(models.TextChoices):
        MONTHLY = "monthly", "Monthly"
        YEARLY = "yearly", "Yearly"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        "families.Family", on_delete=models.CASCADE, related_name="budgets"
    )
    category = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    period = models.CharField(max_length=20, choices=Period.choices, default=Period.MONTHLY)
    year = models.PositiveIntegerField()
    month = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ("family", "category", "period", "year", "month")
        ordering = ["category"]


class Asset(TimeStampedModel, SoftDeleteModel):
    class AssetType(models.TextChoices):
        HOUSE = "house", "House"
        LAND = "land", "Land"
        CAR = "car", "Car"
        BUSINESS = "business", "Business"
        BANK_ACCOUNT = "bank_account", "Bank Account"
        INVESTMENT = "investment", "Investment"
        EQUIPMENT = "equipment", "Equipment"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        SOLD = "sold", "Sold"
        MAINTENANCE = "maintenance", "Maintenance"
        ARCHIVED = "archived", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        "families.Family", on_delete=models.CASCADE, related_name="assets"
    )
    name = models.CharField(max_length=255)
    asset_type = models.CharField(max_length=30, choices=AssetType.choices)
    owner = models.ForeignKey(
        "members.FamilyMember",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assets",
    )
    purchase_date = models.DateField(null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    current_value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    location = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    document = models.FileField(upload_to="finance/assets/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        ordering = ["-current_value"]


class Debt(TimeStampedModel, SoftDeleteModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        "families.Family", on_delete=models.CASCADE, related_name="debts"
    )
    name = models.CharField(max_length=255)
    creditor = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    remaining_balance = models.DecimalField(max_digits=14, decimal_places=2)
    interest = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    due_date = models.DateField(null=True, blank=True)
    responsible_member = models.ForeignKey(
        "members.FamilyMember",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="debts",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["status", "due_date"]


class FinancialGoal(TimeStampedModel, SoftDeleteModel):
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        PAUSED = "paused", "Paused"
        CANCELLED = "cancelled", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    family = models.ForeignKey(
        "families.Family", on_delete=models.CASCADE, related_name="financial_goals"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    target_amount = models.DecimalField(max_digits=14, decimal_places=2)
    current_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    deadline = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    responsible_members = models.ManyToManyField(
        "members.FamilyMember", blank=True, related_name="financial_goals"
    )

    class Meta:
        ordering = ["-created_at"]

    @property
    def progress(self):
        if self.target_amount <= 0:
            return 0
        return min(100, float(self.current_amount / self.target_amount * 100))
