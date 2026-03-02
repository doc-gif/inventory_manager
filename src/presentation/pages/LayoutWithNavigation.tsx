import { Outlet, useLocation, useNavigate } from "react-router";
import { Package, History, Archive, Plus, LucideIcon } from "lucide-react";
import { Toaster } from "sonner";

import { useHydrateInventory } from "@/presentation/hooks/useHydrateInventory";
import React from "react";
import {InstallPrompt} from "@/presentation/components/InstallPrompt";

type NavItem = {
    path: string;
    icon: LucideIcon;
    label: string;
    highlight?: boolean;
};

const navItems: NavItem[] = [
  { path: "/", icon: Package, label: "在庫" },
  { path: "/history", icon: History, label: "履歴" },
  { path: "/add", icon: Plus, label: "追加", highlight: true },
  { path: "/archive", icon: Archive, label: "アーカイブ" },
];

export function LayoutPage() {
  useHydrateInventory();

  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background font-[Noto_Sans_JP,sans-serif] max-w-lg mx-auto relative">
      <Outlet />

        <InstallPrompt />

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around py-1.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);

            if (item.highlight) {
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-0.5 px-4 py-1 -mt-4"
                >
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-primary">{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <Toaster position="top-center" />
    </div>
  );
}
