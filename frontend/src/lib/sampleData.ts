import { IpoItem } from "./api";

export interface DematAccount {
  id: string;
  broker: "Zerodha" | "Upstox" | "AngelOne" | "Groww" | "ICICIDirect";
  holderName: string;
  clientId: string;
  panMasked: string;
  allocatedBalance: number;
  poolPercentage: number;
  status: "Active" | "Pending" | "Suspended";
  upiId: string;
}

export interface AllocationRecord {
  id: string;
  ipoName: string;
  symbol: string;
  sector: string;
  appliedDate: string;
  amountBlocked: number;
  accountsCount: number;
  lotsApplied: number;
  lotsAllotted: number;
  status: "Allocated" | "Not Allocated" | "Pending";
  listingGainPct?: number;
  profitRealized?: number;
}

export interface ActivityNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  group: "Today" | "Yesterday" | "Earlier";
  type: "mandate" | "allotment" | "bidding" | "rebalance" | "split";
  read: boolean;
  actionText?: string;
  actionHref?: string;
  statusBadge?: string;
  statusBadgeType?: "success" | "warning" | "error" | "neutral";
}

export const SAMPLE_IPOS: IpoItem[] = [
  {
    id: "technova-2026",
    companyName: "TechNova Solutions Ltd",
    symbol: "TECHNOVA",
    exchange: "NSE/BSE",
    category: "Mainboard",
    status: "Open",
    issuePriceLow: 500,
    issuePriceHigh: 510,
    lotSize: 30,
    minInvestment: 15300,
    openDate: "2026-10-14",
    closeDate: "2026-10-16",
    allotmentDate: "2026-10-17",
    listingDate: "2026-10-21",
    listingPrice: null,
    listingGainPct: null,
    gmp: 185,
    subscriptionDataJson: JSON.stringify({ qib: 14.8, nii: 8.4, retail: 5.2, total: 9.8 }),
    registrarName: "Link Intime India",
    registrarUrl: "https://linkintime.co.in/initial_offer/public-issues.html",
  },
  {
    id: "brainbeats-sme",
    companyName: "Brainbeats Infotech Ltd",
    symbol: "BRAINBEATS",
    exchange: "NSE SME",
    category: "Sme",
    status: "Open",
    issuePriceLow: 120,
    issuePriceHigh: 125,
    lotSize: 1000,
    minInvestment: 125000,
    openDate: "2026-10-13",
    closeDate: "2026-10-15",
    allotmentDate: "2026-10-16",
    listingDate: "2026-10-20",
    listingPrice: null,
    listingGainPct: null,
    gmp: 68,
    subscriptionDataJson: JSON.stringify({ qib: 22.1, nii: 34.6, retail: 18.9, total: 24.3 }),
    registrarName: "Bigshare Services",
    registrarUrl: "https://ipo.bigshareonline.com/IPO_Status.html",
  },
  {
    id: "aura-intel",
    companyName: "Aura Intelligence Ltd",
    symbol: "AURAINT",
    exchange: "NSE/BSE",
    category: "Mainboard",
    status: "Upcoming",
    issuePriceLow: 740,
    issuePriceHigh: 760,
    lotSize: 20,
    minInvestment: 15200,
    openDate: "2026-10-22",
    closeDate: "2026-10-24",
    allotmentDate: "2026-10-25",
    listingDate: "2026-10-29",
    listingPrice: null,
    listingGainPct: null,
    gmp: 240,
    subscriptionDataJson: JSON.stringify({ qib: 0, nii: 0, retail: 0, total: 0 }),
    registrarName: "KFin Technologies",
    registrarUrl: "https://kosmic.kfintech.com/ipostatus/",
  },
  {
    id: "nexus-energy",
    companyName: "Nexus Clean Energy Ltd",
    symbol: "NEXUSEN",
    exchange: "BSE",
    category: "Mainboard",
    status: "Closed",
    issuePriceLow: 210,
    issuePriceHigh: 220,
    lotSize: 68,
    minInvestment: 14960,
    openDate: "2026-10-06",
    closeDate: "2026-10-09",
    allotmentDate: "2026-10-10",
    listingDate: "2026-10-14",
    listingPrice: 310,
    listingGainPct: 40.9,
    gmp: 90,
    subscriptionDataJson: JSON.stringify({ qib: 42.5, nii: 28.1, retail: 15.4, total: 27.2 }),
    registrarName: "Link Intime India",
    registrarUrl: "https://linkintime.co.in/initial_offer/public-issues.html",
  },
];

export const SAMPLE_ACCOUNTS: DematAccount[] = [
  {
    id: "acc-1",
    broker: "Zerodha",
    holderName: "Aarav Sharma",
    clientId: "ZER12345",
    panMasked: "ABCDE1234F",
    allocatedBalance: 4166666,
    poolPercentage: 33,
    status: "Active",
    upiId: "aarav@okhdfcbank",
  },
  {
    id: "acc-2",
    broker: "Upstox",
    holderName: "Aarav Sharma",
    clientId: "UPS98765",
    panMasked: "ABCDE1234F",
    allocatedBalance: 4166667,
    poolPercentage: 33,
    status: "Active",
    upiId: "aarav@oksbi",
  },
  {
    id: "acc-3",
    broker: "AngelOne",
    holderName: "Pooja Sharma",
    clientId: "ANG55432",
    panMasked: "FGHIJ5678K",
    allocatedBalance: 2500000,
    poolPercentage: 20,
    status: "Active",
    upiId: "pooja@okaxis",
  },
  {
    id: "acc-4",
    broker: "Groww",
    holderName: "Vikram Sharma",
    clientId: "GRW77890",
    panMasked: "KLMNO9012P",
    allocatedBalance: 1666667,
    poolPercentage: 14,
    status: "Active",
    upiId: "vikram@icici",
  },
];

export const SAMPLE_ALLOCATIONS: AllocationRecord[] = [
  {
    id: "alloc-1",
    ipoName: "TechNova Solutions Ltd",
    symbol: "TECHNOVA",
    sector: "Technology • SaaS",
    appliedDate: "Oct 14, 2026",
    amountBlocked: 45900,
    accountsCount: 3,
    lotsApplied: 3,
    lotsAllotted: 0,
    status: "Pending",
  },
  {
    id: "alloc-2",
    ipoName: "Nexus Clean Energy Ltd",
    symbol: "NEXUSEN",
    sector: "Clean Energy & Utilities",
    appliedDate: "Oct 08, 2026",
    amountBlocked: 44880,
    accountsCount: 3,
    lotsApplied: 3,
    lotsAllotted: 1,
    status: "Allocated",
    listingGainPct: 40.9,
    profitRealized: 6120,
  },
  {
    id: "alloc-3",
    ipoName: "Vanguard BioSciences Ltd",
    symbol: "VANGBIO",
    sector: "Healthcare & Pharma",
    appliedDate: "Sep 28, 2026",
    amountBlocked: 30400,
    accountsCount: 2,
    lotsApplied: 2,
    lotsAllotted: 0,
    status: "Not Allocated",
  },
  {
    id: "alloc-4",
    ipoName: "Quantum Data Systems Ltd",
    symbol: "QDATA",
    sector: "Enterprise Cloud Infra",
    appliedDate: "Sep 15, 2026",
    amountBlocked: 61200,
    accountsCount: 4,
    lotsApplied: 4,
    lotsAllotted: 2,
    status: "Allocated",
    listingGainPct: 62.5,
    profitRealized: 19125,
  },
];

export const SAMPLE_NOTIFICATIONS: ActivityNotification[] = [
  {
    id: "notif-1",
    title: "Allotment Finalized: TechNova Solutions",
    description: "Registrar Link Intime has released the basis of allotment. Check your PAN allocations across linked accounts.",
    timestamp: "10 mins ago",
    group: "Today",
    type: "allotment",
    read: false,
    actionText: "Check Allotment",
    actionHref: "/analytics",
    statusBadge: "Finalized",
    statusBadgeType: "success",
  },
  {
    id: "notif-2",
    title: "UPI Mandate Released: Vanguard BioSciences",
    description: "Unblocking request of ₹30,400 successfully processed back to primary HDFC bank wallet.",
    timestamp: "2 hours ago",
    group: "Today",
    type: "mandate",
    read: false,
    statusBadge: "Funds Released",
    statusBadgeType: "neutral",
  },
  {
    id: "notif-3",
    title: "Auto-Balance Completed",
    description: "Unallocated capital of ₹1,25,00,000 has been evenly balanced across 4 active Demat accounts.",
    timestamp: "Yesterday, 4:30 PM",
    group: "Yesterday",
    type: "rebalance",
    read: true,
    actionText: "View Accounts",
    actionHref: "/accounts",
    statusBadge: "Rebalanced",
    statusBadgeType: "success",
  },
  {
    id: "notif-4",
    title: "New IPO Open for Bidding: Brainbeats Infotech",
    description: "NSE SME issue open with GMP of ₹68 (+54.4%). Retail cutoff price is ₹125 with lot size of 1,000.",
    timestamp: "2 days ago",
    group: "Earlier",
    type: "bidding",
    read: true,
    actionText: "Deploy Lots",
    actionHref: "/apply?id=brainbeats-sme",
    statusBadge: "Open",
    statusBadgeType: "warning",
  },
  {
    id: "notif-5",
    title: "Syndicate Profit Split Settled",
    description: "Nexus Clean Energy listing gains of ₹6,120 distributed with zero penny drift across 3 syndicate members.",
    timestamp: "3 days ago",
    group: "Earlier",
    type: "split",
    read: true,
    actionText: "View Ledger",
    actionHref: "/analytics",
    statusBadge: "Settled",
    statusBadgeType: "success",
  },
];
