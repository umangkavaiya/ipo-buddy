"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Search,
  Filter,
  CheckCheck,
  CheckCircle2,
  Clock,
  Landmark,
  Wallet,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import { AppNavigation } from "@/components/AppNavigation";
import { SAMPLE_NOTIFICATIONS, ActivityNotification } from "@/lib/sampleData";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<ActivityNotification[]>(
    SAMPLE_NOTIFICATIONS
  );
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter((item) => {
    const matchesTab =
      activeTab === "All" ||
      (activeTab === "Allotments" && item.type === "allotment") ||
      (activeTab === "Mandates" && item.type === "mandate") ||
      (activeTab === "Syndicate" && (item.type === "split" || item.type === "rebalance"));

    const matchesSearch =
      item.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.description.toLowerCase().includes(searchFilter.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const groups = ["Today", "Yesterday", "Earlier"] as const;

  const getIcon = (type: ActivityNotification["type"]) => {
    switch (type) {
      case "allotment":
        return <CheckCircle2 className="w-4 h-4 text-[#006d37]" />;
      case "mandate":
        return <Wallet className="w-4 h-4 text-[#0a2540]" />;
      case "rebalance":
        return <Landmark className="w-4 h-4 text-[#006d37]" />;
      case "bidding":
        return <TrendingUp className="w-4 h-4 text-[#006d37]" />;
      case "split":
        return <FileSpreadsheet className="w-4 h-4 text-[#0a2540]" />;
      default:
        return <Bell className="w-4 h-4 text-[#74777e]" />;
    }
  };

  return (
    <AppNavigation pageTitle="Activity Log & Notifications">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#000f22] tracking-tight">
              Activity Log & Notifications
            </h1>
            <p className="text-xs text-[#74777e]">
              Real-time registrar allotment drops, UPI mandate unblocks, and syndicate splits.
            </p>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#c4c6ce] text-[#000f22] rounded-lg text-xs font-semibold hover:bg-[#eceef0] transition-colors shadow-2xs"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#006d37]" />
            <span>Mark All Read</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-xl p-4 border border-[#e0e3e5] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#74777e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#f7f9fb] border border-[#c4c6ce] rounded-lg text-[#000f22] focus:outline-none focus:border-[#000f22]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {["All", "Allotments", "Mandates", "Syndicate"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-[#000f22] text-white shadow-xs"
                    : "bg-[#f7f9fb] text-[#43474d] hover:bg-[#eceef0]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline by Group */}
        <div className="space-y-6">
          {groups.map((group) => {
            const items = filteredNotifications.filter((n) => n.group === group);
            if (items.length === 0) return null;

            return (
              <div key={group} className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#74777e] px-1">
                  {group}
                </h3>

                <div className="space-y-3">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs ${
                        !item.read
                          ? "border-[#000f22]/40 bg-gradient-to-r from-white via-white to-[#f7f9fb]"
                          : "border-[#e0e3e5]"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-lg bg-[#f7f9fb] border border-[#e0e3e5] flex items-center justify-center shrink-0 mt-0.5">
                          {getIcon(item.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-bold text-[#000f22] text-sm leading-tight">
                              {item.title}
                            </h4>
                            {item.statusBadge && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  item.statusBadgeType === "success"
                                    ? "bg-[#6bfe9c]/20 text-[#006d37]"
                                    : item.statusBadgeType === "warning"
                                    ? "bg-[#d3e4fe] text-[#001c37]"
                                    : "bg-[#eceef0] text-[#74777e]"
                                }`}
                              >
                                {item.statusBadge}
                              </span>
                            )}
                            {!item.read && (
                              <span className="w-2 h-2 rounded-full bg-[#006d37]" />
                            )}
                          </div>
                          <p className="text-xs text-[#43474d] leading-relaxed max-w-xl">
                            {item.description}
                          </p>
                          <span className="text-[10px] text-[#74777e] font-mono mt-1 block">
                            {item.timestamp}
                          </span>
                        </div>
                      </div>

                      {item.actionText && item.actionHref && (
                        <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e0e3e5] flex justify-end">
                          <Link
                            href={item.actionHref}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f7f9fb] hover:bg-[#000f22] hover:text-white border border-[#c4c6ce] text-[#000f22] text-xs font-semibold transition-all"
                          >
                            <span>{item.actionText}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredNotifications.length === 0 && (
            <div className="p-12 text-center bg-white rounded-xl border border-[#e0e3e5]">
              <Bell className="w-8 h-8 text-[#c4c6ce] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#000f22]">No notifications found</p>
              <p className="text-xs text-[#74777e] mt-1">
                Try selecting a different filter or search term.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppNavigation>
  );
}
