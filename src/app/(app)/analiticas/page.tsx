import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getFamilies, getAdvisorAnalytics, getInsights } from "@/lib/db";
import type { AnalyticsPeriodKey } from "@/lib/db";
import { babyAgeLabel } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { AnalyticsPeriodSelector } from "@/components/app/AnalyticsPeriodSelector";
import {
  Moon,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Baby,
  Brain,
  Target,
  BarChart3,
  Sparkles,
} from "lucide-react";

const CHART_PX = 180;

function periodFromSearchParam(raw: string | undefined): AnalyticsPeriodKey {
  if (raw === "mes") return "month";
  if (raw === "trimestre") return "quarter";
  return "week";
}

function trendSleep(current: number, prev: number | null) {
  if (prev === null) return { text: "Sin periodo previo", good: true };
  const d = Math.round((current - prev) * 10) / 10;
  if (d === 0) return { text: "Sin cambios vs anterior", good: true };
  return {
    text: `${d > 0 ? "+" : ""}${d}h vs anterior`,
    good: d >= 0,
  };
}

function trendAwakenings(current: number, prev: number | null) {
  if (prev === null) return { text: "Sin periodo previo", good: true };
  const d = Math.round((current - prev) * 10) / 10;
  if (d === 0) return { text: "Sin cambios vs anterior", good: true };
  return {
    text: `${d > 0 ? "+" : ""}${d} vs anterior`,
    good: d <= 0,
  };
}

function trendAdherence(current: number, prev: number | null) {
  if (prev === null) return { text: "Sin periodo previo", good: true };
  const d = Math.round((current - prev) * 10) / 10;
  if (d === 0) return { text: "Sin cambios vs anterior", good: true };
  return {
    text: `${d > 0 ? "+" : ""}${d} pts vs anterior`,
    good: d >= 0,
  };
}

function PeriodSelectorFallback() {
  return (
    <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden self-start h-[38px] w-[280px] animate-pulse bg-gray-50" />
  );
}

export default async function AnaliticasPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { period: periodParam } = await searchParams;
  const periodKey = periodFromSearchParam(periodParam);

  const families = await getFamilies(user.id);

  if (families.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analíticas</h1>
            <p className="text-gray-400 mt-1 text-sm">Visión global de todas tus familias</p>
          </div>
        </div>
        <EmptyState
          icon={BarChart3}
          title="Añade familias para ver analíticas"
          description="Cuando tengas familias registradas, aquí verás métricas agregadas, gráficos de sueño y adherencia."
          action={{ label: "Ir a familias", href: "/familias" }}
        />
      </div>
    );
  }

  const [analytics, insights] = await Promise.all([
    getAdvisorAnalytics(user.id, periodKey, families),
    getInsights(user.id, { limit: 20 }),
  ]);

  if (!analytics) {
    return null;
  }

  const prev = analytics.previousOverview;
  const tSleep = trendSleep(analytics.overview.avgSleepHours, prev?.avgSleepHours ?? null);
  const tWake = trendAwakenings(analytics.overview.avgAwakenings, prev?.avgAwakenings ?? null);
  const tAdh = trendAdherence(analytics.overview.adherencePct, prev?.adherencePct ?? null);

  const patternInsights = insights.filter((i) => i.type === "pattern");
  const displayInsights = patternInsights.length > 0 ? patternInsights : insights;

  const maxStacked = Math.max(
    0.01,
    ...analytics.chart.map((b) => b.avgNightHours + b.avgNapHours)
  );
  const maxWake = Math.max(0.01, ...analytics.chart.map((b) => b.avgAwakenings));

  const overviewMetrics = [
    {
      icon: Moon,
      label: "Sueño medio",
      value: `${analytics.overview.avgSleepHours}h`,
      sub: "por día (media familias)",
      trend: tSleep.text,
      good: tSleep.good,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      icon: AlertTriangle,
      label: "Despertares",
      value: String(analytics.overview.avgAwakenings),
      sub: "media por día",
      trend: tWake.text,
      good: tWake.good,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      icon: Target,
      label: "Adherencia",
      value: `${analytics.overview.adherencePct}%`,
      sub: "registro diario (media)",
      trend: tAdh.text,
      good: tAdh.good,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      icon: Baby,
      label: "Familias",
      value: String(analytics.totalFamilies),
      sub: "en el panel",
      trend: "Total en cartera",
      good: true,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analíticas</h1>
          <p className="text-gray-400 mt-1 text-sm">Visión global de todas tus familias</p>
        </div>
        <Suspense fallback={<PeriodSelectorFallback />}>
          <AnalyticsPeriodSelector />
        </Suspense>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {overviewMetrics.map((m) => (
          <div key={m.label} className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${m.bg} rounded-xl flex items-center justify-center mb-3`}>
              <m.icon className={`w-5 h-5 ${m.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{m.value}</div>
            <div className="text-xs text-gray-400">{m.sub}</div>
            <div
              className={`flex items-center gap-1 mt-2 text-[11px] font-medium ${
                m.good ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {m.good ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {m.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h2 className="font-bold text-gray-900">Horas de sueño (media)</h2>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                <span className="text-[11px] text-gray-400">Noche</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-300" />
                <span className="text-[11px] text-gray-400">Siesta</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-[11px] text-gray-400">Despertares</span>
              </div>
            </div>
          </div>
          {analytics.chart.length === 0 ? (
            <p className="text-sm text-gray-400 py-12 text-center">No hay datos de sueño en este periodo.</p>
          ) : (
            <div className="flex items-end gap-1 sm:gap-3 h-48">
              {analytics.chart.map((d, i) => {
                const totalH = d.avgNightHours + d.avgNapHours;
                const stackH = (totalH / maxStacked) * CHART_PX;
                const nightFrac = totalH > 0 ? d.avgNightHours / totalH : 0;
                const napFrac = totalH > 0 ? d.avgNapHours / totalH : 0;
                const nightPx = stackH * nightFrac;
                const napPx = stackH * napFrac;
                const wakePx = Math.min(CHART_PX, (d.avgAwakenings / maxWake) * 72);
                return (
                  <div key={`${d.label}-${i}`} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div
                      className="w-full flex flex-col items-center justify-end relative"
                      style={{ height: `${CHART_PX}px` }}
                    >
                      <div className="absolute bottom-0 w-full flex gap-0.5 items-end justify-center">
                        <div className="flex-1 flex flex-col justify-end items-stretch max-w-[80%]">
                          <div
                            className="w-full bg-violet-300 rounded-t-md min-h-0"
                            style={{ height: `${napPx}px` }}
                            title={`Siesta: ${d.avgNapHours}h`}
                          />
                          <div
                            className="w-full bg-violet-500 min-h-0"
                            style={{ height: `${nightPx}px` }}
                            title={`Noche: ${d.avgNightHours}h`}
                          />
                        </div>
                        <div
                          className="w-2 shrink-0 bg-amber-400 rounded-t-md"
                          style={{ height: `${wakePx}px` }}
                          title={`Despertares: ${d.avgAwakenings}`}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium mt-1 truncate w-full text-center">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <h2 className="font-bold text-gray-900 mb-1">Adherencia al registro</h2>
          <p className="text-xs text-gray-400 mb-6">% familias que registran cada día</p>
          {analytics.chart.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Sin datos en este periodo.</p>
          ) : (
            <>
              <div className="flex items-end gap-1 sm:gap-1.5 h-32">
                {analytics.chart.map((d, i) => (
                  <div
                    key={`adh-${d.label}-${i}`}
                    className="flex-1 flex flex-col items-center gap-1 min-w-0 h-full"
                  >
                    <span className="text-[9px] text-gray-400 shrink-0">{d.adherencePct}%</span>
                    <div className="flex-1 w-full flex flex-col justify-end min-h-[48px]">
                      <div
                        className={`w-full rounded-t-md ${
                          d.adherencePct >= 95
                            ? "bg-emerald-400"
                            : d.adherencePct >= 85
                              ? "bg-amber-400"
                              : "bg-red-400"
                        }`}
                        style={{
                          height: `${d.adherencePct}%`,
                          minHeight: d.adherencePct > 0 ? "4px" : "0",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium truncate w-full text-center shrink-0">
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-50 text-center">
                <span className="text-3xl font-bold text-emerald-600">{analytics.overview.adherencePct}%</span>
                <p className="text-xs text-gray-400 mt-1">Media del periodo</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">Ranking de familias</h2>
            <p className="text-xs text-gray-400 mt-0.5">Ordenadas por score de sueño (periodo seleccionado)</p>
          </div>
          <div className="divide-y divide-gray-50">
            {analytics.rankings.map((row, i) => (
              <Link
                key={row.family.id}
                href={`/familia/${row.family.id}`}
                className="flex items-center gap-3 p-4 hover:bg-gray-50/60 transition"
              >
                <span
                  className={`w-6 text-center text-xs font-bold shrink-0 ${i < 3 ? "text-violet-600" : "text-gray-400"}`}
                >
                  {i + 1}
                </span>
                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700 shrink-0">
                  {row.family.baby_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{row.family.baby_name}</p>
                  <p className="text-[11px] text-gray-400">
                    {row.avgSleepHours}h sueño · {row.avgAwakenings} despert. · {babyAgeLabel(row.family.baby_birth_date)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">{row.score}</p>
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${row.statusColor}`}
                  >
                    {row.statusLabel}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-50 flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-600" />
            <div>
              <h2 className="font-bold text-gray-900">Patrones detectados</h2>
              <p className="text-xs text-gray-400">Insights desde la tabla de análisis</p>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {displayInsights.length === 0 ? (
              <div className="py-8 text-center">
                <Sparkles className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  Aún no hay patrones. Aparecerán cuando el sistema genere insights con tus datos.
                </p>
              </div>
            ) : (
              displayInsights.map((insight) => {
                const confidence =
                  typeof insight.data?.confidence === "number" ? insight.data.confidence : null;
                const familiesN =
                  typeof insight.data?.families_count === "number"
                    ? insight.data.families_count
                    : typeof insight.data?.families === "number"
                      ? insight.data.families
                      : null;
                return (
                  <div
                    key={insight.id}
                    className="bg-violet-50 rounded-xl p-4 border border-violet-100"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-gray-900">{insight.title}</h3>
                      {confidence !== null && (
                        <span className="text-[10px] font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full shrink-0">
                          {Math.round(confidence)}% confianza
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">{insight.description}</p>
                    {familiesN !== null && (
                      <p className="text-[10px] text-gray-400">{familiesN} familias analizadas</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
