from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import FamilyProfile, Parent, Spouse, Health, Employment, Property


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_family_profile(sender, instance, created, **kwargs):
    if created and not instance.is_superuser:
        profile, made = FamilyProfile.objects.get_or_create(user=instance)
        if made:
            Parent.objects.get_or_create(profile=profile)
            Spouse.objects.get_or_create(profile=profile)
            Health.objects.get_or_create(profile=profile)
            Employment.objects.get_or_create(profile=profile)
            Property.objects.get_or_create(profile=profile)
