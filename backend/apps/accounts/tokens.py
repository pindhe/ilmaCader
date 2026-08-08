from datetime import timedelta

from django.utils import timezone

from apps.accounts.models import EmailVerificationToken, PasswordResetToken

EMAIL_TOKEN_LIFETIME = timedelta(hours=24)
PASSWORD_RESET_TOKEN_LIFETIME = timedelta(hours=1)


def create_email_verification_token(user):
    """Invalidate prior unused tokens and issue a fresh 24h verification token."""
    EmailVerificationToken.objects.filter(user=user, used=False).update(used=True)
    return EmailVerificationToken.objects.create(
        user=user,
        expires_at=timezone.now() + EMAIL_TOKEN_LIFETIME,
    )


def create_password_reset_token(user):
    """Invalidate prior unused tokens and issue a fresh 1h reset token."""
    PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
    return PasswordResetToken.objects.create(
        user=user,
        expires_at=timezone.now() + PASSWORD_RESET_TOKEN_LIFETIME,
    )
