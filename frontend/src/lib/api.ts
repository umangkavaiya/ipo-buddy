const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5074/api";

export interface IpoItem {
  id: string;
  companyName: string;
  symbol: string | null;
  exchange: string;
  category: "Mainboard" | "Sme";
  status: "Upcoming" | "Open" | "Closed" | "Listed";
  issuePriceLow: number | null;
  issuePriceHigh: number | null;
  lotSize: number;
  minInvestment: number | null;
  openDate: string | null;
  closeDate: string | null;
  allotmentDate: string | null;
  listingDate: string | null;
  listingPrice: number | null;
  listingGainPct: number | null;
  gmp: number | null;
  subscriptionDataJson: string;
  registrarName: string;
  registrarUrl: string;
}

export interface UserProfile {
  id: string;
  phone: string | null;
  email: string;
  displayName: string;
  subscriptionTier: string;
}

export interface GroupItem {
  id: string;
  name: string;
  inviteCode: string;
  maxMembers: number;
  memberCount: number;
  createdAt: string;
}

export interface GroupMemberItem {
  userId: string;
  displayName: string;
  phone: string | null;
  email?: string;
  role: string;
}

export interface GroupDetail {
  id: string;
  name: string;
  inviteCode: string;
  maxMembers: number;
  members: GroupMemberItem[];
  watchlistIpoIds: string[];
}

export interface SplitEntryItem {
  entryId: string;
  userId: string;
  displayName: string;
  amount: number;
  isSettled: boolean;
  settledAt: string | null;
}

export interface SplitItem {
  id: string;
  groupId: string;
  description: string;
  totalAmount: number;
  status: "Pending" | "Settled";
  createdByName: string;
  createdAt: string;
  entries: SplitEntryItem[];
}

export interface NetBalanceItem {
  userId: string;
  displayName: string;
  netAmount: number;
}

export interface TaxCalculationResult {
  grossGain: number;
  stcgTaxRatePct: number;
  taxPayable: number;
  netAfterTax: number;
}

let clerkTokenGetter: (() => Promise<string | null>) | null = null;

export function setClerkTokenGetter(getter: (() => Promise<string | null>) | null) {
  clerkTokenGetter = getter;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  if (clerkTokenGetter) {
    try {
      const token = await clerkTokenGetter();
      if (token) return { Authorization: `Bearer ${token}` };
    } catch {
      // Fallback
    }
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ipobuddy_token");
    if (token) return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export const api = {
  // Public IPOs
  async getIpos(params?: { status?: string; category?: string; search?: string }): Promise<IpoItem[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.category) query.append("category", params.category);
    if (params?.search) query.append("search", params.search);

    const res = await fetch(`${API_BASE_URL}/ipos?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch IPOs");
    return res.json();
  },

  async getIpo(id: string): Promise<IpoItem> {
    const res = await fetch(`${API_BASE_URL}/ipos/${id}`);
    if (!res.ok) throw new Error("Failed to fetch IPO details");
    return res.json();
  },

  async syncIpos(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/sync-ipos`, { method: "POST" });
    return res.json();
  },

  // Auth
  async requestOtp(phone: string): Promise<{ status: string; message: string; mock_otp?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    return res.json();
  },

  async verifyOtp(phone: string, otp: string): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Invalid OTP");
    }
    return res.json();
  },

  async getProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/profile`, {
      headers: { ...(await getAuthHeader()) },
    });
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  },

  // Watchlist
  async getWatchlist(): Promise<IpoItem[]> {
    const res = await fetch(`${API_BASE_URL}/watchlist`, {
      headers: { ...(await getAuthHeader()) },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async addToWatchlist(ipoId: string): Promise<void> {
    await fetch(`${API_BASE_URL}/watchlist/${ipoId}`, {
      method: "POST",
      headers: { ...(await getAuthHeader()) },
    });
  },

  async removeFromWatchlist(ipoId: string): Promise<void> {
    await fetch(`${API_BASE_URL}/watchlist/${ipoId}`, {
      method: "DELETE",
      headers: { ...(await getAuthHeader()) },
    });
  },

  // Groups
  async getGroups(): Promise<GroupItem[]> {
    const res = await fetch(`${API_BASE_URL}/groups`, {
      headers: { ...(await getAuthHeader()) },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getGroup(id: string): Promise<GroupDetail> {
    const res = await fetch(`${API_BASE_URL}/groups/${id}`, {
      headers: { ...(await getAuthHeader()) },
    });
    if (!res.ok) throw new Error("Failed to fetch group");
    return res.json();
  },

  async createGroup(name: string): Promise<GroupItem> {
    const res = await fetch(`${API_BASE_URL}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await getAuthHeader()) },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to create group");
    return res.json();
  },

  async joinGroup(inviteCode: string): Promise<GroupItem> {
    const res = await fetch(`${API_BASE_URL}/groups/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await getAuthHeader()) },
      body: JSON.stringify({ inviteCode }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to join group");
    }
    return res.json();
  },

  // Splits
  async getSplits(groupId: string): Promise<SplitItem[]> {
    const res = await fetch(`${API_BASE_URL}/groups/${groupId}/splits`, {
      headers: { ...(await getAuthHeader()) },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createSplit(groupId: string, description: string, totalAmount: number): Promise<SplitItem> {
    const res = await fetch(`${API_BASE_URL}/groups/${groupId}/splits`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await getAuthHeader()) },
      body: JSON.stringify({ description, totalAmount }),
    });
    if (!res.ok) throw new Error("Failed to create split");
    return res.json();
  },

  async toggleSettle(splitId: string, entryId: string): Promise<{ isSettled: boolean; splitStatus: string }> {
    const res = await fetch(`${API_BASE_URL}/splits/${splitId}/settle/${entryId}`, {
      method: "POST",
      headers: { ...(await getAuthHeader()) },
    });
    if (!res.ok) throw new Error("Failed to toggle settlement");
    return res.json();
  },

  async getBalances(): Promise<NetBalanceItem[]> {
    const res = await fetch(`${API_BASE_URL}/splits/balances`, {
      headers: { ...(await getAuthHeader()) },
    });
    if (!res.ok) return [];
    return res.json();
  },

  // Tax Calculator
  async calculateTax(gainAmount: number): Promise<TaxCalculationResult> {
    const res = await fetch(`${API_BASE_URL}/tools/tax-calculator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gainAmount }),
    });
    if (!res.ok) throw new Error("Calculation failed");
    return res.json();
  },
};
