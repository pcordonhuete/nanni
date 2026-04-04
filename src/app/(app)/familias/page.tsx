"use client";

import Link from "next/link";
import { useState, useEffect, useTransition } from "react";
import {
  Search, TrendingUp, Clock, AlertTriangle, Minus, ArrowRight,
  Plus, LayoutGrid, List, Moon, Users, CheckSquare, Square,
  Pause, Play, Archive, Trash2, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { babyAgeLabel, timeAgo, cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { FamilyCardSkeleton } from "@/components/ui/Skeleton";
import { InviteFamily } from "@/components/app/InviteFamily";
import { bulkUpdateFamilyStatus } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import type { Family, ActivityRecord } from "@/lib/types";

interface FamilyRow extends Family {
  last_record_at: string | null;
  record_count: number;
}

const statusIcons: Record<string, typeof TrendingUp> = {
  Mejorando: TrendingUp,
  "En proceso": Clock,
  Atención: AlertTriangle,
  Estable: Minus,
};

const filters = [
  { label: "Todos", value: "all" },
  { label: "Activas", value: "active" },
  { label: "Pausadas", value: "paused" },
  { label: "Completadas", value: "completed" },
];

export default function FamiliasPage() {
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showInvite, setShowInvite] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filtered.map((f) => f.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setBulkMode(false);
  }

  function handleBulkAction(status: string) {
    if (selectedIds.size === 0) return;
    startTransition(async () => {
      const result = await bulkUpdateFamilyStatus(Array.from(selectedIds), status);
      if (result.error) {
        toast(result.error, "error");
      } else {
        setFamilies((prev) => prev.map((f) => selectedIds.has(f.id) ? { ...f, status: status as Family["status"] } : f));
        toast(`${selectedIds.size} familia(s) actualizadas`);
        clearSelection();
      }
    });
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: fams } = await supabase
        .from("families")
        .select("*")
        .eq("advisor_id", user.id)
        .order("created_at", { ascending: false });

      if (fams) {
        const enriched: FamilyRow[] = await Promise.all(
          fams.map(async (f: Family) => {
            const { data: lastRec } = await supabase
              .from("activity_records")
              .select("created_at")
              .eq("family_id", f.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            const { count } = await supabase
              .from("activity_records")
              .select("*", { count: "exact", head: true })
              .eq("family_id", f.id);

            return {
              ...f,
              last_record_at: lastRec?.created_at || null,
              record_count: count || 0,
            };
          })
        );
        setFamilies(enriched);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = families.filter((f) => {
    const matchesSearch = f.baby_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "all" || f.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <InviteFamily open={showInvite} onClose={() => setShowInvite(false)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Familias</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {families.length} familia{families.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="bg-nanni-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-nanni-700 transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Añadir familia
        </button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre del bebé..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>
          <div className="hidden sm:flex border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-2.5 transition", viewMode === "grid" ? "bg-nanni-50 text-nanni-600" : "text-gray-400 hover:text-gray-600")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-2.5 transition", viewMode === "list" ? "bg-nanni-50 text-nanni-600" : "text-gray-400 hover:text-gray-600")}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                "text-xs font-medium px-3.5 py-1.5 rounded-full transition whitespace-nowrap",
                activeFilter === f.value
                  ? "bg-nanni-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-nanni-300"
              )}
            >
              {f.label}
              {f.value !== "all" && (
                <span className="ml-1 opacity-70">
                  ({families.filter((fam) => f.value === "all" || fam.status === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions bar */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2">
          {!bulkMode ? (
            <button onClick={() => setBulkMode(true)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition">
              <CheckSquare className="w-3.5 h-3.5" /> Selección múltiple
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap bg-nanni-50 rounded-xl px-3 py-2 w-full">
              <button onClick={selectAll} className="text-xs text-nanni-600 font-medium hover:text-nanni-800">Seleccionar todos</button>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{selectedIds.size} seleccionado(s)</span>
              <div className="flex-1" />
              {selectedIds.size > 0 && (
                <>
                  <button onClick={() => handleBulkAction("paused")} disabled={isPending} className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 hover:bg-amber-200 transition disabled:opacity-50"><Pause className="w-3 h-3" /> Pausar</button>
                  <button onClick={() => handleBulkAction("active")} disabled={isPending} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 hover:bg-emerald-200 transition disabled:opacity-50"><Play className="w-3 h-3" /> Activar</button>
                  <button onClick={() => handleBulkAction("completed")} disabled={isPending} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 hover:bg-gray-200 transition disabled:opacity-50"><Archive className="w-3 h-3" /> Completar</button>
                </>
              )}
              <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600 p-1"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <FamilyCardSkeleton key={i} />)}
        </div>
      ) : families.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin familias todavía"
          description="Añade tu primera familia para empezar a recibir registros de sueño y rutinas."
          action={{ label: "Añadir familia", onClick: () => setShowInvite(true) }}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">No se encontraron familias con estos filtros.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((family) => {
            const age = babyAgeLabel(family.baby_birth_date);
            const statusColors: Record<string, string> = {
              active: "bg-emerald-100 text-emerald-700",
              paused: "bg-amber-100 text-amber-700",
              completed: "bg-gray-100 text-gray-700",
            };
            return (
              <div key={family.id} className="relative">
                {bulkMode && (
                  <button onClick={() => toggleSelect(family.id)} className={cn("absolute top-3 left-3 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition", selectedIds.has(family.id) ? "bg-nanni-600 border-nanni-600 text-white" : "bg-white border-gray-300")}>
                    {selectedIds.has(family.id) && <span className="text-[10px]">✓</span>}
                  </button>
                )}
              <Link
                href={`/familia/${family.id}`}
                className={cn("bg-white rounded-2xl border shadow-sm p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all group block", selectedIds.has(family.id) ? "border-nanni-300 bg-nanni-50/30" : "border-gray-100", bulkMode && "pl-10")}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-nanni-100 flex items-center justify-center text-sm font-bold text-nanni-700">
                      {family.baby_name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{family.baby_name}</p>
                      <p className="text-[11px] text-gray-400">{age}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-nanni-500 transition" />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs font-bold text-gray-900">{family.record_count}</p>
                    <p className="text-[9px] text-gray-400">Registros</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs font-bold text-gray-900">
                      {family.last_record_at ? timeAgo(family.last_record_at) : "—"}
                    </p>
                    <p className="text-[9px] text-gray-400">Último</p>
                  </div>
                </div>
                <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full", statusColors[family.status] || statusColors.active)}>
                  {family.status === "active" ? "Activa" : family.status === "paused" ? "Pausada" : "Completada"}
                </span>
              </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {filtered.map((family) => {
            const age = babyAgeLabel(family.baby_birth_date);
            return (
              <Link
                key={family.id}
                href={`/familia/${family.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition group"
              >
                <div className="w-11 h-11 rounded-full bg-nanni-100 flex items-center justify-center text-sm font-bold text-nanni-700 shrink-0">
                  {family.baby_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{family.baby_name}</p>
                    <span className="text-xs text-gray-400">{age}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {family.record_count} registros · Último: {family.last_record_at ? timeAgo(family.last_record_at) : "ninguno"}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-nanni-500 transition shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
