import { NavLink } from "react-router";
import { KeyRound } from "lucide-react";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const links = [
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-[#CBF1F5] dark:border-[#1e364d] bg-white/95 dark:bg-[#0b131e]/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 sm:gap-6">
          <NavLink
            to="/"
            className="flex items-center gap-2 font-bold text-base sm:text-lg tracking-tight hover:opacity-90 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#007ACC] text-white shadow-xs">
              <KeyRound className="h-4 w-4" />
            </div>
            <span className="text-foreground">Minivers</span>
          </NavLink>

          <nav className="flex gap-2 sm:gap-3 text-xs sm:text-sm font-medium">
            {links.map(({ to, label }) => {
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `px-2.5 py-1 rounded-md transition-colors ${
                      isActive
                        ? "bg-[#E3FDFD] text-[#007ACC] font-semibold dark:bg-[#162a3d] dark:text-[#A6E3E9]"
                        : "text-muted-foreground hover:text-foreground hover:bg-[#E3FDFD]/50 dark:hover:bg-[#162a3d]/50"
                    }`
                  }
                  end
                >
                  {label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
