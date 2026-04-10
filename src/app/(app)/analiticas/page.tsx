import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getFamilies, getAdvisorAnalytics, getInsights, getPortfolioHealth, getPortfolioSleepMethods } from "@/lib/db";
import type { AnalyticsPeriodKey } from "@/lib/db";
import { babyAgeLabel, babyAgeMonths } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { AnalyticsPeriodSelector } from "@/components/app/AnalyticsPeriodSelector";
import {
  Moon, TrendingUp, TrendingDown, AlertTriangle, Brain, Target,
  BarChart3, Sparkles, CheckCircle, ArrowUpRight, Users, MapPin,
  Baby, Clock,
} from "lucide-react";

const CHART_PX = 180;

function periodFromSearchParam(raw: string | undefined): AnalyticsPeriodKey {
  if (raw === "mes") return "month";
  if (raw === "trimestre") return "quarter";
  return "week";
}

function trendCalc(current: number, prev: number | null, unit: string, invertGood = false) {
  if (prev === null) return { text: "Sin periodo previo", good: true };
  const d = Math.round((current - prev) * 10) / 10;
  if (d === 0) return { text: "Sin cambios vs anterior", good: true };
  const good = invertGood ? d <= 0 : d >= 0;
  return { text: `${d > 0 ? "+" : ""}${d}${unit} vs anterior`, good };
}

function PeriodSelectorFallback() {
  return <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden self-start h-[38px] w-[280px] animate-pulse bg-gray-50" />;
}

function ageBracketLabel(months: number): string {
  if (months < 3) return "0-3 meses";
  if (months < 6) return "3-6 meses";
  if (months < 12) return "6-12 meses";
  if (months < 24) return "12-24 meses";
  return "24+ meses";
}

const STATUS_LABELS: Record<string, string> = { active: "Activas", paused: "Pausadas", completed: "Completadas" };
const STATUS_COLORS: Record<string, string> = { active: "#10b981", paused: "#f59e0b", completed: "#6366f1" };

const METHOD_LABELS: Record<string, string> = {
  self: "Solo/a", rocking: "Meciendo", feeding: "Pecho/Biberón", white_noise: "Ruido blanco",
};

const METHOD_COLORS: Record<string, string> = {
  self: "bg-emerald-500", rocking: "bg-nanni-500", feeding: "bg-blue-500", white_noise: "bg-amber-500",
};

const AGE_COLORS = ["bg-nanni-600", "bg-nanni-500", "bg-nanni-400", "bg-nanni-300", "bg-nanni-200"];

export default async function AnaliticasPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { period: periodParam } = await searchParams;
  const periodKey = periodFromSearchParam(periodParam);
  const families = await getFamilies(user.id);

  if (families.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div><h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analíticas</h1><p className="text-gray-400 mt-1 text-sm">Visión global de todas tus familias</p></div>
        </div>
        <EmptyState icon={BarChart3} title="Añade familias para ver analíticas" description="Cuando tengas familias registradas, aquí verás métricas agregadas." action={{ label: "Ir a familias", href: "/familias" }} />
      </div>
    );
  }

  const activeFamilies = families.filter((f) => f.status === "active");
  const activeFamilyIds = activeFamilies.map((f) => f.id);

  const [analytics, portfolio, sleepMethods, insights] = await Promise.all([
    getAdvisorAnalytics(user.id, periodKey, families),
    getPortfolioHealth(user.id),
    getPortfolioSleepMethods(activeFamilyIds),
    getInsights(user.id, { limit: 20 }),
  ]);

  if (!analytics) return null;

  const prev = analytics.previousOverview;
  const tAdh = trendCalc(analytics.overview.adherencePct, prev?.adherencePct ?? null, " pts");

  const familiesWithPlan = portfolio.filter((p) => p.hasActivePlan).length;
  const familiesWithoutPlan = activeFamilies.length - familiesWithPlan;
  const avgSleepPortfolio = portfolio.length > 0
    ? Math.round(portfolio.reduce((a, p) => a + p.avgSleepHours, 0) / portfolio.length * 10) / 10
    : 0;
  const avgAwakeningsPortfolio = portfolio.length > 0
    ? Math.round(portfolio.reduce((a, p) => a + p.avgAwakenings, 0) / portfolio.length * 10) / 10
    : 0;

  /* ── Distributions ── */
  const statusDist: Record<string, number> = { active: 0, paused: 0, completed: 0 };
  for (const f of families) statusDist[f.status] = (statusDist[f.status] || 0) + 1;
  const statusEntries = Object.entries(statusDist).filter(([, v]) => v > 0);
  const statusTotal = statusEntries.reduce((a, [, v]) => a + v, 0);

  const ageDist: Record<string, number> = {};
  for (const f of families) {
    const bracket = ageBracketLabel(babyAgeMonths(f.baby_birth_date));
    ageDist[bracket] = (ageDist[bracket] || 0) + 1;
  }
  const ageBrackets = ["0-3 meses", "3-6 meses", "6-12 meses", "12-24 meses", "24+ meses"];
  const ageEntries = ageBrackets.map((b) => [b, ageDist[b] || 0] as [string, number]).filter(([, v]) => v > 0);
  const ageMax = Math.max(1, ...ageEntries.map(([, v]) => v));

  const cityDist: Record<string, number> = {};
  for (const f of families) {
    const city = f.city?.trim() || "Sin ciudad";
    cityDist[city] = (cityDist[city] || 0) + 1;
  }
  const topCities = Object.entries(cityDist).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const cityMax = topCities.length > 0 ? topCities[0][1] : 1;

  /* ── Sleep Methods ── */
  const methodTotal = Object.values(sleepMethods).reduce((a, v) => a + v, 0);
  const methodEntries = Object.entries(sleepMethods).sort((a, b) => b[1] - a[1]).slice(0, 5);

  /* ── Charts ── */
  const maxStacked = Math.max(0.01, ...analytics.chart.map((b) => b.avgNightHours + b.avgNapHours));
  const maxWake = Math.max(0.01, ...analytics.chart.map((b) => b.avgAwakenings));

  /* ── Ranking (no score) ── */
  const rankingWithTrend = analytics.rankings.map((r) => {
    const ph = portfolio.find((p) => p.family.id === r.family.id);
    return { ...r, trend: ph?.trend || ("stable" as const), avgSleepHours: r.avgSleepHours, avgAwakenings: r.avgAwakenings };
  }).sort((a, b) => b.avgSleepHours - a.avgSleepHours);

  const patternInsights = insights.filter((i) => i.type === "pattern");
  const displayInsights = patternInsights.length > 0 ? patternInsights : insights;

  /* ── KPIs ── */
  const kpis = [
    { icon: Users, value: String(families.length), label: "Total familias", sub: "gestionadas" , color: "text-nanni-600", bg: "bg-nanni-50" },
    { icon: CheckCircle, value: String(activeFamilies.length), label: "Activas ahora", sub: `de ${families.length} totales`, color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: Target, value: String(familiesWithPlan), label: "Con plan activo", sub: familiesWithoutPlan > 0 ? `${familiesWithoutPlan} sin plan` : "Todas con plan", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: CheckCircle, value: `${analytics.overview.adherencePct}%`, label: "Adherencia media", sub: tAdh.text, color: "text-amber-600", bg: "bg-amber-50", trend: tAdh },
  ];

  /* ── SVG Donut helper ── */
  const DONUT_R = 42;
  const DONUT_C = 2 * Math.PI * DONUT_R;
  let donutOffset = 0;
  const donutSegments = statusEntries.map(([key, val]) => {
    const pct = val / statusTotal;
    const seg = { key, val, pct, offset: donutOffset, dash: pct * DONUT_C, color: STATUS_COLORS[key] || "#94a3b8" };
    donutOffset += pct * DONUT_C;
    return seg;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analíticas</h1>
          <p className="text-gray-400 mt-1 text-sm">Visión global de tu cartera de familias</p>
        </div>
        <Suspense fallback={<PeriodSelectorFallback />}>
          <AnalyticsPeriodSelector />
        </Suspense>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{kpi.label}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Distributions row */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Status donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-1">Distribución por estado</h3>
          <p className="text-xs text-gray-400 mb-4">{families.length} familias totales</p>
          <div className="flex items-center gap-6">
            <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
              {donutSegments.map((seg) => (
                <circle
                  key={seg.key}
                  cx="50" cy="50" r={DONUT_R}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="12"
                  strokeDasharray={`${seg.dash} ${DONUT_C - seg.dash}`}
                  strokeDashoffset={-seg.offset}
                  transform="rotate(-90 50 50)"
                />
              ))}
              <text x="50" y="48" textAnchor="middle" className="text-lg font-bold fill-gray-900">{families.length}</text>
              <text x="50" y="60" textAnchor="middle" className="text-[8px] fill-gray-400">familias</text>
            </svg>
            <div className="space-y-2 flex-1">
              {statusEntries.map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[key] }} />
                  <span className="text-xs text-gray-600 flex-1">{STATUS_LABELS[key] || key}</span>
                  <span className="text-xs font-bold text-gray-900">{val}</span>
                  <span className="text-[10px] text-gray-400">{Math.round((val / statusTotal) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Age distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <Baby className="w-4 h-4 text-nanni-600" />
            <h3 className="font-bold text-gray-900">Distribución por edad</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Rango de edad de los bebés</p>
          <div className="space-y-2.5">
            {ageEntries.map(([bracket, count], i) => (
              <div key={bracket}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-gray-600">{bracket}</span>
                  <span className="text-xs font-bold text-gray-900">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${AGE_COLORS[i] || "bg-nanni-400"}`}
                    style={{ width: `${(count / ageMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {ageEntries.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>}
          </div>
        </div>

        {/* City distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-nanni-600" />
            <h3 className="font-bold text-gray-900">Distribución por ciudad</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Alcance geográfico</p>
          <div className="space-y-2.5">
            {topCities.map(([city, count]) => (
              <div key={city}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-gray-600">{city}</span>
                  <span className="text-xs font-bold text-gray-900">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-nanni-400"
                    style={{ width: `${(count / cityMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {topCities.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin datos de ciudad</p>}
          </div>
        </div>
      </div>

      {/* Charts: Sleep + Adherence */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h2 className="font-bold text-gray-900">Horas de sueño (media)</h2>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-nanni-500" /><span className="text-[11px] text-gray-400">Noche</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-nanni-300" /><span className="text-[11px] text-gray-400">Siesta</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="text-[11px] text-gray-400">Despertares</span></div>
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
                    <div className="w-full flex flex-col items-center justify-end relative" style={{ height: `${CHART_PX}px` }}>
                      <div className="absolute bottom-0 w-full flex gap-0.5 items-end justify-center">
                        <div className="flex-1 flex flex-col justify-end items-stretch max-w-[80%]">
                          <div className="w-full bg-nanni-300 rounded-t-md min-h-0" style={{ height: `${napPx}px` }} title={`Siesta: ${d.avgNapHours}h`} />
                          <div className="w-full bg-nanni-500 min-h-0" style={{ height: `${nightPx}px` }} title={`Noche: ${d.avgNightHours}h`} />
                        </div>
                        <div className="w-2 shrink-0 bg-amber-400 rounded-t-md" style={{ height: `${wakePx}px` }} title={`Despertares: ${d.avgAwakenings}`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium mt-1 truncate w-full text-center">{d.label}</span>
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
                  <div key={`adh-${d.label}-${i}`} className="flex-1 flex flex-col items-center gap-1 min-w-0 h-full">
                    <span className="text-[9px] text-gray-400 shrink-0">{d.adherencePct}%</span>
                    <div className="flex-1 w-full flex flex-col justify-end min-h-[48px]">
                      <div className={`w-full rounded-t-md ${d.adherencePct >= 95 ? "bg-emerald-400" : d.adherencePct >= 85 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ height: `${d.adherencePct}%`, minHeight: d.adherencePct > 0 ? "4px" : "0" }} />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium truncate w-full text-center shrink-0">{d.label}</span>
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

      {/* Ranking table */}
      {rankingWithTrend.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">Ranking de familias</h2>
            <p className="text-xs text-gray-400 mt-0.5">Ordenadas por horas de sueño medio</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">#</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Familia</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Edad</th>
                  <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Sueño medio</th>
                  <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Despertares</th>
                  <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Tendencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rankingWithTrend.map((row, i) => {
                  const trendIcon = row.trend === "improving" ? TrendingUp : row.trend === "worsening" ? TrendingDown : null;
                  const trendColor = row.trend === "improving" ? "text-emerald-500" : row.trend === "worsening" ? "text-red-500" : "text-gray-300";
                  const trendLabel = row.trend === "improving" ? "Mejorando" : row.trend === "worsening" ? "Empeorando" : "Estable";
                  return (
                    <tr key={row.family.id} className={`hover:bg-gray-50/50 transition ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-bold ${i < 3 ? "text-nanni-600" : "text-gray-400"}`}>{i + 1}</span>
                      </td>
                      <td className="px-3 py-3">
                        <Link href={`/familia/${row.family.id}`} className="flex items-center gap-2.5 hover:underline">
                          <div className="w-8 h-8 rounded-full bg-nanni-100 flex items-center justify-center text-[10px] font-bold text-nanni-700 shrink-0">
                            {row.family.baby_name[0]}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{row.family.baby_name}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">{babyAgeLabel(row.family.baby_birth_date)}</td>
                      <td className="px-3 py-3 text-right text-sm font-semibold text-gray-900">{row.avgSleepHours}h</td>
                      <td className="px-3 py-3 text-right text-sm text-gray-700">{row.avgAwakenings}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {trendIcon ? (
                            <>
                              {(() => { const Icon = trendIcon; return <Icon className={`w-3.5 h-3.5 ${trendColor}`} />; })()}
                              <span className={`text-[11px] font-medium ${trendColor}`}>{trendLabel}</span>
                            </>
                          ) : (
                            <span className="text-[11px] text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Two-column: Methods + Portfolio summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sleep Methods */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <div className="flex items-center gap-2 mb-1">
            <Moon className="w-4 h-4 text-nanni-600" />
            <h2 className="font-bold text-gray-900">Métodos de conciliación</h2>
          </div>
          <p className="text-xs text-gray-400 mb-5">Top métodos usados por tus familias (últimos 30 días)</p>
          {methodEntries.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Sin datos de métodos aún.</p>
          ) : (
            <div className="space-y-3">
              {methodEntries.map(([method, count]) => {
                const pct = methodTotal > 0 ? Math.round((count / methodTotal) * 100) : 0;
                return (
                  <div key={method}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 font-medium">{METHOD_LABELS[method] || method}</span>
                      <span className="text-xs text-gray-500">{pct}% <span className="text-gray-400">({count})</span></span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${METHOD_COLORS[method] || "bg-gray-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Portfolio summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <h2 className="font-bold text-gray-900 mb-1">Resumen del portfolio</h2>
          <p className="text-xs text-gray-400 mb-5">Métricas globales de tus familias activas</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <Moon className="w-5 h-5 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{avgSleepPortfolio}h</div>
              <p className="text-[11px] text-gray-500 mt-0.5">Sueño medio</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{avgAwakeningsPortfolio}</div>
              <p className="text-[11px] text-gray-500 mt-0.5">Despertares (media)</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <Target className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{familiesWithPlan}</div>
              <p className="text-[11px] text-gray-500 mt-0.5">Con plan activo</p>
            </div>
            <div className={`rounded-xl p-4 text-center ${familiesWithoutPlan > 0 ? "bg-red-50" : "bg-gray-50"}`}>
              <Clock className="w-5 h-5 mx-auto mb-2" style={{ color: familiesWithoutPlan > 0 ? "#ef4444" : "#9ca3af" }} />
              <div className="text-2xl font-bold text-gray-900">{familiesWithoutPlan}</div>
              <p className="text-[11px] text-gray-500 mt-0.5">Sin plan activo</p>
            </div>
          </div>
          {familiesWithoutPlan > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Familias activas sin plan:</p>
              <div className="flex flex-wrap gap-1.5">
                {portfolio.filter((p) => !p.hasActivePlan).slice(0, 5).map((p) => (
                  <Link key={p.family.id} href={`/familia/${p.family.id}`} className="text-[11px] font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1 hover:bg-red-100 transition">
                    {p.family.baby_name}
                  </Link>
                ))}
                {portfolio.filter((p) => !p.hasActivePlan).length > 5 && (
                  <span className="text-[11px] text-gray-400 self-center">+{portfolio.filter((p) => !p.hasActivePlan).length - 5} más</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Patterns IA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-50 flex items-center gap-2">
          <Brain className="w-5 h-5 text-nanni-600" />
          <div>
            <h2 className="font-bold text-gray-900">Patrones detectados</h2>
            <p className="text-xs text-gray-400">Insights generados por IA</p>
          </div>
        </div>
        <div className="p-4">
          {displayInsights.length === 0 ? (
            <div className="py-8 text-center">
              <Sparkles className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aún no hay patrones detectados.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayInsights.slice(0, 6).map((insight) => {
                const confidence = typeof insight.data?.confidence === "number" ? insight.data.confidence : null;
                const familiesN = typeof insight.data?.families_count === "number" ? insight.data.families_count : typeof insight.data?.families === "number" ? insight.data.families : null;
                return (
                  <div key={insight.id} className="bg-nanni-50 rounded-xl p-4 border border-nanni-100">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-gray-900">{insight.title}</h3>
                      {confidence !== null && (
                        <span className="text-[10px] font-semibold bg-nanni-100 text-nanni-700 px-2 py-0.5 rounded-full shrink-0">{Math.round(confidence)}%</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">{insight.description}</p>
                    {familiesN !== null && <p className="text-[10px] text-gray-400">{familiesN} familias analizadas</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
