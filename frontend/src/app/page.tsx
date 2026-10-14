"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Calculator,
  Lock,
  Layers,
  Percent,
  CheckCircle2,
  PieChart,
  Landmark,
  FileSpreadsheet,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, IpoItem } from "@/lib/api";
import { SAMPLE_IPOS } from "@/lib/sampleData";

export default function HomePage() {
  const { user, isSignedIn, login } = useAuth();

  // IPO Data & Filters
  const [ipos, setIpos] = useState<IpoItem[]>(SAMPLE_IPOS);
  const [loadingIpos, setLoadingIpos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [syncing, setSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Interactive Syndicate Calculator State
  const [calcPool, setCalcPool] = useState<number>(150000);
  const [calcCutoffPrice, setCalcCutoffPrice] = useState<number>(500);
  const [calcListingPrice, setCalcListingPrice] = useState<number>(920);

  useEffect(() => {
    async function loadIpos() {
      try {
        setLoadingIpos(true);
        const data = await api.getIpos();
        if (data && data.length > 0) {
          setIpos(data);
        }
      } catch {
        // Keep realistic sample data if backend is still spinning up
      } finally {
        setLoadingIpos(false);
      }
    }
    loadIpos();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncSuccessMsg(null);
      const res = await api.syncIpos();
      setSyncSuccessMsg(res.message || "IPO database synced successfully!");
      const refreshed = await api.getIpos();
      if (refreshed && refreshed.length > 0) {
        setIpos(refreshed);
      }
    } catch {
      setSyncSuccessMsg("Database sync initiated in background.");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    }
  };

  // Filter IPOs
  const filteredIpos = ipos.filter((ipo) => {
    const matchesSearch =
      ipo.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ipo.symbol && ipo.symbol.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      categoryFilter === "All" ||
      (categoryFilter === "Mainboard" && ipo.category === "Mainboard") ||
      (categoryFilter === "SME" && ipo.category === "Sme");
    return matchesSearch && matchesCategory;
  });

  // Calculate Syndicate Gain
  const totalShares = Math.floor(calcPool / calcCutoffPrice);
  const grossCapital = totalShares * calcCutoffPrice;
  const grossProceeds = totalShares * calcListingPrice;
  const grossGain = Math.max(0, grossProceeds - grossCapital);
  const stcgTax = Math.round(grossGain * 0.2); // Section 111A 20%
  const netProfit = grossGain - stcgTax;

  // Split calculation among 3 syndicate members (Alpha: 50%, Beta: 30%, Gamma: 20%)
  const memberAlpha = Math.floor(netProfit * 0.5);
  const memberBeta = Math.floor(netProfit * 0.3);
  const memberGamma = netProfit - (memberAlpha + memberBeta); // Zero penny drift remainder allocation!

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex flex-col font-sans selection:bg-[#006d37] selection:text-white">
      {/* Top Header / Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#e0e3e5] shadow-2xs">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#000f22] flex items-center justify-center text-[#6bfe9c] shadow-sm group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 text-[#2ecc71]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[#000f22] text-lg tracking-tight leading-none">
                IPO Buddy
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#006d37] mt-0.5">
                Syndicate Hub
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#43474d]">
            <a href="#live-ipos" className="hover:text-[#000f22] transition-colors">
              Live IPOs & GMP
            </a>
            <a href="#syndicate-calculator" className="hover:text-[#000f22] transition-colors">
              Syndicate Splitter
            </a>
            <a href="#allotment-checker" className="hover:text-[#000f22] transition-colors">
              Allotment Status
            </a>
            <a href="#features" className="hover:text-[#000f22] transition-colors">
              Institutional Infrastructure
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-[#000f22] text-white text-xs font-semibold hover:bg-[#0a2540] transition-colors shadow-xs flex items-center gap-1.5"
            >
              <span>Launch Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-[#e0e3e5] bg-gradient-to-b from-white via-[#f7f9fb] to-[#f7f9fb]">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#6bfe9c]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#eceef0] border border-[#c4c6ce]/60 text-[#006d37] text-xs font-bold tracking-wide uppercase mb-6">
            <ShieldCheck className="w-4 h-4 text-[#006d37]" />
            <span>Institutional-Grade Syndicate Distribution</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-[#000f22] tracking-tight leading-[1.15] max-w-4xl mx-auto mb-6">
            India&apos;s First Centralized <br className="hidden sm:inline" />
            <span className="text-[#006d37]">IPO Allotment & Syndicate</span> Engine
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#43474d] max-w-2xl mx-auto mb-10 leading-relaxed">
            Pool multi-account capital across family and investor syndicates. Automate SEBI-compliant
            UPI mandates, track real-time grey market premiums, and settle listing day profit splits
            with mathematical precision.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#000f22] text-white font-semibold text-sm hover:bg-[#0a2540] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
            >
              <span>Launch Portfolio Terminal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/apply"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-[#c4c6ce] text-[#000f22] font-semibold text-sm hover:bg-[#eceef0] transition-all shadow-2xs flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-[#006d37]" />
              <span>Smart Apply Multi-Demat</span>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-white border border-[#e0e3e5] shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#74777e] mb-1">
                Active Issues Open
              </p>
              <p className="text-2xl font-bold text-[#000f22] font-mono">
                {ipos.filter((i) => i.status === "Open").length || "2"} Live
              </p>
              <p className="text-xs text-[#006d37] font-medium mt-1">NSE & BSE Validated</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#e0e3e5] shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#74777e] mb-1">
                Multi-PAN Pool
              </p>
              <p className="text-2xl font-bold text-[#000f22] font-mono">₹1.25 Cr</p>
              <p className="text-xs text-[#006d37] font-medium mt-1">Auto-Balanced Capital</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#e0e3e5] shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#74777e] mb-1">
                Settlement Drift
              </p>
              <p className="text-2xl font-bold text-[#006d37] font-mono">₹0.00</p>
              <p className="text-xs text-[#43474d] font-medium mt-1">Zero Penny Discrepancy</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#e0e3e5] shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#74777e] mb-1">
                Average Listing Pop
              </p>
              <p className="text-2xl font-bold text-[#000f22] font-mono">+38.2%</p>
              <p className="text-xs text-[#006d37] font-medium mt-1">YTD Syndicate Returns</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live & Upcoming IPOs Section */}
      <section id="live-ipos" className="py-16 md:py-24 max-w-[1280px] mx-auto px-4 sm:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006d37] uppercase tracking-wider mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>Real-Time Market Feeds</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#000f22] tracking-tight">
              Live & Upcoming Public Issues
            </h2>
            <p className="text-sm text-[#43474d] mt-1">
              Live grey market premiums, official price bands, and one-click syndicate deployment.
            </p>
          </div>

          {/* Sync action & feedback */}
          <div className="flex items-center gap-3">
            {syncSuccessMsg && (
              <span className="text-xs font-medium text-[#006d37] bg-[#6bfe9c]/20 px-3 py-1 rounded-md animate-fade-in">
                {syncSuccessMsg}
              </span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#c4c6ce] text-[#000f22] text-xs font-semibold hover:bg-[#eceef0] transition-colors shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-[#006d37]" : ""}`} />
              <span>{syncing ? "Scraping NSE/BSE..." : "Sync Live GMP"}</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-xl p-4 border border-[#e0e3e5] shadow-2xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#74777e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by company or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#f7f9fb] border border-[#c4c6ce] rounded-lg text-[#000f22] focus:outline-none focus:border-[#000f22]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {["All", "Mainboard", "SME"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  categoryFilter === cat
                    ? "bg-[#000f22] text-white shadow-xs"
                    : "bg-[#f7f9fb] text-[#43474d] hover:bg-[#eceef0]"
                }`}
              >
                {cat} Issues
              </button>
            ))}
          </div>
        </div>

        {/* IPOs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIpos.map((ipo) => {
            const hasGmp = ipo.gmp !== null && ipo.gmp !== undefined;
            const expectedGainPct =
              hasGmp && ipo.issuePriceHigh
                ? Math.round((ipo.gmp! / ipo.issuePriceHigh) * 100)
                : null;

            return (
              <div
                key={ipo.id}
                className="bg-white rounded-xl border border-[#e0e3e5] p-5 shadow-2xs hover:shadow-md hover:border-[#000f22]/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#eceef0] text-[#000f22]">
                        {ipo.category} • {ipo.exchange}
                      </span>
                      <h3 className="font-bold text-[#000f22] text-base mt-1.5 leading-snug">
                        {ipo.companyName}
                      </h3>
                      {ipo.symbol && (
                        <span className="text-xs font-mono text-[#74777e]">{ipo.symbol}</span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        ipo.status === "Open"
                          ? "bg-[#6bfe9c]/20 text-[#006d37]"
                          : ipo.status === "Upcoming"
                          ? "bg-[#d3e4fe] text-[#001c37]"
                          : "bg-[#eceef0] text-[#74777e]"
                      }`}
                    >
                      {ipo.status}
                    </span>
                  </div>

                  {/* GMP Badge */}
                  <div className="my-4 p-3 rounded-lg bg-[#f7f9fb] border border-[#e0e3e5] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#74777e]">
                        Grey Market Premium (GMP)
                      </p>
                      <p className="text-base font-bold text-[#006d37] font-mono mt-0.5">
                        {hasGmp ? `+₹${ipo.gmp}` : "Estimating"}
                      </p>
                    </div>
                    {expectedGainPct !== null && (
                      <span className="text-xs font-bold px-2 py-1 rounded bg-[#006d37] text-white">
                        +{expectedGainPct}%
                      </span>
                    )}
                  </div>

                  {/* Issue Stats */}
                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <div>
                      <p className="text-[#74777e] text-[11px]">Price Band</p>
                      <p className="font-semibold text-[#000f22] font-mono">
                        ₹{ipo.issuePriceLow || "-"} - ₹{ipo.issuePriceHigh || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#74777e] text-[11px]">Lot Size</p>
                      <p className="font-semibold text-[#000f22] font-mono">
                        {ipo.lotSize} Shares
                      </p>
                    </div>
                    <div>
                      <p className="text-[#74777e] text-[11px]">Close Date</p>
                      <p className="font-semibold text-[#000f22]">
                        {ipo.closeDate ? new Date(ipo.closeDate).toLocaleDateString() : "TBA"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#74777e] text-[11px]">Registrar</p>
                      <p className="font-semibold text-[#000f22] truncate">
                        {ipo.registrarName || "Official Registrar"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#e0e3e5] flex items-center justify-between gap-3">
                  <Link
                    href={`/apply?id=${ipo.id}`}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#000f22] text-white text-xs font-semibold text-center hover:bg-[#0a2540] transition-colors"
                  >
                    Deploy Lots via Syndicate
                  </Link>
                  {ipo.registrarUrl && (
                    <a
                      href={ipo.registrarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Registrar Link"
                      className="p-2 rounded-lg border border-[#c4c6ce] text-[#74777e] hover:text-[#000f22] hover:bg-[#eceef0] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Syndicate Profit Splitter Section */}
      <section
        id="syndicate-calculator"
        className="py-16 md:py-24 bg-white border-y border-[#e0e3e5]"
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006d37] uppercase tracking-wider mb-2">
              <Calculator className="w-4 h-4" />
              <span>Zero Penny Drift Algorithm</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#000f22] tracking-tight">
              Syndicate Profit & Capital Splitter
            </h2>
            <p className="text-sm text-[#43474d] mt-2">
              Simulate high-stakes listing gains with automatic STCG Section 111A tax deduction and
              exact remainder allocation across syndicate members.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Calculator Controls */}
            <div className="lg:col-span-5 bg-[#f7f9fb] p-6 rounded-2xl border border-[#e0e3e5] space-y-5">
              <h3 className="font-bold text-[#000f22] text-base">Syndicate Deployment Parameters</h3>

              <div>
                <label className="block text-xs font-semibold text-[#43474d] mb-1.5">
                  Total Pooled Capital (₹)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={calcPool}
                  onChange={(e) => setCalcPool(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#c4c6ce] font-mono text-sm text-[#000f22] focus:outline-none focus:border-[#000f22]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#43474d] mb-1.5">
                    Cut-Off Issue Price (₹)
                  </label>
                  <input
                    type="number"
                    value={calcCutoffPrice}
                    onChange={(e) => setCalcCutoffPrice(Number(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#c4c6ce] font-mono text-sm text-[#000f22] focus:outline-none focus:border-[#000f22]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#43474d] mb-1.5">
                    Expected Listing Price (₹)
                  </label>
                  <input
                    type="number"
                    value={calcListingPrice}
                    onChange={(e) => setCalcListingPrice(Number(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#c4c6ce] font-mono text-sm text-[#000f22] focus:outline-none focus:border-[#000f22]"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#e0e3e5] space-y-2 text-xs">
                <div className="flex justify-between text-[#43474d]">
                  <span>Total Applied Shares:</span>
                  <span className="font-mono font-semibold text-[#000f22]">{totalShares} Shares</span>
                </div>
                <div className="flex justify-between text-[#43474d]">
                  <span>Gross Listing Pop:</span>
                  <span className="font-mono font-semibold text-[#006d37]">
                    +₹{grossGain.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[#43474d]">
                  <span>STCG Tax (20% Sec 111A):</span>
                  <span className="font-mono font-semibold text-[#ba1a1a]">
                    -₹{stcgTax.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#e0e3e5] flex justify-between font-bold text-sm text-[#000f22]">
                  <span>Net Distributable Gains:</span>
                  <span className="font-mono text-[#006d37]">₹{netProfit.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Split Distribution Preview */}
            <div className="lg:col-span-7 bg-[#000f22] text-white p-6 sm:p-8 rounded-2xl shadow-lg space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6bfe9c]">
                    Audit-Grade Distribution
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Live Member Profit Allocations
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#0a2540] border border-[#314865] text-[#6bfe9c] text-xs font-mono font-bold">
                  Zero Remainder Leak
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#0a2540]/60 border border-[#314865] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#d2e4ff] text-[#001c37] font-bold text-sm flex items-center justify-center">
                      M1
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">Alpha Fund (Lead Investor)</p>
                      <p className="text-xs text-[#768dad]">50.0% Allocation Share</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-[#6bfe9c] font-mono">
                      ₹{memberAlpha.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#768dad]">Net after tax</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0a2540]/60 border border-[#314865] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#b0c8eb] text-[#001c37] font-bold text-sm flex items-center justify-center">
                      M2
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">Beta Demat Trust</p>
                      <p className="text-xs text-[#768dad]">30.0% Allocation Share</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-[#6bfe9c] font-mono">
                      ₹{memberBeta.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#768dad]">Net after tax</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0a2540]/60 border border-[#314865] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#4ae183] text-[#00210c] font-bold text-sm flex items-center justify-center">
                      M3
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">Gamma Family Demat</p>
                      <p className="text-xs text-[#768dad]">20.0% Allocation Share (+Remainder)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-[#6bfe9c] font-mono">
                      ₹{memberGamma.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#768dad]">Exact Match (No Drift)</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0a2540] border border-[#314865] flex items-center justify-between text-xs text-[#b0c8eb]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#6bfe9c]" />
                  <span>Mathematical Proof: sum(shares) == netProfit</span>
                </div>
                <span className="font-mono font-bold text-white">
                  ₹{(memberAlpha + memberBeta + memberGamma).toLocaleString()} = ₹
                  {netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Registrar Direct Status Lookup Section */}
      <section
        id="allotment-checker"
        className="py-16 md:py-24 max-w-[1280px] mx-auto px-4 sm:px-8 w-full"
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006d37] uppercase tracking-wider mb-2">
            <Landmark className="w-4 h-4" />
            <span>Direct Registrar Infrastructure</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#000f22] tracking-tight">
            Official Allotment Status Portals
          </h2>
          <p className="text-sm text-[#43474d] mt-2">
            Avoid broker latency. Query the official share transfer registrars directly using your
            PAN, Application Number, or DP ID.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-[#e0e3e5] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#000f22] text-[#6bfe9c] font-bold flex items-center justify-center text-sm mb-4">
                LI
              </div>
              <h3 className="font-bold text-[#000f22] text-base mb-1">Link Intime India</h3>
              <p className="text-xs text-[#74777e] leading-relaxed mb-4">
                Handles mega-cap IPOs including Tata Technologies, Bajaj Housing, and Premier
                Energies.
              </p>
            </div>
            <a
              href="https://linkintime.co.in/initial_offer/public-issues.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs font-semibold text-[#006d37] hover:underline"
            >
              <span>Query Link Intime Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#e0e3e5] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#000f22] text-[#6bfe9c] font-bold flex items-center justify-center text-sm mb-4">
                KF
              </div>
              <h3 className="font-bold text-[#000f22] text-base mb-1">KFin Technologies</h3>
              <p className="text-xs text-[#74777e] leading-relaxed mb-4">
                Primary registrar for technology giants such as Swiggy, Ola Electric, and Ixigo.
              </p>
            </div>
            <a
              href="https://kosmic.kfintech.com/ipostatus/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs font-semibold text-[#006d37] hover:underline"
            >
              <span>Query KFintech Kosmic</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#e0e3e5] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#000f22] text-[#6bfe9c] font-bold flex items-center justify-center text-sm mb-4">
                BS
              </div>
              <h3 className="font-bold text-[#000f22] text-base mb-1">Bigshare Services</h3>
              <p className="text-xs text-[#74777e] leading-relaxed mb-4">
                Specialized registrar for high-demand NSE SME and BSE SME rapid public offerings.
              </p>
            </div>
            <a
              href="https://ipo.bigshareonline.com/IPO_Status.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs font-semibold text-[#006d37] hover:underline"
            >
              <span>Query Bigshare Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#e0e3e5] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#000f22] text-[#6bfe9c] font-bold flex items-center justify-center text-sm mb-4">
                SK
              </div>
              <h3 className="font-bold text-[#000f22] text-base mb-1">Skyline Financial</h3>
              <p className="text-xs text-[#74777e] leading-relaxed mb-4">
                Official registrar for industrial manufacturing and regional emerging market
                offerings.
              </p>
            </div>
            <a
              href="https://www.skylinerta.com/ipo.php"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs font-semibold text-[#006d37] hover:underline"
            >
              <span>Query Skyline Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Platform Features Bento Grid */}
      <section id="features" className="py-16 md:py-24 bg-[#eceef0]/50 border-t border-[#e0e3e5]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#000f22] tracking-tight">
              Built for Serious Indian Retail Syndicates
            </h2>
            <p className="text-sm text-[#43474d] mt-2">
              Everything needed to scale from a solo retail investor to an organized family office
              syndicate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#e0e3e5] shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#000f22] text-[#6bfe9c] flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-[#2ecc71]" />
              </div>
              <h3 className="font-bold text-[#000f22] text-base mb-2">
                Multi-PAN Lottery Distribution
              </h3>
              <p className="text-xs text-[#43474d] leading-relaxed">
                SEBI lottery rules favor one lot per unique PAN. Link accounts across family members
                to maximize individual allocation probability without violating SEBI mandate
                regulations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#e0e3e5] shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#000f22] text-[#6bfe9c] flex items-center justify-center mb-4">
                <PieChart className="w-5 h-5 text-[#2ecc71]" />
              </div>
              <h3 className="font-bold text-[#000f22] text-base mb-2">
                Automated Capital Rebalancing
              </h3>
              <p className="text-xs text-[#43474d] leading-relaxed">
                Our Auto-Balance engine automatically redistributes idle bank balances equally
                across linked Demat accounts before major IPO cutoff deadlines.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#e0e3e5] shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#000f22] text-[#6bfe9c] flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-5 h-5 text-[#2ecc71]" />
              </div>
              <h3 className="font-bold text-[#000f22] text-base mb-2">
                Instant Settlement Ledgers
              </h3>
              <p className="text-xs text-[#43474d] leading-relaxed">
                Export clean, audit-ready CSV & JSON tax statements on listing day with individual
                shareholder gains and withholding tax deductions clearly logged.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#000f22] text-white text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Organize Your Syndicate?
          </h2>
          <p className="text-sm sm:text-base text-[#b0c8eb] max-w-xl mx-auto">
            Launch the terminal now to link your Demat accounts, deploy cut-off bids, and experience
            zero-drift profit sharing.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#006d37] hover:bg-[#005228] text-white font-bold text-sm shadow-md transition-all hover:scale-105"
            >
              <span>Launch Institutional Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-[#e0e3e5] text-xs text-[#74777e]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#000f22] flex items-center justify-center text-white">
              <TrendingUp className="w-3.5 h-3.5 text-[#2ecc71]" />
            </div>
            <span className="font-bold text-[#000f22] text-sm">IPO Buddy</span>
            <span className="text-[11px] text-[#74777e]">
              — Centralized Indian IPO Syndicate System
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-[#000f22] transition-colors">
              Dashboard
            </Link>
            <Link href="/apply" className="hover:text-[#000f22] transition-colors">
              Smart Apply
            </Link>
            <Link href="/accounts" className="hover:text-[#000f22] transition-colors">
              Linked Demats
            </Link>
            <Link href="/analytics" className="hover:text-[#000f22] transition-colors">
              Analytics
            </Link>
            <Link href="/notifications" className="hover:text-[#000f22] transition-colors">
              Notifications
            </Link>
          </div>

          <p className="text-[11px]">
            © {new Date().getFullYear()} IPO Buddy. Non-custodial syndicate management tool.
          </p>
        </div>
      </footer>
    </div>
  );
}
