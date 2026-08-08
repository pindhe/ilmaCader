from django.db import migrations, models


ROLE_MAP = {
    "family_admin": "admin",
    "family_member": "member",
    "viewer": "member",
}


def forwards(apps, schema_editor):
    FamilyMembership = apps.get_model("families", "FamilyMembership")
    for old, new in ROLE_MAP.items():
        FamilyMembership.objects.filter(role=old).update(role=new)


def backwards(apps, schema_editor):
    FamilyMembership = apps.get_model("families", "FamilyMembership")
    FamilyMembership.objects.filter(role="admin").update(role="family_admin")
    FamilyMembership.objects.filter(role="member").update(role="family_member")


class Migration(migrations.Migration):
    dependencies = [
        ("families", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
        migrations.AlterField(
            model_name="familymembership",
            name="role",
            field=models.CharField(
                choices=[("admin", "Admin"), ("member", "Member")],
                default="member",
                max_length=32,
            ),
        ),
    ]
