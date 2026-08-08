from django.db import migrations, models


ROLE_MAP = {
    "super_admin": "admin",
    "family_admin": "admin",
    "family_member": "member",
    "viewer": "member",
}


def forwards(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    for old, new in ROLE_MAP.items():
        User.objects.filter(role=old).update(role=new)


def backwards(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(role="admin").update(role="family_admin")
    User.objects.filter(role="member").update(role="family_member")


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[("admin", "Admin"), ("member", "Member")],
                db_index=True,
                default="member",
                max_length=32,
            ),
        ),
    ]
