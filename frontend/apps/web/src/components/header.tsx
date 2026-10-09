import { useState } from "react";
import { NavLink, useLocation } from "react-router";
import {
  KeyRound,
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Receipt,
  CalendarCheck,
  CreditCard,
  UserCheck,
  Users,
  FolderLock,
  BookOpen,
  Handshake,
} from "lucide-react";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { Button } from "./ui/button";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const desktopLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/dashboard?tab=accounts", label: "Accounts" },
    { to: "/dashboard?tab=expenses", label: "Expenses" },
    { to: "/dashboard?tab=attendance", label: "Attendance" },
    { to: "/dashboard?tab=vault", label: "Vault" },
  ] as const;

  const allModuleLinks = [
    { to: "/dashboard", label: "Dashboard Overview", icon: LayoutDashboard },
    { to: "/dashboard?tab=accounts", label: "Bank Accounts & Balance", icon: Building2 },
    { to: "/dashboard?tab=expenses", label: "Daily Costs & Expenses", icon: Receipt },
    { to: "/dashboard?tab=attendance", label: "Office & Gym Attendance", icon: CalendarCheck },
    { to: "/dashboard?tab=payments", label: "Payment Management", icon: CreditCard },
    { to: "/dashboard?tab=biodata", label: "Personal Biodata", icon: UserCheck },
    { to: "/dashboard?tab=contacts", label: "Family & Friends", icon: Users },
    { to: "/dashboard?tab=documents", label: "Documents & Storage", icon: FolderLock },
    { to: "/dashboard?tab=notes", label: "Thoughts & Notes", icon: BookOpen },
    { to: "/dashboard?tab=vault", label: "Password Vault", icon: KeyRound },
    { to: "/dashboard?tab=debt", label: "Borrowing & Lending", icon: Handshake },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#CBF1F5] dark:border-[#1e364d] bg-white/95 dark:bg-[#0b131e]/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 font-bold text-base sm:text-lg tracking-tight hover:opacity-90 transition-opacity shrink-0"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#007ACC] text-white shadow-xs">
              <KeyRound className="h-4 w-4" />
            </div>
            <span className="text-foreground font-black">Minivers</span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-1.5 sm:gap-2 text-xs font-semibold">
            {desktopLinks.map(({ to, label }) => {
              const isActive = location.pathname + location.search === to;
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#E3FDFD] text-[#007ACC] font-bold dark:bg-[#162a3d] dark:text-[#A6E3E9]"
                      : "text-muted-foreground hover:text-foreground hover:bg-[#E3FDFD]/50 dark:hover:bg-[#162a3d]/50"
                  }`}
                >
                  {label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ModeToggle />
          <UserMenu />

          {/* Mobile hamburger button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden text-foreground ml-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#CBF1F5] dark:border-[#1e364d] bg-background/98 backdrop-blur-md px-4 py-3 space-y-1 max-h-[80vh] overflow-y-auto animate-in slide-in-from-top-2 duration-150">
          <div className="text-[11px] font-bold text-muted-foreground uppercase px-2 py-1">
            Minivers Modules
          </div>
          <div className="grid grid-cols-1 gap-1">
            {allModuleLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname + location.search === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#E3FDFD] text-[#007ACC] font-bold dark:bg-[#162a3d] dark:text-[#A6E3E9]"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4 text-[#007ACC] dark:text-[#A6E3E9] shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
