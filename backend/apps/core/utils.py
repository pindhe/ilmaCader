from rest_framework import status
from rest_framework.response import Response

from apps.core.models import ActivityLog
from apps.notifications.models import Notification


def api_response(success, message, data=None, status_code=status.HTTP_200_OK, errors=None):
    payload = {"success": success, "message": message, "data": data if data is not None else {}}
    if errors is not None:
        payload["errors"] = errors
    return Response(payload, status=status_code)


def log_activity(request, action, module="", family=None, details=None):
    user = getattr(request, "user", None)
    if user and not user.is_authenticated:
        user = None
    return ActivityLog.objects.create(
        user=user,
        family=family,
        action=action,
        module=module,
        details=details or {},
        ip_address=getattr(request, "client_ip", None),
        user_agent=getattr(request, "user_agent", ""),
    )


def notify_user(user, title, message, family=None, notification_type="system", link=""):
    if not user:
        return None
    return Notification.objects.create(
        user=user,
        family=family,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link,
    )


def notify_family_members(family, title, message, notification_type="system", link="", exclude_user=None):
    from apps.families.models import FamilyMembership

    memberships = FamilyMembership.objects.filter(family=family, is_active=True).select_related(
        "user"
    )
    created = []
    for membership in memberships:
        if exclude_user and membership.user_id == exclude_user.id:
            continue
        created.append(
            notify_user(
                membership.user,
                title,
                message,
                family=family,
                notification_type=notification_type,
                link=link,
            )
        )
    return created
