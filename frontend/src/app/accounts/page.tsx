"use client";

import React, { useState } from "react";
import {
  Plus,
  Scale,
  CheckCircle2,
  Trash2,
  RefreshCw,
  X,
} from "lucide-react";
import { AppNavigation } from "@/components/AppNavigation";
import { SAMPLE_ACCOUNTS, DematAccount } from "@/lib/sampleData";

export default function LinkedAccountsPage() {
  const [accounts, setAccounts] = useState<DematAccount[]>(SAMPLE_ACCOUNTS);
  const [unallocatedPool] = useState<number>(12500000);
  const [balancing, setBalancing] = useState<boolean>(false);
  const [balanceMsg, setBalanceMsg] = useState<string | null>(null);

  // Add Account Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newBroker, setNewBroker] = useState<"Zerodha" | "Upstox" | "AngelOne" | "Groww" | "ICICIDirect">("Zerodha");
  const [newHolderName, setNewHolderName] = useState<string>("");
  const [newClientId, setNewClientId] = useState<string>("");
  const [newPan, setNewPan] = useState<string>("");
  const [newUpiId, setNewUpiId] = useState<string>("");

  const handleAutoBalance = () => {
    setBalancing(true);
    setBalanceMsg(null);
    setTimeout(() => {
      const activeCount = accounts.filter((a) => a.status === "Active").length;
      if (activeCount > 0) {
        const perAccount = Math.floor(unallocatedPool / activeCount);
        const remainder = unallocatedPool % activeCount;
        const updated = accounts.map((acc, index) => {
          if (acc.status === "Active") {
            const added = index === 0 ? perAccount + remainder : perAccount;
            return {
              ...acc,
              allocatedBalance: added,
              poolPercentage: Math.round((added / unallocatedPool) * 100),
            };
          }
          return acc;
        });
        setAccounts(updated);
      }
      setBalancing(false);
      setBalanceMsg(
        "Auto-balance executed successfully! ₹1.25 Cr evenly distributed across active accounts with zero penny drift."
      );
      setTimeout(() => setBalanceMsg(null), 5000);
    }, 900);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolderName || !newClientId || !newPan) return;

    const newAcc: DematAccount = {
      id: `acc-${Date.now()}`,
      broker: newBroker,
      holderName: newHolderName,
      clientId: newClientId.toUpperCase(),
      panMasked: newPan.toUpperCase().slice(0, 5) + "****",
      allocatedBalance: 1500000,
      poolPercentage: 12,
      status: "Active",
      upiId: newUpiId || `${newHolderName.toLowerCase().replace(/\s+/g, "")}@okaxis`,
    };

    setAccounts([...accounts, newAcc]);
    setShowAddModal(false);
    setNewHolderName("");
    setNewClientId("");
    setNewPan("");
    setNewUpiId("");
  };

  const handleDeleteAccount = (id: string) => {
    if (confirm("Are you sure you want to unlink this Demat account?")) {
      setAccounts(accounts.filter((a) => a.id !== id));
    }
  };

  return (
    <AppNavigation pageTitle="Linked Demat Accounts">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#000f22] tracking-tight">
              Linked Demat Accounts Manager
            </h1>
            <p className="text-xs text-[#74777e]">
              Manage multi-PAN trading accounts, UPI mandates, and allocated capital pools.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#000f22] text-white rounded-lg text-xs font-semibold hover:bg-[#0a2540] transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Demat</span>
          </button>
        </div>

        {/* Feedback Message */}
        {balanceMsg && (
          <div className="p-4 rounded-xl bg-[#6bfe9c]/20 border border-[#006d37]/30 flex items-center gap-3 text-xs text-[#006d37] font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{balanceMsg}</span>
          </div>
        )}

        {/* Auto-Balance Feature Card */}
        <section className="bg-white rounded-xl p-6 border border-[#e0e3e5] shadow-2xs flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <Scale className="w-5 h-5 text-[#006d37]" />
              <h3 className="font-bold text-[#000f22] text-base">Auto-Balance Capital</h3>
            </div>
            <p className="text-xs text-[#43474d] max-w-2xl leading-relaxed">
              Optimize SEBI retail allotment odds by automatically distributing uninvested funds
              equally across all active family Demat accounts with zero penny discrepancy.
            </p>
          </div>

          <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#74777e]">
                Total Unallocated Pool
              </p>
              <p className="font-mono text-xl font-extrabold text-[#000f22]">
                ₹ {unallocatedPool.toLocaleString("en-IN")}
              </p>
            </div>
            <button
              onClick={handleAutoBalance}
              disabled={balancing}
              className="px-4 py-2.5 bg-[#006d37] text-white rounded-lg text-xs font-semibold hover:bg-[#005228] transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${balancing ? "animate-spin" : ""}`} />
              <span>{balancing ? "Balancing Pool..." : "Execute Auto-Balance"}</span>
            </button>
          </div>
        </section>

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <article
              key={acc.id}
              className="bg-white rounded-xl p-5 border border-[#e0e3e5] shadow-2xs flex flex-col justify-between hover:border-[#000f22]/30 transition-all group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded bg-[#6bfe9c]/20 text-[#006d37] text-[10px] font-bold mb-1.5">
                      {acc.status}
                    </span>
                    <h3 className="font-bold text-[#000f22] text-base leading-tight">
                      {acc.broker}
                    </h3>
                    <p className="text-xs text-[#43474d] mt-0.5">
                      {acc.holderName} • <span className="font-mono">{acc.clientId}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAccount(acc.id)}
                    className="p-1.5 text-[#74777e] hover:text-[#ba1a1a] rounded transition-colors"
                    title="Unlink Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-[#f7f9fb] rounded-lg border border-[#e0e3e5] space-y-1 text-xs mb-4">
                  <div className="flex justify-between text-[#74777e]">
                    <span>PAN Number:</span>
                    <span className="font-mono font-semibold text-[#000f22]">{acc.panMasked}</span>
                  </div>
                  <div className="flex justify-between text-[#74777e]">
                    <span>Linked UPI ID:</span>
                    <span className="font-mono text-[#006d37] truncate max-w-[140px]">
                      {acc.upiId}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#e0e3e5]">
                <p className="text-[10px] font-bold uppercase text-[#74777e] mb-1">
                  Allocated Capital
                </p>
                <p className="font-mono text-xl font-bold text-[#000f22]">
                  ₹ {acc.allocatedBalance.toLocaleString("en-IN")}
                </p>
                <div className="mt-2">
                  <div className="w-full bg-[#eceef0] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#000f22] h-full rounded-full transition-all duration-500"
                      style={{ width: `${acc.poolPercentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#74777e] mt-1 text-right font-medium">
                    {acc.poolPercentage}% of Syndicate Pool
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Add Account Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e0e3e5] animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#e0e3e5] mb-4">
                <h3 className="font-bold text-[#000f22] text-base">Link Demat Account</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-[#74777e] hover:text-[#000f22]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAccount} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#43474d] mb-1">Broker Platform</label>
                  <select
                    value={newBroker}
                    onChange={(e) => setNewBroker(e.target.value as DematAccount["broker"])}
                    className="w-full px-3 py-2 bg-[#f7f9fb] border border-[#c4c6ce] rounded-lg text-[#000f22] font-semibold"
                  >
                    <option value="Zerodha">Zerodha (Kite API)</option>
                    <option value="Upstox">Upstox (Pro)</option>
                    <option value="AngelOne">AngelOne (SmartAPI)</option>
                    <option value="Groww">Groww</option>
                    <option value="ICICIDirect">ICICI Direct</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#43474d] mb-1">
                    Demat Account Holder Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={newHolderName}
                    onChange={(e) => setNewHolderName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f7f9fb] border border-[#c4c6ce] rounded-lg text-[#000f22]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#43474d] mb-1">
                      DP Client ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ZER12345"
                      value={newClientId}
                      onChange={(e) => setNewClientId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f7f9fb] border border-[#c4c6ce] rounded-lg text-[#000f22] font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#43474d] mb-1">PAN Number</label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="e.g. ABCDE1234F"
                      value={newPan}
                      onChange={(e) => setNewPan(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f7f9fb] border border-[#c4c6ce] rounded-lg text-[#000f22] font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#43474d] mb-1">
                    Linked Mandate UPI ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. holder@okhdfcbank"
                    value={newUpiId}
                    onChange={(e) => setNewUpiId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f7f9fb] border border-[#c4c6ce] rounded-lg text-[#000f22] font-mono"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 rounded-lg border border-[#c4c6ce] text-[#43474d] font-semibold hover:bg-[#eceef0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg bg-[#000f22] text-white font-semibold hover:bg-[#0a2540]"
                  >
                    Confirm & Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppNavigation>
  );
}
