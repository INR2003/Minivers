import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Building2,
  Receipt,
  CalendarCheck,
  CreditCard,
  UserCheck,
  Users,
  FolderLock,
  BookOpen,
  KeyRound,
  Handshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { api } from "@/lib/api";
import DashboardOverview from "@/components/modules/DashboardOverview";
import BankAccountsModule from "@/components/modules/BankAccountsModule";
import ExpensesModule from "@/components/modules/ExpensesModule";
import AttendanceModule from "@/components/modules/AttendanceModule";
import PaymentsModule from "@/components/modules/PaymentsModule";
import BiodataModule from "@/components/modules/BiodataModule";
import ContactsModule from "@/components/modules/ContactsModule";
import DocumentsModule from "@/components/modules/DocumentsModule";
import NotesModule from "@/components/modules/NotesModule";
import VaultModule from "@/components/modules/VaultModule";
import DebtModule from "@/components/modules/DebtModule";

const MODULE_TABS = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "accounts", label: "Bank Accounts", icon: Building2 },
  { id: "expenses", label: "Daily Costs", icon: Receipt },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "biodata", label: "Biodata", icon: UserCheck },
  { id: "contacts", label: "Family & Friends", icon: Users },
  { id: "documents", label: "Documents", icon: FolderLock },
  { id: "notes", label: "Thoughts", icon: BookOpen },
  { id: "vault", label: "Vault Passwords", icon: KeyRound },
  { id: "debt", label: "Borrow & Lend", icon: Handshake },
] as const;

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get("tab") || "overview";

  const storedUserRaw = typeof window !== "undefined" ? localStorage.getItem("minivers_user") : null;
  const currentUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;

  // Live health check
  const { data: healthData } = useQuery({
    queryKey: ["django-health"],
    queryFn: async () => {
      const res = await fetch("http://127.0.0.1:8000/");
      return res.json() as Promise<{ status: string; message: string }>;
    },
    retry: false,
  });

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#007ACC] border-t-transparent" />
      </div>
    );
  }

  const setTab = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  const userName = currentUser?.name || "Iyyanar";

  return (
    <div className="container mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* Top Banner Header */}
      <div className="rounded-2xl border border-[#CBF1F5] dark:border-[#1e364d] bg-gradient-to-r from-[#E3FDFD] via-white to-[#CBF1F5]/40 dark:from-[#111d2e] dark:via-[#0b131e] dark:to-[#162a3d] p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Minivers
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#007ACC]/10 text-[#007ACC] dark:text-[#A6E3E9]">
                Personal Life Management
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Welcome, <span className="font-semibold text-foreground">{userName}</span>. Private workspace for finances, records, and daily habits.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-[#111d2e] border border-[#71C9CE]/60 px-3 py-1 text-xs font-semibold text-[#007ACC] dark:text-[#A6E3E9] shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-[#71C9CE]" />
              <span>{healthData?.status === "ok" ? "Live Vault Active ✓" : "Vault Secure"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Module Select Dropdown (visible only on small screens < 640px) */}
      <div className="sm:hidden">
        <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1.5">
          Select Module
        </label>
        <select
          value={currentTab}
          onChange={(e) => setTab(e.target.value)}
          className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground shadow-xs focus:ring-2 focus:ring-[#007ACC] focus:outline-hidden"
        >
          {MODULE_TABS.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Horizontal Scrollable Tabs Navigation for Tablets & Desktops */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border touch-pan-x">
        {MODULE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all border-b-2 shrink-0 ${
                isActive
                  ? "border-[#007ACC] text-[#007ACC] dark:text-[#A6E3E9] bg-muted/60"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Module Content */}
      <div className="transition-all animate-in fade-in-50 duration-200">
        {currentTab === "overview" && <DashboardOverview onSelectModule={setTab} />}
        {currentTab === "accounts" && <BankAccountsModule />}
        {currentTab === "expenses" && <ExpensesModule />}
        {currentTab === "attendance" && <AttendanceModule />}
        {currentTab === "payments" && <PaymentsModule />}
        {currentTab === "biodata" && <BiodataModule />}
        {currentTab === "contacts" && <ContactsModule />}
        {currentTab === "documents" && <DocumentsModule />}
        {currentTab === "notes" && <NotesModule />}
        {currentTab === "vault" && <VaultModule />}
        {currentTab === "debt" && <DebtModule />}
      </div>
    </div>
  );
}
