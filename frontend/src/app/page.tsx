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

  // Active Navigation Tab
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

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ── Top Header ────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-xl">
            ₹
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">IPO Buddy</h1>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                .NET 10 API
              </span>
            </div>
            <p className="text-xs text-slate-400">Zero-Cost Indian IPO Tracker & Group Splits</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncingIpos}
            className="min-h-[44px] px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            title="Fetch live IPOs from Groww & InvestorGain"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncingIpos ? "animate-spin text-emerald-400" : ""}`} />
            {syncingIpos ? "Syncing..." : "Sync Public Feeds"}
          </button>

          {user ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1.5 pl-3">
              <span className="text-xs font-semibold text-slate-200">{user.displayName}</span>
              <button
                onClick={logout}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              Sign In with Email
            </button>
          )}
        </div>
      </header>

      {syncMsg && (
        <div className="mt-4 p-3 bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{syncMsg}</span>
        </div>
      )}

      {/* ── Navigation Tabs ───────────────────────────────── */}
      <nav className="flex items-center gap-2 overflow-x-auto py-4 border-b border-slate-900 no-scrollbar" aria-label="Main Navigation">
        {[
          { id: "ipos", label: "IPO Explorer", icon: TrendingUp },
          { id: "watchlist", label: `Watchlist (${watchlist.length})`, icon: Star },
          { id: "groups", label: `Friend Groups (${groups.length})`, icon: Users },
          { id: "splits", label: "Split Calculator", icon: Calculator },
          { id: "tax", label: "STCG Tax Tool", icon: Percent },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ── TAB 1: IPO Explorer ───────────────────────────── */}
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
                  className={`min-h-[38px] px-3 rounded-md text-xs font-medium transition-colors ${
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
                className="min-h-[44px] bg-slate-900 border border-slate-800 rounded-lg px-3 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
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
                  className="min-h-[44px] w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </form>
            </div>
          </div>

          {/* IPO Cards Grid */}
          {loadingIpos ? (
            <div className="py-20 text-center text-slate-500 text-xs">Loading IPOs from database...</div>
          ) : ipos.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl p-8">
              <TrendingUp className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No IPOs found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Click &quot;Sync Public Feeds&quot; at the top to ingest real-time IPO listings and GMP directly from Groww and InvestorGain.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ipos.map((ipo) => {
                const isStarred = watchlist.some((w) => w.id === ipo.id);
                return (
                  <div
                    key={ipo.id}
                    className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-lg"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-medium">
                              {ipo.category}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-medium ${
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
                          <h2 className="text-sm font-bold text-white mt-2 leading-tight">
                            {ipo.companyName}
                          </h2>
                          {ipo.symbol && <p className="text-xs text-slate-400 font-mono mt-0.5">{ipo.symbol}</p>}
                        </div>

                        <button
                          onClick={() => handleWatchlistToggle(ipo.id)}
                          className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg transition-colors ${
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
                      <div className="grid grid-cols-2 gap-2 my-4 p-3 rounded-lg bg-slate-950/60 border border-slate-900 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Price Band</span>
                          <span className="font-semibold text-slate-200">
                            {ipo.issuePriceHigh ? `₹${ipo.issuePriceLow || ipo.issuePriceHigh} - ₹${ipo.issuePriceHigh}` : "TBA"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Lot Size</span>
                          <span className="font-semibold text-slate-200">
                            {ipo.lotSize} shares {ipo.minInvestment ? `(₹${ipo.minInvestment.toLocaleString("en-IN")})` : ""}
                          </span>
                        </div>
                      </div>

                      {/* Live GMP Chip */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-xs mb-4">
                        <span className="text-emerald-400/80 font-medium">Estimated GMP</span>
                        <span className="font-bold text-emerald-400">
                          {ipo.gmp ? `+₹${ipo.gmp} / share` : "No GMP data yet"}
                        </span>
                      </div>
                    </div>

                    {/* Timeline & Actions */}
                    <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
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
                          className="min-h-[44px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                        >
                          Allotment Portal <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-slate-600 text-[11px]">Allotment via registrar</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Watchlist ──────────────────────────────── */}
      {activeTab === "watchlist" && (
        <div className="py-6">
          {!user ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl p-8">
              <Star className="h-8 w-8 text-amber-500/60 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">Sign in to save IPOs</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Sign in with your mobile number to star IPOs and keep track of important bidding and allotment dates.
              </p>
              <button
                onClick={login}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold min-h-[44px]"
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
                <div key={ipo.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white">{ipo.companyName}</h3>
                    <button
                      onClick={() => handleWatchlistToggle(ipo.id)}
                      className="min-h-[40px] text-amber-400 p-1"
                    >
                      <Star className="h-4 w-4 fill-current" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Category: {ipo.category} • Status: {ipo.status}</p>
                  <div className="mt-3 text-xs font-semibold text-emerald-400">
                    GMP: {ipo.gmp ? `+₹${ipo.gmp}` : "TBA"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Friend Groups ──────────────────────────── */}
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
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold min-h-[44px]"
              >
                Sign In Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Create & Join */}
              <div className="flex flex-col gap-4">
                {/* Create Group Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                    <Plus className="h-4 w-4 text-emerald-400" /> Create Private Group
                  </h3>
                  <form onSubmit={handleCreateGroup} className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="e.g., Office IPO Circle"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="min-h-[44px] bg-slate-950 border border-slate-800 rounded-lg px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <button
                      type="submit"
                      className="min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Generate Group & Invite Code
                    </button>
                  </form>
                </div>

                {/* Join Group Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
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
                      className="min-h-[44px] bg-slate-950 border border-slate-800 rounded-lg px-3 text-xs font-mono text-center tracking-widest text-slate-200 focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <button
                      type="submit"
                      className="min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                    >
                      Join Group
                    </button>
                  </form>
                </div>

                {/* Groups List */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">My Groups</h4>
                  {groups.length === 0 ? (
                    <p className="text-xs text-slate-500">You have not joined any groups yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {groups.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => loadGroupDetail(g.id)}
                          className={`min-h-[48px] text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
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
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                      <div>
                        <h2 className="text-base font-bold text-white">{selectedGroup.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">Invite Code:</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono font-bold text-xs select-all">
                            {selectedGroup.inviteCode}
                          </span>
                          <span className="text-xs text-slate-500">({selectedGroup.members.length} / {selectedGroup.maxMembers} members)</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("splits")}
                        className="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        Open Split Calculator <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Members Roster */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">Group Roster</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedGroup.members.map((m) => (
                          <div
                            key={m.userId}
                            className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between"
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
                  <div className="py-20 text-center border border-dashed border-slate-800 rounded-xl p-8 text-slate-500 text-xs">
                    Select or create a group on the left to view details.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Group Split Calculator ─────────────────── */}
      {activeTab === "splits" && (
        <div className="py-6 flex flex-col gap-6">
          {!user ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl p-8">
              <Calculator className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">Sign in to calculate group splits</p>
              <button
                onClick={login}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold min-h-[44px]"
              >
                Sign In Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Create Split Form & Net Balances */}
              <div className="flex flex-col gap-4">
                {/* Net Balances Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
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
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs"
                        >
                          <span className="font-medium text-slate-300">{b.displayName}</span>
                          <span
                            className={`font-bold ${
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

                {/* Create New Split Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-white mb-2">Record Shared Gain / Expense</h3>
                  <p className="text-[11px] text-slate-400 mb-4">
                    The calculator divides the amount equally with 100% precision and zero remainder drift.
                  </p>

                  <form onSubmit={handleCreateSplit} className="flex flex-col gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Target Group</label>
                      <select
                        value={selectedGroup?.id || ""}
                        onChange={(e) => loadGroupDetail(e.target.value)}
                        className="min-h-[44px] w-full bg-slate-950 border border-slate-800 rounded-lg px-3 text-xs text-slate-200"
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
                        placeholder="e.g., Tata Tech Listing Day Profit"
                        value={splitDesc}
                        onChange={(e) => setSplitDesc(e.target.value)}
                        className="min-h-[44px] w-full bg-slate-950 border border-slate-800 rounded-lg px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
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
                        className="min-h-[44px] w-full bg-slate-950 border border-slate-800 rounded-lg px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors mt-2"
                    >
                      Calculate & Record Split
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Splits History in Group */}
              <div className="lg:col-span-2">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                    <div>
                      <h2 className="text-sm font-bold text-white">
                        {selectedGroup ? `${selectedGroup.name} Splits` : "Select a Group"}
                      </h2>
                      <p className="text-xs text-slate-500">Track and toggle member settlement checks</p>
                    </div>
                  </div>

                  {splits.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 text-xs">
                      No splits recorded in this group yet. Use the form on the left to add one!
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

                          {/* Member Share Entries */}
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
                                    className={`min-h-[32px] px-2.5 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-all ${
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

      {/* ── TAB 5: STCG Tax Tool ───────────────────────────── */}
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
                  className="min-h-[48px] flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
                <button
                  type="submit"
                  className="min-h-[48px] px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  Recalculate
                </button>
              </div>
            </form>

            {taxResult && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="p-3 bg-slate-900/60 rounded-lg">
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Gross Gain</span>
                  <span className="text-base font-bold text-slate-200 mt-1 block">
                    ₹{taxResult.grossGain.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-lg">
                  <span className="text-[10px] text-rose-400/80 block uppercase tracking-wider">
                    STCG Tax (20%)
                  </span>
                  <span className="text-base font-bold text-rose-400 mt-1 block">
                    ₹{taxResult.taxPayable.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-3 bg-emerald-950/30 border border-emerald-900/30 rounded-lg">
                  <span className="text-[10px] text-emerald-400/80 block uppercase tracking-wider">
                    Net In-Pocket
                  </span>
                  <span className="text-base font-bold text-emerald-400 mt-1 block">
                    ₹{taxResult.netAfterTax.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/30 text-amber-400/90 text-xs flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Educational estimate only:</strong> Surcharge and health & education cess (4%) may additionally apply depending on overall annual income bracket. Always verify with your tax professional.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="mt-auto pt-10 pb-6 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col gap-1">
        <p>
          IPO Buddy is an independent information and group calculation tool. It does not provide financial or investment advice.
        </p>
        <p className="text-[11px] text-slate-600">
          Clean Architecture .NET 10 API on port 5074 • Next.js 15 PWA on Vercel
        </p>
      </footer>
    </div>
  );
}
