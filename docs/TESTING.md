# IPO Buddy — Testing Strategy & Quality Assurance Guide

> **Test Runner:** xUnit (.NET 10) & Next.js 16 Quality Gates  
> **CI Pipeline:** GitHub Actions Parallel Matrix (`.github/workflows/ci.yml`)

---

## 1. Testing Philosophy & Test Pyramid

```
           ▲
          / \
         /   \
        / E2E \       Playwright Browser Smoke Tests (UI + Flow)
       /───────\
      /         \
     / Integrat. \    ASP.NET Core WebApplicationFactory (API + DB)
    /─────────────\
   /   Unit Tests  \  SplitCalculator & Financial Precision (Math)
  /─────────────────\
```

1. **Shift Left:** Catch bugs at compile time (TypeScript strict mode, C# nullable types) before tests even run.
2. **Deterministic Financial Math:** Financial division and penny allocation must have 100% unit test coverage with strict equality assertions.
3. **Realistic In-Memory Integration:** Endpoints are tested against an in-memory ASP.NET Core server with SQLite persistence, mimicking real HTTP requests without mocking away the database.

---

## 2. Test Suite Breakdown

### 2.1 Backend Unit & Integration Tests (13 Tests)
Location: `tests/IpoBuddy.Tests/`

#### 1. `FinancialPrecisionTests.cs` (Unit Tests)
Validates the zero-penny-loss remainder allocation algorithm:
* `DivideEqually_WithCleanSplit_CalculatesExactShares`: Tests clean integer splits (e.g., ₹15,000 / 2 = ₹7,500.00 each).
* `DivideEqually_WithRemainderPennies_EnsuresZeroPennyLoss`: Tests repeating decimal splits (e.g., ₹100.00 across 3 members $\rightarrow$ ₹33.34, ₹33.33, ₹33.33, ensuring $\sum = ₹100.00$).
* `DivideEqually_WithUnevenSevenMembers_MaintainsExactSum`: Tests uneven splits across 7 members, verifying exact sum conservation.
* `TokenService_GeneratesAndValidates_TamperProofToken`: Validates HMAC-SHA256 generation, expiration checks, and signature verification.

#### 2. `ApiIntegrationTests.cs` (API Integration Tests)
* `GetHealth_ReturnsHealthyStatus`: Verifies `/api/health` returns HTTP 200 and healthy metadata.
* `CalculateTax_CalculatesCorrectSTCGTax`: Verifies Section 111A 20% tax calculation (e.g., ₹15,000 gain $\rightarrow$ ₹3,000 tax, ₹12,000 net).
* `AuthFlow_RequestOtp_Verify_AccessProfile`: Tests the full OTP verification flow, 401 on unauthenticated profile access, and 200 with Bearer token.

#### 3. `GroupAndSplitIntegrationTests.cs` (Workflow Tests)
* `GroupCreation_And_JoinWithInviteCode_Success`: Tests User A creating a group, generating an invite code, and User B joining with that code.
* `SplitFlow_CreateSplit_SettleEntry_BalancesCalculated`: Full syndicate lifecycle: split creation, net balance computation (User B owes User A), settlement toggle, and balance clearing.

#### 4. `IpoAndWatchlistIntegrationTests.cs` (Data & Feature Tests)
* `GetIpos_ReturnsSeededList`: Verifies database initialization and seed data retrieval.
* `GetIpos_WithCategoryFilter_FiltersProperly`: Verifies `Mainboard` vs `Sme` query parameter filtering.
* `Watchlist_Add_Get_Remove_FullCycle`: Tests adding an IPO to a user's watchlist, verifying presence, and removing it.
* `SyncIpos_Endpoint_ReturnsSuccess`: Tests `POST /api/ipos/sync` endpoint execution.

---

## 3. Custom WebApplicationFactory Architecture

In `tests/IpoBuddy.Tests/CustomWebApplicationFactory.cs`:
```csharp
using Microsoft.AspNetCore.Mvc.Testing;

namespace IpoBuddy.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
}
```
The test suite boots the entire ASP.NET Core Minimal API pipeline in-memory. It automatically executes `db.Database.EnsureCreated()` and `DbInitializer.SeedInitialDataAsync(db)` on SQLite in-memory, giving each test run isolated, realistic database persistence.

---

## 4. Frontend Quality Gates (Next.js 16)

The frontend does not rely on fragile DOM unit mocks. It enforces three automated gates:

```bash
# Gate 1: ESLint Code Quality & Hook Rules
npm run lint

# Gate 2: Strict TypeScript Type-Checking
npx tsc --noEmit

# Gate 3: Next.js Turbopack Production Compilation
npm run build
```

---

## 5. CI/CD Automation (GitHub Actions)

Located at [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml). Executes automatically on every `push` and `pull_request` to `master`:

```yaml
name: CI Build & Test

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  backend:
    name: Backend Tests (.NET 10)
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '10.0.x'
    - run: dotnet restore IpoBuddy.sln
    - run: dotnet build IpoBuddy.sln --no-restore --configuration Release
    - run: dotnet test IpoBuddy.sln --no-build --configuration Release --verbosity normal

  frontend:
    name: Frontend Quality Gates (Next.js)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    - run: npm ci
    - run: npm run lint
    - run: npx tsc --noEmit
    - run: npm run build
```

---

## 6. Local Developer Testing Commands

Run these commands locally before opening any pull request or pushing to git:

```powershell
# Run all 13 backend unit and integration tests
dotnet test IpoBuddy.sln

# Run only financial precision tests
dotnet test --filter "FullyQualifiedName~FinancialPrecisionTests"

# Run frontend quality gates
cd frontend
npm run lint
npx tsc --noEmit
npm run build
cd ..
```
