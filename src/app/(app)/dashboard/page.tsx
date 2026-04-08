import { createClient } from "@/lib/supabase/server";
import {
  getDashboardStats, getFamilies, getRecentRecordsAllFamilies,
  getInsights, getSubscription, getBrand, getPortfolioHealth,
  getPortfolioScoreTrend,
} from "@/lib/db";
import { trialDaysLeft, isTrialExpired } from "@/lib/types";
import { getGreeting, timeAgo, babyAgeLabel, sleepScore, statusFromScore } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { UpgradeToast } from "@/components/app/UpgradeToast";
import { Suspense } from "react";
import Link from "next/link";
import {
  Users, CheckCircle, Check, AlertTriangle, TrendingUp, TrendingDown,
  Clock, Brain, ArrowRight, ArrowUpRight, CalendarDays, Moon, Sparkles,
  Crown, Zap, Palette, Target, Rocket, Activity, Shield,
  Sun, Droplets, Baby, Smile, FileText, ClipboardList,
  type LucideIcon,
} from "lucide-react";

const typeIcons: Record<string, LucideIcon> = {
  sleep: Moon, feed: Droplets, diaper: Baby, play: Activity,
  mood: Smile, note: FileText, wake: Sun, feeding: Droplets, wakeup: Sun,
};

const typeLabels: Record<string, string> = {
  sleep: "sueño", feed: "toma", diaper: "pañal", play: "juego",
  mood: "humor", note: "nota", wake: "despertar", feeding: "alimentación", wakeup: "despertar",
};

const methodLabels: Record<string, string> = {
  breast: "Pecho", bottle: "Biberón", solids: "Sólidos", mixed: "Mixto",
};

function SleepDetailSnippet({ details }: { details: Record<string, unknown> | null }) {
  if (!details) return null;
  const parts: string[] = [];
  const method = details.fell_asleep_method as string | undefined;
  if (method) {
    const labels: Record<string, string> = { self: "solo/a", rocking: "meciendo", feeding: "pecho/bib.", white_noise: "ruido blanco" };
    parts.push(labels[method] || method);
  }
  const lat = details.latency_minutes as number | undefined;
  if (typeof lat === "number") parts.push(`${lat}min latencia`);
  const loc = details.location as string | undefined;
  if (loc) {
    const labels: Record<string, string> = { crib: "cuna", cosleep: "colecho", arms: "brazos", stroller: "carrito", car: "coche" };
    parts.push(labels[loc] || loc);
  }
  return parts.length > 0 ? <span className="text-gray-400"> · {parts.join(", ")}</span> : null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const firstName = (user.user_metadata?.full_name || user.email?.split("@")[0] || "Asesora").split(" ")[0];
  const greeting = getGreeting();

  const [stats, families, recentActivity, insights, subscription, brand, portfolio, scoreTrend] = await Promise.all([
    getDashboardStats(user.id),
    getFamilies(user.id),
    getRecentRecordsAllFamilies(user.id, 10),
    getInsights(user.id, { unreadOnly: false, limit: 4 }),
    getSubscription(user.id),
    getBrand(user.id),
    getPortfolioHealth(user.id),
    getPortfolioScoreTrend(user.id, 14),
  ]);

  const activeFamilies = families.filter((f) => f.status === "active");

  if (families.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{greeting}, {firstName}</h1>
        </div>
        <EmptyState
          icon={Users}
          title="Añade tu primera familia"
          description="Crea una familia, comparte el enlace con los padres y empieza a recibir datos de sueño y rutinas."
          action={{ label: "Añadir familia", href: "/familias" }}
        />
      </div>
    );
  }

  const improving = portfolio.filter((p) => p.trend === "improving").length;
  const worsening = portfolio.filter((p) => p.trend === "worsening").length;
  const avgScore = portfolio.length > 0 ? Math.round(portfolio.reduce((a, p) => a + p.score, 0) / portfolio.length * 10) / 10 : 0;
  const prevAvgScore = portfolio.length > 0 ? Math.round(portfolio.reduce((a, p) => a + p.prevScore, 0) / portfolio.length * 10) / 10 : 0;
  const scoreDelta = Math.round((avgScore - prevAvgScore) * 10) / 10;
  const familiesWithAttention = portfolio.filter((p) => p.attentionReason);

  const summaryLine = (() => {
    const parts: string[] = [];
    if (familiesWithAttention.length > 0) parts.push(`${familiesWithAttention.length} alerta${familiesWithAttention.length > 1 ? "s" : ""}`);
    if (improving > 0) parts.push(`${improving} familia${improving > 1 ? "s" : ""} mejorando`);
    if (worsening > 0) parts.push(`${worsening} empeorando`);
    if (parts.length === 0) return "Todo bajo control hoy.";
    return parts.join(" · ");
  })();

  const { label: avgStatusLabel, color: avgStatusColor } = statusFromScore(avgScore);

  const statCards = [
    {
      icon: Shield,
      value: avgScore > 0 ? avgScore.toFixed(1) : "—",
      label: "Score medio",
      sub: avgStatusLabel,
      trend: scoreDelta !== 0 ? `${scoreDelta > 0 ? "+" : ""}${scoreDelta} vs sem. pasada` : "Sin cambios",
      trendUp: scoreDelta >= 0,
      color: "text-nanni-600",
      bg: "bg-nanni-50",
    },
    {
      icon: TrendingUp,
      value: `${improving}/${activeFamilies.length}`,
      label: "Mejorando",
      sub: worsening > 0 ? `${worsening} empeorando` : "Ninguna empeora",
      trend: improving === activeFamilies.length ? "Todas mejoran" : `${activeFamilies.length - improving - worsening} estables`,
      trendUp: improving >= worsening,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      icon: CheckCircle,
      value: `${stats.records_today_pct}%`,
      label: "Adherencia hoy",
      sub: "familias que registraron",
      trend: stats.records_trend !== 0 ? `${stats.records_trend > 0 ? "+" : ""}${stats.records_trend}% vs sem. pasada` : "Sin cambios",
      trendUp: stats.records_trend >= 0,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: AlertTriangle,
      value: familiesWithAttention.length.toString(),
      label: "Necesitan atención",
      sub: familiesWithAttention.length > 0 ? familiesWithAttention[0].attentionReason || "" : "Todo ok",
      trend: stats.attention_trend < 0 ? `${stats.attention_trend} vs semana pasada` : stats.attention_trend > 0 ? `+${stats.attention_trend} vs semana pasada` : "Sin cambios",
      trendUp: stats.attention_trend <= 0,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const trendMax = Math.max(0.01, ...scoreTrend.map((t) => t.score));
  const CHART_H = 100;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Suspense><UpgradeToast /></Suspense>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{greeting}, {firstName}</h1>
          <p className="text-gray-400 mt-1 text-sm">{summaryLine}</p>
        </div>
        <Link href="/analiticas" className="text-sm text-nanni-600 hover:text-nanni-700 font-medium flex items-center gap-1">
          Ver analíticas <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{stat.sub}</div>
            <div className={`flex items-center gap-1 mt-2 text-[11px] font-medium ${stat.trendUp ? "text-emerald-600" : "text-amber-600"}`}>
              {stat.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {stat.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Trial banner */}
      {subscription?.status === "trialing" && (
        <div className="bg-gradient-to-r from-nanni-600 via-nanni-600 to-nanni-700 rounded-2xl p-5 md:p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-300" />
                <span className="text-xs font-bold text-nanni-200 uppercase tracking-wider">Prueba Premium</span>
              </div>
              <h3 className="text-lg font-bold mb-1">Te quedan {trialDaysLeft(subscription)} días de acceso completo</h3>
              <p className="text-nanni-200 text-sm">Elige tu plan antes de que termine.</p>
            </div>
            <Link href="/plan" className="bg-white text-nanni-700 font-bold text-sm px-6 py-3 rounded-xl hover:bg-nanni-50 transition shadow-lg flex items-center gap-2">
              Ver planes <Zap className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Onboarding checklist */}
      {(() => {
        const steps = [
          { done: families.length > 0, label: "Añade tu primera familia", href: "/familias", icon: Users },
          { done: brand?.name !== "Mi Marca" && !!brand?.name, label: "Personaliza tu marca", href: "/marca", icon: Palette },
          { done: recentActivity.length > 0, label: "Recibe el primer registro", href: "/familias", icon: CheckCircle },
          { done: insights.length > 0, label: "Genera tu primer insight IA", href: families[0] ? `/familia/${families[0].id}` : "/familias", icon: Brain },
        ];
        const completed = steps.filter((s) => s.done).length;
        if (completed >= steps.length) return null;
        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-2 mb-1">
              <Rocket className="w-5 h-5 text-nanni-600" />
              <h2 className="font-bold text-gray-900">Primeros pasos</h2>
            </div>
            <p className="text-xs text-gray-400 mb-4">{completed}/{steps.length} completados</p>
            <div className="h-2 bg-gray-100 rounded-full mb-5 overflow-hidden">
              <div className="h-full bg-nanni-600 rounded-full transition-all" style={{ width: `${(completed / steps.length) * 100}%` }} />
            </div>
            <div className="space-y-2">
              {steps.map((step) => (
                <Link key={step.label} href={step.href} className={`flex items-center gap-3 p-3 rounded-xl transition ${step.done ? "bg-emerald-50" : "bg-gray-50 hover:bg-nanni-50"}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${step.done ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-400"}`}>
                    {step.done ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-sm font-medium ${step.done ? "text-emerald-700 line-through" : "text-gray-700"}`}>{step.label}</span>
                  {!step.done && <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto" />}
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Portfolio Health Grid */}
      {portfolio.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-4 md:p-5 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Mapa de salud</h2>
              <p className="text-xs text-gray-400 mt-0.5">Estado de cada familia esta semana</p>
            </div>
            <Link href="/familias" className="text-xs text-nanni-600 hover:text-nanni-700 font-medium flex items-center gap-1">
              Ver todas <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {portfolio.sort((a, b) => (a.attentionReason ? -1 : 1) - (b.attentionReason ? -1 : 1) || a.score - b.score).map((p) => {
              const scoreColor = p.score >= 8 ? "text-emerald-600 bg-emerald-50 border-emerald-200" : p.score >= 6 ? "text-amber-600 bg-amber-50 border-amber-200" : p.score >= 4 ? "text-red-500 bg-red-50 border-red-200" : "text-red-700 bg-red-100 border-red-300";
              const trendIcon = p.trend === "improving" ? TrendingUp : p.trend === "worsening" ? TrendingDown : null;
              const trendColor = p.trend === "improving" ? "text-emerald-500" : p.trend === "worsening" ? "text-red-500" : "text-gray-300";
              return (
                <Link key={p.family.id} href={`/familia/${p.family.id}`} className={`rounded-xl p-3 border transition hover:shadow-md ${p.attentionReason ? "border-amber-200 bg-amber-50/30" : "border-gray-100 bg-white hover:border-nanni-200"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-nanni-100 flex items-center justify-center text-xs font-bold text-nanni-700 shrink-0">
                      {p.family.baby_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.family.baby_name}</p>
                      <p className="text-[10px] text-gray-400">{babyAgeLabel(p.family.baby_birth_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-bold px-2 py-0.5 rounded-lg border ${scoreColor}`}>
                      {p.score.toFixed(1)}
                    </span>
                    <div className="flex items-center gap-1">
                      {trendIcon && <>{(() => { const Icon = trendIcon; return <Icon className={`w-3.5 h-3.5 ${trendColor}`} />; })()}</>}
                      {p.scoreDelta !== 0 && (
                        <span className={`text-[10px] font-medium ${trendColor}`}>
                          {p.scoreDelta > 0 ? "+" : ""}{p.scoreDelta.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  {p.attentionReason && (
                    <div className="mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="text-[10px] text-amber-600 font-medium truncate">{p.attentionReason}</span>
                    </div>
                  )}
                  {p.hasActivePlan && !p.attentionReason && (
                    <div className="mt-2 flex items-center gap-1">
                      <Target className="w-3 h-3 text-nanni-400 shrink-0" />
                      <span className="text-[10px] text-nanni-500 font-medium">Plan activo</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Score trend chart */}
          {scoreTrend.length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900">Evolución del score</h2>
                  <p className="text-xs text-gray-400">Media de todas las familias (últimos 14 días)</p>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-nanni-500" /> Score</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Mejorando</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /> Empeorando</span>
                </div>
              </div>
              <div className="relative h-28">
                {/* Grid lines */}
                {[0, 2.5, 5, 7.5, 10].map((v) => (
                  <div key={v} className="absolute w-full border-t border-gray-50" style={{ bottom: `${(v / 10) * CHART_H}%` }}>
                    <span className="absolute -left-0 -top-2 text-[9px] text-gray-300">{v}</span>
                  </div>
                ))}
                {/* Line */}
                <svg viewBox={`0 0 ${scoreTrend.length * 20} ${CHART_H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="var(--color-nanni-500, #7c5cbf)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    points={scoreTrend.map((t, i) => `${i * 20 + 10},${CHART_H - (t.score / 10) * CHART_H}`).join(" ")}
                  />
                  {scoreTrend.map((t, i) => (
                    <circle key={i} cx={i * 20 + 10} cy={CHART_H - (t.score / 10) * CHART_H} r="3" fill="white" stroke="var(--color-nanni-500, #7c5cbf)" strokeWidth="2" />
                  ))}
                </svg>
              </div>
              <div className="flex justify-between mt-1">
                {scoreTrend.filter((_, i) => i % 2 === 0 || i === scoreTrend.length - 1).map((t) => (
                  <span key={t.date} className="text-[9px] text-gray-400">
                    {new Date(t.date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent activity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-4 md:p-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-nanni-600" />
                <h2 className="font-bold text-gray-900">Actividad reciente</h2>
              </div>
              <Link href="/familias" className="text-xs text-nanni-600 hover:text-nanni-700 font-medium flex items-center gap-1">
                Ver todas <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">Aún no hay registros.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentActivity.map((item) => {
                  const Icon = typeIcons[item.type] || ClipboardList;
                  const details = item.details as Record<string, unknown> | null;
                  return (
                    <Link key={item.id} href={`/familia/${item.family_id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50/50 transition">
                      <span className="w-8 h-8 rounded-full bg-nanni-50 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-nanni-600" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">
                          <span className="font-medium">{item.family?.baby_name}</span>
                          {" — "}{typeLabels[item.type] || item.type}
                          {item.duration_minutes ? ` (${item.duration_minutes} min)` : ""}
                          {item.type === "sleep" && <SleepDetailSnippet details={details} />}
                          {item.type === "feeding" && typeof details?.method === "string" && (
                            <span className="text-gray-400"> · {methodLabels[details.method] || details.method}</span>
                          )}
                        </p>
                      </div>
                      <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(item.created_at)}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Families needing attention */}
          {familiesWithAttention.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-gray-900">Necesitan atención</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {familiesWithAttention.slice(0, 6).map((p) => (
                  <Link key={p.family.id} href={`/familia/${p.family.id}`} className="bg-white rounded-xl p-3 flex items-center gap-3 hover:shadow-md transition border border-amber-100/50">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700 shrink-0">
                      {p.family.baby_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {p.family.baby_name} <span className="text-gray-400 font-normal">· {babyAgeLabel(p.family.baby_birth_date)}</span>
                      </p>
                      <p className="text-xs text-amber-600">{p.attentionReason}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-gray-900">{p.score.toFixed(1)}</span>
                      {p.scoreDelta !== 0 && (
                        <p className={`text-[10px] font-medium ${p.scoreDelta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {p.scoreDelta > 0 ? "+" : ""}{p.scoreDelta.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* AI Insights */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-4 md:p-5 border-b border-gray-50 flex items-center gap-2">
              <Brain className="w-5 h-5 text-nanni-600" />
              <h2 className="font-bold text-gray-900">IA Insights</h2>
            </div>
            {insights.length === 0 ? (
              <div className="p-6 text-center">
                <Sparkles className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Los insights aparecerán cuando haya datos suficientes.</p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {insights.map((insight) => {
                  const colors = {
                    improvement: { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
                    alert: { bg: "bg-amber-50 border-amber-100", text: "text-amber-700" },
                    pattern: { bg: "bg-nanni-50 border-nanni-100", text: "text-nanni-700" },
                    recommendation: { bg: "bg-blue-50 border-blue-100", text: "text-blue-700" },
                  };
                  const c = colors[insight.type] || colors.pattern;
                  const insightIcons = { improvement: TrendingUp, alert: AlertTriangle, pattern: Brain, recommendation: Sparkles };
                  const InsightIcon = insightIcons[insight.type] || Brain;
                  return (
                    <div key={insight.id} className={`p-3.5 rounded-xl border ${c.bg}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <InsightIcon className={`w-3.5 h-3.5 ${c.text}`} />
                        <span className={`text-[11px] font-bold ${c.text}`}>{insight.title}</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{insight.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick stats per family */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
            <h3 className="font-bold text-gray-900 mb-1">Resumen rápido</h3>
            <p className="text-xs text-gray-400 mb-4">{activeFamilies.length} familias activas</p>
            <div className="space-y-2">
              {portfolio.sort((a, b) => b.score - a.score).slice(0, 6).map((p) => {
                const { color } = statusFromScore(p.score);
                return (
                  <Link key={p.family.id} href={`/familia/${p.family.id}`} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition">
                    <div className="w-8 h-8 rounded-full bg-nanni-100 flex items-center justify-center text-[10px] font-bold text-nanni-700">
                      {p.family.baby_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{p.family.baby_name}</p>
                      <p className="text-[10px] text-gray-400">
                        {p.avgSleepHours}h sueño · {p.avgAwakenings} despert.
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
                      {p.score.toFixed(1)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
