# IlmaCader

**One Family. One Platform. One Future.**

A professional full-stack family management platform for members, documents, events, and more.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, ShadCN-style UI, Framer Motion, Recharts |
| Backend | Python, Django 5, Django REST Framework, SimpleJWT |
| Database | PostgreSQL (production) / SQLite (development) |

## Project structure

```
backend/                 # Django REST API
  apps/
    accounts/            # Auth, users, admin API
    families/            # Families, memberships, dashboard stats
    members/             # Members + relationships + family tree
    finance/             # Income, expenses, savings, budgets, assets, debts, goals
    events/              # Events + announcements
    documents/           # Secure document center
    tasks/               # Task management + kanban
    notifications/       # In-app notifications
    reports/             # Reports, analytics, search, export
    core/                # Activity logs, permissions, seed command
frontend/                # React SPA
```

## Quick start

### 1. Backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
copy .env.example .env
cd backend
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

API: http://127.0.0.1:8000/api/

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

App: http://127.0.0.1:5173/

## Demo accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@ilmacader.local` | `Admin@12345` | Admin (platform) |
| `hassan@demo.local` | `Demo@12345` | Admin (Hassan Family) |
| `amina@demo.local` | `Demo@12345` | Member |

There is **no public registration**. Only an **admin** can create members (with login).

Roles: `admin` · `member`

Demo family ID example: `FAM-2026-00001`

## Environment

Copy `.env.example` to `.env`. Important keys:

- `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`
- `USE_SQLITE=True` for local SQLite, or `False` + `DATABASE_URL` for PostgreSQL
- `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`
- Email settings (console backend by default)
- Optional JWT / storage credentials

Never commit real secrets.

## Main features

- JWT auth with refresh tokens, email verification, password reset
- Roles: Super Admin, Family Admin, Family Member, Viewer
- Family members + interactive relationship tree
- Income, expenses, contributions, savings, budgets, assets, debts, goals
- Events, announcements, documents, tasks (list + kanban)
- Notifications, activity logs, global search (Ctrl+K)
- Reports / analytics with CSV & Excel export
- Dark mode, responsive dashboard, landing page

## API overview

- `/api/auth/`
- `/api/families/`
- `/api/members/`
- `/api/income/` `/api/expenses/` `/api/contributions/` `/api/savings/`
- `/api/budgets/` `/api/assets/` `/api/debts/` `/api/goals/`
- `/api/events/` `/api/announcements/` `/api/documents/` `/api/tasks/`
- `/api/notifications/` `/api/reports/` `/api/analytics/` `/api/search/`
- `/api/activity/` `/api/admin/`

## Production notes

- Set `DEBUG=False`, strong `SECRET_KEY`, and PostgreSQL
- Serve behind HTTPS
- Configure real email SMTP
- Put media on object storage when needed
- Run migrations and collectstatic as part of deploy
