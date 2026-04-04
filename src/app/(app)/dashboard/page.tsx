import { createClient } from "@/lib/supabase/server";
import { getDashboardStats, getFamilies, getRecentRecordsAllFamilies, getInsights, getWeeklySleep, getSubscription, getBrand } from "@/lib/db";
import { trialDaysLeft, isTrialExpired } from "@/lib/types";
import { getGreeting, timeAgo, babyAgeLabel, sleepScore, statusFromScore } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { UpgradeToast } from "@/components/app/UpgradeToast";
import { Suspense } from "react";
import Link from "next/link";
import {
  Users, CheckCircle, Check, AlertTriangle, TrendingUp, TrendingDown,
  Clock, Brain, ArrowRight, ArrowUpRight, CalendarDays, Moon, Sparkles,
  Crown, Zap, Palette, Target, Rocket,
  Sun, Droplets, Baby, Smile, FileText, Activity, ClipboardList,
  type LucideIcon,
} from "lucide-react";

const typeIcons: Record<string, LucideIcon> = {
  sleep: Moon, feed: Droplets, diaper: Baby, play: Activity,
  mood: Smile, note: FileText, wake: Sun,
};

const typeLabels: Record<string, string> = {
  sleep: "sueño", feed: "toma", diaper: "pañal", play: "juego",
  mood: "humor", note: "nota", wake: "despertar",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const firstName = (user.user_metadata?.full_name || user.email?.split("@")[0] || "Asesora").split(" ")[0];
  const greeting = getGreeting();

  const [stats, families, recentActivity, insights, subscription, brand] = await Promise.all([
    getDashboardStats(user.id),
    getFamilies(user.id),
    getRecentRecordsAllFamilies(user.id, 8),
    getInsights(user.id, { unreadOnly: false, limit: 4 }),
    getSubscription(user.id),
    getBrand(user.id),
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

  const statCards = [
    {
      icon: Users,
      value: stats.active_families.toString(),
      label: "Familias activas",
      trend: stats.families_trend > 0 ? `+${stats.families_trend} este mes` : "Sin cambios",
      trendUp: stats.families_trend >= 0,
      color: "text-nanni-600",
      bg: "bg-nanni-50",
    },
    {
      icon: CheckCircle,
      value: `${stats.records_today_pct}%`,
      label: "Registros al día",
      trend: stats.records_trend > 0 ? `+${stats.records_trend}% vs sem. pasada` : "Sin datos",
      trendUp: stats.records_trend >= 0,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      icon: AlertTriangle,
      value: stats.families_needing_attention.toString(),
      label: "Necesitan atención",
      trend: stats.attention_trend < 0 ? `${stats.attention_trend} vs ayer` : "Sin cambios",
      trendUp: stats.attention_trend <= 0,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      icon: Moon,
      value: stats.avg_sleep_hours > 0 ? `${stats.avg_sleep_hours}h` : "—",
      label: "Media sueño/día",
      trend: stats.sleep_trend > 0 ? `+${stats.sleep_trend}h vs sem. pasada` : "Sin datos",
      trendUp: stats.sleep_trend >= 0,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  const familiesNeedingAttention = activeFamilies.filter((f) => {
    const lastRecord = recentActivity.find((r) => r.family_id === f.id);
    if (!lastRecord) return true;
    const hoursSince = (Date.now() - new Date(lastRecord.created_at).getTime()) / (1000 * 60 * 60);
    return hoursSince > 24;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Suspense><UpgradeToast /></Suspense>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {greeting}, {firstName}
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {stats.families_needing_attention > 0
              ? `Tienes ${stats.families_needing_attention} alerta${stats.families_needing_attention > 1 ? "s" : ""} pendiente${stats.families_needing_attention > 1 ? "s" : ""}.`
              : "Todo bajo control hoy."}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
            <div className={`flex items-center gap-1 mt-2 text-[11px] font-medium ${stat.trendUp ? "text-emerald-600" : "text-amber-600"}`}>
              {stat.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {stat.trend}
            </div>
          </div>
        ))}
      </div>

      {subscription?.status === "trialing" && (
        <div className="bg-gradient-to-r from-nanni-600 via-nanni-600 to-nanni-700 rounded-2xl p-5 md:p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-300" />
                <span className="text-xs font-bold text-nanni-200 uppercase tracking-wider">Prueba Premium</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-1">
                Te quedan {trialDaysLeft(subscription)} días de acceso completo
              </h3>
              <p className="text-nanni-200 text-sm">
                Elige tu plan antes de que termine para no perder el acceso a tus familias e insights IA
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 text-center">
                <div className="text-2xl font-extrabold">{trialDaysLeft(subscription)}</div>
                <div className="text-[10px] text-nanni-200 font-medium uppercase">días</div>
              </div>
              <Link href="/plan" className="bg-white text-nanni-700 font-bold text-sm px-6 py-3 rounded-xl hover:bg-nanni-50 transition shadow-lg flex items-center gap-2">
                Ver planes <Zap className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="relative mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-x-6 gap-y-2 text-xs text-nanni-200">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-300" /> 50% dto. 3 primeros meses</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-300" /> Desde 24.50€/mes</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-300" /> Cancela cuando quieras</span>
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
            <p className="text-xs text-gray-400 mb-4">{completed}/{steps.length} completados — Configura Nanni para sacarle el máximo partido</p>
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
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
                <p className="text-sm text-gray-400">Aún no hay registros. Invita a una familia para empezar.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentActivity.map((item) => (
                  <Link
                    key={item.id}
                    href={`/familia/${item.family_id}`}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50/50 transition"
                  >
                    <span className="w-8 h-8 rounded-full bg-nanni-50 flex items-center justify-center shrink-0">
                      {(() => { const Icon = typeIcons[item.type] || ClipboardList; return <Icon className="w-4 h-4 text-nanni-600" />; })()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">
                        {item.family?.baby_name} — {typeLabels[item.type] || item.type}
                        {item.duration_minutes ? ` (${item.duration_minutes} min)` : ""}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {timeAgo(item.created_at)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Families needing attention */}
          {familiesNeedingAttention.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-gray-900">Necesitan atención</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {familiesNeedingAttention.slice(0, 4).map((f) => (
                  <Link
                    key={f.id}
                    href={`/familia/${f.id}`}
                    className="bg-white rounded-xl p-3 flex items-center gap-3 hover:shadow-md transition border border-amber-100/50"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700 shrink-0">
                      {f.baby_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {f.baby_name} <span className="text-gray-400 font-normal">· {babyAgeLabel(f.baby_birth_date)}</span>
                      </p>
                      <p className="text-xs text-amber-600">Sin registrar recientemente</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: AI Insights */}
        <div className="space-y-6">
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

          {/* Families overview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
            <h3 className="font-bold text-gray-900 mb-1">Familias</h3>
            <p className="text-xs text-gray-400 mb-4">{activeFamilies.length} activas</p>
            <div className="space-y-2">
              {activeFamilies.slice(0, 5).map((f) => (
                <Link key={f.id} href={`/familia/${f.id}`} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition">
                  <div className="w-8 h-8 rounded-full bg-nanni-100 flex items-center justify-center text-[10px] font-bold text-nanni-700">
                    {f.baby_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{f.baby_name}</p>
                    <p className="text-[10px] text-gray-400">{babyAgeLabel(f.baby_birth_date)}</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
