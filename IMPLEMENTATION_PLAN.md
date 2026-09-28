# Implementation Plan: IPO Buddy Phase 1 (MVP Backend Foundation)

This plan details the step-by-step execution strategy to build the foundational backend and data pipeline for **IPO Buddy**, strictly following the approved zero-cost architecture in [ARCHITECTURE.md](file:///d:/Projects/Centralized%20ipo%20allotment%20system/ARCHITECTURE.md).

---

## User Review Required

> [!IMPORTANT]
> **Database for Development vs Production:**
> - In local development, the backend will default to SQLite (`db.sqlite3`) for instant, friction-free testing with zero external setup.
> - When `DATABASE_URL` is set in `.env`, it will automatically connect to Supabase PostgreSQL 16 via the Supavisor Transaction Pooler (`port 6543`).
> - This allows developing and running tests completely offline.

> [!NOTE]
> **Authentication in MVP Phase 1:**
> - To avoid burning money on paid SMS gateways (MSG91/Twilio) before launch, development mode will provide a mock OTP endpoint (returns code `123456` or logs to console).
> - Production SMS provider credentials can be dropped into `.env` without any code changes.

---

## Proposed Changes

```
d:\Projects\Centralized ipo allotment system\
├── .gitignore
├── requirements.txt
├── manage.py
├── core/                       # Django project root
│   ├── __init__.py
│   ├── settings.py            # SQLite local / Supabase Postgres prod
│   ├── urls.py                # Mounts Django Ninja API router
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── users/                 # Custom user, auth, preferences
│   │   ├── models.py
│   │   ├── api.py             # OTP login & token refresh
│   │   └── admin.py
│   ├── ipos/                  # IPO data, subscription, GMP
│   │   ├── models.py
│   │   ├── api.py             # IPO listing, details, search
│   │   └── admin.py
│   ├── groups/                # Private friend groups & watchlists
│   │   ├── models.py
│   │   ├── api.py             # Group CRUD, invite codes
│   │   └── admin.py
│   └── splits/                # Generic Splitwise-style calculator
│       ├── models.py
│       ├── api.py             # Split creation, settle, balance aggregation
│       └── admin.py
├── scripts/
│   └── sync_ipos.py           # Standalone scraper: Groww API + InvestorGain GMP
├── .github/
│   └── workflows/
│       ├── test.yml           # CI test runner
│       └── ipo_sync.yml       # Scheduled cron (runs sync_ipos.py)
└── tests/
    ├── test_splits.py         # Precision math & net balance tests
    ├── test_ipos_api.py       # IPO endpoints
    └── test_groups_api.py     # Group management & invite codes
```

---

### 1. Foundation & Dependencies

#### [NEW] `.gitignore`
- Exclude `venv/`, `.env`, `db.sqlite3`, `__pycache__/`, `.pytest_cache/`, `*.pyc`.

#### [NEW] `requirements.txt`
```text
Django>=5.1,<5.2
django-ninja>=1.3,<1.4
dj-database-url>=2.2,<2.3
psycopg[binary]>=3.2,<3.3
pydantic>=2.7,<3.0
python-dotenv>=1.0,<1.1
requests>=2.32,<2.33
curl-cffi>=0.7,<0.8
beautifulsoup4>=4.12,<4.13
gunicorn>=23.0,<24.0
pytest>=8.0,<9.0
pytest-django>=4.9,<5.0
```

---

### 2. Core Django Project Setup

#### [NEW] `core/settings.py`
- Load `.env` using `python-dotenv`.
- Configure `DATABASES` using `dj_database_url.config(default='sqlite:///db.sqlite3')`.
- Enforce `DecimalField` precision and configure Django Ninja routing.
- Enable `Django Admin` for instant back-office visibility.

#### [NEW] `core/urls.py`
- Expose `/admin/` and `/api/` (Django Ninja NinjaAPI instance with OpenAPI docs at `/api/docs`).

---

### 3. Applications & Data Models

#### [NEW] `apps/users/models.py`
- `User`: Inherits `AbstractBaseUser` with `phone` (unique), `email`, `display_name`, `subscription_tier` (`FREE`, `PRO`), and timestamps.

#### [NEW] `apps/ipos/models.py`
- `IPO`: `company_name`, `symbol`, `exchange`, `issue_price_low`, `issue_price_high`, `lot_size`, `open_date`, `close_date`, `allotment_date`, `listing_date`, `gmp`, `category` (`MAINBOARD`, `SME`), `status` (`UPCOMING`, `OPEN`, `CLOSED`, `LISTED`), and `subscription_data` (JSONB/JSON).
- `WatchlistItem`: User watchlist with alert flags.

#### [NEW] `apps/groups/models.py`
- `Group`: `name`, `invite_code` (unique 6-character alphanumeric), `created_by`, `max_members`.
- `GroupMember`: `group`, `user`, `role` (`ADMIN`, `MEMBER`), `joined_at`.
- `GroupWatchlist`: Shared group watchlist linking `Group` to `IPO`.

#### [NEW] `apps/splits/models.py`
- `Split`: `group`, `created_by`, `description`, `total_amount` (`DecimalField(12, 2)`), `split_type` (`EQUAL`, `CUSTOM`), `status` (`PENDING`, `SETTLED`).
- `SplitEntry`: `split`, `user`, `amount` (`DecimalField(12, 2)`), `is_settled` (boolean), `settled_at`.

---

### 4. REST API (Django Ninja)

#### [NEW] `apps/users/api.py`
- `POST /api/v1/auth/request-otp`
- `POST /api/v1/auth/verify-otp` (returns auth token)
- `GET /api/v1/profile`

#### [NEW] `apps/ipos/api.py`
- `GET /api/v1/ipos` (supports filters: `status`, `category`, search by company name)
- `GET /api/v1/ipos/{id}`
- `POST /api/v1/watchlist/{ipo_id}`
- `GET /api/v1/watchlist`

#### [NEW] `apps/groups/api.py`
- `POST /api/v1/groups` (create group + auto-generate invite code)
- `GET /api/v1/groups` (list user's groups)
- `GET /api/v1/groups/{id}`
- `POST /api/v1/groups/join` (join via invite code)
- `POST /api/v1/groups/{id}/watchlist/{ipo_id}`

#### [NEW] `apps/splits/api.py`
- `POST /api/v1/groups/{id}/splits` (create split + auto-divide amounts without floating point errors)
- `GET /api/v1/groups/{id}/splits`
- `POST /api/v1/splits/{id}/settle/{entry_id}` (mark personal entry settled)
- `GET /api/v1/splits/balances` (aggregate net who-owes-whom across all groups)

---

### 5. Data Ingestion Pipeline & Automation

#### [NEW] `scripts/sync_ipos.py`
- Standalone runnable script that:
  1. Calls Groww web API (`GET https://groww.in/v1/api/stocks_data/v1/ipo/all`) for upcoming/active/closed IPO listings.
  2. Scrapes InvestorGain (`https://www.investorgain.com/gmp/ipo-gmp-today/`) for real-time Grey Market Premiums.
  3. Uses Django ORM (`django.setup()`) to upsert records into the `ipos_ipo` table with idempotency.

#### [NEW] `.github/workflows/ipo_sync.yml`
- Scheduled GitHub Actions workflow:
  ```yaml
  name: Sync IPO Data
  on:
    schedule:
      - cron: '0 4,7,10,13 * * 1-5'  # 4 times daily on market weekdays (UTC)
    workflow_dispatch:                 # Manual trigger support
  jobs:
    sync:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-python@v5
          with:
            python-version: '3.12'
        - run: pip install -r requirements.txt
        - env:
            DATABASE_URL: ${{ secrets.DATABASE_URL }}
          run: python scripts/sync_ipos.py
  ```

---

## Verification Plan

### Automated Tests
1. **Model & Calculation Integrity (`tests/test_splits.py`)**:
   - Verify splitting ₹15,000 across 3 members yields exactly ₹5,000.00 each.
   - Verify non-even division (e.g., ₹100.00 among 3 members: ₹33.34 to creator, ₹33.33 to others) has zero floating point drift.
   - Verify net balance aggregation across multiple splits.
2. **API Tests (`tests/test_ipos_api.py`, `tests/test_groups_api.py`)**:
   - Test group creation and invite-code joining.
   - Test IPO filtering and search.
   - Test authenticated split submission and settlement toggles.
3. **Execution command**:
   ```bash
   pytest
   ```

### Manual Verification
1. **Interactive API Documentation**:
   - Start local dev server: `python manage.py runserver`
   - Open browser at `http://127.0.0.1:8000/api/docs` and test endpoints via the built-in Swagger UI.
2. **Scraper Test**:
   - Run `python scripts/sync_ipos.py` locally and verify live Indian IPO data populates the local database.
