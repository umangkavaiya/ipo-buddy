# IPO Buddy — Complete Interview Preparation Guide & Revision Notes

This document provides a comprehensive revision manual for **IPO Buddy**, covering the 30-second elevator pitch, technical architecture, real-world engineering challenges solved using the STAR method, and common interview questions with in-depth model answers.

---

## 1. 30-Second Elevator Pitch
> *"In the Indian stock market, retail investors frequently pool capital across family and friend accounts (an informal syndicate) to apply for IPOs across multiple retail buckets and increase allotment probability. However, tracking live Grey Market Premium (GMP) across unorganized blogs is cumbersome, and after allotment, dividing profits manually in Excel or standard apps leads to floating-point rounding errors and confusion over 20% Short-Term Capital Gains (STCG) tax calculations.*
> 
> *I built **IPO Buddy**, a full-stack platform featuring:
> 1. A real-time IPO and GMP tracking explorer with automated background scrapers.
> 2. A syndicate management module with an algorithmic **zero-penny-loss split calculator**.
> 3. A statutory Indian STCG (Section 111A) tax calculator.
> 4. A 100% zero-cost production deployment leveraging Supabase PostgreSQL, Render, Vercel, and GitHub Actions."*

---

## 2. Technical Stack Summary

| Layer | Technologies & Tools |
| :--- | :--- |
| **Backend** | .NET 10, ASP.NET Core Minimal APIs, C#, Clean Architecture |
| **Data & ORM** | Entity Framework Core (EF Core), SQLite (Local), Npgsql / Supabase PostgreSQL (Cloud) |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons |
| **Authentication** | Clerk OAuth (JWT Bearer integration in ASP.NET Core) |
| **API Documentation** | Scalar Interactive OpenAPI (`/scalar/v1`) |
| **Background Processing**| .NET `BackgroundService` hosted worker, `HtmlAgilityPack`, `HttpClient` |
| **DevOps & CI/CD** | Docker (multi-stage build), GitHub Actions, Render (Docker Web Service), Vercel |

---

## 3. Top 4 Engineering Challenges Solved (STAR Method)

### Challenge 1: The JWT Claims Shadowing Bug (Auth & Data Modeling)
* **Situation:** When integrating Clerk OAuth on Next.js with our .NET 10 backend, user authentication appeared successful on the frontend, but every authenticated backend endpoint (like creating groups or fetching watchlists) returned `401 Unauthorized`.
* **Problem:** Clerk’s JWT payload contains a string subject ID (e.g., `user_2tXy...`), whereas our clean architecture domain entities use strongly typed `Guid` primary keys (`Users.Id`). ASP.NET Core’s default `JwtBearerHandler` automatically mapped Clerk’s string to `ClaimTypes.NameIdentifier` on the primary `ClaimsIdentity`. Although our `OnTokenValidated` hook looked up the user and added the database `Guid`, calling `ClaimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier)` always returned the string from the first identity, causing `Guid.TryParse` to fail silently across all endpoints.
* **Action:** 
  1. In `OnTokenValidated`, modified the primary `ClaimsIdentity` directly to replace the external string with the database entity `Guid`.
  2. Wrote a custom extension method, `ClaimsPrincipal.GetUserId()`, which safely iterates across all identity claims to extract and validate the `Guid`.
* **Result:** All protected routes resolved user identity reliably. Created automated xUnit integration tests using `WebApplicationFactory` to prevent regressions.

---

### Challenge 2: Financial Precision & Zero-Penny-Loss Remainder Allocation
* **Situation:** In IPO syndicates, multiple people pool money to apply for allotments. When listing profits occur (e.g., ₹10,000 profit across 3 members), the split is an uneven repeating decimal (`3333.3333...`).
* **Problem:** Using standard division or binary floating-point types (`double`/`float`) leads to rounding errors. If everyone is assigned ₹3,333.33, the total equals ₹9,999.99, losing 1 paisa. Over dozens of syndicate transactions, rounding drift accumulates, violating the core accounting rule: $\sum(\text{shares}) \equiv \text{total}$.
* **Action:** Strictly banned `float` and `double` in favor of the 128-bit `decimal` type, and engineered a deterministic remainder allocation algorithm in `SplitCalculator`:
  * Calculated the integer floor for each share.
  * Computed the exact remaining pennies: `remainder = total - sum(base_shares)`.
  * Distributed residual pennies one-by-one to the first $N$ members.
* **Result:** Guaranteed 100% financial precision down to the last paisa. Backed with unit tests verifying uneven splits across arbitrary member counts (3, 7, and 13 members).

---

### Challenge 3: Corporate Firewall Restrictions vs. Cloud Database
* **Situation:** Developed the platform locally from an office laptop behind a strict corporate proxy, while hosting the production database in the cloud on Supabase PostgreSQL (Mumbai `ap-south-1`).
* **Problem:** The office corporate firewall blocked outbound raw TCP traffic on standard PostgreSQL ports (5432 and 6543), which completely prevented local database migrations and testing during development.
* **Action:** Architected a dual-provider abstraction in EF Core's `DependencyInjection.cs`:
  * In production or open networks, it connects via the Supavisor Transaction Pooler (`port 6543`).
  * In local development behind firewalls or offline, it seamlessly falls back to SQLite (`ipobuddy.db`).
  * Both use identical EF Core entity configurations, and `Database.EnsureCreated()` auto-provisions tables and seed data upon startup.
* **Result:** Enabled frictionless coding and running of all 13 integration tests offline and behind firewalls, while containerized builds deploy to Render and Supabase seamlessly.

---

### Challenge 4: Resilient Scraper Pipeline Without Paid APIs
* **Situation:** To maintain a 100% zero-cost budget, expensive stock exchange API feeds ($50–$100/month) were eliminated. Real-time IPO dates, issue prices, and Grey Market Premium (GMP) data had to be ingested via web scraping.
* **Problem:** Third-party financial portals frequently change HTML structure, throw `502 Bad Gateway` errors, or block scrapers with anti-bot rate limits.
* **Action:** Built a resilient ingestion pipeline using `HtmlAgilityPack` and a background worker (`IpoSyncBackgroundService`):
  * **Semantic Selectors:** Used resilient table `data-label` attributes instead of brittle CSS class names.
  * **Cache Fallback:** Wrapped scraping in `try/catch` blocks so that if an external source times out or fails, the API logs a warning and returns the last known database records instead of crashing.
  * **Asynchronous Decoupling:** Decoupled data fetching from client requests by running periodic background syncs every 30 minutes.
* **Result:** Maintained 100% uptime with fresh market data at zero monthly operating cost.

---

## 4. Technical Interview Questions & Answers

### Architecture & .NET 10

#### Q1: What are the principles of Clean Architecture and how are they reflected in your project?
* **Answer:** Clean Architecture separates concerns into concentric layers where dependencies only point inward:
  * **Domain Layer:** Contains enterprise entities (`User`, `Ipo`, `Group`, `Split`) and enums with zero third-party dependencies.
  * **Application Layer:** Contains DTOs, interfaces (`IAppDbContext`), and core calculation logic (`SplitCalculator`).
  * **Infrastructure Layer:** Implements external concerns like database persistence (EF Core `AppDbContext`) and scraping services (`IpoSyncService`).
  * **Api Layer:** Entry point containing Minimal API route endpoints, authentication configuration, and Swagger/Scalar documentation.

#### Q2: What is the benefit of Minimal APIs over Controller-based APIs in .NET 10?
* **Answer:** Minimal APIs bypass the overhead of controller discovery, action filters, and model binding reflection filters. They have lower memory consumption, faster cold-start times (critical for free-tier containers on Render), and allow routing logic to be cleanly partitioned into route groups (`app.MapGroup("/api").MapIpoEndpoints()`).

---

### Financial Precision & Calculation Logic

#### Q3: Why should financial systems never use `float` or `double`?
* **Answer:** Floating-point numbers use IEEE 754 binary representation (base 2), which cannot precisely represent fractional decimal values like `0.1` or `0.7`. This leads to rounding errors during addition or division. The `decimal` type is a 128-bit floating-point format based on base-10, offering 28–29 significant digits of exact precision, eliminating binary representation errors.

#### Q4: How does your Splitwise-style net balance calculation work?
* **Answer:** When a user creates a group split, member entries are generated. To calculate overall balances across multiple groups, the system queries unsettled entries where:
  * Amount a user is owed: Sum of unsettled entries in splits created by the user where other members owe them.
  * Amount a user owes: Sum of unsettled entries in splits where other members paid for this user.
  The service computes net balances by netting mutual debts between pairs of users.

---

### Security & Authentication

#### Q5: How does the backend validate Clerk JWT tokens without sharing a secret key?
* **Answer:** Clerk uses asymmetric RSA/ECDSA cryptography. The backend is configured with Clerk’s OpenID Connect authority (`https://<app>.clerk.accounts.dev`). ASP.NET Core’s `JwtBearerHandler` downloads Clerk's public JSON Web Key Set (JWKS) and verifies the token's cryptographic signature, expiration (`exp`), and issuer (`iss`) without needing a private secret key on the backend.

---

### Cloud, DevOps & CI/CD

#### Q6: How does the parallel CI/CD pipeline in GitHub Actions work?
* **Answer:** The workflow [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml) triggers on every push and pull request. It executes two independent jobs in parallel:
  1. **Backend Tests:** Sets up .NET 10, restores solution dependencies, builds in Release mode, and runs 13 unit and integration tests.
  2. **Frontend Quality Gates:** Sets up Node.js 20, runs `npm ci`, verifies ESLint compliance, runs TypeScript type-checking (`npx tsc --noEmit`), and compiles the Next.js production build.
  This catches issues early before any changes reach production.

#### Q7: How are cold-starts mitigated on Render's free tier?
* **Answer:** Render free services sleep after 15 minutes of inactivity. To keep the service warm and market data fresh during trading hours, a scheduled GitHub Actions cron job (`.github/workflows/ipo_sync.yml`) runs at 10:00 AM, 2:00 PM, and 5:00 PM IST with curl retries and 90-second timeouts, effectively waking up the container and syncing public feeds.

---

## 5. Quick Revision Flashcards

* **Local DB:** SQLite (`ipobuddy.db`)
* **Cloud DB:** Supabase PostgreSQL 16 (Mumbai region `ap-south-1`, port `6543` Supavisor pooler)
* **Auth Protocol:** Clerk OAuth + asymmetric JWT Bearer validation
* **Tax Rate:** 20% Short-Term Capital Gains (Section 111A, Indian Income Tax Act)
* **Financial Precision Rule:** Never `float`/`double`, always `decimal`, remainder pennies sequentially allocated
* **API Documentation:** Scalar OpenAPI at `/scalar/v1`
* **Test Suite:** 13 xUnit integration and unit tests passing in 4 seconds
