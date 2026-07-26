# ilmaCader — Family Data Center

Professional Django website for managing family records securely.

## Stack

- Django 5 · Python 3.11+ · PostgreSQL
- Tailwind CSS · Alpine.js · Chart.js
- xhtml2pdf for PDF export

## Setup

1. Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and set database credentials.

3. **Database**
   - Preferred: PostgreSQL — create DB `ilmacader`, set `USE_SQLITE=False` in `.env`
   - Temporary fallback: `USE_SQLITE=True` (already set if Postgres is not running yet)

4. Migrate and bootstrap admin:

```powershell
python manage.py migrate
python manage.py bootstrap_admin
```

Default admin (change immediately): `admin` / `Admin@12345`

5. Run:

```powershell
python manage.py runserver
```

Open http://127.0.0.1:8000/login/

## Demo accounts (after bootstrap / initial setup)

| Username | Password     | Role  |
|----------|--------------|-------|
| admin    | Admin@12345  | Admin |
| demo     | Demo@12345   | User  |

## Roles

- **Administrator** — full access (`/admin-dashboard/`)
- **User** — own data only (`/dashboard/`)

Users cannot self-register. Admins create all accounts under **Users**.

## Note on Python version

Target was Python 3.13; this environment uses **Python 3.11** with Django 5.2, which is fully supported.