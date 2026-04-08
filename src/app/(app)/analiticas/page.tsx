import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getFamilies, getAdvisorAnalytics, getInsights, getPortfolioHealth, getPortfolioScoreTrend } from "@/lib/db";
import type { AnalyticsPeriodKey } from "@/lib/db";
import { babyAgeLabel, sleepScore, statusFromScore } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { AnalyticsPeriodSelector } from "@/components/app/AnalyticsPeriodSelector";
import {
  Moon, TrendingUp, TrendingDown, AlertTriangle, Baby, Brain, Target,
  BarChart3, Sparkles, Shield, CheckCircle, ArrowUpRight,
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

  const [analytics, insights, portfolio, scoreTrend] = await Promise.all([
    getAdvisorAnalytics(user.id, periodKey, families),
    getInsights(user.id, { limit: 20 }),
    getPortfolioHealth(user.id),
    getPortfolioScoreTrend(user.id, 14),
  ]);

  if (!analytics) return null;

  const prev = analytics.previousOverview;
  const tSleep = trendCalc(analytics.overview.avgSleepHours, prev?.avgSleepHours ?? null, "h");
  const tWake = trendCalc(analytics.overview.avgAwakenings, prev?.avgAwakenings ?? null, "", true);
  const tAdh = trendCalc(analytics.overview.adherencePct, prev?.adherencePct ?? null, " pts");

  const avgScore = portfolio.length > 0 ? Math.round(portfolio.reduce((a, p) => a + p.score, 0) / portfolio.length * 10) / 10 : 0;
  const prevAvgScore = portfolio.length > 0 ? Math.round(portfolio.reduce((a, p) => a + p.prevScore, 0) / portfolio.length * 10) / 10 : 0;
  const scoreDelta = Math.round((avgScore - prevAvgScore) * 10) / 10;
  const improving = portfolio.filter((p) => p.trend === "improving").length;
  const worsening = portfolio.filter((p) => p.trend === "worsening").length;

  const patternInsights = insights.filter((i) => i.type === "pattern");
  const displayInsights = patternInsights.length > 0 ? patternInsights : insights;

  const maxStacked = Math.max(0.01, ...analytics.chart.map((b) => b.avgNightHours + b.avgNapHours));
  const maxWake = Math.max(0.01, ...analytics.chart.map((b) => b.avgAwakenings));

  const overviewMetrics = [
    { icon: Shield, label: "Score medio", value: avgScore > 0 ? avgScore.toFixed(1) : "—", sub: `${improving} mejorando · ${worsening} empeorando`, trend: scoreDelta !== 0 ? `${scoreDelta > 0 ? "+" : ""}${scoreDelta} vs sem.` : "Sin cambios", good: scoreDelta >= 0, color: "text-nanni-600", bg: "bg-nanni-50" },
    { icon: Moon, label: "Sueño medio", value: `${analytics.overview.avgSleepHours}h`, sub: "por día (media familias)", trend: tSleep.text, good: tSleep.good, color: "text-blue-600", bg: "bg-blue-50" },
    { icon: AlertTriangle, label: "Despertares", value: String(analytics.overview.avgAwakenings), sub: "media por día", trend: tWake.text, good: tWake.good, color: "text-amber-600", bg: "bg-amber-50" },
    { icon: Target, label: "Adherencia", value: `${analytics.overview.adherencePct}%`, sub: "registro diario (media)", trend: tAdh.text, good: tAdh.good, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const SCORE_CHART_H = 80;

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
            <div className={`flex items-center gap-1 mt-2 text-[11px] font-medium ${m.good ? "text-emerald-600" : "text-red-500"}`}>
              {m.good ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {m.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Score trend */}
      {scoreTrend.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900">Evolución del score medio</h2>
              <p className="text-xs text-gray-400">Últimos 14 días — media de todas las familias</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-nanni-500" /> Score</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Mejorando</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /> Empeorando</span>
            </div>
          </div>
          <div className="relative h-24">
            {[0, 5, 10].map((v) => (
              <div key={v} className="absolute w-full border-t border-gray-50" style={{ bottom: `${(v / 10) * 100}%` }}>
                <span className="absolute -left-0 -top-2 text-[9px] text-gray-300">{v}</span>
              </div>
            ))}
            <svg viewBox={`0 0 ${scoreTrend.length * 20} ${SCORE_CHART_H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <polyline fill="none" stroke="var(--color-nanni-500, #7c5cbf)" strokeWidth="2" strokeLinejoin="round"
                points={scoreTrend.map((t, i) => `${i * 20 + 10},${SCORE_CHART_H - (t.score / 10) * SCORE_CHART_H}`).join(" ")} />
              {scoreTrend.map((t, i) => (
                <circle key={i} cx={i * 20 + 10} cy={SCORE_CHART_H - (t.score / 10) * SCORE_CHART_H} r="3" fill="white" stroke="var(--color-nanni-500, #7c5cbf)" strokeWidth="2" />
              ))}
            </svg>
          </div>
          <div className="flex justify-between mt-1 px-1">
            {scoreTrend.filter((_, i) => i % 2 === 0 || i === scoreTrend.length - 1).map((t) => (
              <span key={t.date} className="text-[9px] text-gray-400">
                {new Date(t.date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-gray-900">{improving}</span>
              <span className="text-xs text-gray-400">mejorando</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-gray-900">{worsening}</span>
              <span className="text-xs text-gray-400">empeorando</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{portfolio.length - improving - worsening}</span>
              <span className="text-xs text-gray-400">estables</span>
            </div>
          </div>
        </div>
      )}

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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ranking */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">Ranking de familias</h2>
            <p className="text-xs text-gray-400 mt-0.5">Ordenadas por score de sueño</p>
          </div>
          <div className="divide-y divide-gray-50">
            {analytics.rankings.map((row, i) => {
              const ph = portfolio.find((p) => p.family.id === row.family.id);
              const delta = ph?.scoreDelta || 0;
              return (
                <Link key={row.family.id} href={`/familia/${row.family.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50/60 transition">
                  <span className={`w-6 text-center text-xs font-bold shrink-0 ${i < 3 ? "text-nanni-600" : "text-gray-400"}`}>{i + 1}</span>
                  <div className="w-9 h-9 rounded-full bg-nanni-100 flex items-center justify-center text-xs font-bold text-nanni-700 shrink-0">{row.family.baby_name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{row.family.baby_name}</p>
                    <p className="text-[11px] text-gray-400">{row.avgSleepHours}h sueño · {row.avgAwakenings} despert. · {babyAgeLabel(row.family.baby_birth_date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{row.score}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${row.statusColor}`}>{row.statusLabel}</span>
                      {delta !== 0 && (
                        <span className={`text-[10px] font-medium ${delta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Patterns */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-50 flex items-center gap-2">
            <Brain className="w-5 h-5 text-nanni-600" />
            <div>
              <h2 className="font-bold text-gray-900">Patrones detectados</h2>
              <p className="text-xs text-gray-400">Insights desde la tabla de análisis</p>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {displayInsights.length === 0 ? (
              <div className="py-8 text-center">
                <Sparkles className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aún no hay patrones.</p>
              </div>
            ) : (
              displayInsights.slice(0, 6).map((insight) => {
                const confidence = typeof insight.data?.confidence === "number" ? insight.data.confidence : null;
                const familiesN = typeof insight.data?.families_count === "number" ? insight.data.families_count : typeof insight.data?.families === "number" ? insight.data.families : null;
                return (
                  <div key={insight.id} className="bg-nanni-50 rounded-xl p-4 border border-nanni-100">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-gray-900">{insight.title}</h3>
                      {confidence !== null && (
                        <span className="text-[10px] font-semibold bg-nanni-100 text-nanni-700 px-2 py-0.5 rounded-full shrink-0">{Math.round(confidence)}% confianza</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">{insight.description}</p>
                    {familiesN !== null && <p className="text-[10px] text-gray-400">{familiesN} familias analizadas</p>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Portfolio grid */}
      {portfolio.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Mapa de familias</h2>
              <p className="text-xs text-gray-400 mt-0.5">Estado individual de cada familia</p>
            </div>
            <Link href="/familias" className="text-xs text-nanni-600 hover:text-nanni-700 font-medium flex items-center gap-1">Ver todas <ArrowUpRight className="w-3 h-3" /></Link>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {portfolio.sort((a, b) => a.score - b.score).map((p) => {
              const sc = p.score >= 8 ? "border-emerald-200 bg-emerald-50/30" : p.score >= 6 ? "border-amber-200 bg-amber-50/30" : "border-red-200 bg-red-50/30";
              const tc = p.scoreDelta >= 0.5 ? "text-emerald-600" : p.scoreDelta <= -0.5 ? "text-red-500" : "text-gray-400";
              return (
                <Link key={p.family.id} href={`/familia/${p.family.id}`} className={`rounded-xl p-3 border transition hover:shadow-md ${sc}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-nanni-100 flex items-center justify-center text-[10px] font-bold text-nanni-700">{p.family.baby_name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{p.family.baby_name}</p>
                      <p className="text-[9px] text-gray-400">{babyAgeLabel(p.family.baby_birth_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">{p.score.toFixed(1)}</span>
                    {p.scoreDelta !== 0 && (
                      <span className={`text-[10px] font-medium ${tc}`}>{p.scoreDelta > 0 ? "+" : ""}{p.scoreDelta.toFixed(1)}</span>
                    )}
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1">{p.avgSleepHours}h · {p.avgAwakenings} despert.</p>
                  {p.attentionReason && <p className="text-[9px] text-amber-600 font-medium mt-1">{p.attentionReason}</p>}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
