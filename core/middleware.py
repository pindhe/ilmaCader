from django.utils import timezone
from django.conf import settings


class SessionTimeoutMiddleware:
    """Expire idle sessions after SESSION_COOKIE_AGE seconds of inactivity."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            last = request.session.get("last_activity")
            timeout = getattr(settings, "SESSION_COOKIE_AGE", 1800)
            now = timezone.now().timestamp()
            if last and (now - float(last)) > timeout:
                from django.contrib.auth import logout

                logout(request)
            else:
                request.session["last_activity"] = now
        return self.get_response(request)


class AuditRequestMiddleware:
    """Attach client IP to request for audit helpers."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        request.client_ip = xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR")
        return self.get_response(request)
