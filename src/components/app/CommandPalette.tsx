"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, LayoutDashboard, Users, BarChart3, Palette, Settings, Moon, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Family } from "@/lib/types";

interface CommandPaletteProps {
  families: Family[];
}

const staticRoutes = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Familias", href: "/familias", icon: Users },
  { label: "Analíticas", href: "/analiticas", icon: BarChart3 },
  { label: "Mi marca", href: "/marca", icon: Palette },
  { label: "Ajustes", href: "/ajustes", icon: Settings },
];

export function CommandPalette({ families }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.toLowerCase();
    const familyResults = families
      .filter((f) => f.baby_name.toLowerCase().includes(q))
      .map((f) => ({
        label: f.baby_name,
        href: `/familia/${f.id}`,
        icon: Moon,
        type: "family" as const,
      }));
    const routeResults = staticRoutes.filter((r) =>
      r.label.toLowerCase().includes(q)
    ).map((r) => ({ ...r, type: "route" as const }));
    return [...routeResults, ...familyResults];
  }, [query, families]);

  function navigate(href: string) {
    router.push(href);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      navigate(results[selectedIndex].href);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh]"
      onClick={() => setOpen(false)}
    >
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar familias, páginas..."
            className="w-full py-3.5 text-sm outline-none placeholder:text-gray-400"
          />
          <kbd className="hidden sm:flex text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        <div className="max-h-64 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin resultados</p>
          ) : (
            results.map((item, i) => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                  i === selectedIndex ? "bg-nanni-50 text-nanni-700" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left font-medium">{item.label}</span>
                {item.type === "family" && (
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Familia</span>
                )}
                <ArrowRight className="w-3 h-3 text-gray-300" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
