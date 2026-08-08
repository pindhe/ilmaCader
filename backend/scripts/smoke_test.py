import json
import os
import sys

import django

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test import Client

from apps.families.models import Family

c = Client()
r = c.post(
    "/api/auth/login/",
    data=json.dumps({"email": "hassan@demo.local", "password": "Demo@12345"}),
    content_type="application/json",
)
print("login", r.status_code)
payload = r.json()
print("success", payload.get("success"), payload.get("message"))
tokens = (payload.get("data") or {}).get("tokens") or {}
access = tokens.get("access")
assert access, payload

family = Family.objects.filter(name="Hassan Family").first()
assert family, "family missing"

r2 = c.get(
    f"/api/families/dashboard-stats/?family={family.id}",
    HTTP_AUTHORIZATION=f"Bearer {access}",
)
print("stats", r2.status_code, r2.json().get("data"))

r3 = c.get("/api/income/", HTTP_AUTHORIZATION=f"Bearer {access}", data={"family": str(family.id)})
print("income", r3.status_code, "count", len(r3.json().get("results", r3.json() if isinstance(r3.json(), list) else [])))

r4 = c.get("/api/admin/stats/", HTTP_AUTHORIZATION=f"Bearer {access}")
print("admin as family admin", r4.status_code)

r5 = c.post(
    "/api/auth/login/",
    data=json.dumps({"email": "admin@ilmacader.local", "password": "Admin@12345"}),
    content_type="application/json",
)
admin_token = r5.json()["data"]["tokens"]["access"]
r6 = c.get("/api/admin/stats/", HTTP_AUTHORIZATION=f"Bearer {admin_token}")
print("admin stats", r6.status_code, r6.json().get("data"))
print("OK")
