-- ==============================================================================
-- IPO BUDDY: Supabase PostgreSQL 16 Schema & Initial Seeds
-- Location: ap-south-1 (Mumbai)
-- Architecture: .NET 10 Clean Architecture Compatible
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "Phone" VARCHAR(20) NULL,
    "Email" VARCHAR(255) NOT NULL,
    "DisplayName" VARCHAR(100) NOT NULL,
    "SubscriptionTier" VARCHAR(50) NOT NULL DEFAULT 'Free',
    "ClerkId" VARCHAR(255) NULL,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_ClerkId" ON "Users" ("ClerkId") WHERE "ClerkId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "IX_Users_Phone" ON "Users" ("Phone") WHERE "Phone" IS NOT NULL;

-- 3. IPOs Table
CREATE TABLE IF NOT EXISTS "Ipos" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "CompanyName" VARCHAR(255) NOT NULL,
    "Symbol" VARCHAR(50) NULL,
    "Exchange" VARCHAR(50) NOT NULL DEFAULT 'NSE/BSE',
    "Category" VARCHAR(50) NOT NULL DEFAULT 'Mainboard',
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Upcoming',
    "IssuePriceLow" NUMERIC(10, 2) NULL,
    "IssuePriceHigh" NUMERIC(10, 2) NULL,
    "LotSize" INT NOT NULL DEFAULT 1,
    "MinInvestment" NUMERIC(12, 2) NULL,
    "OpenDate" DATE NULL,
    "CloseDate" DATE NULL,
    "AllotmentDate" DATE NULL,
    "ListingDate" DATE NULL,
    "ListingPrice" NUMERIC(10, 2) NULL,
    "ListingGainPct" NUMERIC(6, 2) NULL,
    "Gmp" NUMERIC(10, 2) NULL,
    "GmpUpdatedAt" TIMESTAMPTZ NULL,
    "SubscriptionDataJson" TEXT NOT NULL DEFAULT '{}',
    "RegistrarName" VARCHAR(255) NOT NULL DEFAULT '',
    "RegistrarUrl" VARCHAR(500) NOT NULL DEFAULT '',
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IX_Ipos_Status_Category" ON "Ipos" ("Status", "Category");
CREATE INDEX IF NOT EXISTS "IX_Ipos_Symbol" ON "Ipos" ("Symbol");

-- 4. Watchlist Items Table
CREATE TABLE IF NOT EXISTS "WatchlistItems" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL REFERENCES "Users" ("Id") ON DELETE CASCADE,
    "IpoId" UUID NOT NULL REFERENCES "Ipos" ("Id") ON DELETE CASCADE,
    "AlertOnOpen" BOOLEAN NOT NULL DEFAULT TRUE,
    "AlertOnAllotment" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_WatchlistItems_UserId_IpoId" ON "WatchlistItems" ("UserId", "IpoId");

-- 5. Syndicate Groups Table
CREATE TABLE IF NOT EXISTS "Groups" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "Name" VARCHAR(255) NOT NULL,
    "InviteCode" VARCHAR(50) NOT NULL,
    "CreatedById" UUID NOT NULL REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Groups_InviteCode" ON "Groups" ("InviteCode");

-- 6. Group Members Table
CREATE TABLE IF NOT EXISTS "GroupMembers" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "GroupId" UUID NOT NULL REFERENCES "Groups" ("Id") ON DELETE CASCADE,
    "UserId" UUID NOT NULL REFERENCES "Users" ("Id") ON DELETE CASCADE,
    "Role" VARCHAR(50) NOT NULL DEFAULT 'Member',
    "JoinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_GroupMembers_GroupId_UserId" ON "GroupMembers" ("GroupId", "UserId");

-- 7. Group Shared Watchlists Table
CREATE TABLE IF NOT EXISTS "GroupWatchlists" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "GroupId" UUID NOT NULL REFERENCES "Groups" ("Id") ON DELETE CASCADE,
    "IpoId" UUID NOT NULL REFERENCES "Ipos" ("Id") ON DELETE CASCADE,
    "AddedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_GroupWatchlists_GroupId_IpoId" ON "GroupWatchlists" ("GroupId", "IpoId");

-- 8. Group Splits Table
CREATE TABLE IF NOT EXISTS "Splits" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "GroupId" UUID NOT NULL REFERENCES "Groups" ("Id") ON DELETE CASCADE,
    "CreatedById" UUID NOT NULL REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    "Title" VARCHAR(255) NOT NULL,
    "TotalAmount" NUMERIC(12, 2) NOT NULL,
    "SplitType" VARCHAR(50) NOT NULL DEFAULT 'Equal',
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "SettledAt" TIMESTAMPTZ NULL
);

-- 9. Split Individual Entries Table
CREATE TABLE IF NOT EXISTS "SplitEntries" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "SplitId" UUID NOT NULL REFERENCES "Splits" ("Id") ON DELETE CASCADE,
    "UserId" UUID NOT NULL REFERENCES "Users" ("Id") ON DELETE CASCADE,
    "Amount" NUMERIC(12, 2) NOT NULL,
    "IsSettled" BOOLEAN NOT NULL DEFAULT FALSE,
    "SettledAt" TIMESTAMPTZ NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_SplitEntries_SplitId_UserId" ON "SplitEntries" ("SplitId", "UserId");

-- ==============================================================================
-- Initial Seed Data: Active Indian IPOs (Mainboard & SME)
-- ==============================================================================

INSERT INTO "Ipos" (
    "Id", "CompanyName", "Symbol", "Exchange", "Category", "Status",
    "IssuePriceLow", "IssuePriceHigh", "LotSize", "MinInvestment",
    "OpenDate", "CloseDate", "AllotmentDate", "ListingDate",
    "ListingPrice", "ListingGainPct", "Gmp", "GmpUpdatedAt",
    "SubscriptionDataJson", "RegistrarName", "RegistrarUrl"
)
VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    'KRN Heat Exchanger and Refrigeration Ltd',
    'KRNHEAT',
    'NSE/BSE',
    'Mainboard',
    'Open',
    209.00,
    220.00,
    65,
    14300.00,
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '4 days',
    CURRENT_DATE + INTERVAL '7 days',
    NULL,
    NULL,
    238.00,
    NOW(),
    '{"overall": 24.1, "retail": 18.5, "qib": 32.4, "nii": 28.2}',
    'Bigshare Services Pvt Ltd',
    'https://www.bigshareonline.com/ipo_Allotment.html'
),
(
    'b2222222-2222-2222-2222-222222222222',
    'Manba Finance Ltd',
    'MANBA',
    'NSE/BSE',
    'Mainboard',
    'Closed',
    114.00,
    120.00,
    125,
    15000.00,
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '4 days',
    NULL,
    NULL,
    55.00,
    NOW(),
    '{"overall": 73.2, "retail": 70.1, "qib": 65.4, "nii": 84.8}',
    'Link Intime India Pvt Ltd',
    'https://linkintime.co.in/initial_offer/public-issues.html'
),
(
    'c3333333-3333-3333-3333-333333333333',
    'Hyundai Motor India Ltd',
    'HYUNDAI',
    'NSE/BSE',
    'Mainboard',
    'Upcoming',
    1865.00,
    1960.00,
    7,
    13720.00,
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '12 days',
    CURRENT_DATE + INTERVAL '15 days',
    NULL,
    NULL,
    165.00,
    NOW(),
    '{}',
    'KFin Technologies Ltd',
    'https://kosmic.kfintech.com/ipostatus'
),
(
    'd4444444-4444-4444-4444-444444444444',
    'Bajaj Housing Finance Ltd',
    'BAJAJHFL',
    'NSE/BSE',
    'Mainboard',
    'Listed',
    66.00,
    70.00,
    214,
    14980.00,
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE - INTERVAL '17 days',
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE - INTERVAL '12 days',
    150.00,
    114.28,
    82.00,
    NOW(),
    '{"overall": 67.4, "retail": 7.0, "qib": 222.0, "nii": 43.5}',
    'KFin Technologies Ltd',
    'https://kosmic.kfintech.com/ipostatus'
),
(
    'e5555555-5555-5555-5555-555555555555',
    'Diffusor Precision Engineering Ltd',
    'DIFFUSOR',
    'BSE SME',
    'Sme',
    'Open',
    100.00,
    105.00,
    1200,
    126000.00,
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '3 days',
    CURRENT_DATE + INTERVAL '6 days',
    NULL,
    NULL,
    45.00,
    NOW(),
    '{"overall": 14.8, "retail": 18.2, "nii": 11.4}',
    'Maashitla Securities Pvt Ltd',
    'https://maashitla.com/allotment-status'
),
(
    'f6666666-6666-6666-6666-666666666666',
    'Northern Arc Capital Ltd',
    'NORTHARC',
    'NSE/BSE',
    'Mainboard',
    'Listed',
    249.00,
    263.00,
    57,
    14991.00,
    CURRENT_DATE - INTERVAL '14 days',
    CURRENT_DATE - INTERVAL '11 days',
    CURRENT_DATE - INTERVAL '9 days',
    CURRENT_DATE - INTERVAL '6 days',
    351.00,
    33.46,
    128.00,
    NOW(),
    '{"overall": 117.2, "retail": 32.0, "qib": 241.0, "nii": 148.0}',
    'KFin Technologies Ltd',
    'https://kosmic.kfintech.com/ipostatus'
)
ON CONFLICT ("Id") DO NOTHING;
