import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Moon,
  LayoutDashboard,
  Users,
  BarChart3,
  PenTool,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard#familias", label: "Familias", icon: Users },
  { href: "/dashboard#analytics", label: "Analíticas", icon: BarChart3 },
  { href: "/dashboard#contenido", label: "Contenido", icon: PenTool },
  { href: "/dashboard#ajustes", label: "Ajustes", icon: Settings },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";
  const initials = userName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-30">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Moon className="w-6 h-6 text-violet-600" />
            <span className="text-xl font-bold text-gray-900">Nanni</span>
            <span className="text-xs font-medium bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
              Pro
            </span>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition"
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-semibold text-violet-700">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userName}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <form action="/api/auth/signout" method="POST" className="mt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 transition w-full rounded-lg hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-violet-600" />
            <span className="font-bold text-gray-900">Nanni</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700">
            {initials}
          </div>
        </div>
        <nav className="flex overflow-x-auto px-2 pb-2 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition whitespace-nowrap"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-24 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
