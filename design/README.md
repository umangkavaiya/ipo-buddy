# IPO Buddy — UI/UX Design System & Screen Catalog

Generated and managed via **Google Stitch MCP** (`projects/15300535086223492224`).

---

## 1. Design Philosophy & Guidelines

The design system (**Equitas Financial System**) is tailored specifically for high-stakes Indian retail investing and syndicate IPO allocation. It balances institutional authority with accessible retail fintech ergonomics.

### Design Tokens
- **Primary Navy**: `#0a2540` / `#000f22` — Used for navigation, brand surfaces, headlines, and primary actions.
- **Listing Pop Emerald**: `#2ecc71` / `#006d37` — Reserved for positive listing gains, active subscription status, and primary CTAs.
- **Surface & Desk**: `#f7f9fb` (Page background) / `#ffffff` (Elevated content cards with soft 1px borders).
- **Typography**: **Inter** across all scales. Tabular figures (`tnum`, `lnum`) enabled on all financial metrics, lot counts, and gain percentages to ensure zero decimal column drift.
- **Corner Radii**: 4px (`ROUND_FOUR`) for buttons/inputs, 8px/12px for cards, and pill badges (9999px) for IPO status chips.

---

## 2. Screen Catalog

Each screen has been exported as a self-contained HTML/CSS prototype and high-resolution screenshot in [`design/screens/`](./screens):

### [00. Homepage & Landing Platform](./screens/00-homepage)
- **Files**: [HTML Prototype](./screens/00-homepage/homepage.html) | [Screenshot](./screens/00-homepage/homepage.png)
- **Purpose**: High-converting, comprehensive landing page for retail syndicate leads and family investors.
- **Key Sections**:
  1. **Sticky Header**: Logo, Live IPOs, GMP Tracker, Split Calculator, Allotment Status, and Auth CTAs.
  2. **Hero Section**: Value proposition for multi-account bidding with real-time trust badges (SEBI compliant remainder allocation, bank-grade decimal precision, zero password sharing).
  3. **Live Market Pulse Ticker**: Real-time cards for active IPOs (Tata Tech +84% GMP, Bajaj Housing +114% GMP, lot sizes, price bands, and overbooking multiples).
  4. **Core Capabilities Grid**: Multi-PAN Demat Hub, Live GMP Scraper, Automated Syndicate Split Engine, and Unified Allotment Checker.
  5. **Interactive Split Engine Showcase**: Live interactive matrix demonstrating the Hare-Niemeyer Largest Remainder method across 3 partners with zero rounding loss.
  6. **How It Works**: 3-step syndicate lifecycle (Profile Setup → Pooled Bidding → Instant Settlement).
  7. **Social Proof & Metrics**: ₹12.5+ Cr tracked, 45,000+ bids managed, 99.9% listing day uptime.
  8. **Footer & Compliance**: SEBI statutory risk disclaimers, investor links, and theme toggle.

---

### [01. Capital Flow & Portfolio Dashboard](./screens/01-capital-flow-dashboard)
- **Files**: [HTML Prototype](./screens/01-capital-flow-dashboard/dashboard.html) | [Screenshot](./screens/01-capital-flow-dashboard/dashboard.png)
- **Purpose**: Authenticated dashboard providing bird's-eye visibility into pooled syndicate capital, active bids, locked funds, and realized listing gains.
- **Highlights**:
  - Summary metrics: Total Capital Deployed, Active Applications, Unallocated Cash, and Net Realized Gain.
  - Active IPO tracking board with countdown to mandate expiry.
  - Portfolio allocation distribution progress bars.

---

### [02. Smart IPO Application](./screens/02-smart-ipo-application)
- **Files**: [HTML Prototype](./screens/02-smart-ipo-application/apply.html) | [Screenshot](./screens/02-smart-ipo-application/apply.png)
- **Purpose**: Multi-account batch application workflow across linked family PAN profiles.
- **Highlights**:
  - Select target IPO and quota category (Retail vs. sHNI vs. bHNI).
  - Bulk select family accounts with automatic lot calculation and UPI mandate distribution.
  - Cut-off price auto-fill with one-click bid confirmation.

---

### [03. Linked Accounts Manager (Multi-PAN)](./screens/03-linked-accounts-manager)
- **Files**: [HTML Prototype](./screens/03-linked-accounts-manager/linked-accounts.html) | [Screenshot](./screens/03-linked-accounts-manager/linked-accounts.png)
- **Purpose**: Multi-Demat account manager for managing family profiles without storing sensitive broker passwords.
- **Highlights**:
  - Card view per investor (Name, Masked PAN, Demat / DP ID, UPI handle).
  - Verification badges and quick bank mandate linking.
  - Syndicate weight assignment for automated split payouts.

---

### [04. Allocation History & Analytics](./screens/04-allocation-analytics)
- **Files**: [HTML Prototype](./screens/04-allocation-analytics/analytics.html) | [Screenshot](./screens/04-allocation-analytics/analytics.png)
- **Purpose**: Post-allotment ledger, listing gain tracking, and exportable syndicate settlement sheets.
- **Highlights**:
  - Allotment hit-rate analytics by category and issue type.
  - Detailed share-by-share gain distribution breakdown.
  - One-click export to WhatsApp-ready text summary and Excel CSV.

---

### [05. Notifications & Activity Log](./screens/05-notifications-activity)
- **Files**: [HTML Prototype](./screens/05-notifications-activity/notifications.html) | [Screenshot](./screens/05-notifications-activity/notifications.png)
- **Purpose**: Centralized notification center for registrar allotment drops, UPI mandate reminders, and fund unblocking alerts.
- **Highlights**:
  - Categorized drawer (Mandates, Allotments, Listings, Settlements).
  - Real-time timestamped audit log.

---

## 3. How to Review Locally

You can open any of the HTML prototypes directly in your browser:
- `design/screens/00-homepage/homepage.html`
- `design/screens/01-capital-flow-dashboard/dashboard.html`
- `design/screens/02-smart-ipo-application/apply.html`
- `design/screens/03-linked-accounts-manager/linked-accounts.html`
- `design/screens/04-allocation-analytics/analytics.html`
- `design/screens/05-notifications-activity/notifications.html`

Or open the corresponding `.png` screenshots in any image viewer.

---

## 4. Implementation Phase (Next Step)

Once you review and approve these designs:
1. We will extract shared Tailwind primitives into `frontend/src/components/ui`.
2. We will implement the new **Homepage** in `frontend/src/app/page.tsx` using Next.js 15 Server and Client components.
3. We will connect the interactive widgets (Live IPO pulse, Split Calculator teaser) directly to our .NET 10 Minimal APIs (`/api/ipos` and `/api/syndicates/calculate-split`).
