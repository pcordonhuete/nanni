"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import {
  Moon, LayoutDashboard, Users, BarChart3, Palette, Settings,
  LogOut, MoreHorizontal, Plus, Search,
} from "lucide-react";
import { NotificationPanel } from "@/components/app/NotificationPanel";
import { CommandPalette } from "@/components/app/CommandPalette";
import { InviteFamily } from "@/components/app/InviteFamily";
import type { Notification, Family, SubscriptionPlan } from "@/lib/types";

interface NavigationProps {
  userName: string;
  userEmail: string;
  userInitials: string;
  notifications: Notification[];
  unreadCount: number;
  families: Family[];
  plan: SubscriptionPlan;
  trialDaysLeft?: number;
}

const sidebarGroups = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/familias", label: "Familias", icon: Users },
      { href: "/analiticas", label: "Analíticas", icon: BarChart3 },
    ],
  },
  {
    label: "Herramientas",
    items: [{ href: "/marca", label: "Mi marca", icon: Palette }],
  },
  {
    label: "Cuenta",
    items: [{ href: "/ajustes", label: "Ajustes", icon: Settings }],
  },
];

const mobileNavItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/familias", label: "Familias", icon: Users },
  { href: "/analiticas", label: "Datos", icon: BarChart3 },
  { href: "/ajustes", label: "Más", icon: MoreHorizontal },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

const planLabels: Record<SubscriptionPlan, string> = {
  trial: "Trial",
  basico: "Básico",
  premium: "Premium",
};

export default function Navigation({
  userName, userEmail, userInitials,
  notifications, unreadCount, families, plan, trialDaysLeft,
}: NavigationProps) {
  const pathname = usePathname();
  const [showInvite, setShowInvite] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <>
      <CommandPalette families={families} />
      <InviteFamily open={showInvite} onClose={() => setShowInvite(false)} />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-30">
        <div className="p-5 pb-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-nanni-600 flex items-center justify-center">
              <Moon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Nanni</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              plan === "trial"
                ? "bg-amber-100 text-amber-700"
                : plan === "premium"
                ? "bg-nanni-100 text-nanni-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {planLabels[plan]}
              {trialDaysLeft !== undefined && ` · ${trialDaysLeft}d`}
            </span>
          </Link>
        </div>

        {/* Quick search */}
        <div className="px-3 mb-4">
          <button
            onClick={() => {
              const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
              window.dispatchEvent(event);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">Buscar...</span>
            <kbd className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </button>
        </div>

        {/* Add family button */}
        <div className="px-3 mb-4">
          <button
            onClick={() => setShowInvite(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-white bg-nanni-600 rounded-xl hover:bg-nanni-700 transition"
          >
            <Plus className="w-4 h-4" />
            Añadir familia
          </button>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto">
          {sidebarGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                        active
                          ? "bg-nanni-50 text-nanni-700"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <item.icon className={`w-[18px] h-[18px] ${active ? "text-nanni-600" : ""}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-nanni-100 flex items-center justify-center text-xs font-bold text-nanni-700 shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
              <p className="text-[11px] text-gray-400 truncate">{userEmail}</p>
            </div>
            <NotificationPanel notifications={notifications} unreadCount={unreadCount} />
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 px-3 py-2 mt-1 text-sm text-gray-400 hover:text-red-600 transition w-full rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-nanni-600 flex items-center justify-center">
              <Moon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Nanni</span>
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowInvite(true)}
              className="p-2 text-nanni-600 hover:bg-nanni-50 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
            </button>
            <NotificationPanel notifications={notifications} unreadCount={unreadCount} />
            <div className="w-8 h-8 rounded-full bg-nanni-100 flex items-center justify-center text-[10px] font-bold text-nanni-700 ml-1">
              {userInitials}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 min-w-[56px] transition relative ${
                  active ? "text-nanni-600" : "text-gray-400"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-nanni-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
