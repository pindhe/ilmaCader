from django.core.management.base import BaseCommand
from accounts.models import CustomUser
from core.models import SiteSettings


class Command(BaseCommand):
    help = "Create default administrator if missing"

    def handle(self, *args, **options):
        SiteSettings.get_solo()
        if CustomUser.objects.filter(username="admin").exists():
            self.stdout.write("admin already exists")
            return
        user = CustomUser.objects.create_superuser(
            username="admin",
            email="admin@ilmacader.local",
            password="Admin@12345",
        )
        user.role = CustomUser.Role.ADMIN
        user.first_name = "System"
        user.last_name = "Administrator"
        user.save()
        self.stdout.write(self.style.SUCCESS("Created admin / Admin@12345 — change this password!"))
