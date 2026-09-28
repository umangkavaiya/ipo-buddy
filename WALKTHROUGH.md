# Walkthrough: IPO Buddy .NET Clean Architecture Backend

The backend for **IPO Buddy** has been transitioned to a modular, production-ready **.NET 10 Clean Architecture** solution.

---

## 1. Solution Architecture

```
IpoBuddy.sln
├── src/
│   ├── IpoBuddy.Domain/          # Enterprise Entities & Business Rules
│   │   └── Entities/             # User, Ipo, WatchlistItem, Group, GroupMember, Split, SplitEntry
│   │
│   ├── IpoBuddy.Application/     # Use Cases, DTOs & Calculation Logic
│   │   ├── DTOs/                 # Request/Response contracts
│   │   ├── Interfaces/           # IAppDbContext
│   │   └── Common/               # Zero-drift financial SplitCalculator
│   │
│   ├── IpoBuddy.Infrastructure/  # Persistence & External Public Scrapers
│   │   ├── Data/                 # EF Core AppDbContext (SQLite locally, Npgsql/Supabase in prod)
│   │   └── Services/             # IpoSyncService (Groww API & InvestorGain GMP scraping)
│   │
│   └── IpoBuddy.Api/             # ASP.NET Core Minimal APIs & Auth
│       ├── Auth/                 # HMAC-SHA256 TokenService & Bearer AuthHandler
│       ├── Endpoints/            # Auth, IPO, Group, and Split endpoint groups
│       └── Program.cs            # OpenAPI + Scalar interactive documentation UI
│
└── tests/
    └── IpoBuddy.Tests/           # Unit & Integration Test Suite
        ├── FinancialPrecisionTests.cs
        ├── ApiIntegrationTests.cs
        └── GroupAndSplitIntegrationTests.cs
```

---

## 2. Implemented API Endpoints

| Area | Method | Endpoint | Description | Auth Required? |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Health check probe | No |
| **System** | `GET` | `/scalar/v1` | Modern interactive OpenAPI documentation | No |
| **Tools** | `POST` | `/api/tools/tax-calculator` | Calculates 20% Indian STCG tax on gains | No |
| **Auth** | `POST` | `/api/auth/request-otp` | Request OTP for mobile login | No |
| **Auth** | `POST` | `/api/auth/verify-otp` | Verify OTP & receive 30-day tamper-proof Bearer token | No |
| **Profile** | `GET` | `/api/profile` | Get current user's profile | Yes |
| **Profile** | `PATCH` | `/api/profile` | Update profile display name & email | Yes |
| **IPOs** | `GET` | `/api/ipos` | List IPOs with category, status, and search filters | No |
| **IPOs** | `GET` | `/api/ipos/{id}` | Get single IPO details | No |
| **Watchlist** | `GET` | `/api/watchlist` | Get authenticated user's watchlist | Yes |
| **Watchlist** | `POST` | `/api/watchlist/{ipoId}` | Add IPO to watchlist | Yes |
| **Watchlist** | `DELETE`| `/api/watchlist/{ipoId}` | Remove IPO from watchlist | Yes |
| **Scraper** | `POST` | `/api/admin/sync-ipos` | Trigger on-demand sync from Groww & InvestorGain | No |
| **Groups** | `POST` | `/api/groups` | Create private friend group with 6-char invite code | Yes |
| **Groups** | `GET` | `/api/groups` | List user's groups | Yes |
| **Groups** | `GET` | `/api/groups/{id}` | Get group details, members, and watchlist | Yes |
| **Groups** | `POST` | `/api/groups/join` | Join group via invite code | Yes |
| **Groups** | `POST` | `/api/groups/{id}/watchlist/{ipoId}` | Add IPO to group shared watchlist | Yes |
| **Splits** | `POST` | `/api/groups/{id}/splits` | Create split divided equally with zero penny drift | Yes |
| **Splits** | `GET` | `/api/groups/{id}/splits` | List all splits in a group | Yes |
| **Splits** | `POST` | `/api/splits/{id}/settle/{entryId}` | Toggle settled status on a split entry | Yes |
| **Splits** | `GET` | `/api/splits/balances` | Aggregate net balances across all groups | Yes |

---

## 3. Verification & Test Results

The solution was verified with automated xUnit unit and integration tests covering financial precision, token security, and full API workflows:

```bash
dotnet test
```

### Test Output:
```
Test run for .../IpoBuddy.Tests.dll (.NETCoreApp,Version=v10.0)
Passed! - Failed: 0, Passed: 9, Skipped: 0, Total: 9, Duration: 2 s
```

- ✅ `DivideEqually_WithCleanSplit_CalculatesExactShares`
- ✅ `DivideEqually_WithRemainderPennies_EnsuresZeroPennyLoss`
- ✅ `DivideEqually_WithUnevenSevenMembers_MaintainsExactSum`
- ✅ `TokenService_GeneratesAndValidates_TamperProofToken`
- ✅ `GetHealth_ReturnsHealthyStatus`
- ✅ `CalculateTax_CalculatesCorrectSTCGTax`
- ✅ `AuthFlow_RequestOtp_Verify_AccessProfile`
- ✅ `GroupCreation_And_JoinWithInviteCode_Success`
- ✅ `SplitFlow_CreateSplit_SettleEntry_BalancesCalculated`

---

## 4. How to Run Locally

### 1. Run the .NET 10 API
```bash
# Starts backend API on http://localhost:5074
dotnet run --project src/IpoBuddy.Api
```
- Interactive Scalar API Documentation: [http://localhost:5074/scalar/v1](http://localhost:5074/scalar/v1)
- Health check probe: [http://localhost:5074/api/health](http://localhost:5074/api/health)

### 2. Run the Next.js Frontend
```bash
cd frontend
npm.cmd run dev
```
- Open your browser at [http://localhost:3000](http://localhost:3000)

---

## 5. Deployment & Automation (100% Zero-Cost)

1. **Backend on Render Free Web Service**:
   - `Dockerfile`: Multi-stage .NET 10 container image (~90MB).
   - `render.yaml`: Blueprint configuration with dynamic `$PORT` routing and `/api/health` probe.
   - Database: Supabase PostgreSQL 16 connection URI passed in `DATABASE_URL`.
2. **Frontend on Vercel Hobby**:
   - Deploy `frontend/` directory with `NEXT_PUBLIC_API_URL` pointing to the Render backend URL.
3. **Scheduled Ingestion via GitHub Actions**:
   - `.github/workflows/ipo_sync.yml`: Automates IPO & GMP scraping on Indian market trading days (Mon–Fri at 10 AM, 2 PM, and 5 PM IST) at zero infrastructure cost.

