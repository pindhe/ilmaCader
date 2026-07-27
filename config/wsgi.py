import os
from pathlib import Path

from django.core.management import call_command
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_wsgi_application()

# Vercel serverless: ensure tables exist for ephemeral SQLite.
if os.getenv("VERCEL") or os.getenv("VERCEL_URL"):
    try:
        Path("/tmp/ilmacader-media").mkdir(parents=True, exist_ok=True)
        call_command("migrate", interactive=False, run_syncdb=True)
    except Exception:
        # Don't crash import if migrate fails; request will show the real error.
        pass

# Some serverless adapters look for `app`.
app = application
