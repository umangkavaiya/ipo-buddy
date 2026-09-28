# ADR-002: Switch Backend to .NET 10 Clean Architecture

## Status
Accepted

## Date
2026-09-28

## Context
In ADR-001, Python/Django was originally selected for the backend. However, several operational and technical considerations emerged during development:
1. **Financial Arithmetic Precision**: Financial calculation logic (equal splits, penny remainders, capital gains tax) requires native arbitrary-precision arithmetic without floating-point hazards. C# provides a native 128-bit `decimal` type specifically engineered for monetary precision.
2. **Cold Start Latency on Free Hosting**: Render's free tier spins down web services after 15 minutes of inactivity. Python/Django takes ~2.5–4 seconds to boot and load Django ORM/apps on cold start, whereas a compiled .NET 10 binary starts in **~200–300ms**.
3. **Memory Footprint**: Render limits free instances to 512 MB of RAM. ASP.NET Core Minimal APIs operate at **~50–80 MB RAM**, leaving over 80% headroom, whereas Python/Django with Gunicorn workers easily consumes 180–260 MB.
4. **Clean Architecture Separation**: The project requires a clear, decoupled architectural boundary separating Domain entities, Application business logic & DTOs, Infrastructure data access, and API presentation layers.

## Decision
Transition the backend entirely to **.NET 10 (C#) Clean Architecture**:

- **`IpoBuddy.Domain`**: Pure POCO domain models (`User`, `Ipo`, `WatchlistItem`, `Group`, `GroupMember`, `Split`, `SplitEntry`) and domain enums with zero external framework dependencies.
- **`IpoBuddy.Application`**: Application contracts, DTOs, `IAppDbContext` interface, and business rules (`SplitCalculator` ensuring zero-penny drift).
- **`IpoBuddy.Infrastructure`**: EF Core `AppDbContext` (configured with `Microsoft.EntityFrameworkCore.Sqlite` for local dev and `Npgsql.EntityFrameworkCore.PostgreSQL` for Supabase in production) and `IpoSyncService` utilizing `HtmlAgilityPack` and `HttpClient`.
- **`IpoBuddy.Api`**: ASP.NET Core Minimal APIs with route groups, lightweight HMAC-SHA256 Bearer Token authentication, and interactive API documentation powered by `Scalar.AspNetCore` (accessible locally on port **5074** at `http://localhost:5074/scalar/v1`).
- **`IpoBuddy.Tests`**: Automated xUnit test suite validating financial precision and API integration in-memory using `Microsoft.AspNetCore.Mvc.Testing`.

## Alternatives Considered

### Retain Python 3.12 / Django Ninja
- **Pros**: Django provides an automatic `/admin/` portal.
- **Cons**: Slower cold starts on free tier (~3s vs ~200ms); higher memory consumption (~200MB vs ~60MB); dynamic typing requires Pydantic schema duplication.
- **Supabase Mitigation**: Supabase already provides a web-based Table Editor and Database GUI, eliminating the strict necessity for Django Admin.

## Consequences

### Positive
- **Execution Speed & Low Memory**: ~60 MB RAM footprint runs comfortably within Render's 512 MB free tier.
- **Instant Cold Starts**: Compiled binary responds in sub-second time even if spun down by Render.
- **Compile-Time Type Safety**: Refactoring across Domain, Application, and API layers is verified at build time.
- **Built-in Interactive Docs**: Scalar provides a modern, fast API testing workbench at `/scalar/v1`.
- **Local Dev Port**: Local dev environment is established on port **5074**.

### Trade-offs
- Scaffolded across 4 Clean Architecture projects rather than a single Django directory, requiring project references and solution management.
