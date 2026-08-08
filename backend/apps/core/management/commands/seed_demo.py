from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.core.models import ActivityLog
from apps.events.models import Announcement, Event
from apps.families.models import Family, FamilyMembership
from apps.finance.models import (
    Asset,
    Budget,
    Contribution,
    Debt,
    Expense,
    FinancialGoal,
    Income,
    SavingGoal,
)
from apps.members.models import FamilyMember, Relationship
from apps.notifications.models import Notification
from apps.tasks.models import Task


class Command(BaseCommand):
    help = "Seed Hassan Family demo data for Family Data Center"

    @transaction.atomic
    def handle(self, *args, **options):
        admin, _ = User.objects.update_or_create(
            email="admin@familydatacenter.local",
            defaults={
                "username": "admin@familydatacenter.local",
                "full_name": "Platform Admin",
                "role": User.Role.ADMIN,
                "email_verified": True,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin.set_password("Admin@12345")
        admin.save()

        hassan_user, _ = User.objects.update_or_create(
            email="hassan@demo.local",
            defaults={
                "username": "hassan@demo.local",
                "full_name": "Hassan Ahmed",
                "phone": "+252610000001",
                "role": User.Role.ADMIN,
                "email_verified": True,
                "preferred_currency": "USD",
            },
        )
        hassan_user.set_password("Demo@12345")
        hassan_user.save()

        amina_user, _ = User.objects.update_or_create(
            email="amina@demo.local",
            defaults={
                "username": "amina@demo.local",
                "full_name": "Amina Hassan",
                "phone": "+252610000002",
                "role": User.Role.MEMBER,
                "email_verified": True,
            },
        )
        amina_user.set_password("Demo@12345")
        amina_user.save()

        family, _ = Family.objects.update_or_create(
            name="Hassan Family",
            defaults={
                "description": "A united family building a secure future together.",
                "country": "Somalia",
                "city": "Mogadishu",
                "address": "Hodan District",
                "phone": "+252610000000",
                "email": "hassan.family@demo.local",
                "motto": "One Family. One Data Center. One Future.",
                "date_established": date(1998, 6, 15),
                "currency": "USD",
                "created_by": hassan_user,
                "is_active": True,
                "is_deleted": False,
            },
        )

        FamilyMembership.objects.update_or_create(
            family=family,
            user=hassan_user,
            defaults={"role": FamilyMembership.Role.ADMIN, "is_active": True},
        )
        FamilyMembership.objects.update_or_create(
            family=family,
            user=amina_user,
            defaults={"role": FamilyMembership.Role.MEMBER, "is_active": True},
        )

        members = {}
        member_specs = [
            ("hassan", "Hassan Ahmed", "male", "father", date(1975, 3, 12), "Business Owner", hassan_user),
            ("amina", "Amina Hassan", "female", "mother", date(1978, 8, 21), "Teacher", amina_user),
            ("mohamed", "Mohamed Hassan", "male", "son", date(2002, 1, 5), "Software Engineer", None),
            ("fatima", "Fatima Hassan", "female", "daughter", date(2005, 11, 18), "Student", None),
        ]
        for key, name, gender, role, dob, occupation, user in member_specs:
            member, _ = FamilyMember.objects.update_or_create(
                family=family,
                full_name=name,
                defaults={
                    "gender": gender,
                    "family_role": role,
                    "date_of_birth": dob,
                    "occupation": occupation,
                    "city": "Mogadishu",
                    "country": "Somalia",
                    "email": f"{key}@demo.local",
                    "phone": f"+2526100000{10 + len(members)}",
                    "joined_date": date(2010, 1, 1),
                    "user": user,
                    "is_archived": False,
                    "is_deleted": False,
                    "marital_status": "married" if role in ("father", "mother") else "single",
                },
            )
            members[key] = member

        Relationship.objects.update_or_create(
            family=family,
            from_member=members["hassan"],
            to_member=members["amina"],
            relation_type=Relationship.RelationType.SPOUSE,
            defaults={},
        )
        Relationship.objects.update_or_create(
            family=family,
            from_member=members["hassan"],
            to_member=members["mohamed"],
            relation_type=Relationship.RelationType.PARENT,
            defaults={},
        )
        Relationship.objects.update_or_create(
            family=family,
            from_member=members["hassan"],
            to_member=members["fatima"],
            relation_type=Relationship.RelationType.PARENT,
            defaults={},
        )
        Relationship.objects.update_or_create(
            family=family,
            from_member=members["amina"],
            to_member=members["mohamed"],
            relation_type=Relationship.RelationType.PARENT,
            defaults={},
        )
        Relationship.objects.update_or_create(
            family=family,
            from_member=members["amina"],
            to_member=members["fatima"],
            relation_type=Relationship.RelationType.PARENT,
            defaults={},
        )
        Relationship.objects.update_or_create(
            family=family,
            from_member=members["mohamed"],
            to_member=members["fatima"],
            relation_type=Relationship.RelationType.SIBLING,
            defaults={},
        )

        today = timezone.now().date()
        month_start = today.replace(day=1)

        Income.objects.filter(family=family).delete()
        income_rows = [
            ("Hassan Salary", Decimal("2500.00"), "salary", members["hassan"], "Import Business"),
            ("Amina Salary", Decimal("1200.00"), "salary", members["amina"], "School"),
            ("Rental Income", Decimal("800.00"), "rental", members["hassan"], "Family Property"),
            ("Freelance Project", Decimal("350.00"), "freelance", members["mohamed"], "Client Work"),
        ]
        for title, amount, category, person, source in income_rows:
            Income.objects.create(
                family=family,
                title=title,
                amount=amount,
                currency="USD",
                category=category,
                person=person,
                source=source,
                date=month_start + timedelta(days=2),
                created_by=hassan_user,
            )

        Expense.objects.filter(family=family).delete()
        expense_rows = [
            ("Groceries", Decimal("420.00"), "food", members["amina"]),
            ("School Fees", Decimal("300.00"), "education", members["hassan"]),
            ("Electricity Bill", Decimal("85.00"), "electricity", members["hassan"]),
            ("Internet", Decimal("45.00"), "internet", members["mohamed"]),
            ("Fuel", Decimal("120.00"), "transport", members["hassan"]),
            ("Clinic Visit", Decimal("90.00"), "healthcare", members["amina"]),
            ("Family Dinner", Decimal("75.00"), "family_events", members["hassan"]),
        ]
        for idx, (title, amount, category, paid_by) in enumerate(expense_rows):
            Expense.objects.create(
                family=family,
                title=title,
                amount=amount,
                currency="USD",
                category=category,
                paid_by=paid_by,
                date=month_start + timedelta(days=3 + idx),
                created_by=hassan_user,
            )

        Contribution.objects.filter(family=family).delete()
        for member, amount, purpose in [
            (members["hassan"], Decimal("500.00"), "House fund"),
            (members["amina"], Decimal("200.00"), "House fund"),
            (members["mohamed"], Decimal("150.00"), "Emergency fund"),
        ]:
            Contribution.objects.create(
                family=family,
                member=member,
                amount=amount,
                date=month_start + timedelta(days=5),
                contribution_type="monthly",
                purpose=purpose,
                payment_method=Contribution.PaymentMethod.BANK,
                created_by=hassan_user,
            )

        SavingGoal.objects.filter(family=family).delete()
        SavingGoal.objects.create(
            family=family,
            title="Buy Family House",
            target_amount=Decimal("50000.00"),
            current_amount=Decimal("18500.00"),
            deadline=date(2027, 12, 31),
            responsible_member=members["hassan"],
            description="Save for a larger family home.",
        )
        SavingGoal.objects.create(
            family=family,
            title="Emergency Fund",
            target_amount=Decimal("10000.00"),
            current_amount=Decimal("4300.00"),
            deadline=date(2026, 12, 31),
            responsible_member=members["amina"],
            description="6 months of essential expenses.",
        )

        year = today.year
        month = today.month
        Budget.objects.filter(family=family, year=year, month=month).delete()
        for category, amount in [
            ("food", Decimal("500.00")),
            ("education", Decimal("300.00")),
            ("healthcare", Decimal("200.00")),
            ("transport", Decimal("150.00")),
            ("emergency", Decimal("100.00")),
        ]:
            Budget.objects.create(
                family=family,
                category=category,
                amount=amount,
                period=Budget.Period.MONTHLY,
                year=year,
                month=month,
            )

        Asset.objects.filter(family=family).delete()
        Asset.objects.create(
            family=family,
            name="Family Home",
            asset_type=Asset.AssetType.HOUSE,
            owner=members["hassan"],
            purchase_date=date(2015, 4, 10),
            purchase_price=Decimal("35000.00"),
            current_value=Decimal("42000.00"),
            location="Mogadishu",
            status=Asset.Status.ACTIVE,
        )
        Asset.objects.create(
            family=family,
            name="Toyota Corolla",
            asset_type=Asset.AssetType.CAR,
            owner=members["hassan"],
            purchase_date=date(2020, 7, 1),
            purchase_price=Decimal("9000.00"),
            current_value=Decimal("7000.00"),
            location="Mogadishu",
            status=Asset.Status.ACTIVE,
        )
        Asset.objects.create(
            family=family,
            name="Business Inventory",
            asset_type=Asset.AssetType.BUSINESS,
            owner=members["hassan"],
            purchase_date=date(2018, 1, 1),
            purchase_price=Decimal("5000.00"),
            current_value=Decimal("8000.00"),
            status=Asset.Status.ACTIVE,
        )

        Debt.objects.filter(family=family).delete()
        Debt.objects.create(
            family=family,
            name="Business Loan",
            creditor="Salaam Bank",
            amount=Decimal("5000.00"),
            remaining_balance=Decimal("2200.00"),
            interest=Decimal("8.50"),
            due_date=date(2026, 12, 1),
            responsible_member=members["hassan"],
            status=Debt.Status.ACTIVE,
        )

        FinancialGoal.objects.filter(family=family).delete()
        goals = [
            ("Buy house", Decimal("50000"), Decimal("18500"), "high"),
            ("Education fund", Decimal("15000"), Decimal("6200"), "high"),
            ("Family trip", Decimal("4000"), Decimal("1100"), "medium"),
            ("Marriage support", Decimal("10000"), Decimal("2500"), "medium"),
            ("Healthcare fund", Decimal("5000"), Decimal("1800"), "urgent"),
        ]
        for name, target, current, priority in goals:
            goal = FinancialGoal.objects.create(
                family=family,
                name=name,
                description=f"Family goal: {name}",
                target_amount=target,
                current_amount=current,
                deadline=date(2027, 6, 1),
                priority=priority,
                status=FinancialGoal.Status.ACTIVE,
            )
            goal.responsible_members.set([members["hassan"], members["amina"]])

        Event.objects.filter(family=family).delete()
        events = [
            ("Mohamed Birthday", "birthday", today + timedelta(days=12)),
            ("Family Meeting", "meeting", today + timedelta(days=3)),
            ("Fatima Graduation", "graduation", today + timedelta(days=45)),
            ("Wedding Anniversary", "anniversary", today + timedelta(days=60)),
        ]
        for name, etype, edate in events:
            event = Event.objects.create(
                family=family,
                name=name,
                event_type=etype,
                date=edate,
                location="Family Home",
                organizer=members["amina"],
                description=f"{name} celebration/meeting.",
                created_by=hassan_user,
            )
            event.participants.set(list(members.values()))

        Announcement.objects.filter(family=family).delete()
        Announcement.objects.create(
            family=family,
            title="Family Meeting",
            message="Family meeting will be held on Saturday at 5:00 PM.",
            priority=Announcement.Priority.HIGH,
            author=hassan_user,
            is_published=True,
        )

        Task.objects.filter(family=family).delete()
        Task.objects.create(
            family=family,
            title="Pay electricity bill",
            description="Settle this month's utility bill.",
            assigned_member=members["hassan"],
            priority=Task.Priority.HIGH,
            due_date=today + timedelta(days=2),
            status=Task.Status.PENDING,
            created_by=hassan_user,
        )
        Task.objects.create(
            family=family,
            title="Upload school certificates",
            description="Add Fatima and Mohamed education documents.",
            assigned_member=members["amina"],
            priority=Task.Priority.MEDIUM,
            due_date=today + timedelta(days=7),
            status=Task.Status.IN_PROGRESS,
            created_by=hassan_user,
        )
        Task.objects.create(
            family=family,
            title="Review monthly budget",
            assigned_member=members["hassan"],
            priority=Task.Priority.URGENT,
            due_date=today + timedelta(days=1),
            status=Task.Status.PENDING,
            created_by=hassan_user,
        )

        Notification.objects.filter(family=family).delete()
        for user in (hassan_user, amina_user):
            Notification.objects.create(
                family=family,
                user=user,
                title="Welcome to Family Data Center",
                message="Your Hassan Family workspace is ready with demo data.",
                notification_type=Notification.NotificationType.SYSTEM,
                link="/app/dashboard",
            )

        ActivityLog.objects.create(
            user=hassan_user,
            family=family,
            action="Seeded Hassan Family demo data",
            module="core",
            details={"family_id": family.family_id},
        )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))
        self.stdout.write(f"Family: {family.name} ({family.family_id})")
        self.stdout.write("Accounts:")
        self.stdout.write("  admin@familydatacenter.local / Admin@12345 (Admin)")
        self.stdout.write("  hassan@demo.local / Demo@12345 (Admin)")
        self.stdout.write("  amina@demo.local / Demo@12345 (Member)")
