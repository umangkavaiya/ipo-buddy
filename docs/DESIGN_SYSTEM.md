# IPO Buddy — Design System & Visual Language

> **Version:** 2.0  
> **Theme:** Dark-First Fintech Dashboard  
> **CSS Architecture:** Tailwind CSS v4

---

## 1. Visual Philosophy & Design Principles

1. **Dark-First High-Contrast Canvas:** Financial trading environments require minimal eye fatigue during extended screen sessions. The canvas uses deep `slate-950` with layered elevation levels.
2. **Emerald as the Growth Anchor:** The primary accent is emerald (`#10b981`), symbolizing financial growth, listing gains, and positive market momentum.
3. **Information Density with Breathability:** Metrics (Issue price, lot size, subscription multiples, and GMP) are arranged in scannable grids without visual clutter.
4. **Touch-First Accessibility:** Minimum interactive tap targets of 44px ($\ge 44 \times 44\text{ px}$) across all buttons, inputs, and tab triggers, complying with WCAG 2.2 AA.

---

## 2. Color Palette & Semantic Tokens

```
Canvas & Backgrounds
├── bg-slate-950     (#020617)  Main viewport background
├── bg-slate-900     (#0f172a)  Elevated card surface / container
├── bg-slate-850     (#131f37)  Hover state on cards & inputs
└── bg-slate-800     (#1e293b)  Secondary containers & borders

Borders & Dividers
├── border-slate-900 (#0f172a)  Subtle structural separation
├── border-slate-800 (#1e293b)  Default card & header border
└── border-slate-700 (#334155)  Interactive hover / focus border

Brand & Accent Palette
├── from-emerald-500 (#10b981)  Logo gradient & primary action highlight
├── to-teal-400      (#2dd4bf)  Subtle gradient secondary stop
└── shadow-emerald   (rgba(16, 185, 129, 0.2))  Action glow

Semantic Status Indicators
├── Active / Positive: text-emerald-400, bg-emerald-500/10, border-emerald-500/20 (Open IPOs, Listing Gains, Settled)
├── Upcoming / Info:   text-sky-400, bg-sky-500/10, border-sky-500/20 (Upcoming IPOs, Informational Badges)
├── Closed / Neutral:  text-slate-400, bg-slate-800/80, border-slate-700/50 (Closed IPOs, Past Events)
├── Warning / Pending: text-amber-400, bg-amber-500/10, border-amber-500/20 (Pending Settlements, Unsettled Debts)
└── Alert / Danger:    text-rose-400, bg-rose-500/10, border-rose-500/20 (Delete Actions, Error States, Logout)
```

---

## 3. Typography System

* **Primary Font Stack:** System Sans-Serif (`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`).
* **Numeric Font Stack:** Tabular Figures (`font-mono` / `tabular-nums`) for currency amounts, lot sizes, and subscription multipliers to prevent layout shifting.

| Token | Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display H1** | 20px (`text-xl`) | 28px | 700 (Bold) | Top header application title |
| **Section H2** | 16px (`text-base`) | 24px | 700 (Bold) | Card titles, modal headers |
| **Subheading** | 14px (`text-sm`) | 20px | 600 (Semibold)| Stat headings, group names |
| **Body Text** | 13px (`text-xs`) | 18px | 400 (Regular) | Paragraphs, descriptions, table rows |
| **Metric Value**| 14px (`text-sm`) | 20px | 700 (Bold) | Currency amounts, lot counts, dates |
| **Badge / Tag** | 11px (`text-[11px]`)| 14px | 600 (Semibold)| Category badges, status indicators |

---

## 4. Indian Financial Formatting Conventions

All monetary metrics rendered on the UI must follow Indian Lakhs/Crores numbering rules:
* **Currency Symbol:** Always prefix with `₹` (Rupee symbol).
* **Number Format:** Indian grouping format `₹1,00,000` (not Western `₹100,000`).
* **Fractional Precision:** Fixed 2 decimals for calculations (`₹7,500.00`), clean whole numbers for prices (`₹197`).

---

## 5. Reusable Component Specifications

### 5.1 Primary Button
```html
<button class="min-h-[44px] px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 
               text-white text-xs font-semibold shadow-md shadow-emerald-600/20 
               transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
  Action Label
</button>
```

### 5.2 Header User Profile Pill (Clean State)
```html
<div class="flex items-center gap-2.5 bg-slate-900 border border-slate-800 rounded-lg p-1.5 pl-2.5 pr-2">
  <div class="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 
              flex items-center justify-center text-emerald-400 text-xs font-bold uppercase shrink-0">
    U
  </div>
  <div class="flex flex-col text-left">
    <span class="text-xs font-semibold text-slate-200 leading-tight">Umang Kavaiya</span>
    <span class="text-[10px] text-slate-400 leading-tight truncate max-w-[150px]">user@domain.com</span>
  </div>
  <button class="ml-1 min-h-[32px] min-w-[32px] flex items-center justify-center 
                 rounded-md hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors">
    <LogOutIcon class="h-3.5 w-3.5" />
  </button>
</div>
```

### 5.3 IPO Explorer Card Anatomy
1. **Header Row:**
   * Left: Company Name (Truncated with full title tooltip) + Exchange Symbol.
   * Right: Category Badge (`Mainboard` in Emerald, `NSE SME` in Purple, `BSE SME` in Cyan) + Status Badge.
2. **Metrics Grid ($2 \times 2$):**
   * Top-Left: Issue Price Band (`₹185 - ₹197`).
   * Top-Right: Lot Size & Min Investment (`75 Shares (₹14,775)`).
   * Bottom-Left: Bidding Window (`Open: 12-Oct / Close: 15-Oct`).
   * Bottom-Right: Grey Market Premium (`+₹35 (+17.7%)` with green highlight).
3. **Footer Actions:**
   * Watchlist Star Toggle (Left) + Split Calculator Shortcut (Right).

### 5.4 Form Inputs
```html
<input class="w-full min-h-[44px] bg-slate-900 border border-slate-800 focus:border-emerald-500/50 
              focus:ring-1 focus:ring-emerald-500/30 rounded-lg px-3 text-xs text-white 
              placeholder-slate-500 transition-all outline-none" />
```

---

## 6. Accessibility & Responsiveness

* **Responsive Breakpoints:**
  * Mobile ($< 640\text{ px}$): 1-column cards, scrollable horizontal navigation bar with `no-scrollbar` utility.
  * Tablet ($640\text{ px} - 1024\text{ px}$): 2-column cards, expanded navigation.
  * Desktop ($> 1024\text{ px}$): 3-column cards, sidebar-assisted split calculators.
* **Focus States:** Every interactive button and input features visible, high-contrast focus rings (`focus:ring-2 focus:ring-emerald-500/40`).
* **Motion & Animations:** Micro-interactions use subtle active compression (`active:scale-95`) with smooth transitions (`transition-all duration-150`).
