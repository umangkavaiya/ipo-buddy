"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { AppNavigation } from "@/components/AppNavigation";
import { api, IpoItem } from "@/lib/api";
import { SAMPLE_IPOS, SAMPLE_ACCOUNTS } from "@/lib/sampleData";

function SmartApplyContent() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id");

  const [ipos, setIpos] = useState<IpoItem[]>(SAMPLE_IPOS);
  const [selectedIpoId, setSelectedIpoId] = useState<string>(
    requestedId || SAMPLE_IPOS[0].id
  );
  const [lots, setLots] = useState<number>(1);
  const [useCutoff, setUseCutoff] = useState<boolean>(true);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([
    "acc-1",
    "acc-2",
  ]);
  const [upiId, setUpiId] = useState<string>("aarav@okhdfcbank");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function loadIpos() {
      try {
        const data = await api.getIpos();
        if (data && data.length > 0) {
          setIpos(data);
          if (requestedId && data.some((i) => i.id === requestedId)) {
            setSelectedIpoId(requestedId);
          }
        }
      } catch {
        // Fallback to sample data
      }
    }
    loadIpos();
  }, [requestedId]);

  const selectedIpo =
    ipos.find((i) => i.id === selectedIpoId) || ipos[0] || SAMPLE_IPOS[0];

  const pricePerShare =
    selectedIpo.issuePriceHigh || selectedIpo.issuePriceLow || 500;
  const costPerLot = selectedIpo.lotSize * pricePerShare;
  const totalCostPerAccount = lots * costPerLot;
  const totalCapitalBlocked = totalCostPerAccount * selectedAccounts.length;

  const toggleAccount = (accId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accId)
        ? prev.length > 1
          ? prev.filter((id) => id !== accId)
          : prev
        : [...prev, accId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmittedSuccess(true);
    }, 1200);
  };

  return (
    <AppNavigation pageTitle="Smart IPO Application">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#43474d] hover:text-[#000f22] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        {/* IPO Details Header Card */}
        <div className="bg-white rounded-xl p-6 border border-[#e0e3e5] shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-[#000f22] text-[#6bfe9c] flex items-center justify-center font-extrabold text-xl shrink-0">
              {selectedIpo.companyName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-[#000f22]">
                  {selectedIpo.companyName}
                </h1>
                <span className="bg-[#6bfe9c]/20 text-[#006d37] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  {selectedIpo.status}
                </span>
              </div>
              <p className="text-xs text-[#74777e]">
                {selectedIpo.category} Issue • {selectedIpo.exchange} • Registrar:{" "}
                <span className="font-semibold text-[#000f22]">
                  {selectedIpo.registrarName}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Issue Stats */}
          <div className="flex gap-6 border-t md:border-t-0 md:border-l border-[#e0e3e5] pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-between md:justify-start">
            <div>
              <p className="text-[10px] font-bold uppercase text-[#74777e] mb-0.5">
                Price Band
              </p>
              <p className="font-mono font-bold text-sm text-[#000f22]">
                ₹{selectedIpo.issuePriceLow || "-"} - ₹{selectedIpo.issuePriceHigh || "-"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-[#74777e] mb-0.5">
                Lot Size
              </p>
              <p className="font-mono font-bold text-sm text-[#000f22]">
                {selectedIpo.lotSize} Shares
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-[#74777e] mb-0.5">
                Min Investment
              </p>
              <p className="font-mono font-bold text-sm text-[#006d37]">
                ₹{costPerLot.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Success Confirmation Modal / Banner */}
        {submittedSuccess && (
          <div className="p-5 rounded-xl bg-[#6bfe9c]/20 border border-[#006d37]/30 flex items-start gap-4 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-[#006d37] shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-[#006d37] text-sm">
                UPI Mandates Dispatched Successfully!
              </h3>
              <p className="text-xs text-[#191c1e] mt-1">
                Mandate requests for {selectedAccounts.length} Demat account(s) totaling{" "}
                <strong className="font-mono">₹{totalCapitalBlocked.toLocaleString()}</strong> have
                been dispatched to <strong className="font-mono">{upiId}</strong>. Please approve
                the request on your BHIM / GPay / PhonePe app before the 5:00 PM cutoff.
              </p>
              <div className="mt-3 flex gap-3">
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 bg-[#006d37] text-white rounded text-xs font-semibold hover:bg-[#005228]"
                >
                  View in Dashboard
                </Link>
                <button
                  onClick={() => setSubmittedSuccess(false)}
                  className="px-3 py-1.5 bg-white border border-[#c4c6ce] text-[#000f22] rounded text-xs font-semibold"
                >
                  Apply Another
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Application Workspace Grid */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Setup (7 Columns) */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-white rounded-xl p-6 border border-[#e0e3e5] shadow-2xs space-y-5">
              <h2 className="font-bold text-[#000f22] text-base">
                Capital Deployment Setup
              </h2>

              {/* Select IPO Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-[#43474d] mb-1.5">
                  Target Public Issue
                </label>
                <select
                  value={selectedIpoId}
                  onChange={(e) => setSelectedIpoId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#f7f9fb] border border-[#c4c6ce] rounded-lg text-[#000f22] font-semibold focus:outline-none focus:border-[#000f22]"
                >
                  {ipos.map((ipo) => (
                    <option key={ipo.id} value={ipo.id}>
                      {ipo.companyName} ({ipo.category} • ₹{ipo.issuePriceHigh || "-"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Lots & Cut-off Bid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#43474d] mb-1.5">
                    Lots per Account
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLots(Math.max(1, lots - 1))}
                      className="w-8 h-8 rounded border border-[#c4c6ce] bg-white font-bold text-sm text-[#000f22] hover:bg-[#eceef0]"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="13"
                      value={lots}
                      onChange={(e) => setLots(Math.max(1, Number(e.target.value) || 1))}
                      className="w-16 text-center py-1.5 border border-[#c4c6ce] rounded font-mono font-bold text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setLots(lots + 1)}
                      className="w-8 h-8 rounded border border-[#c4c6ce] bg-white font-bold text-sm text-[#000f22] hover:bg-[#eceef0]"
                    >
                      +
                    </button>
                    <span className="text-xs text-[#74777e]">
                      ({lots * selectedIpo.lotSize} shs)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#43474d] mb-1.5">
                    Bid Pricing Mode
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={useCutoff}
                      onChange={(e) => setUseCutoff(e.target.checked)}
                      className="rounded border-[#c4c6ce] text-[#006d37] focus:ring-[#006d37]"
                    />
                    <span className="text-xs font-semibold text-[#000f22]">
                      Cut-off Price (₹{pricePerShare})
                    </span>
                  </label>
                </div>
              </div>

              {/* Select Linked Demat Accounts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-[#43474d]">
                    Deploy Across Linked Demats (Multi-PAN)
                  </label>
                  <span className="text-[11px] text-[#006d37] font-semibold">
                    {selectedAccounts.length} Accounts Selected
                  </span>
                </div>

                <div className="space-y-2">
                  {SAMPLE_ACCOUNTS.map((acc) => {
                    const isSelected = selectedAccounts.includes(acc.id);
                    return (
                      <div
                        key={acc.id}
                        onClick={() => toggleAccount(acc.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-[#f7f9fb] border-[#000f22] shadow-2xs"
                            : "bg-white border-[#e0e3e5] hover:border-[#c4c6ce]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded border-[#c4c6ce] text-[#000f22] focus:ring-0"
                          />
                          <div>
                            <p className="text-xs font-bold text-[#000f22]">
                              {acc.broker} • {acc.holderName}
                            </p>
                            <p className="text-[11px] text-[#74777e] font-mono">
                              DP: {acc.clientId} • PAN: {acc.panMasked}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-[#006d37]">
                            ₹{totalCostPerAccount.toLocaleString()}
                          </span>
                          <p className="text-[10px] text-[#74777e]">
                            {lots} Lot ({lots * selectedIpo.lotSize} Shs)
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* UPI ID for Mandate */}
              <div>
                <label className="block text-xs font-semibold text-[#43474d] mb-1.5">
                  Primary Mandate UPI ID (Auto-Rebalance)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                    placeholder="e.g. mobile@okhdfcbank"
                    className="flex-1 px-3 py-2 text-xs bg-[#f7f9fb] border border-[#c4c6ce] rounded-lg text-[#000f22] font-mono focus:outline-none focus:border-[#000f22]"
                  />
                  <span className="text-[11px] text-[#006d37] font-semibold bg-[#6bfe9c]/20 px-2 py-1 rounded">
                    UPI 2.0 Ready
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Mandate Summary Card (5 Columns) */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white rounded-xl p-6 border border-[#e0e3e5] shadow-2xs space-y-5">
              <h3 className="font-bold text-[#000f22] text-base">
                Batch Mandate Breakdown
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-[#e0e3e5]">
                  <span className="text-[#74777e]">Target Offering:</span>
                  <span className="font-semibold text-[#000f22]">{selectedIpo.symbol}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#e0e3e5]">
                  <span className="text-[#74777e]">Cut-off Bid Rate:</span>
                  <span className="font-mono font-semibold text-[#000f22]">₹{pricePerShare}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#e0e3e5]">
                  <span className="text-[#74777e]">Lots per Account:</span>
                  <span className="font-mono font-semibold text-[#000f22]">{lots} Lot</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#e0e3e5]">
                  <span className="text-[#74777e]">Participating Demats:</span>
                  <span className="font-semibold text-[#000f22]">{selectedAccounts.length} PANs</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-sm text-[#000f22] bg-[#f7f9fb] px-3 rounded-lg">
                  <span>Total Capital Blocked:</span>
                  <span className="font-mono text-[#006d37]">
                    ₹{totalCapitalBlocked.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Allotment Probability Gauge */}
              <div className="p-4 rounded-xl bg-[#f7f9fb] border border-[#e0e3e5] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#000f22]">Syndicate Allotment Probability</span>
                  <span className="font-bold text-[#006d37]">Very High (78%)</span>
                </div>
                <div className="w-full bg-[#eceef0] rounded-full h-2 overflow-hidden">
                  <div className="bg-[#006d37] h-full rounded-full" style={{ width: "78%" }} />
                </div>
                <p className="text-[10px] text-[#74777e] leading-relaxed">
                  Based on current retail subscription and {selectedAccounts.length} distinct PANs
                  participating in this batch deployment.
                </p>
              </div>

              {/* SEBI Notice */}
              <div className="flex items-start gap-2.5 text-[11px] text-[#74777e] leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-[#006d37] shrink-0 mt-0.5" />
                <span>
                  Funds remain safe in your bank account and continue earning savings interest until
                  registrar basis of allotment is finalized.
                </span>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={submitting || selectedAccounts.length === 0}
                className="w-full py-3 rounded-xl bg-[#000f22] hover:bg-[#0a2540] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <span>Dispatching Mandates...</span>
                ) : (
                  <span>Submit Batch UPI Mandate</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppNavigation>
  );
}

export default function SmartApplyPage() {
  return (
    <Suspense
      fallback={
        <AppNavigation pageTitle="Smart IPO Application">
          <div className="flex items-center justify-center p-12 text-sm text-[#74777e]">
            Loading application parameters...
          </div>
        </AppNavigation>
      }
    >
      <SmartApplyContent />
    </Suspense>
  );
}
