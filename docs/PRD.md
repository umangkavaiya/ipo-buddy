# IPO Buddy — Product Requirements Document (PRD)

> **Document Version:** 2.0  
> **Status:** Approved / Active Baseline  
> **Target Audience:** Product Engineers, QA, System Architects

---

## 1. Executive Summary & Product Vision

### 1.1 Vision
**IPO Buddy** is a centralized Indian IPO intelligence and syndicate group splitting platform. It gives retail investors real-time IPO analytics, live subscription tracking, Grey Market Premium (GMP) data, and a mathematically exact, zero-penny-loss group calculator to pool funds and divide listing gains among friends and family.

### 1.2 One-Liner
> *"Moneycontrol meets Splitwise — track every Indian IPO, share watchlists with friends, and split listing gains with a mathematical guarantee of zero penny loss."*

### 1.3 Strategic Positioning (Legal & Regulatory De-risking)
To launch with **zero legal expenditure** and **zero regulatory compliance risk** from SEBI (Securities and Exchange Board of India) and RBI:
* **No CIS (Collective Investment Scheme) Exposure:** The platform does not hold, move, pool, or escrow capital. It provides purely mathematical and informational utilities.
* **No Investment Advice:** The platform presents purely factual market data (dates, subscription multiples, and street GMP) without recommendations to "Apply" or "Avoid".
* **The Splitwise Analogy:** The split calculator is context-agnostic. It treats an IPO listing gain the same way Splitwise treats a dinner bill or vacation rental: as numbers entered by consenting private friend groups.

---

## 2. Target User Personas

| Persona | Profile & Goals | Pain Points Solved |
| :--- | :--- | :--- |
| **P1: The Syndicate Leader** | Experienced retail investor who coordinates 5–15 demat accounts across family members to boost IPO lottery allotment chances. | Manual calculations in Excel lead to floating-point penny discrepancies, arguments about who owes whom after listing day, and tax confusion. |
| **P2: The Active Retail Trader** | Individuals tracking Mainboard and SME IPOs daily to time applications before bidding closing dates. | Unreliable blogs, delayed GMP figures, and missing SME IPO information across disparate portals. |
| **P3: The Passive Syndicate Participant** | Family members or friends who let the Syndicate Leader apply on their demat account. | Lack of visibility into whether their application was allotted, what the listing gain was, and when their share is settled. |

---

## 3. Functional Requirements (FR)

### FR1: Real-Time IPO Explorer
* **FR1.1 (Listing):** The system shall display all Indian IPOs categorized into `Mainboard` and `SME` (NSE SME / BSE SME).
* **FR1.2 (Filtering):** Users shall be able to filter listings by Status (`All`, `Open`, `Upcoming`, `Closed`, `Listed`) and Category (`All`, `Mainboard`, `SME`).
* **FR1.3 (Search):** Real-time text search shall match company names and exchange symbols with case-insensitive sub-string matching.
* **FR1.4 (Key Metrics):** Each card shall present Issue Price Low/High, Lot Size, Minimum Retail Investment (Upper Price $\times$ Lot Size), Open Date, Close Date, Allotment Date, and Listing Date.

### FR2: Live Grey Market Premium (GMP) Engine
* **FR2.1 (Live Data):** The system shall display real-time GMP in ₹ and as an estimated percentage gain over the upper issue price.
* **FR2.2 (Listing Estimate):** The system shall compute Estimated Listing Price as $\text{Upper Price} + \text{GMP}$.
* **FR2.3 (Timestamp):** Cards shall display the exact last-updated timestamp of the GMP feed.

### FR3: Personal Watchlist
* **FR3.1 (Toggle):** Authenticated users can toggle any IPO to/from their personal watchlist via a single-click Star (⭐) action.
* **FR3.2 (Persistence):** Watchlist selections shall persist across sessions in the database.
* **FR3.3 (Counter):** The navigation tab shall dynamically render the current count of watched IPOs.

### FR4: Private Friend Groups (Syndicates)
* **FR4.1 (Creation):** Authenticated users can create named groups (e.g., *"Family IPO Syndicate"*).
* **FR4.2 (Invite Codes):** The system shall automatically generate a unique, cryptographically random 6-character alphanumeric invite code (e.g., `K9X2A1`) per group.
* **FR4.3 (Joining):** Other users can join existing groups instantly by submitting the 6-character code.
* **FR4.4 (Roster):** Groups display members, join dates, and member counts.

### FR5: Zero-Penny-Loss Split Calculator
* **FR5.1 (Expense/Gain Entry):** Users can record a shared amount (e.g., ₹15,000 listing gain) against a selected group.
* **FR5.2 (Exact Allocation):** The backend `SplitCalculator` shall divide the total with 100% `decimal` precision. Remainder pennies must be distributed sequentially so $\sum(\text{shares}) \equiv \text{Total Amount}$ down to the last paisa.
* **FR5.3 (Settlement Lifecycle):** Group members can mark individual entries as settled, with timestamps recorded.
* **FR5.4 (Net Balance Ledger):** The platform aggregates mutual debts across all user groups to show a unified "Who Owes Whom" ledger.

### FR6: STCG Tax Calculator Tool
* **FR6.1 (Statutory Calculation):** A stateless calculator computing 20% Short-Term Capital Gains tax under Section 111A of the Indian Income Tax Act.
* **FR6.2 (Net Yield):** Displays Gross Profit, Tax Payable at 20%, and Net Take-Home In-Hand amount.

### FR7: Autonomous Background Feeds & On-Demand Sync
* **FR7.1 (Background Worker):** A hosted background service runs an initial sync 5 seconds after startup, repeating every 30 minutes.
* **FR7.2 (On-Demand Refresh):** UI contains a "Sync Public Feeds" button triggering `POST /api/ipos/sync` with live visual progress feedback.
* **FR7.3 (Fault Tolerance):** If external sources return 5xx or bot challenges, the system logs a warning and falls back to existing cached database records without throwing user-facing errors.

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Financial Precision
* **Zero Binary Floating Drift:** Floating-point data types (`float`, `double`) are strictly prohibited in financial entities and calculations. All amounts must use C# `decimal` and SQL `numeric(18,2)`.

### 4.2 Performance & Responsiveness
* **API Latency:** P95 response times for read operations (`GET /api/ipos`, `GET /api/groups`) shall be $< 100\text{ ms}$ on local and $< 250\text{ ms}$ on warm cloud containers.
* **Frontend Performance:** Next.js Turbopack build with static optimization where possible, maintaining a Core Web Vitals LCP $< 2.0\text{ s}$.

### 4.3 Security & Authentication
* **Token Verification:** Asymmetric validation of Clerk OAuth JWT tokens using Clerk's public JSON Web Key Sets (JWKS).
* **ID Isolation:** Multi-identity resolution guarantees entity primary keys (`Guid`) are isolated from external auth provider identifier formats.
* **Zero Hardcoded Secrets:** Production credentials, database connection strings, and API secrets must reside exclusively in environment variables.

### 4.4 Zero-Cost Infrastructure Mandate
* The application must operate 100% within the free tiers of Render (Docker Web Service), Vercel (Next.js Edge), Supabase (PostgreSQL 16), and GitHub Actions (CI/CD).

---

## 5. User Journeys

### Journey 1: Morning IPO Screening & Watchlist
1. User lands on `https://ipo-buddy-xxx.vercel.app/`.
2. Inspects live IPO cards sorted by status (`Open` first).
3. Reviews Grey Market Premium (e.g., Bajaj Housing Finance +115% GMP).
4. Clicks Star (⭐) on 2 high-conviction IPOs to add them to their personal watchlist.

### Journey 2: Syndicate Creation & Listing Gain Settlement
1. User signs in with email via Clerk OTP.
2. Navigates to **Friend Groups** tab, types *"Alpha Syndicate"*, and receives invite code `K4T9M2`.
3. Shares code with 2 friends via WhatsApp, who enter the code in their respective accounts to join.
4. On listing day, the leader enters a ₹15,000 gain in the **Split Calculator**.
5. The system computes exact ₹5,000.00 shares for each member.
6. When friends transfer their share, the leader clicks **Mark Settled**, automatically clearing the net balance ledger.

---

## 6. Out of Scope for MVP (Future Roadmap)
* **In-app UPI Deep-Linking:** Deferred to avoid RBI payment aggregator compliance requirements.
* **Direct Broker Order Placement:** Deferred to avoid SEBI stock broker / intermediary licensing.
* **SMS Gateway Integration:** Mock OTP in development and Clerk Email OTP in production eliminate recurring SMS gateway costs.
