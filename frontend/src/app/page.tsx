"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Search,
  Star,
  Users,
  Calculator,
  RefreshCw,
  ExternalLink,
  Plus,
  UserPlus,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  LogOut,
  Percent,
  Shield,
  PieChart,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  api,
  IpoItem,
  GroupItem,
  GroupDetail,
  SplitItem,
  NetBalanceItem,
  TaxCalculationResult,
} from "@/lib/api";

export default function Home() {
  const { user, login, logout } = useAuth();

  // Active Navigation Tab for App Workspace
  const [activeTab, setActiveTab] = useState<"ipos" | "watchlist" | "groups" | "splits" | "tax">("ipos");

  // IPO State
  const [ipos, setIpos] = useState<IpoItem[]>([]);
  const [watchlist, setWatchlist] = useState<IpoItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loadingIpos, setLoadingIpos] = useState<boolean>(true);
  const [syncingIpos, setSyncingIpos] = useState<boolean>(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // Group State
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null);
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [joinCode, setJoinCode] = useState<string>("");

  // Split State
  const [splits, setSplits] = useState<SplitItem[]>([]);
  const [balances, setBalances] = useState<NetBalanceItem[]>([]);
  const [splitDesc, setSplitDesc] = useState<string>("");
  const [splitAmount, setSplitAmount] = useState<string>("");

  // Tax State
  const [taxGain, setTaxGain] = useState<string>("15000");
  const [taxResult, setTaxResult] = useState<TaxCalculationResult | null>(null);

  // Interactive Demo Calculator Constants for Landing Showcase
  const demoPool = 150000;
  const demoCutOffPrice = 500;
  const demoListingPrice = 920;

  // Load Initial IPOs
  const fetchIpos = async () => {
    try {
      setLoadingIpos(true);
      const data = await api.getIpos({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        search: searchQuery || undefined,
      });
      setIpos(data);
    } catch {
      // Backend may be starting up
    } finally {
      setLoadingIpos(false);
    }
  };

  const fetchWatchlist = async () => {
    if (!user) return;
    try {
      const data = await api.getWatchlist();
      setWatchlist(data);
    } catch {}
  };

  const fetchGroups = async () => {
    if (!user) return;
    try {
      const data = await api.getGroups();
      setGroups(data);
      if (data.length > 0 && !selectedGroup) {
        loadGroupDetail(data[0].id);
      }
    } catch {}
  };

  const loadGroupDetail = async (id: string) => {
    try {
      const detail = await api.getGroup(id);
      setSelectedGroup(detail);
      const splitList = await api.getSplits(id);
      setSplits(splitList);
    } catch {}
  };

  const fetchBalances = async () => {
    if (!user) return;
    try {
      const b = await api.getBalances();
      setBalances(b);
    } catch {}
  };

  useEffect(() => {
    fetchIpos();
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    if (user) {
      fetchWatchlist();
      fetchGroups();
      fetchBalances();
    }
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIpos();
  };

  const handleSync = async () => {
    try {
      setSyncingIpos(true);
      setSyncMsg(null);
      const res = await api.syncIpos();
      setSyncMsg(res.message);
      await fetchIpos();
    } catch {
      setSyncMsg("Sync failed. Check backend connection.");
    } finally {
      setSyncingIpos(false);
      setTimeout(() => setSyncMsg(null), 5000);
    }
  };

  const handleWatchlistToggle = async (ipoId: string) => {
    if (!user) {
      login();
      return;
    }
    const isWatched = watchlist.some((w) => w.id === ipoId);
    if (isWatched) {
      await api.removeFromWatchlist(ipoId);
    } else {
      await api.addToWatchlist(ipoId);
    }
    await fetchWatchlist();
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const g = await api.createGroup(newGroupName.trim());
      setNewGroupName("");
      await fetchGroups();
      await loadGroupDetail(g.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error creating group");
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      const g = await api.joinGroup(joinCode.trim());
      setJoinCode("");
      await fetchGroups();
      await loadGroupDetail(g.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Invalid invite code");
    }
  };

  const handleCreateSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    const amt = parseFloat(splitAmount);
    if (isNaN(amt) || amt <= 0 || !splitDesc.trim()) return;

    try {
      await api.createSplit(selectedGroup.id, splitDesc.trim(), amt);
      setSplitDesc("");
      setSplitAmount("");
      await loadGroupDetail(selectedGroup.id);
      await fetchBalances();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create split");
    }
  };

  const handleToggleSettle = async (splitId: string, entryId: string) => {
    if (!selectedGroup) return;
    try {
      await api.toggleSettle(splitId, entryId);
      await loadGroupDetail(selectedGroup.id);
      await fetchBalances();
    } catch {}
  };

  const handleCalculateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    const gain = parseFloat(taxGain);
    if (isNaN(gain)) return;
    try {
      const res = await api.calculateTax(gain);
      setTaxResult(res);
    } catch {}
  };

  useEffect(() => {
    api.calculateTax(15000).then(setTaxResult).catch(() => {});
  }, []);

  // Demo Calculator Computed Figures
  const demoLotShares = 30;
  const demoBlockedCapital = demoLotShares * demoCutOffPrice; // ₹15,000
  const demoRefundCapital = Math.max(0, demoPool - demoBlockedCapital); // ₹1,35,000
  const demoListingGainPerShare = Math.max(0, demoListingPrice - demoCutOffPrice); // ₹420
  const demoTotalListingGain = demoLotShares * demoListingGainPerShare; // ₹12,600
  const demoGainPct = ((demoListingPrice - demoCutOffPrice) / demoCutOffPrice) * 100;

  // Scroll Helper
  const scrollToSection = (id: string, tabName?: typeof activeTab) => {
    if (tabName) setActiveTab(tabName);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full bg-slate-950 text-slate-100 min-h-screen">
      {/* ── 1. STICKY TOP APP BAR / NAVIGATION ──────────────── */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2.5 group"
          >
            <div className="h-9 w-9 rounded-lg bg-slate-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/10 group-hover:scale-105 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                IPO Buddy
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 -mt-1">
                Syndicate Hub
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium">
            <button
              onClick={() => scrollToSection("live-ipos", "ipos")}
              className="text-slate-300 hover:text-emerald-400 transition-colors"
            >
              Live IPOs
            </button>
            <button
              onClick={() => scrollToSection("live-ipos", "ipos")}
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              GMP Tracker
            </button>
            <button
              onClick={() => scrollToSection("syndicate-calculator", "splits")}
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Syndicate Tools
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              How It Works
            </button>
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncingIpos}
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              title="Sync real-time IPO and GMP feeds from public portals"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncingIpos ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">{syncingIpos ? "Syncing..." : "Sync Feeds"}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1 pl-2.5 pr-1.5">
                <div className="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold uppercase shrink-0">
                  {(user.displayName?.startsWith("user_")
                    ? (user.email ? user.email.charAt(0) : "I")
                    : (user.displayName?.charAt(0) || "I")
                  ).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.displayName?.startsWith("user_")
                      ? (user.email && !user.email.endsWith("@clerk.user") ? user.email.split("@")[0] : "Investor")
                      : (user.displayName || "Investor")}
                  </span>
                  {user.email && !user.email.endsWith("@clerk.user") && (
                    <span className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">
                      {user.email}
                    </span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-md hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Log out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>Investor Sign In</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sync Notification Banner */}
      {syncMsg && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3 bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{syncMsg}</span>
          </div>
        </div>
      )}

      {/* ── 2. HERO SECTION & MARKET PULSE PREVIEW ──────────── */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 border-b border-slate-900 bg-gradient-to-b from-slate-950 via-slate-900/40 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Copy & Dual CTAs */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Live Indicator Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
                  Live Mainboard &amp; SME Tracking • FY 2024-25
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Master Indian IPOs with Multi-Account{" "}
                <span className="text-emerald-400 underline decoration-emerald-500/50 decoration-2 underline-offset-4">
                  Syndicate Precision
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
                Track live GMP and subscription rates across NSE/BSE, centralize family PAN applications, and split syndicate gains with zero rounding loss. Built specifically for serious Indian retail investor clusters.
              </p>

              {/* Dual CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => scrollToSection("live-ipos", "ipos")}
                  className="min-h-[46px] px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all duration-150 shadow-lg shadow-emerald-600/20 flex items-center gap-2 active:scale-95"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Explore Live IPOs</span>
                </button>

                <button
                  onClick={() => scrollToSection("syndicate-calculator", "splits")}
                  className="min-h-[46px] px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition-all duration-150 flex items-center gap-2 active:scale-95"
                >
                  <Calculator className="h-4 w-4 text-emerald-400" />
                  <span>Try Split Calculator</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-900">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-slate-400 font-medium">100% Free Retail Tier</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <PieChart className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-slate-400 font-medium">SEBI Remainder Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-slate-400 font-medium">Bank-Grade Precision</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Lock className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-slate-400 font-medium">Zero Demat Logins</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Market Pulse Preview Cards */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl relative backdrop-blur-sm">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-sm font-bold text-white">Live Market Pulse</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded">
                    NSE / BSE Verified
                  </span>
                </div>

                <div className="flex flex-col gap-3.5 pt-3.5">
                  {/* Card 1 */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {ipos[0]?.companyName || "Tata Technologies"}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {ipos[0]?.gmp ? `+₹${ipos[0].gmp} GMP` : "+84% (₹420 GMP)"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {ipos[0]?.category || "Mainboard"} • {ipos[0]?.symbol || "TATATECH"}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-1 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20">
                        {ipos[0]?.status || "Open - Closes Soon"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 my-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase">Price Band</span>
                        <span className="font-semibold text-slate-200 font-mono">
                          {ipos[0]?.issuePriceHigh ? `₹${ipos[0].issuePriceHigh}` : "₹475 - ₹500"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase">Lot Size</span>
                        <span className="font-semibold text-slate-200 font-mono">
                          {ipos[0]?.lotSize ? `${ipos[0].lotSize} shares` : "30 shares"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase">Subscription</span>
                        <span className="font-bold text-emerald-400 font-mono">69.4x Total</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>QIB: 203x | NII: 62x | Retail: 16.5x</span>
                        <span className="text-emerald-400 font-semibold">Overbooked</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: "88%" }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {ipos[1]?.companyName || "Bajaj Housing Finance"}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {ipos[1]?.gmp ? `+₹${ipos[1].gmp} GMP` : "+114% (₹80 GMP)"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {ipos[1]?.category || "Mainboard"} • {ipos[1]?.symbol || "BAJAJHFL"}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-1 bg-amber-500/10 text-amber-300 rounded border border-amber-500/20">
                        {ipos[1]?.status || "Open - Day 2"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 my-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase">Price Band</span>
                        <span className="font-semibold text-slate-200 font-mono">
                          {ipos[1]?.issuePriceHigh ? `₹${ipos[1].issuePriceHigh}` : "₹66 - ₹70"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase">Lot Size</span>
                        <span className="font-semibold text-slate-200 font-mono">
                          {ipos[1]?.lotSize ? `${ipos[1].lotSize} shares` : "214 shares"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase">Subscription</span>
                        <span className="font-bold text-emerald-400 font-mono">63.6x Total</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>QIB: 111x | NII: 41x | Retail: 7.0x</span>
                        <span className="text-emerald-400 font-semibold">High Demand</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: "75%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <RefreshCw className="h-3 w-3 text-emerald-400" />
                    <span>Real-time scrapers active</span>
                  </span>
                  <button
                    onClick={() => scrollToSection("live-ipos", "ipos")}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center gap-1"
                  >
                    <span>View all {ipos.length > 0 ? ipos.length : 8} active</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. CORE PLATFORM CAPABILITIES GRID ──────────────── */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="features">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[11px] uppercase font-bold tracking-widest text-emerald-400 block mb-2">
            Institutional-Grade Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Engineered for Allotment Odds &amp; Syndicate Discipline
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Eliminate messy spreadsheets, missed UPI mandate deadlines, and awkward profit math. Everything required to syndicate retail applications transparently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Feature 1 */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Multi-PAN Demat Hub</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pool verified accounts across family members (Self, Spouse, Parents, HUF) to maximize lottery odds without juggling multiple brokerage passwords.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Quota Support</span>
              <span className="font-semibold text-slate-300">Retail / sHNI / bHNI</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Real-Time GMP &amp; Sub Scraper</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Continuous live tracking of grey market premiums, Kostak rates, subject-to-sauda quotes, and institutional bidding figures across NSE/BSE.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Sync Speed</span>
              <span className="font-semibold text-emerald-400">Live Scrapers</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Calculator className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Syndicate Split Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exact integer share allocation and fair remainder distribution algorithms. Ensures every rupee and allotted share is settled without penny loss.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Precision</span>
              <span className="font-semibold text-slate-300">Hare-Niemeyer Algorithm</span>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Unified Allotment Checker</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instant one-click multi-PAN status checks across all premier registrars (Link Intime, KFintech, Bigshare) right as midnight batches drop.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Registrars</span>
              <span className="font-semibold text-slate-300">All Major Portals</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. INTERACTIVE SYNDICATE SPLIT DEMO SECTION ─────── */}
      <section className="py-16 md:py-20 bg-slate-900/40 border-y border-slate-800/80" id="syndicate-calculator">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-8">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-widest text-emerald-400 block mb-1">
                Deterministic Settlement Engine
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Fair Share &amp; Gain Distribution Matrix
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                See how our mathematical engine splits capital, blocked IPO application funds, and listing pops transparently between 3 syndicate partners with zero penny loss.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                Algorithm: Largest Remainder (Hare-Niemeyer)
              </span>
            </div>
          </div>

          {/* Interactive Mockup Container */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            {/* Banner Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-950 border-b border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                  Total Pooled Capital
                </span>
                <span className="text-lg md:text-xl font-bold font-mono text-white">
                  ₹{demoPool.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-slate-500 block">3 Active Syndicate Partners</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                  IPO Allotment Result
                </span>
                <span className="text-lg md:text-xl font-bold font-mono text-emerald-400">
                  1 Lot ({demoLotShares} Shares)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Blocked: ₹{demoBlockedCapital.toLocaleString("en-IN")} (@ ₹{demoCutOffPrice})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                  Listing Day Pop
                </span>
                <span className="text-lg md:text-xl font-bold font-mono text-emerald-400">
                  +₹{demoTotalListingGain.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  +{demoGainPct.toFixed(0)}% Pop (₹{demoListingPrice}/share)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                  Unallocated Cash Refund
                </span>
                <span className="text-lg md:text-xl font-bold font-mono text-slate-200">
                  ₹{demoRefundCapital.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-slate-500 block">Direct Bank Unblock</span>
              </div>
            </div>

            {/* Split Distribution Table */}
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    <th className="py-3 px-4">Participant</th>
                    <th className="py-3 px-4">Contribution</th>
                    <th className="py-3 px-4">Pool %</th>
                    <th className="py-3 px-4">Shares Allocated</th>
                    <th className="py-3 px-4">Unallocated Cash Refund</th>
                    <th className="py-3 px-4 text-right">Net Profit (+{demoGainPct.toFixed(0)}%)</th>
                    <th className="py-3 px-4 text-right">Total Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {/* Priya: 40% */}
                  <tr className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-semibold text-white flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold">
                        P
                      </span>
                      <span>Priya Sharma</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      ₹{(demoPool * 0.4).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        40.00%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">12 shares</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      ₹{(demoRefundCapital * 0.4).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      +₹{(demoTotalListingGain * 0.4).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      ₹{((demoRefundCapital * 0.4) + (12 * demoListingPrice)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Rahul: 35% */}
                  <tr className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-semibold text-white flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">
                        R
                      </span>
                      <span>Rahul Verma</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      ₹{(demoPool * 0.35).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        35.00%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">11 shares</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      ₹{(demoRefundCapital * 0.35).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      +₹{(demoTotalListingGain * 0.35).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      ₹{((demoRefundCapital * 0.35) + (11 * demoListingPrice)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Amit: 25% */}
                  <tr className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-semibold text-white flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-xs font-bold">
                        A
                      </span>
                      <span>Amit Patel</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      ₹{(demoPool * 0.25).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        25.00%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">7 shares</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      ₹{(demoRefundCapital * 0.25).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      +₹{(demoTotalListingGain * 0.25).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      ₹{((demoRefundCapital * 0.25) + (7 * demoListingPrice)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-950 font-semibold text-xs border-t-2 border-slate-800 text-slate-200">
                    <td className="py-3 px-4 font-sans font-bold text-white">Total Syndicate Pool</td>
                    <td className="py-3 px-4 font-mono font-bold">
                      ₹{demoPool.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 font-mono">100.00%</td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                      {demoLotShares} shares (Exact)
                    </td>
                    <td className="py-3 px-4 font-mono">
                      ₹{demoRefundCapital.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                      +₹{demoTotalListingGain.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-white font-bold">
                      ₹{(demoRefundCapital + (demoLotShares * demoListingPrice)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Reconciled with zero remainder friction. Ready for WhatsApp or Excel export.</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => scrollToSection("workspace", "splits")}
                  className="min-h-[38px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Live Syndicate Split</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. HOW IT WORKS (3-STEP SYNDICATE WORKFLOW) ─────── */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="how-it-works">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[11px] uppercase font-bold tracking-widest text-emerald-400 block mb-1">
            Simplicity First
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Three Simple Steps to Syndicate Discipline
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            No password sharing. No complicated broker integrations. Just transparent, proportional coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-2xl font-black text-emerald-500 font-mono mb-4">01</div>
              <h3 className="text-sm font-bold text-white mb-2">Add Investor Profiles</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Securely organize family PANs, Demat DP IDs, and UPI handles without storing sensitive brokerage login passwords.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
              Privacy First • Local Encryption
            </div>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-2xl font-black text-emerald-500 font-mono mb-4">02</div>
              <h3 className="text-sm font-bold text-white mb-2">Pool &amp; Apply for IPOs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Coordinate syndicate capital, select lot quantities per family member, and trigger ASBA UPI payment mandates systematically across accounts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
              Max Retail Odds • Zero Duplicate PANs
            </div>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-2xl font-black text-emerald-500 font-mono mb-4">03</div>
              <h3 className="text-sm font-bold text-white mb-2">Instant Allotment &amp; Settlement</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Run one-click registrar status checks at midnight. The algorithm immediately generates fair profit and unallocated refund breakdown tables.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
              Zero Penny Rounding Loss
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. INVESTOR WORKSPACE (THE FUNCTIONAL PLATFORM) ─── */}
      <section className="py-12 border-t border-slate-900 bg-slate-950" id="workspace">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="live-ipos">
          {/* Section Heading & Workspace Navigation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-widest text-emerald-400 block mb-0.5">
                Investor Console
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">Active Platform Tools</h2>
            </div>

            {/* Workspace Navigation Tabs */}
            <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar" aria-label="Console Navigation">
              {[
                { id: "ipos", label: "IPO Explorer", icon: TrendingUp },
                { id: "watchlist", label: `Watchlist (${watchlist.length})`, icon: Star },
                { id: "groups", label: `Circles (${groups.length})`, icon: Users },
                { id: "splits", label: "Split Calculator", icon: Calculator },
                { id: "tax", label: "STCG Tax Tool", icon: Percent },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ── WORKSPACE TAB 1: IPO Explorer ────────────────── */}
          {activeTab === "ipos" && (
            <div className="py-6 flex flex-col gap-6">
              {/* Controls Bar */}
              <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
                {/* Status Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {[
                    { label: "All Status", value: "" },
                    { label: "Open", value: "Open" },
                    { label: "Upcoming", value: "Upcoming" },
                    { label: "Closed", value: "Closed" },
                    { label: "Listed", value: "Listed" },
                  ].map((pill) => (
                    <button
                      key={pill.value}
                      onClick={() => setStatusFilter(pill.value)}
                      className={`min-h-[38px] px-3.5 rounded-lg text-xs font-medium transition-colors ${
                        statusFilter === pill.value
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {/* Category Dropdown */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="min-h-[40px] bg-slate-900 border border-slate-800 rounded-lg px-3 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    aria-label="Category Filter"
                  >
                    <option value="">All Categories</option>
                    <option value="Mainboard">Mainboard</option>
                    <option value="Sme">SME</option>
                  </select>

                  {/* Search Form */}
                  <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
                    <input
                      type="text"
                      placeholder="Search company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="min-h-[40px] w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                  </form>
                </div>
              </div>

              {/* IPO Cards Grid */}
              {loadingIpos ? (
                <div className="py-20 text-center text-slate-500 text-xs">Loading live IPOs from database...</div>
              ) : ipos.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl p-8">
                  <TrendingUp className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No IPOs found</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Click &quot;Sync Feeds&quot; at the top to ingest real-time IPO listings and GMP directly from Groww and InvestorGain.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ipos.map((ipo) => {
                    const isStarred = watchlist.some((w) => w.id === ipo.id);
                    return (
                      <div
                        key={ipo.id}
                        className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-lg"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-medium">
                                  {ipo.category}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                    ipo.status === "Open"
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                      : ipo.status === "Upcoming"
                                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                      : ipo.status === "Listed"
                                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                      : "bg-slate-800 text-slate-400"
                                  }`}
                                >
                                  {ipo.status}
                                </span>
                              </div>
                              <h3 className="text-sm font-bold text-white mt-2 leading-tight">
                                {ipo.companyName}
                              </h3>
                              {ipo.symbol && (
                                <p className="text-xs text-slate-400 font-mono mt-0.5">{ipo.symbol}</p>
                              )}
                            </div>

                            <button
                              onClick={() => handleWatchlistToggle(ipo.id)}
                              className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-colors ${
                                isStarred
                                  ? "text-amber-400 hover:text-amber-300 bg-amber-500/10"
                                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                              }`}
                              aria-label="Star to watchlist"
                            >
                              <Star className={`h-4 w-4 ${isStarred ? "fill-current" : ""}`} />
                            </button>
                          </div>

                          {/* Pricing & Lot Size */}
                          <div className="grid grid-cols-2 gap-2 my-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/60 text-xs">
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">
                                Price Band
                              </span>
                              <span className="font-semibold text-slate-200 font-mono">
                                {ipo.issuePriceHigh
                                  ? `₹${ipo.issuePriceLow || ipo.issuePriceHigh} - ₹${ipo.issuePriceHigh}`
                                  : "TBA"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">
                                Lot Size
                              </span>
                              <span className="font-semibold text-slate-200 font-mono">
                                {ipo.lotSize} shares {ipo.minInvestment ? `(₹${ipo.minInvestment.toLocaleString("en-IN")})` : ""}
                              </span>
                            </div>
                          </div>

                          {/* Estimated GMP Badge */}
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-xs mb-3.5">
                            <span className="text-emerald-400/80 font-medium">Estimated GMP</span>
                            <span className="font-bold text-emerald-400 font-mono">
                              {ipo.gmp ? `+₹${ipo.gmp} / share` : "No GMP data yet"}
                            </span>
                          </div>
                        </div>

                        {/* Timeline & Actions */}
                        <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            <span>
                              {ipo.openDate ? `Closes ${ipo.closeDate || ipo.openDate}` : "Dates TBA"}
                            </span>
                          </div>

                          {ipo.registrarUrl ? (
                            <a
                              href={ipo.registrarUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="min-h-[36px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                            >
                              <span>Allotment Portal</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-slate-600 text-[11px]">Registrar portal</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── WORKSPACE TAB 2: Watchlist ───────────────────── */}
          {activeTab === "watchlist" && (
            <div className="py-6">
              {!user ? (
                <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl p-8">
                  <Star className="h-8 w-8 text-amber-500/60 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-200">Sign in to save IPOs</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Sign in with your mobile or email to star IPOs and keep track of vital bidding and allotment dates.
                  </p>
                  <button
                    onClick={login}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold min-h-[40px]"
                  >
                    Sign In Now
                  </button>
                </div>
              ) : watchlist.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl p-8">
                  <Star className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">Your watchlist is empty</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Browse the IPO Explorer and click the star icon to track upcoming issues.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {watchlist.map((ipo) => (
                    <div key={ipo.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-white">{ipo.companyName}</h3>
                        <button
                          onClick={() => handleWatchlistToggle(ipo.id)}
                          className="min-h-[36px] text-amber-400 p-1"
                        >
                          <Star className="h-4 w-4 fill-current" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Category: {ipo.category} • Status: {ipo.status}</p>
                      <div className="mt-3 text-xs font-semibold text-emerald-400 font-mono">
                        GMP: {ipo.gmp ? `+₹${ipo.gmp}` : "TBA"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── WORKSPACE TAB 3: Friend Circles ──────────────── */}
          {activeTab === "groups" && (
            <div className="py-6 flex flex-col gap-6">
              {!user ? (
                <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl p-8">
                  <Users className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-200">Sign in to create friend groups</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Form private circles with friends and family using 6-character invite codes.
                  </p>
                  <button
                    onClick={login}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold min-h-[40px]"
                  >
                    Sign In Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Create & Join */}
                  <div className="flex flex-col gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                        <Plus className="h-4 w-4 text-emerald-400" /> Create Private Circle
                      </h3>
                      <form onSubmit={handleCreateGroup} className="flex flex-col gap-3">
                        <input
                          type="text"
                          placeholder="e.g., Office Syndicate Circle"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="min-h-[42px] bg-slate-950 border border-slate-800 rounded-xl px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                          required
                        />
                        <button
                          type="submit"
                          className="min-h-[42px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors"
                        >
                          Generate Circle &amp; Invite Code
                        </button>
                      </form>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                        <UserPlus className="h-4 w-4 text-emerald-400" /> Join via Invite Code
                      </h3>
                      <form onSubmit={handleJoinGroup} className="flex flex-col gap-3">
                        <input
                          type="text"
                          placeholder="e.g., A8B3C1"
                          maxLength={8}
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                          className="min-h-[42px] bg-slate-950 border border-slate-800 rounded-xl px-3 text-xs font-mono text-center tracking-widest text-slate-200 focus:outline-none focus:border-emerald-500"
                          required
                        />
                        <button
                          type="submit"
                          className="min-h-[42px] bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors border border-slate-700"
                        >
                          Join Circle
                        </button>
                      </form>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">My Circles</h4>
                      {groups.length === 0 ? (
                        <p className="text-xs text-slate-500">You have not joined any circles yet.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {groups.map((g) => (
                            <button
                              key={g.id}
                              onClick={() => loadGroupDetail(g.id)}
                              className={`min-h-[48px] text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                                selectedGroup?.id === g.id
                                  ? "bg-emerald-950/40 border-emerald-500/40 text-white"
                                  : "bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-700"
                              }`}
                            >
                              <div>
                                <span className="font-semibold text-xs block">{g.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono">Code: {g.inviteCode}</span>
                              </div>
                              <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                                {g.memberCount} members
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Selected Group Detail */}
                  <div className="lg:col-span-2">
                    {selectedGroup ? (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                          <div>
                            <h2 className="text-base font-bold text-white">{selectedGroup.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400">Invite Code:</span>
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono font-bold text-xs select-all">
                                {selectedGroup.inviteCode}
                              </span>
                              <span className="text-xs text-slate-500">
                                ({selectedGroup.members.length} / {selectedGroup.maxMembers} members)
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab("splits")}
                            className="min-h-[40px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 self-start sm:self-auto"
                          >
                            <span>Open Split Calculator</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">
                            Circle Roster
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedGroup.members.map((m) => (
                              <div
                                key={m.userId}
                                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">
                                    {m.displayName[0]?.toUpperCase() || "U"}
                                  </div>
                                  <div>
                                    <span className="text-xs font-semibold text-white block">{m.displayName}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">****{m.phone}</span>
                                  </div>
                                </div>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                    m.role === "Admin" ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-400"
                                  }`}
                                >
                                  {m.role}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl p-8 text-slate-500 text-xs">
                        Select or create a circle on the left to view members.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── WORKSPACE TAB 4: Group Split Calculator ───────── */}
          {activeTab === "splits" && (
            <div className="py-6 flex flex-col gap-6">
              {!user ? (
                <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl p-8">
                  <Calculator className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-200">Sign in to calculate group splits</p>
                  <button
                    onClick={login}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold min-h-[40px]"
                  >
                    Sign In Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Form & Balances */}
                  <div className="flex flex-col gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                        Net Outstanding Balances
                      </h3>
                      {balances.length === 0 ? (
                        <p className="text-xs text-slate-500">All balances are completely settled!</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {balances.map((b) => (
                            <div
                              key={b.userId}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                            >
                              <span className="font-medium text-slate-300">{b.displayName}</span>
                              <span
                                className={`font-bold font-mono ${
                                  b.netAmount > 0 ? "text-emerald-400" : "text-rose-400"
                                }`}
                              >
                                {b.netAmount > 0
                                  ? `owes you ₹${b.netAmount.toLocaleString("en-IN")}`
                                  : `you owe ₹${Math.abs(b.netAmount).toLocaleString("en-IN")}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-white mb-2">Record Shared Gain / Expense</h3>
                      <p className="text-[11px] text-slate-400 mb-4">
                        The calculator divides the amount equally with 100% precision and zero remainder drift.
                      </p>

                      <form onSubmit={handleCreateSplit} className="flex flex-col gap-3">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Target Circle</label>
                          <select
                            value={selectedGroup?.id || ""}
                            onChange={(e) => loadGroupDetail(e.target.value)}
                            className="min-h-[42px] w-full bg-slate-950 border border-slate-800 rounded-xl px-3 text-xs text-slate-200"
                            required
                          >
                            {groups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name} ({g.memberCount} members)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Description</label>
                          <input
                            type="text"
                            placeholder="e.g., Tata Tech Listing Day Pop"
                            value={splitDesc}
                            onChange={(e) => setSplitDesc(e.target.value)}
                            className="min-h-[42px] w-full bg-slate-950 border border-slate-800 rounded-xl px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Total Amount (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="15000.00"
                            value={splitAmount}
                            onChange={(e) => setSplitAmount(e.target.value)}
                            className="min-h-[42px] w-full bg-slate-950 border border-slate-800 rounded-xl px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          className="min-h-[42px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors mt-2"
                        >
                          Calculate &amp; Record Split
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Right Column: Splits History */}
                  <div className="lg:col-span-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                        <div>
                          <h2 className="text-sm font-bold text-white">
                            {selectedGroup ? `${selectedGroup.name} Splits` : "Select a Circle"}
                          </h2>
                          <p className="text-xs text-slate-500">Track and toggle member settlement checks</p>
                        </div>
                      </div>

                      {splits.length === 0 ? (
                        <div className="py-16 text-center text-slate-500 text-xs">
                          No splits recorded in this circle yet. Use the form on the left to add one!
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {splits.map((s) => (
                            <div
                              key={s.id}
                              className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col gap-3"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-sm text-white">{s.description}</span>
                                  <span className="text-xs text-slate-500 block">
                                    Recorded by {s.createdByName} on {new Date(s.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-mono font-bold text-emerald-400">
                                    ₹{s.totalAmount.toLocaleString("en-IN")}
                                  </span>
                                  <span
                                    className={`text-[10px] block font-semibold ${
                                      s.status === "Settled" ? "text-emerald-500" : "text-amber-500"
                                    }`}
                                  >
                                    {s.status}
                                  </span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-900 flex flex-col gap-1.5">
                                {s.entries.map((entry) => (
                                  <div
                                    key={entry.entryId}
                                    className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-900/50 hover:bg-slate-900"
                                  >
                                    <span className="text-slate-300 font-medium">{entry.displayName}</span>
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono text-slate-200">
                                        ₹{entry.amount.toFixed(2)}
                                      </span>
                                      <button
                                        onClick={() => handleToggleSettle(s.id, entry.entryId)}
                                        className={`min-h-[30px] px-2.5 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-all ${
                                          entry.isSettled
                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                            : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                                        }`}
                                      >
                                        <CheckCircle2 className="h-3 w-3" />
                                        {entry.isSettled ? "Settled" : "Mark Settled"}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── WORKSPACE TAB 5: STCG Tax Tool ───────────────── */}
          {activeTab === "tax" && (
            <div className="py-6 max-w-2xl mx-auto w-full">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                    <Percent className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-bold text-white">Listing Gains Tax Estimator (STCG)</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Under the revised Union Budget 2024 tax framework, Short-Term Capital Gains (STCG) on equity shares under Section 111A is taxed at a flat **20.00%**.
                  </p>
                </div>

                <form onSubmit={handleCalculateTax} className="flex flex-col gap-3">
                  <label className="text-xs text-slate-400 font-medium">Total Listing Gain (₹)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="100"
                      value={taxGain}
                      onChange={(e) => setTaxGain(e.target.value)}
                      className="min-h-[44px] flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <button
                      type="submit"
                      className="min-h-[44px] px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors"
                    >
                      Recalculate
                    </button>
                  </div>
                </form>

                {taxResult && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono">
                    <div className="p-3 bg-slate-900/60 rounded-lg">
                      <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-sans">
                        Gross Gain
                      </span>
                      <span className="text-base font-bold text-slate-200 mt-1 block">
                        ₹{taxResult.grossGain.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-lg">
                      <span className="text-[10px] text-rose-400/80 block uppercase tracking-wider font-sans">
                        STCG Tax (20%)
                      </span>
                      <span className="text-base font-bold text-rose-400 mt-1 block">
                        ₹{taxResult.taxPayable.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-950/30 border border-emerald-900/30 rounded-lg">
                      <span className="text-[10px] text-emerald-400/80 block uppercase tracking-wider font-sans">
                        Net In-Pocket
                      </span>
                      <span className="text-base font-bold text-emerald-400 mt-1 block">
                        ₹{taxResult.netAfterTax.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/30 text-amber-400/90 text-xs flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Educational estimate only:</strong> Surcharge and health &amp; education cess (4%) may additionally apply depending on overall annual income bracket. Always verify with your tax professional.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 7. INSTITUTIONAL METRICS & SOCIAL PROOF ─────────── */}
      <section className="py-12 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono block">₹12.5+ Cr</span>
              <span className="text-xs text-slate-400 mt-1 block font-medium">Syndicate Capital Tracked</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono block">45,000+</span>
              <span className="text-xs text-slate-400 mt-1 block font-medium">Multi-PAN Bids Managed</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono block">99.9%</span>
              <span className="text-xs text-slate-400 mt-1 block font-medium">Allotment Day Uptime</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono block">₹0.00</span>
              <span className="text-xs text-slate-400 mt-1 block font-medium">Penny Remainder Drift</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. COMPREHENSIVE FOOTER & COMPLIANCE ────────────── */}
      <footer className="mt-auto pt-10 pb-8 border-t border-slate-900 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4 text-center">
          <p className="max-w-3xl mx-auto leading-relaxed text-slate-400">
            <strong>Statutory Disclaimer:</strong> IPO Buddy is an independent financial analytics and syndicate coordination utility. Investments in securities market are subject to market risks. Read all scheme related documents carefully before investing. Grey Market Premium (GMP) data is indicative, unvetted by exchanges, and should not be considered investment advice.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 text-[11px] pt-2 border-t border-slate-900">
            <span>Clean Architecture .NET 10 API (Port 5074)</span>
            <span>•</span>
            <span>Next.js 15 PWA on Vercel</span>
            <span>•</span>
            <span>Zero Broker Credentials Stored</span>
            <span>•</span>
            <span>SEBI Rounding Compliant</span>
          </div>
          <p className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} IPO Buddy. Designed with Stitch MCP Equitas Financial System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
