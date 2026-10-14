# IPO Buddy — System Architecture Document

> **Version:** 2.0  
> **Status:** Active / Production  
> **Target Framework:** .NET 10 & Next.js 16  
> **Infrastructure Mandate:** 100% Zero-Cost Free-Tier

---

## 1. System Overview

**IPO Buddy** is a centralized Indian Initial Public Offering (IPO) tracking and informal syndicate split platform. It is engineered to solve two intertwined problems for Indian retail investors:
1. Fragmented, inaccurate market intelligence (live bidding subscription levels, issue price bands, and Grey Market Premium / GMP).
2. The informal coordination problem where friends and family pool capital across accounts to maximize retail lottery allotment odds, requiring precise, audit-proof distribution of listing gains without penny rounding drift.

```mermaid
flowchart TB
    subgraph ClientLayer["Frontend Client (Vercel)"]
        UI["Next.js 16 (React 19 + TypeScript)"]
        Tailwind["Tailwind CSS UI System"]
        ClerkClient["Clerk Auth Client SDK"]
    end

    subgraph EdgeLayer["Edge / DNS / CDN"]
        VercelEdge["Vercel Global CDN"]
        RenderRouter["Render Reverse Proxy"]
    end

    subgraph BackendLayer["Backend API (Render Web Service)"]
        MinimalApi["ASP.NET Core Minimal APIs (.NET 10)"]
        AuthHandler["Clerk JWT Bearer Handler & TokenAuth"]
        ScalarDoc["Scalar OpenAPI Engine (/scalar/v1)"]
        BackgroundSync["IpoSyncBackgroundService (Periodic 30m Worker)"]
    end

    subgraph CleanArch["Clean Architecture Layers"]
        Domain["IpoBuddy.Domain (POCO Entities, Enums)"]
        Application["IpoBuddy.Application (DTOs, SplitCalculator, Interfaces)"]
        Infrastructure["IpoBuddy.Infrastructure (EF Core, Scrapers, Npgsql, SQLite)"]
    end

    subgraph DataLayer["Persistence Layer"]
        SupabasePostgres[("Supabase PostgreSQL 16 (Cloud Prod - Mumbai)")]
        LocalSqlite[("SQLite ipobuddy.db (Local Dev Offline)")]
    end

    subgraph ExternalServices["External Public Feeds"]
        InvestorGain["InvestorGain Live Tables"]
        Groww["Groww Financial Feed"]
        ClerkOIDC["Clerk OIDC Authority (JWKS)"]
    end

    UI --> VercelEdge
    VercelEdge --> RenderRouter
    RenderRouter --> MinimalApi
    MinimalApi --> CleanArch
    CleanArch --> DataLayer
    BackgroundSync --> ExternalServices
    AuthHandler --> ClerkOIDC
```

---

## 2. .NET 10 Clean Architecture

The backend strictly follows the Dependency Inversion Principle. Core business entities and mathematical algorithms do not depend on external frameworks, databases, or UI layers.

```
src/
├── IpoBuddy.Domain/          # Pure POCO Entities & Business Enums (Zero External Deps)
│   ├── Entities/             # User, Ipo, WatchlistItem, Group, GroupMember, Split, SplitEntry
│   └── Enums/                # IpoCategory, IpoStatus, SplitType, SplitStatus, SubscriptionTier
│
├── IpoBuddy.Application/     # Contracts, DTOs & Domain Logic
│   ├── Common/               # Zero-drift SplitCalculator (decimal precision arithmetic)
│   ├── DTOs/                 # Request/Response data transfer records
│   └── Interfaces/           # IAppDbContext, IIpoSyncService contracts
│
├── IpoBuddy.Infrastructure/  # External Services & Persistence
│   ├── Data/                 # EF Core AppDbContext, DbInitializer, Entity Configurations
│   └── Services/             # IpoSyncService (HtmlAgilityPack Scraper), IpoSyncBackgroundService
│
└── IpoBuddy.Api/             # ASP.NET Core Minimal APIs (.NET 10)
    ├── Auth/                 # Clerk JWT Bearer, ClaimsExtensions, TokenService
    ├── Endpoints/            # AuthEndpoints, IpoEndpoints, GroupEndpoints, SplitEndpoints
    └── Program.cs            # Route groups, Scalar OpenAPI, CORS, and middleware pipeline
```

### Layer Dependency Rules
- `Domain` depends on **nothing**.
- `Application` depends only on `Domain`.
- `Infrastructure` depends on `Application` and `Domain`.
- `Api` orchestrates dependencies and depends on `Infrastructure` and `Application`.

---

## 3. Database Persistence Strategy: Dual-Mode Architecture

To guarantee frictionless offline local development behind corporate proxies while deploying to a managed PostgreSQL cluster in production with $0 spend, EF Core dynamically routes connections based on environment:

```mermaid
flowchart LR
    Start["Startup: Configure DbContext"] --> CheckConn{"DATABASE_URL or ConnectionString?"}
    CheckConn -- "Starts with postgres:// or Host=" --> Supabase["Npgsql PostgreSQL Provider (Supavisor Port 6543)"]
    CheckConn -- "Default / Offline" --> SQLite["Microsoft.EntityFrameworkCore.Sqlite (ipobuddy.db)"]
    Supabase --> EnsureCreated["db.Database.EnsureCreated()"]
    SQLite --> EnsureCreated
    EnsureCreated --> SeedData["DbInitializer.SeedInitialDataAsync()"]
```

### Connection Characteristics
* **Production Database:** Supabase PostgreSQL 16 hosted in AWS `ap-south-1` (Mumbai).
  * **Port:** `6543` utilizing Supavisor Transaction Pooler to support serverless connection bursts without exhausting Postgres worker threads.
  * **SSL Mode:** `Require`.
* **Local Offline Database:** SQLite (`ipobuddy.db`). Enables complete local development and testing without internet access or database server installations.

---

## 4. Frontend Architecture (Next.js 16 + React 19)

The client application is built with Next.js 16 (Turbopack) using the App Router and React 19:

```
frontend/src/
├── app/
│   ├── layout.tsx            # Global ClerkProvider wrapper & font injection
│   ├── page.tsx              # Single-page tabbed dashboard (Explorer, Watchlist, Groups, Splits, Tax)
│   └── globals.css           # Tailwind CSS v4 styling & dark theme variables
├── context/
│   └── AuthContext.tsx       # Unified authentication state & profile auto-healing
└── lib/
    └── api.ts                # Type-safe API client with automatic Clerk JWT Bearer injection
```

### Key Frontend Patterns
1. **Dynamic JWT Injection:** `api.ts` registers a reactive token getter with Clerk's `getToken()` so every outgoing REST call carries fresh authorization without stale token expiry.
2. **Self-Healing Display Names:** `AuthContext.tsx` inspects profile display names. If a raw Clerk ID (`user_...`) is detected from legacy creation, it dynamically swaps to the user's friendly name and patches the backend.
3. **Optimistic Visual State:** Tab switches, live sync triggers, and watchlist toggles execute with immediate UI feedback and non-blocking background synchronization.

---

## 5. Ingestion Pipeline & Background Workers

Market data accuracy is maintained without paid third-party financial API subscriptions ($50–$100/mo) through an autonomous ingestion pipeline:

```mermaid
sequenceDiagram
    autonumber
    participant Worker as IpoSyncBackgroundService
    participant Scraper as IpoSyncService (HtmlAgilityPack)
    participant Source as Live Table (InvestorGain / Groww)
    participant DB as EF Core AppDbContext (PostgreSQL / SQLite)

    Note over Worker: Runs 5s after boot, then every 30 mins
    Worker->>Scraper: SyncIposAsync(cancellationToken)
    Scraper->>Source: HTTP GET with Browser User-Agent
    alt Source Available
        Source-->>Scraper: HTML Response (200 OK)
        Scraper->>Scraper: Parse rows (Price, GMP, Dates, Category)
        Scraper->>DB: Upsert records (match by normalized name)
        DB-->>Scraper: Changes committed
        Scraper-->>Worker: Return upsert count
    else Source Error / Throttled
        Source-->>Scraper: 502 / Connection Timeout
        Scraper->>Scraper: Log warning, activate fallback cache
        Scraper-->>Worker: Return existing DB count (zero downtime)
    end
```

---

## 6. End-to-End Sequence: Syndicate Gain Split

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Syndicate Leader (User A)
    actor Member as Friend (User B)
    participant Frontend as Next.js 16 Client
    participant API as Minimal API (/api/splits)
    participant Calc as SplitCalculator (Application)
    participant DB as PostgreSQL Database

    Admin->>Frontend: Create Split (₹15,000, 2 Members)
    Frontend->>API: POST /api/groups/{groupId}/splits (Bearer Token)
    API->>DB: Fetch GroupMembers
    DB-->>API: [User A, User B]
    API->>Calc: DivideEqually(15000.00, 2)
    Calc-->>API: MemberShares: [₹7,500.00, ₹7,500.00] (Zero Remainder Drift)
    API->>DB: Save Split + SplitEntries (Creator = Settled, Member = Pending)
    DB-->>API: Committed
    API-->>Frontend: Return SplitDto
    
    Member->>Frontend: Open Split Calculator & View Net Balances
    Frontend->>API: GET /api/splits/balances
    API-->>Frontend: Net Balance: User B owes User A ₹7,500.00
    Member->>Frontend: Mark Settled
    Frontend->>API: POST /api/splits/{id}/settle/{entryId}
    API->>DB: Update IsSettled = true, SettledAt = UtcNow
    DB-->>API: Committed
    API-->>Frontend: Net Balance Cleared (₹0.00)
```

---

## 7. Infrastructure & Deployment Topology

| Component | Platform | Configuration | Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Backend API** | Render | Docker Linux Container, Singapore Region, Port 8080/Dynamic | $0.00 (Free Tier) |
| **Frontend** | Vercel | Next.js 16 Turbopack, Global Edge Network | $0.00 (Hobby Tier) |
| **Database** | Supabase | PostgreSQL 16, 500 MB Storage, Mumbai `ap-south-1` | $0.00 (Free Tier) |
| **Auth Provider** | Clerk | Multi-tenant OAuth & OTP Engine (10,000 MAUs) | $0.00 (Free Tier) |
| **CI / Automation**| GitHub Actions | Parallel Matrix Workflows (.NET 10 + Node 20) | $0.00 (Public/Free Tier) |
| **Total Cost** | | | **$0.00 / month** |
