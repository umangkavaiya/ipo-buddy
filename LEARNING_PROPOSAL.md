# Learning Proposal: Persist Project Rules for IPO Buddy

## 1. Identified Reusable Behaviors & Preferences

From recent user requests and directives:
1. **Backend Language & Architectural Standard**:
   - The user explicitly requested **.NET (C#)** for the backend.
   - The user mandated a **Clean Architecture** structure: strict separation of `Domain`, `Application`, `Infrastructure`, and `Api` layers.
2. **Infrastructure & Cost Constraints**:
   - Zero fixed infrastructure cost (₹0/mo forever) using **Supabase** (Postgres 16 in Mumbai), **Vercel** (Next.js frontend), **Render** (free web service for .NET), and **GitHub Actions** (scheduled scraping).
3. **Financial Precision**:
   - All monetary calculations must use C# `decimal` with zero penny/paise loss (`SplitCalculator`).
4. **Local Dev Environment**:
   - Local Web API runs on port **5074** (`http://localhost:5074`) with interactive documentation at `/scalar/v1`.

---

## 2. Proposed Customization Type

**Type**: **Workspace Project Rule (`AGENTS.md`)**  
**Location**: `d:\Projects\Centralized ipo allotment system\AGENTS.md`  
**Scope**: Workspace-level rule applied whenever working in this repository.

---

## 3. Proposed Rule Content

```markdown
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
```

---

## 4. User Review Required

Please review this proposal. If approved, I will commit `AGENTS.md` to the workspace repository to persist these standards for all future agent sessions.
