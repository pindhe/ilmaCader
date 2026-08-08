from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("members", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="familymember",
            name="profile_steps",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
