"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import {
  ArrowLeft, Moon, AlertTriangle, Star, TrendingUp, TrendingDown,
  Phone, MessageSquare, Brain, Send, BarChart3, Copy, Check,
  Loader2, Sparkles, Target, ListOrdered, Plus, Info, BookOpen,
  X, Sun, Droplets, Baby, Activity, Smile, FileText,
  ClipboardList, type LucideIcon,
} from "lucide-react";

const TIMELINE_ICONS: Record<string, LucideIcon> = {
  sleep: Moon, wakeup: Sun, feeding: Droplets, note: FileText,
  wake: Sun, feed: Droplets, diaper: Baby, play: Activity, mood: Smile,
};
import {
  createPlan, addPlanGoal, addPlanStep, toggleGoal, toggleStep,
  updatePlanStatus, createPlanFromTemplate,
  updateFamilyContact,
} from "@/lib/actions";
import { generateInsights } from "@/lib/ai";
import { inviteUrl, cn, whatsappUrl, scoreExplanation, getAgeBenchmark } from "@/lib/utils";
import type {
  ActivityRecord, WeeklySleepData, Insight, AdvisorNote, SleepPlan,
  SleepPlanGoal, SleepPlanStep, InsightType, RecordType,
  SleepPlanTemplate,
} from "@/lib/types";

export type PlanWithDetails = SleepPlan & {
  goals: SleepPlanGoal[];
  steps: SleepPlanStep[];
};

export type TimelineEntry = {
  id: string;
  time: string;
  iconName: string;
  label: string;
  detail: string;
  by: string;
  type: RecordType;
};

const TABS = ["Hoy", "Semana", "Gráficas", "IA", "Plan", "Notas"] as const;
type TabId = (typeof TABS)[number];

const DATE_RANGES = [
  { label: "7 días", days: 7 },
  { label: "14 días", days: 14 },
  { label: "30 días", days: 30 },
] as const;

function insightStyles(type: InsightType) {
  switch (type) {
    case "improvement": return { card: "bg-emerald-50 border-emerald-100", icon: "text-emerald-600" };
    case "alert": return { card: "bg-red-50 border-red-100", icon: "text-red-600" };
    case "pattern": return { card: "bg-nanni-50 border-nanni-100", icon: "text-nanni-600" };
    case "recommendation":
    default: return { card: "bg-amber-50 border-amber-100", icon: "text-amber-600" };
  }
}

type Props = {
  familyId: string;
  advisorId: string;
  babyName: string;
  babyInitial: string;
  ageLabel: string;
  ageMonths: number;
  parentsLabel: string;
  sinceLabel: string;
  statusLabel: string;
  statusColorClass: string;
  familyStatus: string;
  totalSleepToday: number;
  awakeningsLastNight: number;
  score: number;
  trendLabel: string;
  trendPositive: boolean;
  weeklySleep: WeeklySleepData[];
  daysWithData: number;
  timeline: TimelineEntry[];
  insights: Insight[];
  notes: AdvisorNote[];
  plans: PlanWithDetails[];
  inviteToken: string;
  parentPhone: string | null;
  parentEmail: string | null;
  templates: SleepPlanTemplate[];
  advisorName: string;
  createNoteAction: (formData: FormData) => Promise<void>;
};

export function FamilyDetailTabs(props: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("Hoy");
  const [copied, setCopied] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [pendingInsight, startInsight] = useTransition();
  const [pendingToggle, startToggle] = useTransition();
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [showContactEdit, setShowContactEdit] = useState(false);
  const [contactPhone, setContactPhone] = useState(props.parentPhone || "");
  const [contactEmail, setContactEmail] = useState(props.parentEmail || "");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedRange, setSelectedRange] = useState(7);

  const url = inviteUrl(props.inviteToken);
  const benchmark = getAgeBenchmark(props.ageMonths);

  const handleCopyInvite = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  };

  const onGenerateInsights = () => {
    setInsightError(null);
    startInsight(async () => {
      const res = await generateInsights(props.familyId, props.advisorId);
      if (res && "error" in res && res.error) { setInsightError(res.error); return; }
      router.refresh();
    });
  };

  const handleSaveContact = () => {
    startToggle(async () => {
      await updateFamilyContact(props.familyId, contactPhone || null, contactEmail || null);
      setShowContactEdit(false);
      router.refresh();
    });
  };

  const sleepTodayLabel = `${props.totalSleepToday.toFixed(1)}h`;
  const awakeningsLabel = String(props.awakeningsLastNight);

  const weekAvgSleep = props.weeklySleep.length > 0 ? props.weeklySleep.reduce((a, d) => a + d.total, 0) / props.weeklySleep.length : 0;
  const weekAvgWake = props.weeklySleep.length > 0 ? props.weeklySleep.reduce((a, d) => a + d.awakenings, 0) / props.weeklySleep.length : 0;
  const maxSleepStack = Math.max(...props.weeklySleep.map((d) => d.night_hours + d.nap_hours), 16, 1);
  const maxAwakeBar = Math.max(...props.weeklySleep.map((d) => d.awakenings), 6, 1);
  const avgNight = props.weeklySleep.length > 0 ? props.weeklySleep.reduce((a, d) => a + d.night_hours, 0) / props.weeklySleep.length : 0;
  const avgNap = props.weeklySleep.length > 0 ? props.weeklySleep.reduce((a, d) => a + d.nap_hours, 0) / props.weeklySleep.length : 0;
  const estWake = Math.max(0, 24 - avgNight - avgNap);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Link href="/familias" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4 transition">
          <ArrowLeft className="w-4 h-4" /> Familias
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-nanni-100 flex items-center justify-center text-xl font-bold text-nanni-700 shrink-0">
              {props.babyInitial}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{props.babyName}</h1>
                <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full", props.statusColorClass)}>{props.statusLabel}</span>
                {props.familyStatus !== "active" && (
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">{props.familyStatus}</span>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-0.5">{props.ageLabel} · {props.parentsLabel} · Desde {props.sinceLabel}</p>
            </div>
          </div>
          <div className="sm:ml-auto flex gap-2">
            {props.parentPhone ? (
              <>
                <a href={`tel:${props.parentPhone}`} className="bg-white border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition">
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Llamar</span>
                </a>
                <a href={whatsappUrl(props.parentPhone, `Hola, soy tu asesora de sueño. ¿Cómo va ${props.babyName}?`)} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              </>
            ) : (
              <button onClick={() => setShowContactEdit(true)} className="bg-white border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition">
                <Phone className="w-4 h-4" />
                <span className="text-xs">Añadir teléfono</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showContactEdit && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Datos de contacto de los padres</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+34 612 345 678" className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500" />
            <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="padre@email.com" className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveContact} className="bg-nanni-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-nanni-700 transition">Guardar</button>
            <button onClick={() => setShowContactEdit(false)} className="text-sm text-gray-500 px-4 py-2">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 md:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Enlace para padres</p>
            <p className="text-xs text-gray-400 mt-0.5">Comparte este enlace para que registren actividad desde su móvil.</p>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <code className="text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 truncate flex-1 min-w-0">{url}</code>
            <button type="button" onClick={handleCopyInvite} className="shrink-0 bg-nanni-600 text-white text-sm font-medium px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-nanni-700 transition">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? "Copiado" : "Copiar"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Sueño hoy", value: sleepTodayLabel, icon: Moon, color: "text-nanni-600 bg-nanni-50" },
          { label: "Despertares (últ. noche)", value: awakeningsLabel, icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
          { label: "Score", value: props.score.toFixed(1), icon: Star, color: "text-emerald-600 bg-emerald-50", hasInfo: true },
          { label: "Tendencia", value: props.trendLabel, icon: props.trendPositive ? TrendingUp : TrendingDown, color: props.trendPositive ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", s.color.split(" ").slice(1).join(" "))}>
              <s.icon className={cn("w-4 h-4", s.color.split(" ")[0])} />
            </div>
            <div className="text-lg font-bold text-gray-900 leading-tight">{s.value}</div>
            <div className="text-[11px] text-gray-400 flex items-center gap-1">
              {s.label}
              {s.hasInfo && (
                <button onClick={() => setShowScoreInfo(!showScoreInfo)} className="text-gray-300 hover:text-nanni-500 transition">
                  <Info className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showScoreInfo && (
        <div className="bg-nanni-50 border border-nanni-100 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-nanni-900 flex items-center gap-2"><Info className="w-4 h-4" /> Cómo se calcula el Score</h4>
            <button onClick={() => setShowScoreInfo(false)} className="text-nanni-400 hover:text-nanni-600"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-nanni-800">{scoreExplanation(props.score)}</p>
          <p className="text-xs text-nanni-700">El score combina: horas de sueño vs lo esperado para la edad ({benchmark.totalSleep}) y penalización por despertares (máx aceptable: {benchmark.maxAwakenings}).</p>
          <div className="bg-white rounded-xl p-3 mt-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Referencia para {benchmark.label}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div><span className="text-gray-400">Sueño total:</span> <span className="font-semibold text-gray-700">{benchmark.totalSleep}</span></div>
              <div><span className="text-gray-400">Noche:</span> <span className="font-semibold text-gray-700">{benchmark.nightSleep}</span></div>
              <div><span className="text-gray-400">Siestas:</span> <span className="font-semibold text-gray-700">{benchmark.naps} ({benchmark.napSleep})</span></div>
              <div><span className="text-gray-400">Ventana vigilia:</span> <span className="font-semibold text-gray-700">{benchmark.wakeWindow}</span></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex border-b border-gray-200 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        {TABS.map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={cn("text-sm font-medium px-4 py-3 border-b-2 transition whitespace-nowrap", activeTab === tab ? "border-nanni-600 text-nanni-600" : "border-transparent text-gray-400 hover:text-gray-600")}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Hoy" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-4 md:p-5 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Diario de {props.babyName} — Hoy</h2>
              <span className="text-xs text-gray-400 capitalize">{new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</span>
            </div>
            {props.timeline.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">Aún no hay registros hoy. Los padres verán actividad aquí cuando registren desde la app.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {props.timeline.map((entry, i) => (
                  <div key={entry.id} className={cn("flex gap-3 p-4", entry.type === "sleep" ? "bg-nanni-50/30" : "")}>
                    <div className="text-xs text-gray-400 font-mono w-10 pt-0.5 shrink-0">{entry.time}</div>
                    <div className="relative flex flex-col items-center shrink-0">
                      <div className="w-8 h-8 rounded-full bg-nanni-50 flex items-center justify-center border border-nanni-100">
                        {(() => { const Icon = TIMELINE_ICONS[entry.iconName] || ClipboardList; return <Icon className="w-4 h-4 text-nanni-600" />; })()}
                      </div>
                      {i < props.timeline.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1 min-h-[12px]" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <p className="text-sm font-medium text-gray-900">{entry.label}</p>
                      {entry.detail && <p className="text-xs text-gray-500 mt-0.5">{entry.detail}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">Registrado por {entry.by}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "Semana" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Resumen semanal</h2>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {DATE_RANGES.map((range) => (
                  <button key={range.days} onClick={() => setSelectedRange(range.days)} className={cn("text-[10px] font-medium px-2.5 py-1 rounded-md transition", selectedRange === range.days ? "bg-white text-nanni-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
            {props.weeklySleep.length === 0 ? (
              <p className="text-sm text-gray-500">No hay datos de sueño esta semana.</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-nanni-50 rounded-xl">
                    <p className="text-2xl font-bold text-nanni-700">{weekAvgSleep.toFixed(1)}h</p>
                    <p className="text-xs text-gray-500">Media sueño/día</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-xl">
                    <p className="text-2xl font-bold text-amber-700">{weekAvgWake.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">Media despertares</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-xl">
                    <p className="text-2xl font-bold text-emerald-700">{props.daysWithData}/7</p>
                    <p className="text-xs text-gray-500">Días con registro</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                  <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Referencia para {benchmark.label}</p>
                  <p className="text-xs text-blue-800">Sueño esperado: {benchmark.totalSleep} · Despertares máx: {benchmark.maxAwakenings} · Ventana vigilia: {benchmark.wakeWindow}</p>
                </div>
                <div className="space-y-3">
                  {props.weeklySleep.map((day) => (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-400 w-8">{day.day}</span>
                      <div className="flex-1 flex gap-1 h-5 min-w-0">
                        <div className="bg-nanni-400 rounded-md h-full" style={{ width: `${(day.night_hours / 15) * 100}%`, minWidth: day.night_hours > 0 ? 4 : 0 }} title={`Noche: ${day.night_hours}h`} />
                        <div className="bg-nanni-300 rounded-md h-full" style={{ width: `${(day.nap_hours / 15) * 100}%`, minWidth: day.nap_hours > 0 ? 4 : 0 }} title={`Siestas: ${day.nap_hours}h`} />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right shrink-0">{day.total.toFixed(1)}h</span>
                      <div className="flex items-center gap-1 w-16 shrink-0 justify-end">
                        {Array.from({ length: day.awakenings }).map((_, i) => (<div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400" />))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50 flex-wrap">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-2 bg-nanni-400 rounded-sm" /><span className="text-[10px] text-gray-400">Noche</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-2 bg-nanni-300 rounded-sm" /><span className="text-[10px] text-gray-400">Siestas</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-amber-400 rounded-full" /><span className="text-[10px] text-gray-400">Despertares</span></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "Gráficas" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-nanni-600" />
              <h2 className="font-bold text-gray-900">Horas de sueño</h2>
            </div>
            <p className="text-xs text-gray-400 mb-4">Últimos 7 días</p>
            {props.weeklySleep.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">Sin datos para graficar.</p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {props.weeklySleep.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-[9px] text-gray-400">{d.total.toFixed(1)}h</span>
                    <div className="w-full flex flex-col gap-0.5 justify-end" style={{ height: `${(d.total / maxSleepStack) * 140}px`, minHeight: d.total > 0 ? 8 : 0 }}>
                      <div className="bg-nanni-400 rounded-t-md w-full" style={{ flex: d.night_hours || 0.01, minHeight: d.night_hours > 0 ? 4 : 0 }} />
                      <div className="bg-nanni-300 rounded-b-md w-full" style={{ flex: d.nap_hours || 0.01, minHeight: d.nap_hours > 0 ? 4 : 0 }} />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">{d.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-1">Despertares nocturnos</h2>
            <p className="text-xs text-gray-400 mb-4">Últimos 7 días · Máx. aceptable: {benchmark.maxAwakenings}</p>
            {props.weeklySleep.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">Sin datos para graficar.</p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {props.weeklySleep.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-gray-400">{d.awakenings}</span>
                    <div className={cn("w-full rounded-t-md", d.awakenings > benchmark.maxAwakenings + 1 ? "bg-red-400" : d.awakenings > benchmark.maxAwakenings ? "bg-amber-400" : "bg-emerald-400")}
                      style={{ height: `${(d.awakenings / maxAwakeBar) * 140}px`, minHeight: d.awakenings > 0 ? 4 : 2 }} />
                    <span className="text-[10px] text-gray-400 font-medium">{d.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-1">Distribución estimada (media semanal)</h2>
            <p className="text-xs text-gray-400 mb-4">Noche, siestas y vigilia aproximada</p>
            {props.weeklySleep.length === 0 ? (
              <p className="text-sm text-gray-500">Sin datos.</p>
            ) : (
              <div className="flex h-8 rounded-xl overflow-hidden text-[10px]">
                <div className="bg-nanni-400 flex items-center justify-center text-white font-medium px-1" style={{ width: `${Math.min(100, (avgNight / 24) * 100)}%`, minWidth: avgNight > 0 ? "2rem" : 0 }}>
                  {avgNight >= 1 ? `Noche ${avgNight.toFixed(1)}h` : ""}
                </div>
                <div className="bg-nanni-300 flex items-center justify-center text-white font-medium px-1" style={{ width: `${Math.min(100, (avgNap / 24) * 100)}%`, minWidth: avgNap > 0 ? "2rem" : 0 }}>
                  {avgNap >= 0.5 ? `Siesta ${avgNap.toFixed(1)}h` : ""}
                </div>
                <div className="bg-amber-200 flex items-center justify-center text-amber-900 font-medium px-1 flex-1 min-w-[20%]">
                  Vigilia ~{estWake.toFixed(1)}h
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "IA" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><Sparkles className="w-4 h-4 text-nanni-600" /> Generar insights con IA</h3>
              <p className="text-xs text-gray-500 mt-1">Analiza los registros de la última semana y crea hasta 3 insights nuevos.</p>
              {insightError && <p className="text-xs text-red-600 mt-2">{insightError}</p>}
            </div>
            <button type="button" disabled={pendingInsight} onClick={onGenerateInsights} className="shrink-0 bg-nanni-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-nanni-700 transition disabled:opacity-60">
              {pendingInsight ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />} Generar
            </button>
          </div>
          {props.insights.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">No hay insights guardados. Pulsa &quot;Generar&quot; cuando haya suficientes registros (mín. 3 en la última semana).</div>
          ) : (
            props.insights.map((insight) => {
              const st = insightStyles(insight.type);
              return (
                <div key={insight.id} className={cn("rounded-2xl border p-5", st.card)}>
                  <div className="flex items-center gap-2 mb-2"><Brain className={cn("w-4 h-4", st.icon)} /><h3 className="text-sm font-bold text-gray-900">{insight.title}</h3></div>
                  <p className="text-sm text-gray-600 leading-relaxed">{insight.description}</p>
                  <p className="text-[10px] text-gray-400 mt-3 capitalize">{insight.type.replace("_", " ")}</p>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "Plan" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <form action={async (formData) => { await createPlan(formData); router.refresh(); }} className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <input type="hidden" name="family_id" value={props.familyId} />
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><Plus className="w-4 h-4 text-nanni-600" /> Nuevo plan</h3>
              <input name="title" required placeholder="Título del plan" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500 focus:border-transparent" />
              <textarea name="description" placeholder="Descripción (opcional)" rows={2} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500 focus:border-transparent resize-none" />
              <button type="submit" className="bg-nanni-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-nanni-700 transition">Crear plan</button>
            </form>
            {props.templates.length > 0 && (
              <div className="bg-gradient-to-br from-nanni-50 to-nanni-50 rounded-2xl border border-nanni-100 p-5 sm:w-72">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2"><BookOpen className="w-4 h-4 text-nanni-600" /> Usar plantilla</h3>
                <p className="text-xs text-gray-500 mb-3">Aplica un método probado con objetivos y pasos predefinidos.</p>
                <button onClick={() => setShowTemplateSelector(true)} className="w-full bg-nanni-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-nanni-700 transition">
                  Ver plantillas ({props.templates.length})
                </button>
              </div>
            )}
          </div>

          {showTemplateSelector && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Seleccionar plantilla</h3>
                <button onClick={() => setShowTemplateSelector(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {props.templates.map((t) => (
                  <div key={t.id} className="border border-gray-200 rounded-xl p-4 hover:border-nanni-300 transition">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-gray-900">{t.title}</h4>
                      {t.is_system && <span className="text-[9px] bg-nanni-100 text-nanni-600 px-1.5 py-0.5 rounded-full font-medium">Sistema</span>}
                    </div>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{t.description}</p>
                    <p className="text-[10px] text-gray-400 mb-3">{t.age_min_months}-{t.age_max_months} meses · {(t.goals as unknown[]).length} objetivos · {(t.steps as unknown[]).length} pasos</p>
                    <button
                      onClick={() => {
                        startToggle(async () => {
                          await createPlanFromTemplate(props.familyId, t.id);
                          setShowTemplateSelector(false);
                          router.refresh();
                        });
                      }}
                      disabled={pendingToggle}
                      className="w-full text-sm font-medium bg-nanni-100 text-nanni-700 px-3 py-2 rounded-xl hover:bg-nanni-200 transition disabled:opacity-50"
                    >
                      Aplicar plantilla
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {props.plans.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">Aún no hay planes. Crea uno o usa una plantilla para definir objetivos y pasos con la familia.</div>
          ) : (
            props.plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 md:p-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-900">{plan.title}</h3>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", plan.status === "active" ? "bg-emerald-100 text-emerald-700" : plan.status === "completed" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-700")}>{plan.status}</span>
                    </div>
                    {plan.description && <p className="text-sm text-gray-500 mt-1">{plan.description}</p>}
                  </div>
                  <label className="text-xs text-gray-500 flex items-center gap-2 shrink-0">
                    Estado
                    <select className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white" defaultValue={plan.status} disabled={pendingToggle} onChange={(e) => { const v = e.target.value; startToggle(async () => { await updatePlanStatus(plan.id, v); router.refresh(); }); }}>
                      <option value="draft">Borrador</option><option value="active">Activo</option><option value="completed">Completado</option>
                    </select>
                  </label>
                </div>
                <div className="p-4 md:p-5 space-y-4 border-b border-gray-50">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900"><Target className="w-4 h-4 text-nanni-600" /> Objetivos</div>
                  {plan.goals.length === 0 ? <p className="text-xs text-gray-400">Sin objetivos.</p> : (
                    <ul className="space-y-2">
                      {plan.goals.map((g) => (
                        <li key={g.id} className="flex items-start gap-3 text-sm text-gray-700">
                          <input type="checkbox" className="mt-1 rounded border-gray-300 text-nanni-600 focus:ring-nanni-500" checked={g.achieved} disabled={pendingToggle} onChange={(e) => { const checked = e.target.checked; startToggle(async () => { await toggleGoal(g.id, checked); router.refresh(); }); }} />
                          <span className={cn(g.achieved && "line-through text-gray-400")}>
                            {g.description}
                            {g.metric != null && g.target_value != null && <span className="text-xs text-gray-400 ml-1">({g.current_value ?? "—"}/{g.target_value} {g.metric})</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form className="flex flex-col sm:flex-row gap-2 pt-2" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startToggle(async () => { await addPlanGoal(plan.id, fd); (e.target as HTMLFormElement).reset(); router.refresh(); }); }}>
                    <input name="description" required placeholder="Nuevo objetivo" className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                    <input name="target_value" placeholder="Meta num." className="w-28 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                    <input name="metric" placeholder="Métrica" className="w-28 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                    <button type="submit" className="text-sm font-medium bg-nanni-100 text-nanni-700 px-3 py-2 rounded-xl hover:bg-nanni-200">Añadir</button>
                  </form>
                </div>
                <div className="p-4 md:p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900"><ListOrdered className="w-4 h-4 text-nanni-600" /> Pasos</div>
                  {plan.steps.length === 0 ? <p className="text-xs text-gray-400">Sin pasos.</p> : (
                    <ul className="space-y-2">
                      {plan.steps.map((s) => (
                        <li key={s.id} className="flex items-start gap-3 text-sm text-gray-700">
                          <input type="checkbox" className="mt-1 rounded border-gray-300 text-nanni-600 focus:ring-nanni-500" checked={s.completed} disabled={pendingToggle} onChange={(e) => { const checked = e.target.checked; startToggle(async () => { await toggleStep(s.id, checked); router.refresh(); }); }} />
                          <div>
                            <span className={cn("font-medium", s.completed && "line-through text-gray-400")}>{s.step_order}. {s.title}</span>
                            {s.description && <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>}
                            <p className="text-[10px] text-gray-400 mt-1">{s.duration_days} días</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form className="flex flex-col gap-2 pt-2" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startToggle(async () => { await addPlanStep(plan.id, fd); (e.target as HTMLFormElement).reset(); router.refresh(); }); }}>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input name="title" required placeholder="Título del paso" className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                      <input name="duration_days" type="number" min={1} defaultValue={7} className="w-full sm:w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                    </div>
                    <textarea name="description" placeholder="Descripción (opcional)" rows={2} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none" />
                    <button type="submit" className="text-sm font-medium bg-nanni-100 text-nanni-700 px-3 py-2 rounded-xl hover:bg-nanni-200 w-fit">Añadir paso</button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "Notas" && (
        <div className="space-y-4">
          <form action={props.createNoteAction} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <input type="hidden" name="family_id" value={props.familyId} />
            <h3 className="font-bold text-gray-900 mb-3">Añadir nota</h3>
            <textarea name="content" required placeholder="Escribe una nota sobre la evolución, recomendaciones..." rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500 focus:border-transparent resize-none" />
            <button type="submit" className="mt-2 bg-nanni-600 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-nanni-700 transition"><Send className="w-4 h-4" /> Guardar nota</button>
          </form>
          {props.notes.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">No hay notas todavía.</div>
          ) : (
            props.notes.map((note) => (
              <div key={note.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-nanni-600">Asesor</span>
                  <span className="text-xs text-gray-400">{new Date(note.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
