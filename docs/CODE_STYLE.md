# IPO Buddy — Code Style & Engineering Standards

> **Target Runtimes:** .NET 10 (C# 13) & Node.js 20+ (Next.js 16 / React 19 / TypeScript 5)

---

## 1. General Principles

1. **Boring Over Clever:** Write code that any engineer can debug at 3 AM. Avoid speculative metaprogramming or complex reflection.
2. **Explicit Over Implicit:** Prefer explicit typing over ambiguous inference where business logic or financial calculations are involved.
3. **Immutability Where Practical:** Prefer records and readonly properties for DTOs and value objects.
4. **No Suppressions:** Never commit `#pragma warning disable`, `// @ts-ignore`, or `/* eslint-disable */` without documenting the exact reason and issue ID.

---

## 2. .NET 10 & C# Standards

### 2.1 Project & Language Defaults
* Every `.csproj` must have:
  ```xml
  <TargetFramework>net10.0</TargetFramework>
  <Nullable>enable</Nullable>
  <ImplicitUsings>enable</ImplicitUsings>
  ```
* Use **file-scoped namespaces**:
  ```csharp
  // Good
  namespace IpoBuddy.Api.Endpoints;

  // Bad
  namespace IpoBuddy.Api.Endpoints
  {
      ...
  }
  ```

### 2.2 Financial Numbers & Arithmetic
* **Rule:** Money is ALWAYS `decimal`. Never `float` or `double`.
* **Literals:** Suffix financial literals with `m` (e.g., `15000.00m`, `20.00m`).
* **Rounding:** Always specify `MidpointRounding.AwayFromZero` or explicit mathematical ceiling/floor behavior.

### 2.3 Minimal API Routing Pattern
Organize endpoints into dedicated static classes returning `RouteGroupBuilder`:

```csharp
// src/IpoBuddy.Api/Endpoints/IpoEndpoints.cs
namespace IpoBuddy.Api.Endpoints;

public static class IpoEndpoints
{
    public static RouteGroupBuilder MapIpoEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/ipos", async (
            string? status,
            string? category,
            string? search,
            IAppDbContext db,
            CancellationToken ct) =>
        {
            var query = db.Ipos.AsNoTracking().AsQueryable();
            // ... filtering ...
            return Results.Ok(await query.Select(i => ToDto(i)).ToListAsync(ct));
        })
        .WithTags("IPOs")
        .WithSummary("List Indian IPOs with status, category, and text filters");

        return group;
    }
}
```

### 2.4 Entity Framework Core & Async Practices
* **Read-Only Queries:** Always append `.AsNoTracking()` to queries that return data without modifying entities.
* **Cancellation Tokens:** Pass `CancellationToken cancellationToken = default` through to EF Core calls (`ToListAsync(ct)`, `SaveChangesAsync(ct)`).
* **Identity Extension:** Always resolve the authenticated user ID via `principal.GetUserId()`, never by casting `FindFirstValue` directly.

---

## 3. TypeScript & Next.js 16 Standards

### 3.1 Strict Typing & No `any`
* The use of `any` is strictly prohibited. Use strong interfaces, unions, or `unknown` with type narrowing:
  ```typescript
  // Good
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    alert(message);
  }

  // Bad
  catch (err: any) {
    alert(err.message);
  }
  ```

### 3.2 React 19 Hook Discipline
* **No Synchronous `setState` in Effects:** Do not call state setters directly in the body of a `useEffect`. Wrap asynchronous data fetching or subscriptions properly:
  ```typescript
  // Good
  useEffect(() => {
    let isMounted = true;
    api.getIpos(statusFilter, categoryFilter)
       .then(data => { if (isMounted) setIpos(data); })
       .catch(() => {});
    return () => { isMounted = false; };
  }, [statusFilter, categoryFilter]);
  ```

### 3.3 Tailwind CSS v4 Class Organization
Maintain a consistent ordering sequence for utility classes:
1. **Layout / Positioning:** `flex`, `grid`, `absolute`, `relative`, `z-10`
2. **Display & Sizing:** `w-full`, `max-w-7xl`, `h-10`, `min-h-[44px]`
3. **Spacing:** `p-4`, `px-3`, `py-2`, `gap-3`, `mx-auto`
4. **Typography:** `text-xs`, `font-semibold`, `text-slate-200`, `leading-tight`
5. **Background & Border:** `bg-slate-900`, `border`, `border-slate-800`, `rounded-lg`
6. **Shadow & Effects:** `shadow-md`, `shadow-emerald-500/20`, `transition-all`
7. **Interactive States:** `hover:bg-slate-800`, `focus:ring-2`, `active:scale-95`, `disabled:opacity-50`

---

## 4. Git Commit & Message Conventions

Follow the **Conventional Commits** specification:
```
<type>(<scope>): <short description in present tense>

[optional body explaining WHY the change was made]
```

### Allowed Types
* `feat`: New user-facing functionality
* `fix`: Bug fix
* `refactor`: Internal code reorganization without behavior change
* `test`: Adding or updating unit/integration tests
* `docs`: Documentation updates
* `ci`: GitHub Actions workflow or deployment config modifications
* `chore`: Dependency updates, tooling adjustments

### Examples
* `feat(sync): add live GMP scraper targeting ipoji tables`
* `fix(auth): sanitize raw clerk user_ ID to friendly display name`
* `test(splits): add zero-penny-loss remainder test for 7 members`
