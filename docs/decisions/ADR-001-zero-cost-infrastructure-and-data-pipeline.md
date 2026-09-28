# ADR-001: Zero-Cost Serverless Infrastructure and Free Data Pipeline

## Status
Accepted

## Date
2026-09-28

## Context
"IPO Buddy" is an IPO tracking and informal group split web platform targeting Indian retail investors. As a solo-founder bootstrapped project with zero initial capital, paying fixed cloud infrastructure costs ($32/month or ~₹2,700/month for DigitalOcean Droplet + Managed PostgreSQL + API data providers) imposes unnecessary burn before product-market validation.

Key requirements:
- Reliable, production-ready PostgreSQL 16 database supporting transactions and foreign keys.
- Web-accessible API runtime for Django Ninja backend.
- High-performance frontend hosting with Edge CDN for Next.js.
- Automated periodic data ingestion (IPOs, subscription status, and Grey Market Premium) without paying for 24/7 background worker servers.
- Compliance with RBI data localization directives (data stored within India).
- **Target monthly infrastructure cost: ₹0.00**.

## Decision
Adopt a 100% zero-cost, multi-provider serverless architecture:

1. **Database**: **Supabase PostgreSQL 16** hosted in the AWS Mumbai (`ap-south-1`) region.
   - Connect via Supavisor Transaction Pooler (`aws-0-ap-south-1.pooler.supabase.com:6543`).
   - 500 MB free persistent storage.
2. **Backend API**: **Render Free Web Service** running Python 3.12, Django 5.x, Django Ninja, and Gunicorn.
   - Keep-alive heartbeat: Scheduled ping via `cron-job.org` every 10 minutes between 9:00 AM and 4:00 PM IST on weekdays to eliminate cold starts during market hours.
3. **Frontend**: **Vercel Hobby Tier** hosting Next.js 15 PWA with Edge CDN, automated SSL, and instant Git push deployments.
4. **Data Sync & Background Automation**: **GitHub Actions Cron Workflows** (`.github/workflows/ipo_sync.yml`).
   - Replaces Celery and Redis entirely.
   - Runs every 2 hours during Indian market trading hours (consuming ~150 runner minutes/month out of 2,000 free minutes).
   - Directly scrapes public endpoints (Groww internal JSON API, InvestorGain GMP, and `curl_cffi` for direct exchange queries) and persists updates directly to Supabase via `DATABASE_URL`.

## Alternatives Considered

### Paid DigitalOcean Droplet ($12/mo) + Managed PostgreSQL ($15/mo)
- **Pros**: All components (app, DB, Celery, Redis) reside on one controllable environment.
- **Cons**: Requires ~₹2,250 - ₹2,700/month recurring cost; requires manual OS patches and maintenance.
- **Rejected**: Incurs cash burn before validating user demand.

### Neon PostgreSQL Free Tier
- **Pros**: Fast serverless Postgres with instant branching.
- **Cons**: Enforces a strict 100 Compute Unit (CU)-hour/month quota on the free tier. Any continuous activity or frequent keep-alive pings exhaust this budget within ~12–14 days, suspending the entire database.
- **Rejected**: High risk of mid-month production lockout. Supabase has no CU-hour quota and only pauses after 7 days of complete inactivity.

### ElephantSQL
- **Rejected**: Service reached End-of-Life and was permanently decommissioned on January 27, 2025.

### Render Free PostgreSQL
- **Rejected**: Render's free database instance is automatically and irreversibly deleted after 30 days.

### Running Celery Worker + Redis on Render / Railway
- **Cons**: Render free tier only allows Web Services; background worker processes cost $7/mo minimum. Railway discontinued its permanent free tier ($5 one-time credit only).
- **Rejected**: GitHub Actions provides 2,000 free runner minutes/month for scheduled Python scripts with zero server maintenance.

## Consequences

### Positive
- **100% Free**: Zero monthly hosting or database bill.
- **Zero Server Ops**: No Linux administration, security patching, or Docker daemon debugging.
- **RBI Data Localization Compliant**: Supabase instance is pinned to AWS Mumbai (`ap-south-1`).
- **Resilient Data Ingestion**: GitHub Actions runners originate from Microsoft/Azure IP addresses, reducing the probability of IP-based bot blocking.

### Trade-offs & Mitigations
- **Render Cold Starts**: Outside market hours or after 15 minutes of inactivity, Render free instances sleep (~30-50s spin-up time). Mitigated by `cron-job.org` daytime heartbeats.
- **Supabase 7-Day Inactivity Pause**: Supabase pauses projects if no queries occur for 7 consecutive days. Mitigated automatically by the scheduled GitHub Actions scraper querying the DB every weekday.
- **Gunicorn Connection Limits**: Connecting Django to a serverless DB can exhaust Postgres connection slots. Mitigated by connecting through Supabase's Supavisor Transaction Pooler on port 6543 (`conn_max_age=0`).
