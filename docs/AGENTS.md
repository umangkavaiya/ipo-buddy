# Agent Operating Guidelines: IPO Buddy

This document defines the strict operational rules, architectural boundaries, and coding conventions that all autonomous AI coding agents must follow when maintaining, refactoring, or extending **IPO Buddy**.

---

## 1. Core Architecture Invariants

1. **.NET 10 Clean Architecture Enforcement:**
   * **`src/IpoBuddy.Domain`:** Pure POCO entities and enums ONLY. Zero external package references. No EF Core attributes, no JSON annotations, no infrastructure leaks.
   * **`src/IpoBuddy.Application`:** DTOs, use-case contracts, `IAppDbContext` interface, and core business algorithms (`SplitCalculator`). Zero direct database or HTTP client code.
   * **`src/IpoBuddy.Infrastructure`:** Implements `IAppDbContext` using EF Core (`AppDbContext`), external scrapers (`IpoSyncService`), and background services.
   * **`src/IpoBuddy.Api`:** ASP.NET Core Minimal APIs with static extension route groups (`app.MapGroup("/api").MapXEndpoints()`). No bloated controller classes.

2. **Dual-Database Persistence Mandate:**
   * Local development must always fall back frictionlessly to SQLite (`ipobuddy.db`) if `DATABASE_URL` is unset or corporate proxies block outbound database ports.
   * Production connects to Supabase PostgreSQL 16 via the Supavisor Transaction Pooler (`port 6543`) with `SslMode=Require`.
   * Never hardcode database connection strings in application code.

3. **Financial Math & Zero Decimal Drift:**
   * **NEVER** use `float` or `double` for currency, issue prices, lot costs, capital gains, or group split allocations. Always use C# `decimal`.
   * Group splits must allocate remainder pennies deterministically so that:
     $$\sum_{i=1}^{N} \text{MemberShare}_i \equiv \text{TotalAmount}$$

---

## 2. Coding & Implementation Discipline (The Ponytail Ladder)

Agents must follow the **Ponytail (Lazy/Senior Dev)** ladder:
1. **Does this need to exist at all?** Reject speculative abstractions and boilerplate. (YAGNI)
2. **Already in this codebase?** Check existing utilities and domain models before writing new code.
3. **Can the standard library or platform do it?** Use built-in .NET 10 or browser features first.
4. **Fewest files possible:** The shortest correct, working diff wins.
5. **Root-cause fix over symptom patching:** When fixing bugs, fix the shared function where all callers route through.

---

## 3. Pre-Commit Quality Gates

Every code change made by an agent MUST pass these quality gates before committing:

```bash
# 1. Backend Verification (.NET 10)
dotnet build IpoBuddy.sln -c Release
dotnet test IpoBuddy.sln --no-build -c Release

# 2. Frontend Verification (Next.js 16)
cd frontend
npm run lint
npx tsc --noEmit
npm run build

# 3. Knowledge Graph Sync (Mandatory)
cd ..
graphify update .
```

* If tests break, fix the code — **NEVER** silence or delete tests to get to green.
* If lint fails, fix the code formatting — **NEVER** disable rules globally.

---

## 4. Git Workflow & Versioning

* **Atomic Save-Point Commits:** Each logical change gets its own commit with a conventional commit prefix:
  * `feat:` &mdash; New user-facing feature
  * `fix:` &mdash; Bug fix
  * `refactor:` &mdash; Code improvement without behavior change
  * `test:` &mdash; Test suite additions or fixes
  * `docs:` &mdash; Documentation changes
  * `ci:` &mdash; Pipeline and workflow changes
* **No Unstaged Secrets:** Ensure `.env`, `.env.local`, `appsettings.Development.json`, and database passwords are never committed to version control.

---

## 5. Security & Identity Guidelines

* **Clerk OAuth Claims Handling:**
  * When resolving user identity in Minimal API endpoints, always use the extension method `principal.GetUserId()`.
  * Never cast `ClaimTypes.NameIdentifier` directly to `Guid` without checking the secondary identity claims.
  * Ensure raw external IDs (`user_3Jzz...`) are never displayed on user-facing UI screens. Sanitize with friendly names, email prefixes, or `"Investor"`.

---

## 6. Prohibited Actions for Agents

* ❌ **DO NOT** add paid cloud services, third-party SMS providers, or paid stock market API subscriptions ($0 budget mandate).
* ❌ **DO NOT** edit `IpoBuddy.sln` or `IpoBuddy.slnx` manually. Use `dotnet sln` CLI commands.
* ❌ **DO NOT** introduce state management libraries (Redux, MobX, Zustand) when React 19 context and server state suffice.
* ❌ **DO NOT** create long-lived feature branches when trunk-based atomic commits to `master` keep CI/CD pipelines green.
