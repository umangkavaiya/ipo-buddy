"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  ArrowUpRight,
  Filter,
  Download,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Calculator,
  ChevronRight,
} from "lucide-react";
import { AppNavigation } from "@/components/AppNavigation";
import { SAMPLE_ALLOCATIONS, AllocationRecord } from "@/lib/sampleData";
import { api, TaxCalculationResult } from "@/lib/api";

export default function AnalyticsPage() {
  const [allocations, setAllocations] = useState<AllocationRecord[]>(SAMPLE_ALLOCATIONS);
  const [yearFilter, setYearFilter] = useState("All Years");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  // Tax Calculator State
  const [taxGainInput, setTaxGainInput] = useState<string>("1420000");
  const [taxResult, setTaxResult] = useState<TaxCalculationResult | null>(null);
  const [calculatingTax, setCalculatingTax] = useState(false);

  const filteredAllocations = allocations.filter((item) => {
    if (statusFilter !== "All Statuses" && item.status !== statusFilter) return false;
    return true;
  });

  const handleExportCsv = () => {
    const headers = "IPO Name,Symbol,Sector,Date,Amount Blocked,Accounts,Status,Listing Gain Pct,Profit Realized\n";
    const rows = allocations
      .map(
        (a) =>
          `"${a.ipoName}","${a.symbol}","${a.sector}","${a.appliedDate}",${a.amountBlocked},${a.accountsCount},"${a.status}",${a.listingGainPct || 0},${a.profitRealized || 0}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ipo_buddy_allocation_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCalculateTax = async () => {
    try {
      setCalculatingTax(true);
      const gain = Number(taxGainInput) || 0;
      const res = await api.calculateTax(gain);
      setTaxResult(res);
    } catch {
      // Offline fallback: STCG Section 111A 20%
      const gain = Number(taxGainInput) || 0;
      const tax = Math.round(gain * 0.2);
      setTaxResult({
        grossGain: gain,
        stcgTaxRatePct: 20,
        taxPayable: tax,
        netAfterTax: gain - tax,
      });
    } finally {
      setCalculatingTax(false);
    }
  };

  return (
    <AppNavigation pageTitle="Allocation History & Analytics">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#000f22] tracking-tight">
              Allocation History & Analytics
            </h1>
            <p className="text-xs text-[#74777e]">
              Review past syndicate commitments, allotment outcomes, and listing gains.
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#c4c6ce] text-[#000f22] rounded-lg text-xs font-semibold hover:bg-[#eceef0] transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#006d37]" />
            <span>Export Ledger (.CSV)</span>
          </button>
        </div>

        {/* Bento Grid: Table on Left (9 cols), Metrics on Right (3 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Filters and Records Table */}
          <div className="lg:col-span-8 space-y-4">
            {/* Filter Bar */}
            <div className="bg-white rounded-xl p-3.5 border border-[#e0e3e5] shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#74777e]">
                <Filter className="w-3.5 h-3.5" />
                <span className="font-bold uppercase tracking-wider text-[10px]">Filters</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[#f7f9fb] border border-[#c4c6ce] rounded-lg text-[#000f22] font-semibold"
                >
                  <option>All Years</option>
                  <option>2026</option>
                  <option>2025</option>
                  <option>2024</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[#f7f9fb] border border-[#c4c6ce] rounded-lg text-[#000f22] font-semibold"
                >
                  <option>All Statuses</option>
                  <option>Allocated</option>
                  <option>Not Allocated</option>
                  <option>Pending</option>
                </select>
              </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-xl border border-[#e0e3e5] shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#e0e3e5] bg-[#f7f9fb] text-[10px] font-bold uppercase tracking-wider text-[#74777e]">
                      <th className="p-3.5">Public Offering</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5 text-right">Amount Blocked</th>
                      <th className="p-3.5 text-center">Accounts</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Listing Gain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e3e5] text-xs font-mono text-[#000f22]">
                    {filteredAllocations.map((item) => (
                      <tr key={item.id} className="hover:bg-[#f7f9fb]/80 transition-colors">
                        <td className="p-3.5 font-sans">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded bg-[#000f22] text-[#6bfe9c] flex items-center justify-center font-bold text-[10px] shrink-0">
                              {item.symbol.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-semibold text-[#000f22] text-xs">{item.ipoName}</p>
                              <p className="text-[10px] text-[#74777e]">{item.sector}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-sans text-[#74777e]">{item.appliedDate}</td>
                        <td className="p-3.5 text-right font-bold">
                          ₹{item.amountBlocked.toLocaleString("en-IN")}
                        </td>
                        <td className="p-3.5 text-center font-bold">{item.accountsCount}</td>
                        <td className="p-3.5 font-sans">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === "Allocated"
                                ? "bg-[#6bfe9c]/20 text-[#006d37]"
                                : item.status === "Pending"
                                ? "bg-[#d3e4fe] text-[#001c37]"
                                : "bg-[#eceef0] text-[#74777e]"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {item.profitRealized ? (
                            <span className="font-bold text-[#006d37]">
                              +₹{item.profitRealized.toLocaleString()} ({item.listingGainPct}%)
                            </span>
                          ) : (
                            <span className="text-[#74777e]">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 border-t border-[#e0e3e5] flex justify-between items-center text-xs text-[#74777e] bg-[#f7f9fb]">
                <span>Showing {filteredAllocations.length} of {allocations.length} records</span>
                <span className="font-semibold text-[#000f22]">Ledger Clean & Reconciled</span>
              </div>
            </div>
          </div>

          {/* Right Column: Success Metrics & Tax Calculator */}
          <div className="lg:col-span-4 space-y-6">
            {/* Success Rate Card */}
            <div className="bg-[#000f22] text-white rounded-xl p-5 shadow-sm space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6bfe9c]">
                Allotment Success Rate (YTD)
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white font-mono">78%</span>
                <span className="text-xs text-[#6bfe9c] font-semibold flex items-center">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                  +12% vs single PAN
                </span>
              </div>
              <div className="w-full bg-[#0a2540] rounded-full h-2 overflow-hidden">
                <div className="bg-[#6bfe9c] h-full rounded-full" style={{ width: "78%" }} />
              </div>
              <div className="flex justify-between text-[11px] text-[#b0c8eb]">
                <span>14 Lots Allocated</span>
                <span>18 Batch Deployments</span>
              </div>
            </div>

            {/* Estimated Total Gain Card */}
            <div className="bg-white rounded-xl p-5 border border-[#e0e3e5] shadow-2xs space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#74777e]">
                Est. Total Listing Gains
              </p>
              <h3 className="text-2xl font-extrabold text-[#000f22] font-mono">₹ 14,20,000</h3>
              <p className="text-xs font-semibold text-[#006d37] flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+18.5% Average Listing Pop</span>
              </p>
            </div>

            {/* STCG Tax Calculator Widget */}
            <div className="bg-white rounded-xl p-5 border border-[#e0e3e5] shadow-2xs space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#006d37]" />
                <h4 className="font-bold text-[#000f22]">STCG Section 111A Advisory</h4>
              </div>

              <div>
                <label className="block text-[#74777e] mb-1 font-medium">
                  Taxable Listing Gain (₹)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={taxGainInput}
                    onChange={(e) => setTaxGainInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#f7f9fb] border border-[#c4c6ce] rounded-lg font-mono"
                  />
                  <button
                    onClick={handleCalculateTax}
                    disabled={calculatingTax}
                    className="px-3 py-1.5 bg-[#000f22] text-white rounded-lg font-semibold hover:bg-[#0a2540]"
                  >
                    Calculate
                  </button>
                </div>
              </div>

              {taxResult && (
                <div className="p-3 bg-[#f7f9fb] rounded-lg border border-[#e0e3e5] space-y-1.5 font-mono">
                  <div className="flex justify-between text-[#74777e]">
                    <span>Gross Gain:</span>
                    <span>₹{taxResult.grossGain.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#ba1a1a]">
                    <span>Tax (20% Sec 111A):</span>
                    <span>-₹{taxResult.taxPayable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#006d37] pt-1 border-t border-[#e0e3e5]">
                    <span>Net After Tax:</span>
                    <span>₹{taxResult.netAfterTax.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Allocation Logic Notice */}
            <div className="bg-[#eceef0]/60 rounded-xl p-4 border border-[#e0e3e5] flex gap-3 text-xs text-[#43474d]">
              <Info className="w-4 h-4 text-[#000f22] shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                Under SEBI regulations, all retail allotments are made on a proportionate / lottery basis.
                All unallocated funds are automatically released back to the investor&apos;s bank account on T+2.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppNavigation>
  );
}
