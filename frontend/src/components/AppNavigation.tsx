"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Landmark,
  Rocket,
  History,
  Bell,
  HelpCircle,
  Menu,
  X,
  Search,
  Plus,
  LogOut,
  LogIn,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AppNavigationProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function AppNavigation({ children, pageTitle }: AppNavigationProps) {
  const pathname = usePathname();
  const { user, isSignedIn, login, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount] = useState(2);

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Linked Accounts",
      href: "/accounts",
      icon: Landmark,
    },
    {
      label: "Smart Apply",
      href: "/apply",
      icon: Rocket,
    },
    {
      label: "Allocation History",
      href: "/analytics",
      icon: History,
    },
    {
      label: "Notifications",
      href: "/notifications",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex flex-col md:flex-row antialiased">
      {/* Desktop SideNavBar */}
      <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-[#f7f9fb] border-r border-[#e0e3e5] z-50 select-none">
        {/* Brand / Firm Header */}
        <div className="p-6 border-b border-[#e0e3e5]/60">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#000f22] flex items-center justify-center text-[#6bfe9c] shadow-sm group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 text-[#2ecc71]" />
            </div>
            <div>
              <h1 className="font-bold text-[#000f22] text-lg tracking-tight leading-snug">
                IPO Buddy
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#006d37]">
                Institutional Terminal
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#eceef0] text-[#000f22] font-semibold border-r-4 border-[#000f22] shadow-xs"
                    : "text-[#43474d] hover:bg-[#eceef0]/60 hover:text-[#000f22]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#000f22]" : "text-[#74777e]"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#006d37] text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User & Support Section */}
        <div className="p-4 border-t border-[#e0e3e5]/60 space-y-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg border border-[#c4c6ce] text-[#000f22] text-xs font-medium hover:bg-[#eceef0] transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#74777e]" />
            <span>Public Home & Docs</span>
          </Link>

          {isSignedIn && user ? (
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-[#000f22] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {user.displayName?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-[#000f22] truncate">
                    {user.displayName}
                  </p>
                  <p className="text-[10px] text-[#74777e] truncate font-mono">
                    {user.subscriptionTier || "Pro Tier"}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-[#74777e] hover:text-[#ba1a1a] rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#000f22] text-white text-xs font-semibold hover:bg-[#0a2540] transition-colors shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connect Wallet / Login</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex justify-between items-center w-full px-4 py-3 bg-white border-b border-[#e0e3e5] sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#000f22] hover:bg-[#eceef0] rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#000f22] flex items-center justify-center text-white">
              <TrendingUp className="w-4 h-4 text-[#2ecc71]" />
            </div>
            <span className="font-bold text-[#000f22] text-base tracking-tight">IPO Buddy</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="relative p-2 text-[#43474d] hover:text-[#000f22] rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#ba1a1a] rounded-full" />
            )}
          </Link>
          {isSignedIn && user ? (
            <div className="w-7 h-7 rounded-full bg-[#000f22] text-white font-bold text-xs flex items-center justify-center">
              {user.displayName?.charAt(0).toUpperCase() || "U"}
            </div>
          ) : (
            <button
              onClick={login}
              className="text-xs font-semibold px-2.5 py-1 bg-[#000f22] text-white rounded-md"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex">
          <div className="w-64 bg-white h-full p-4 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#e0e3e5]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#000f22] flex items-center justify-center text-white">
                    <TrendingUp className="w-4 h-4 text-[#2ecc71]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[#000f22] text-sm">IPO Buddy</h2>
                    <p className="text-[10px] text-[#006d37] font-semibold">Institutional</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-[#74777e] hover:text-[#000f22]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                        isActive
                          ? "bg-[#eceef0] text-[#000f22] font-semibold"
                          : "text-[#43474d] hover:bg-[#eceef0]/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#006d37] text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#e0e3e5]">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center text-xs font-medium py-2 rounded bg-[#f7f9fb] border border-[#e0e3e5] text-[#000f22] mb-3"
              >
                Go to Public Landing Page
              </Link>
              {isSignedIn ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-xs text-[#ba1a1a] font-semibold py-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    login();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-xs font-semibold py-2 bg-[#000f22] text-white rounded"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Workspace Canvas */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-white border-b border-[#e0e3e5] sticky top-0 z-30 shadow-2xs">
          <div>
            <h2 className="font-bold text-[#000f22] text-lg tracking-tight">
              {pageTitle || "Terminal Overview"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#74777e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search IPOs, Demats, Mandates..."
                className="pl-9 pr-4 py-1.5 text-xs bg-[#f7f9fb] border border-[#c4c6ce] rounded-lg text-[#000f22] focus:outline-none focus:border-[#000f22] focus:ring-1 focus:ring-[#000f22]/20 w-64 transition-all"
              />
            </div>

            <Link
              href="/apply"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#000f22] text-white text-xs font-semibold hover:bg-[#0a2540] transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Smart Apply</span>
            </Link>

            <Link
              href="/notifications"
              className="relative p-2 text-[#43474d] hover:text-[#000f22] hover:bg-[#eceef0] rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full" />
              )}
            </Link>

            <div className="h-5 w-px bg-[#e0e3e5]" />

            {isSignedIn && user ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#000f22] text-white text-xs font-bold flex items-center justify-center">
                  {user.displayName?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-semibold text-[#000f22] leading-none">
                    {user.displayName}
                  </p>
                  <p className="text-[10px] text-[#006d37] font-semibold mt-0.5">Verified Demats</p>
                </div>
              </div>
            ) : (
              <button
                onClick={login}
                className="text-xs font-semibold px-3 py-1.5 bg-[#eceef0] hover:bg-[#e0e3e5] text-[#000f22] rounded-lg transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Child Screen Content */}
        <main className="flex-1 p-4 md:p-8 max-w-[1280px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
