# Project Rules: IPO Buddy

## Architecture Standards
- The backend MUST follow **.NET 10 Clean Architecture**:
  - `src/IpoBuddy.Domain`: Pure POCO entities and enums. Zero external library dependencies.
  - `src/IpoBuddy.Application`: DTOs, use case contracts, `IAppDbContext` interface, and business algorithms (`SplitCalculator`).
  - `src/IpoBuddy.Infrastructure`: EF Core `AppDbContext` (SQLite for local dev, Npgsql for Supabase PostgreSQL), external scrapers.
  - `src/IpoBuddy.Api`: ASP.NET Core Minimal APIs with route groups, HMAC Bearer token auth, and Scalar OpenAPI documentation.
  - `tests/IpoBuddy.Tests`: xUnit unit and integration tests.

## Financial Precision
- NEVER use `float` or `double` for money or allotment gains. Always use `decimal`.
- Ensure all group splits allocate remainders so `sum(shares) == totalAmount` precisely.

## Infrastructure & Zero-Cost Mandate
- Database: Supabase PostgreSQL 16 (`ap-south-1` Mumbai) via Supavisor Transaction Pooler (`port 6543`).
- Local DB: SQLite (`ipobuddy.db`).
- API Hosting: Render Free Web Service.
- Frontend Hosting: Vercel Hobby Tier (Next.js 15).
- Background Jobs: GitHub Actions Cron Workflows (`.github/workflows/`).
- Local API URL: `http://localhost:5074` with documentation at `/scalar/v1`.
