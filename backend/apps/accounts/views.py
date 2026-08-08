from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.models import EmailVerificationToken, LoginHistory, PasswordResetToken, User
from apps.accounts.serializers import (
    ChangePasswordSerializer,
    LoginHistorySerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
)
from apps.accounts.tokens import create_email_verification_token, create_password_reset_token
from apps.families.models import Family, FamilyMembership


def api_response(success, message, data=None, status_code=status.HTTP_200_OK, errors=None):
    payload = {"success": success, "message": message, "data": data if data is not None else {}}
    if errors is not None:
        payload["errors"] = errors
    return Response(payload, status=status_code)


def get_tokens_for_user(user, remember_me=False):
    refresh = RefreshToken.for_user(user)
    if remember_me:
        refresh.set_exp(lifetime=timedelta(days=30))
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def send_verification_email(user, token):
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token.token}"
    subject = "Verify your Family Data Center email"
    message = (
        f"Hi {user.full_name},\n\n"
        f"Please verify your email by opening this link:\n{verify_url}\n\n"
        f"Or use this token: {token.token}\n"
        f"This link expires in 24 hours.\n"
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)


def send_password_reset_email(user, token):
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token.token}"
    subject = "Reset your Family Data Center password"
    message = (
        f"Hi {user.full_name},\n\n"
        f"Reset your password using this link:\n{reset_url}\n\n"
        f"Or use this token: {token.token}\n"
        f"This link expires in 1 hour.\n"
        f"If you did not request this, you can ignore this email.\n"
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)


def record_login(request, user, successful=True):
    LoginHistory.objects.create(
        user=user,
        ip_address=getattr(request, "client_ip", None) or request.META.get("REMOTE_ADDR"),
        user_agent=getattr(request, "user_agent", "") or request.META.get("HTTP_USER_AGENT", ""),
        successful=successful,
    )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            email = (request.data.get("email") or "").lower().strip()
            user = User.objects.filter(email__iexact=email).first()
            if user:
                record_login(request, user, successful=False)
            return api_response(
                False,
                "Login failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.validated_data["user"]
        remember_me = serializer.validated_data.get("remember_me", False)
        tokens = get_tokens_for_user(user, remember_me=remember_me)
        record_login(request, user, successful=True)

        return api_response(
            True,
            "Login successful.",
            {
                "user": UserSerializer(user, context={"request": request}).data,
                "tokens": tokens,
            },
        )


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            return api_response(True, "Token refreshed.", response.data)
        return api_response(
            False,
            "Token refresh failed.",
            errors=response.data,
            status_code=response.status_code,
        )


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return api_response(
                False,
                "Refresh token is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return api_response(
                False,
                "Invalid or expired refresh token.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        return api_response(True, "Logged out successfully.")


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return api_response(
            True,
            "Profile retrieved.",
            UserSerializer(request.user, context={"request": request}).data,
        )

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_response(
            True,
            "Profile updated.",
            UserSerializer(request.user, context={"request": request}).data,
        )


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        token_value = request.data.get("token")
        if not token_value:
            return api_response(
                False,
                "Verification token is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = EmailVerificationToken.objects.select_related("user").get(token=token_value)
        except (EmailVerificationToken.DoesNotExist, ValueError):
            return api_response(
                False,
                "Invalid verification token.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        if not token.is_valid():
            return api_response(
                False,
                "Verification token is expired or already used.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        user = token.user
        user.email_verified = True
        user.save(update_fields=["email_verified"])
        token.used = True
        token.save(update_fields=["used"])

        return api_response(
            True,
            "Email verified successfully.",
            UserSerializer(user, context={"request": request}).data,
        )


class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        email = (request.data.get("email") or "").lower().strip()
        if not email:
            return api_response(
                False,
                "Email is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email).first()
        # Always return success to avoid email enumeration.
        if user and not user.email_verified:
            token = create_email_verification_token(user)
            send_verification_email(user, token)

        return api_response(
            True,
            "If an unverified account exists for this email, a verification message has been sent.",
        )


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = User.objects.filter(email__iexact=email).first()
        if user:
            token = create_password_reset_token(user)
            send_password_reset_email(user, token)

        return api_response(
            True,
            "If an account exists for this email, a password reset message has been sent.",
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            token = PasswordResetToken.objects.select_related("user").get(token=data["token"])
        except PasswordResetToken.DoesNotExist:
            return api_response(
                False,
                "Invalid reset token.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        if not token.is_valid():
            return api_response(
                False,
                "Reset token is expired or already used.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        user = token.user
        user.set_password(data["password"])
        user.save(update_fields=["password"])
        token.used = True
        token.save(update_fields=["used"])

        return api_response(True, "Password has been reset successfully.")


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return api_response(True, "Password changed successfully.")


class LoginHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LoginHistorySerializer

    def get_queryset(self):
        return LoginHistory.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page if page is not None else queryset, many=True)
        if page is not None:
            return Response(
                {
                    "success": True,
                    "message": "Login history retrieved.",
                    "data": {
                        "count": self.paginator.page.paginator.count,
                        "next": self.paginator.get_next_link(),
                        "previous": self.paginator.get_previous_link(),
                        "results": serializer.data,
                    },
                }
            )
        return api_response(True, "Login history retrieved.", serializer.data)
