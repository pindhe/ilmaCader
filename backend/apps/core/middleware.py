class ActivityLogMiddleware:
    """Attach request metadata used by activity logging helpers."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.client_ip = self._get_ip(request)
        request.user_agent = request.META.get("HTTP_USER_AGENT", "")[:500]
        return self.get_response(request)

    @staticmethod
    def _get_ip(request):
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")
