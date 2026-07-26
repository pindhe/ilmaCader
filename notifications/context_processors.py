def unread_notifications(request):
    if request.user.is_authenticated:
        qs = request.user.notifications.filter(is_read=False)
        return {
            "unread_notification_count": qs.count(),
            "recent_notifications": request.user.notifications.all()[:5],
        }
    return {"unread_notification_count": 0, "recent_notifications": []}
