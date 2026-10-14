"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  Wallet,
  Rocket,
  CheckCircle2,
  ChevronRight,
  Plus,
} from "lucide-react";
import { AppNavigation } from "@/components/AppNavigation";
import { api, IpoItem } from "@/lib/api";
import { SAMPLE_IPOS } from "@/lib/sampleData";

export default function DashboardPage() {
  const [ipos, setIpos] = useState<IpoItem[]>(SAMPLE_IPOS);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getIpos();
        if (data && data.length > 0) {
          setIpos(data);
        }
      } catch {
        // Fallback to sample data
      }
    }
    loadData();
  }, []);

  const totalInvested = "₹42,50,000";
  const pendingAllotment = "₹11,20,000";
  const refunded30d = "₹4,50,000";

  return (
    <AppNavigation pageTitle="Capital Flow Dashboard">
      <div className="space-y-8">
        {/* Top Section: Capital Overview Metric Cards */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-[#000f22] tracking-tight">
                Institutional Capital Overview
              </h1>
              <p className="text-xs text-[#74777e]">
                Real-time liquidity, blocked mandates, and uninvested funds across syndicate accounts.
              </p>
            </div>
            <Link
              href="/apply"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#006d37] text-white text-xs font-semibold hover:bg-[#005228] transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Deploy New Lot</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Invested */}
            <div className="bg-white rounded-xl p-6 border border-[#e0e3e5] shadow-2xs flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#74777e] mb-1">
                  Total Invested Capital
                </p>
                <h3 className="text-3xl font-extrabold text-[#000f22] font-mono tracking-tight">
                  {totalInvested}
                </h3>
              </div>
              <div className="mt-4 flex items-center text-[#006d37] text-xs font-semibold">
                <TrendingUp className="w-4 h-4 mr-1.5" />
                <span>+12.5% vs previous quarter</span>
              </div>
            </div>

            {/* Pending Allotment */}
            <div className="bg-white rounded-xl p-6 border border-[#e0e3e5] shadow-2xs flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-0 top-0 w-28 h-28 bg-[#6bfe9c]/10 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none" />
              <div className="relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#74777e] mb-1">
                  Pending Allotment Mandates
                </p>
                <h3 className="text-3xl font-extrabold text-[#000f22] font-mono tracking-tight">
                  {pendingAllotment}
                </h3>
              </div>
              <div className="mt-4 flex items-center text-[#74777e] text-xs font-medium relative z-10">
                <Clock className="w-4 h-4 mr-1.5 text-[#006d37]" />
                <span>Across 3 active UPI mandates</span>
              </div>
            </div>

            {/* Refunded & Liquid Wallet */}
            <div className="bg-white rounded-xl p-6 border border-[#e0e3e5] shadow-2xs flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#74777e] mb-1">
                  Refunded & Liquid Pool (30d)
                </p>
                <h3 className="text-3xl font-extrabold text-[#000f22] font-mono tracking-tight">
                  {refunded30d}
                </h3>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-[#006d37] font-semibold flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Available in linked accounts</span>
                </span>
                <Link
                  href="/accounts"
                  className="text-xs font-semibold text-[#000f22] hover:underline flex items-center gap-0.5"
                >
                  <span>Rebalance</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid: Capital Split Visualization & Recent Activity */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Capital Split Visualization (8 Columns) */}
          <div className="lg:col-span-8 bg-white rounded-xl p-6 border border-[#e0e3e5] shadow-2xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-[#000f22] text-base">Capital Split Visualization</h3>
                <p className="text-xs text-[#74777e]">
                  Real-time allocation ratio across linked syndicate entities
                </p>
              </div>
              <Link
                href="/accounts"
                className="text-xs font-semibold text-[#006d37] hover:underline flex items-center gap-1"
              >
                <span>Manage Accounts</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-4">
              {/* Account 1 */}
              <div className="flex items-center">
                <div className="w-36 shrink-0">
                  <span className="text-xs font-medium text-[#191c1e]">Alpha Fund (Lead)</span>
                </div>
                <div className="flex-1 h-2.5 bg-[#eceef0] rounded-full overflow-hidden mx-3">
                  <div className="h-full bg-[#000f22] rounded-full" style={{ width: "45%" }} />
                </div>
                <div className="w-24 text-right">
                  <span className="font-mono text-xs font-bold text-[#000f22]">₹19,12,500 (45%)</span>
                </div>
              </div>

              {/* Account 2 */}
              <div className="flex items-center">
                <div className="w-36 shrink-0">
                  <span className="text-xs font-medium text-[#191c1e]">Beta Demat Trust</span>
                </div>
                <div className="flex-1 h-2.5 bg-[#eceef0] rounded-full overflow-hidden mx-3">
                  <div className="h-full bg-[#006d37] rounded-full" style={{ width: "30%" }} />
                </div>
                <div className="w-24 text-right">
                  <span className="font-mono text-xs font-bold text-[#000f22]">₹12,75,000 (30%)</span>
                </div>
              </div>

              {/* Account 3 */}
              <div className="flex items-center">
                <div className="w-36 shrink-0">
                  <span className="text-xs font-medium text-[#191c1e]">Gamma Family Demat</span>
                </div>
                <div className="flex-1 h-2.5 bg-[#eceef0] rounded-full overflow-hidden mx-3">
                  <div className="h-full bg-[#314865] rounded-full" style={{ width: "15%" }} />
                </div>
                <div className="w-24 text-right">
                  <span className="font-mono text-xs font-bold text-[#000f22]">₹6,37,500 (15%)</span>
                </div>
              </div>

              {/* Account 4 */}
              <div className="flex items-center">
                <div className="w-36 shrink-0">
                  <span className="text-xs font-medium text-[#191c1e]">Retail Reserve Pool</span>
                </div>
                <div className="flex-1 h-2.5 bg-[#eceef0] rounded-full overflow-hidden mx-3">
                  <div className="h-full bg-[#74777e] rounded-full" style={{ width: "10%" }} />
                </div>
                <div className="w-24 text-right">
                  <span className="font-mono text-xs font-bold text-[#000f22]">₹4,25,000 (10%)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#e0e3e5] flex items-center justify-between text-xs text-[#74777e]">
              <span>4 Linked Demat Entities Active</span>
              <span className="font-mono font-semibold text-[#000f22]">Total: ₹42,50,000</span>
            </div>
          </div>

          {/* Recent Activity (4 Columns) */}
          <div className="lg:col-span-4 bg-white rounded-xl p-6 border border-[#e0e3e5] shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#000f22] text-base">Recent Activity</h3>
                <Link
                  href="/notifications"
                  className="text-xs font-semibold text-[#006d37] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#6bfe9c]/20 text-[#006d37] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-[#000f22] truncate">
                      TechNova Solutions
                    </p>
                    <p className="text-[11px] text-[#74777e]">Allotment Basis Released</p>
                    <p className="text-[10px] text-[#006d37] font-semibold mt-0.5">
                      ₹45,900 Mandate Active
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#d2e4ff] text-[#001c37] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-[#000f22] truncate">
                      Brainbeats Infotech
                    </p>
                    <p className="text-[11px] text-[#74777e]">Multi-Account Lot Submitted</p>
                    <p className="text-[10px] text-[#74777e] font-semibold mt-0.5">
                      1,000 Shares @ Cut-Off
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#eceef0] text-[#74777e] flex items-center justify-center shrink-0 mt-0.5">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-[#000f22] truncate">
                      Vanguard BioSciences
                    </p>
                    <p className="text-[11px] text-[#74777e]">UPI Mandate Unblocked</p>
                    <p className="text-[10px] text-[#74777e] font-semibold mt-0.5">
                      ₹30,400 Returned to HDFC
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#e0e3e5]">
              <Link
                href="/analytics"
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#f7f9fb] hover:bg-[#eceef0] text-xs font-semibold text-[#000f22] transition-colors"
              >
                <span>Full Allocation History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Active IPO Mandates Table */}
        <section className="bg-white rounded-xl border border-[#e0e3e5] shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-[#e0e3e5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-[#000f22] text-base">Active Public Offerings & Mandates</h3>
              <p className="text-xs text-[#74777e]">
                Direct live status from Indian registrars with probability estimation
              </p>
            </div>
            <Link
              href="/apply"
              className="px-3 py-1.5 bg-[#000f22] text-white rounded-lg text-xs font-semibold hover:bg-[#0a2540] transition-colors shadow-xs inline-flex items-center gap-1"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Smart Apply</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e0e3e5] bg-[#f7f9fb] text-[11px] font-bold uppercase tracking-wider text-[#74777e]">
                  <th className="p-4">Public Offering</th>
                  <th className="p-4">Exchange / Type</th>
                  <th className="p-4 text-right">Cut-Off Price</th>
                  <th className="p-4 text-right">Live GMP</th>
                  <th className="p-4 text-center">Allotment Probability</th>
                  <th className="p-4">Mandate Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e3e5] text-xs font-mono text-[#000f22]">
                {ipos.map((ipo) => (
                  <tr key={ipo.id} className="hover:bg-[#f7f9fb]/80 transition-colors">
                    <td className="p-4 font-sans font-semibold">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#000f22] text-[#6bfe9c] flex items-center justify-center font-bold text-xs shrink-0">
                          {ipo.companyName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#000f22]">{ipo.companyName}</p>
                          <p className="text-[11px] font-normal text-[#74777e]">{ipo.symbol || "MAIN"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-sans">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#eceef0] text-[#000f22]">
                        {ipo.category} • {ipo.exchange}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold">
                      ₹{ipo.issuePriceHigh || ipo.issuePriceLow || "-"}
                    </td>
                    <td className="p-4 text-right font-bold text-[#006d37]">
                      {ipo.gmp ? `+₹${ipo.gmp}` : "-"}
                    </td>
                    <td className="p-4 text-center font-sans">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#6bfe9c]/20 text-[#006d37]">
                        High (~18.4%)
                      </span>
                    </td>
                    <td className="p-4 font-sans">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          ipo.status === "Open"
                            ? "bg-[#6bfe9c]/20 text-[#006d37]"
                            : ipo.status === "Upcoming"
                            ? "bg-[#d3e4fe] text-[#001c37]"
                            : "bg-[#eceef0] text-[#74777e]"
                        }`}
                      >
                        {ipo.status === "Open" ? "Bidding Open" : ipo.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-sans">
                      <Link
                        href={`/apply?id=${ipo.id}`}
                        className="px-3 py-1 bg-[#f7f9fb] hover:bg-[#000f22] hover:text-white border border-[#c4c6ce] text-[#000f22] rounded text-xs font-semibold transition-all"
                      >
                        Deploy Lot
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppNavigation>
  );
}
