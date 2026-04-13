"use client";

import Link from "next/link";
import { useState, useEffect, useTransition } from "react";
import {
  Search, TrendingUp, Clock, AlertTriangle, Minus, ArrowRight,
  Plus, LayoutGrid, List, Moon, Users, CheckSquare, Square,
  Pause, Play, Archive, Trash2, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { babyAgeLabel, timeAgo, cn, sleepScore, babyAgeMonths, statusFromScore } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { FamilyCardSkeleton } from "@/components/ui/Skeleton";
import { InviteFamily } from "@/components/app/InviteFamily";
import { bulkUpdateFamilyStatus } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import type { Family } from "@/lib/types";

interface FamilyRow extends Family {
  last_record_at: string | null;
  record_count: number;
  score: number;
  score_delta: number;
  trend: "up" | "down" | "stable";
  status_label: string;
  avg_sleep_hours: number;
  avg_awakenings: number;
  attention_reason: string | null;
  has_active_plan: boolean;
}

function fullBabyName(f: Pick<Family, "baby_name" | "baby_last_name">): string {
  return [f.baby_name, f.baby_last_name].filter(Boolean).join(" ");
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
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);
        const prevStart = new Date(weekStart);
        prevStart.setDate(prevStart.getDate() - 7);

        const enriched: FamilyRow[] = await Promise.all(
          fams.map(async (f: Family) => {
            const [{ data: lastRec }, { count }, { data: currRecs }, { data: prevRecs }, { data: activePlan }] = await Promise.all([
              supabase
                .from("activity_records")
                .select("created_at")
                .eq("family_id", f.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single(),
              supabase
                .from("activity_records")
                .select("*", { count: "exact", head: true })
                .eq("family_id", f.id),
              supabase
                .from("activity_records")
                .select("type, duration_minutes, details")
                .eq("family_id", f.id)
                .gte("started_at", weekStart.toISOString()),
              supabase
                .from("activity_records")
                .select("type, duration_minutes, details")
                .eq("family_id", f.id)
                .gte("started_at", prevStart.toISOString())
                .lt("started_at", weekStart.toISOString()),
              supabase
                .from("sleep_plans")
                .select("id")
                .eq("family_id", f.id)
                .eq("status", "active")
                .limit(1)
                .single(),
            ]);

            const calcMetrics = (records: { type: string; duration_minutes: number | null; details: Record<string, unknown> | null }[] | null) => {
              let sleepH = 0;
              let wakes = 0;
              for (const r of records || []) {
                if (r.type === "sleep") {
                  sleepH += (r.duration_minutes || 0) / 60;
                  const aw = r.details?.awakenings;
                  if (typeof aw === "number") wakes += aw;
                }
                if (r.type === "wake" || r.type === "wakeup") wakes += 1;
              }
              return {
                avgSleep: Math.round((sleepH / 7) * 10) / 10,
                avgWakes: Math.round((wakes / 7) * 10) / 10,
              };
            };

            const current = calcMetrics(currRecs as { type: string; duration_minutes: number | null; details: Record<string, unknown> | null }[] | null);
            const previous = calcMetrics(prevRecs as { type: string; duration_minutes: number | null; details: Record<string, unknown> | null }[] | null);
            const ageMonths = babyAgeMonths(f.baby_birth_date);
            const score = sleepScore(current.avgSleep, current.avgWakes, ageMonths);
            const prevScore = sleepScore(previous.avgSleep, previous.avgWakes, ageMonths);
            const scoreDelta = Math.round((score - prevScore) * 10) / 10;
            const trend: FamilyRow["trend"] = scoreDelta >= 0.5 ? "up" : scoreDelta <= -0.5 ? "down" : "stable";
            const { label: statusLabel } = statusFromScore(score);
            const lastRecordAt = lastRec?.created_at || null;
            const hoursSinceLast = lastRecordAt ? (Date.now() - new Date(lastRecordAt).getTime()) / 3600000 : 9999;
            const attentionReason =
              hoursSinceLast > 48 ? `Sin registrar hace ${Math.round(hoursSinceLast / 24)} días` :
              score < 4 ? "Necesita atención" :
              trend === "down" ? "Tendencia negativa" : null;

            return {
              ...f,
              last_record_at: lastRecordAt,
              record_count: count || 0,
              score,
              score_delta: scoreDelta,
              trend,
              status_label: statusLabel,
              avg_sleep_hours: current.avgSleep,
              avg_awakenings: current.avgWakes,
              attention_reason: attentionReason,
              has_active_plan: !!activePlan?.id,
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
    const matchesSearch = fullBabyName(f).toLowerCase().includes(search.toLowerCase());
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
              placeholder="Buscar por nombre y apellidos..."
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
              <CheckSquare className="w-3.5 h-3.5" /> Seleccionar varias
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
          title="Invita a tu primera familia"
          description="Envía un enlace y empieza a recibir registros de sueño y rutinas."
          action={{ label: "Invitar familia", onClick: () => setShowInvite(true) }}
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
                      <p className="font-semibold text-gray-900">{fullBabyName(family)}</p>
                      <p className="text-[11px] text-gray-400">
                        {age}{family.city ? ` · ${family.city}` : ""}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-nanni-500 transition" />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs font-bold text-gray-900">{family.score.toFixed(1)}</p>
                    <p className="text-[9px] text-gray-400">Score</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs font-bold text-gray-900">
                      {family.last_record_at ? timeAgo(family.last_record_at) : "—"}
                    </p>
                    <p className="text-[9px] text-gray-400">Último</p>
                  </div>
                </div>
                <div className="mb-3 text-[11px]">
                  <p className="text-gray-500">
                    {family.avg_sleep_hours}h sueño · {family.avg_awakenings} despertares
                    {family.score_delta !== 0 ? (
                      <span className={cn("ml-1 font-medium", family.score_delta > 0 ? "text-emerald-600" : "text-red-500")}>
                        ({family.score_delta > 0 ? "+" : ""}{family.score_delta})
                      </span>
                    ) : (
                      <span className="ml-1 text-gray-400">(estable)</span>
                    )}
                  </p>
                  {family.attention_reason ? (
                    <p className="text-amber-600 font-medium mt-0.5">{family.attention_reason}</p>
                  ) : family.has_active_plan ? (
                    <p className="text-nanni-600 font-medium mt-0.5">Plan activo</p>
                  ) : null}
                </div>
                <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full", statusColors[family.status] || statusColors.active)}>
                  {family.status === "active" ? "Activa" : family.status === "paused" ? "Pausada" : "Completada"}
                </span>
                <span className="ml-2 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                  {family.status_label}
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
                    <p className="text-sm font-semibold text-gray-900">{fullBabyName(family)}</p>
                    <span className="text-xs text-gray-400">
                      {age}{family.city ? ` · ${family.city}` : ""}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Score {family.score.toFixed(1)} · {family.avg_sleep_hours}h sueño · {family.avg_awakenings} despertares · Último: {family.last_record_at ? timeAgo(family.last_record_at) : "ninguno"}
                  </p>
                  {family.attention_reason && (
                    <p className="text-[11px] text-amber-600 font-medium mt-0.5">{family.attention_reason}</p>
                  )}
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
