from .models import AuditLog


def log_action(request, action, message, model_name="", object_id=""):
    user = getattr(request, "user", None)
    if user is not None and not user.is_authenticated:
        user = None
    AuditLog.objects.create(
        user=user if user and user.is_authenticated else None,
        action=action,
        model_name=model_name,
        object_id=str(object_id) if object_id else "",
        message=message,
        ip_address=getattr(request, "client_ip", None),
    )
