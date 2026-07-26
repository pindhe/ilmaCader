from .models import SiteSettings


def site_settings(request):
    try:
        settings_obj = SiteSettings.get_solo()
    except Exception:
        settings_obj = None
    return {"site_settings": settings_obj}
