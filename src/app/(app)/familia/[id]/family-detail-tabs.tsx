"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import {
  ArrowLeft, Moon, AlertTriangle, Star, TrendingUp, TrendingDown,
  Phone, MessageSquare, Brain, Send, Copy, Check,
  Loader2, Sparkles, Target, ListOrdered, Plus, Info, BookOpen,
  X, Sun, Droplets, Baby, Activity, Smile, FileText, Pencil,
  ClipboardList, UtensilsCrossed, Clock, Frown, Meh,
  type LucideIcon,
} from "lucide-react";
import type { AgeBenchmark } from "@/lib/utils";

const TIMELINE_ICONS: Record<string, LucideIcon> = {
  sleep: Moon, wakeup: Sun, feeding: UtensilsCrossed, note: FileText,
  wake: Sun, feed: Droplets, diaper: Baby, play: Activity, mood: Smile,
};
import {
  createPlan, addPlanGoal, addPlanStep, toggleGoal, toggleStep,
  updatePlanStatus, createPlanFromTemplate,
  updateFamilyContact, updateFamily,
} from "@/lib/actions";
import { generateInsights } from "@/lib/ai";
import {
  inviteUrl, cn, whatsappUrl, scoreExplanation, getAgeBenchmark,
  countDaysWithSleepRecords, averageSleepMetric,
} from "@/lib/utils";
import type {
  ActivityRecord, WeeklySleepData, Insight, AdvisorNote, SleepPlan,
  SleepPlanGoal, SleepPlanStep, InsightType, RecordType,
  SleepPlanTemplate, FamilyDeepAnalytics,
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

const TABS = ["Diario", "Sueño", "Hábitos", "IA & Plan", "Notas"] as const;
type TabId = (typeof TABS)[number];

function insightStyles(type: InsightType) {
  switch (type) {
    case "improvement": return { card: "bg-emerald-50 border-emerald-100", icon: "text-emerald-600" };
    case "alert": return { card: "bg-red-50 border-red-100", icon: "text-red-600" };
    case "pattern": return { card: "bg-nanni-50 border-nanni-100", icon: "text-nanni-600" };
    case "recommendation":
    default: return { card: "bg-amber-50 border-amber-100", icon: "text-amber-600" };
  }
}

function parseRange(raw: string): { min: number; max: number } | null {
  const m = raw.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const min = Number(m[1]);
  const max = Number(m[2]);
  if (Number.isNaN(min) || Number.isNaN(max)) return null;
  return { min, max };
}

type Props = {
  familyId: string;
  advisorId: string;
  babyName: string;
  initialBabyName: string;
  initialBabyLastName: string | null;
  babyInitial: string;
  ageLabel: string;
  ageMonths: number;
  parentsLabel: string;
  city: string | null;
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
  deepAnalytics: FamilyDeepAnalytics;
  scoreTrend: { date: string; score: number }[];
  createNoteAction: (formData: FormData) => Promise<void>;
};

export function FamilyDetailTabs(props: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("Diario");
  const [copied, setCopied] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [pendingInsight, startInsight] = useTransition();
  const [pendingToggle, startToggle] = useTransition();
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [showContactEdit, setShowContactEdit] = useState(false);
  const [showFamilyEdit, setShowFamilyEdit] = useState(false);
  const [editBabyName, setEditBabyName] = useState(props.initialBabyName);
  const [editBabyLastName, setEditBabyLastName] = useState(props.initialBabyLastName || "");
  const [editCity, setEditCity] = useState(props.city || "");
  const [editStatus, setEditStatus] = useState(props.familyStatus);
  const [contactPhone, setContactPhone] = useState(props.parentPhone || "");
  const [contactEmail, setContactEmail] = useState(props.parentEmail || "");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

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

  const handleSaveFamily = () => {
    startToggle(async () => {
      const fd = new FormData();
      fd.set("baby_name", editBabyName.trim());
      fd.set("baby_last_name", editBabyLastName.trim());
      fd.set("city", editCity.trim());
      fd.set("status", editStatus);
      await updateFamily(props.familyId, fd);
      setShowFamilyEdit(false);
      router.refresh();
    });
  };

  const sleepTodayLabel = `${props.totalSleepToday.toFixed(1)}h`;
  const awakeningsLabel = String(props.awakeningsLastNight);

  const totalRange = parseRange(benchmark.totalSleep);
  const nightRange = parseRange(benchmark.nightSleep);
  const napRange = parseRange(benchmark.napSleep);
  const napsRange = parseRange(benchmark.naps);
  const daysWithSleep = props.weeklySleep.filter((d) => d.total > 0);
  const rulesAlerts: { level: "alta" | "media"; text: string }[] = [];
  if (daysWithSleep.length > 0) {
    const lowNightDays = nightRange ? daysWithSleep.filter((d) => d.night_hours > 0 && d.night_hours < nightRange.min).length : 0;
    const lowTotalDays = totalRange ? daysWithSleep.filter((d) => d.total > 0 && d.total < totalRange.min).length : 0;
    const lowNapDays = napRange ? daysWithSleep.filter((d) => d.nap_hours > 0 && d.nap_hours < napRange.min).length : 0;
    const highWakeDays = daysWithSleep.filter((d) => d.awakenings > benchmark.maxAwakenings).length;
    const napCountOutDays = napsRange
      ? daysWithSleep.filter((d) => d.nap_count > 0 && (d.nap_count < napsRange.min || d.nap_count > napsRange.max)).length
      : 0;
    if (highWakeDays >= 2) rulesAlerts.push({ level: "alta", text: `${highWakeDays} noches con despertares por encima del máximo recomendado (${benchmark.maxAwakenings}).` });
    if (lowTotalDays >= 2) rulesAlerts.push({ level: "alta", text: `${lowTotalDays} días con sueño total por debajo de ${totalRange?.min}h.` });
    if (lowNightDays >= 2) rulesAlerts.push({ level: "media", text: `${lowNightDays} noches por debajo del rango nocturno recomendado (${benchmark.nightSleep}).` });
    if (lowNapDays >= 3) rulesAlerts.push({ level: "media", text: `${lowNapDays} días con siestas por debajo del rango recomendado (${benchmark.napSleep}).` });
    if (napCountOutDays >= 3) rulesAlerts.push({ level: "media", text: `${napCountOutDays} días con número de siestas fuera de rango (${benchmark.naps}).` });
  }

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
              <p className="text-gray-400 text-sm mt-0.5">
                {props.ageLabel}
                {props.city ? ` · ${props.city}` : ""}
                {" · "}
                {props.parentsLabel}
                {" · Desde "}
                {props.sinceLabel}
              </p>
            </div>
          </div>
          <div className="sm:ml-auto flex gap-2">
            <button
              onClick={() => setShowFamilyEdit(true)}
              className="bg-white border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition"
            >
              <Pencil className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </button>
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

      {showFamilyEdit && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Editar perfil de la familia</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={editBabyName}
              onChange={(e) => setEditBabyName(e.target.value)}
              placeholder="Nombre del bebé"
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500"
            />
            <input
              value={editBabyLastName}
              onChange={(e) => setEditBabyLastName(e.target.value)}
              placeholder="Apellidos del bebé"
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500"
            />
            <input
              value={editCity}
              onChange={(e) => setEditCity(e.target.value)}
              placeholder="Ciudad"
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500"
            />
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500"
            >
              <option value="active">Activa</option>
              <option value="paused">Pausada</option>
              <option value="completed">Completada</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveFamily}
              disabled={pendingToggle || !editBabyName.trim()}
              className="bg-nanni-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-nanni-700 transition disabled:opacity-50"
            >
              Guardar cambios
            </button>
            <button onClick={() => setShowFamilyEdit(false)} className="text-sm text-gray-500 px-4 py-2">
              Cancelar
            </button>
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

      {activeTab === "Diario" && (
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

      {activeTab === "Sueño" && (
        <SuenoTab allSleepData={props.weeklySleep} benchmark={benchmark} />
      )}

      {activeTab === "Hábitos" && (
        <HabitosTab analytics={props.deepAnalytics} benchmark={benchmark} />
      )}

      {activeTab === "IA & Plan" && (
        <div className="space-y-6">
          {/* Alerts section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Alertas por reglas (edad {benchmark.label})
            </h3>
            <p className="text-xs text-gray-500 mt-1">Interpretación automática basada en ventanas de sueño recomendadas.</p>
            {rulesAlerts.length === 0 ? (
              <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                <p className="text-xs text-emerald-700 font-medium">Sin alertas activas en los últimos días con datos.</p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {rulesAlerts.map((alert, idx) => (
                  <div key={idx} className={cn("rounded-xl p-3 border", alert.level === "alta" ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100")}>
                    <p className={cn("text-xs font-semibold mb-0.5", alert.level === "alta" ? "text-red-700" : "text-amber-700")}>Prioridad {alert.level}</p>
                    <p className="text-xs text-gray-700">{alert.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI insights */}
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
          {props.insights.length > 0 && (
            <div className="space-y-3">
              {props.insights.map((insight) => {
                const st = insightStyles(insight.type);
                return (
                  <div key={insight.id} className={cn("rounded-2xl border p-5", st.card)}>
                    <div className="flex items-center gap-2 mb-2"><Brain className={cn("w-4 h-4", st.icon)} /><h3 className="text-sm font-bold text-gray-900">{insight.title}</h3></div>
                    <p className="text-sm text-gray-600 leading-relaxed">{insight.description}</p>
                    <p className="text-[10px] text-gray-400 mt-3 capitalize">{insight.type.replace("_", " ")}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Plan progress from analytics */}
          {props.deepAnalytics.planProgress.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-nanni-600" />
                <h3 className="font-bold text-gray-900">Progreso de intervenciones</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">Score antes y después de cada plan</p>
              <div className="space-y-4">
                {props.deepAnalytics.planProgress.map((plan) => {
                  const goalsProgress = plan.goalsTotal > 0 ? Math.round((plan.goalsAchieved / plan.goalsTotal) * 100) : 0;
                  const stepsProgress = plan.stepsTotal > 0 ? Math.round((plan.stepsCompleted / plan.stepsTotal) * 100) : 0;
                  return (
                    <div key={plan.planId} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900">{plan.planTitle}</h4>
                          <p className="text-[10px] text-gray-400">
                            Iniciado {new Date(plan.startedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                            {" · "}
                            <span className={cn("font-medium capitalize", plan.planStatus === "active" ? "text-emerald-600" : plan.planStatus === "completed" ? "text-gray-600" : "text-amber-600")}>
                              {plan.planStatus === "active" ? "Activo" : plan.planStatus === "completed" ? "Completado" : "Borrador"}
                            </span>
                          </p>
                        </div>
                        <div className={`text-center px-3 py-1.5 rounded-xl ${plan.scoreDelta >= 0 ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                          <p className={`text-lg font-bold ${plan.scoreDelta >= 0 ? "text-emerald-600" : "text-red-600"}`}>{plan.scoreDelta > 0 ? "+" : ""}{plan.scoreDelta.toFixed(1)}</p>
                          <p className="text-[9px] text-gray-400">delta score</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="text-center bg-white rounded-lg p-2 border border-gray-100">
                          <p className="text-[10px] text-gray-400">Score antes</p>
                          <p className="text-lg font-bold text-gray-500">{plan.scoreBefore.toFixed(1)}</p>
                        </div>
                        <div className="text-center bg-white rounded-lg p-2 border border-gray-100">
                          <p className="text-[10px] text-gray-400">Score ahora</p>
                          <p className="text-lg font-bold text-gray-900">{plan.scoreNow.toFixed(1)}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1"><span className="text-gray-500">Objetivos</span><span className="font-medium text-gray-900">{plan.goalsAchieved}/{plan.goalsTotal}</span></div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${goalsProgress}%` }} /></div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1"><span className="text-gray-500">Pasos</span><span className="font-medium text-gray-900">{plan.stepsCompleted}/{plan.stepsTotal}</span></div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-nanni-400 rounded-full transition-all" style={{ width: `${stepsProgress}%` }} /></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Plan management */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Gestión de planes</h3>
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-4">
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
                        onClick={() => { startToggle(async () => { await createPlanFromTemplate(props.familyId, t.id); setShowTemplateSelector(false); router.refresh(); }); }}
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
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500 mt-4">Aún no hay planes. Crea uno o usa una plantilla.</div>
            ) : (
              <div className="space-y-4 mt-4">
                {props.plans.map((plan) => (
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
                ))}
              </div>
            )}
          </div>
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

// ─── Sueño Tab ───

const CHART_BAR_H = 180;
/** Espacio bajo la leyenda para marcas de siestas y barras que crecen hacia arriba */
const CHART_TOP_PAD = 44;
const RANGE_OPTIONS = [
  { label: "7 días", days: 7 },
  { label: "14 días", days: 14 },
  { label: "30 días", days: 30 },
] as const;

function fullWeekdayEs(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const w = d.toLocaleDateString("es-ES", { weekday: "long" });
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function chartDayLabel(dateStr: string, rangeDays: number): string {
  const d = new Date(dateStr + "T12:00:00");
  if (rangeDays <= 14) return fullWeekdayEs(dateStr);
  const s = d.toLocaleDateString("es-ES", { weekday: "short" });
  const t = s.replace(/\.$/, "").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function fmtHoursWithMinutes(hours: number): string {
  const mins = Math.round(hours * 60);
  return `${hours.toFixed(1)}h (${mins} min)`;
}

function SuenoTab({
  allSleepData, benchmark,
}: {
  allSleepData: WeeklySleepData[];
  benchmark: AgeBenchmark;
}) {
  const [rangeDays, setRangeDays] = useState(7);
  const weeklySleep = allSleepData.slice(-rangeDays);

  const totalRange = parseRange(benchmark.totalSleep);
  const nightRange = parseRange(benchmark.nightSleep);
  const daysWithData = countDaysWithSleepRecords(weeklySleep);
  const weekAvgSleep = averageSleepMetric(weeklySleep, (d) => d.total);
  const weekAvgWake = averageSleepMetric(weeklySleep, (d) => d.awakenings);
  const avgNight = averageSleepMetric(weeklySleep, (d) => d.night_hours);
  const avgNap = averageSleepMetric(weeklySleep, (d) => d.nap_hours);
  const avgNapCount = averageSleepMetric(weeklySleep, (d) => d.nap_count);
  /* +12% cabeza de eje: las barras no llenan el 100% y no rozan el borde superior */
  const rawMax = Math.max(...weeklySleep.map((d) => d.night_hours + d.nap_hours), 16, 1);
  const maxSleepStack = Math.ceil(rawMax * 1.12 * 10) / 10;
  const maxAwakeBar = Math.max(...weeklySleep.map((d) => d.awakenings), 6, 1);
  const recommendedLine = totalRange && totalRange.min > 0 ? totalRange.min : null;

  const fmtDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  if (allSleepData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <Moon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No hay datos de sueño todavía.</p>
        <p className="text-xs text-gray-400 mt-1">Los datos aparecerán cuando los padres registren actividad.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Range selector + KPI strip */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-bold text-gray-900 text-xl tracking-tight">Sueño</h2>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5 w-fit">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setRangeDays(r.days)}
              className={cn(
                "text-sm font-medium px-4 py-2 rounded-lg transition min-w-[5.5rem]",
                rangeDays === r.days ? "bg-white text-nanni-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600 tabular-nums">
            {daysWithData > 0 ? <>{weekAvgSleep.toFixed(1)}<span className="text-base font-medium text-gray-400">h</span></> : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1.5">Media sueño</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-amber-600 tabular-nums">{daysWithData > 0 ? weekAvgWake.toFixed(1) : "—"}</p>
          <p className="text-xs text-gray-500 mt-1.5">Media despertares</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-cyan-600 tabular-nums">
            {daysWithData > 0 ? <>{avgNap.toFixed(1)}<span className="text-base font-medium text-gray-400">h</span></> : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1.5">Media siestas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{daysWithData}<span className="text-base font-medium text-gray-400">/{rangeDays}</span></p>
          <p className="text-xs text-gray-500 mt-1.5">Días con datos</p>
        </div>
      </div>

      {/* Unified chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-7">
        <div className="flex flex-col gap-3 mb-4">
          <p className="text-sm text-gray-500">Sueño nocturno, siestas y despertares por día</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs text-gray-600 pb-1 border-b border-gray-100/80">
            <div className="flex items-center gap-2"><div className="w-[2px] h-3.5 bg-cyan-500 rounded-full shrink-0" /><span>Nº siestas</span></div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-cyan-400 rounded-sm shrink-0" /><span>Siesta</span></div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-indigo-500 rounded-sm shrink-0" /><span>Noche</span></div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-amber-200 shrink-0" /><span>Despertares</span></div>
          </div>
        </div>

        <div className="relative pl-8 pr-8" style={{ paddingTop: CHART_TOP_PAD }}>
          <div
            className="absolute left-0 w-7 flex flex-col justify-between text-right pr-1"
            style={{ top: CHART_TOP_PAD, height: CHART_BAR_H }}
          >
            {[maxSleepStack, Math.round(maxSleepStack * 0.66), Math.round(maxSleepStack * 0.33), 0].map((v) => (
              <span key={`l${v}`} className="text-[10px] text-gray-400 tabular-nums leading-none">{v}h</span>
            ))}
          </div>
          <div
            className="absolute right-0 w-7 flex flex-col justify-between text-left pl-1"
            style={{ top: CHART_TOP_PAD, height: CHART_BAR_H }}
          >
            {[maxAwakeBar, Math.round(maxAwakeBar / 2), 0].map((v) => (
              <span key={`r${v}`} className="text-[10px] text-amber-400/90 tabular-nums leading-none">{v}</span>
            ))}
          </div>

          <div className="mx-0 relative">
            {recommendedLine && (
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top: CHART_BAR_H - (recommendedLine / maxSleepStack) * CHART_BAR_H,
                }}
              >
                <div className="w-full border-t-2 border-dashed border-emerald-300/60" />
                <span className="absolute -top-4 right-0 text-[10px] text-emerald-600 font-semibold bg-white/95 px-1.5 py-0.5 rounded shadow-sm">Mín. {recommendedLine}h</span>
              </div>
            )}

            <div className={cn("flex items-end", rangeDays <= 14 ? "gap-2 sm:gap-3" : "gap-1 sm:gap-1.5")} style={{ height: `${CHART_BAR_H}px` }}>
              {weeklySleep.map((d, idx) => {
                const hasData = d.total > 0 || d.awakenings > 0;
                const nightPx = (d.night_hours / maxSleepStack) * CHART_BAR_H;
                const napPx = (d.nap_hours / maxSleepStack) * CHART_BAR_H;
                const isLow = totalRange && d.total > 0 && d.total < totalRange.min;
                const highWake = d.awakenings > benchmark.maxAwakenings;
                const showDayLabel = rangeDays <= 14 || idx % 2 === 0 || idx === weeklySleep.length - 1;

                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 min-w-0 relative group">
                    <div className="absolute -top-[4.25rem] left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-xl px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg max-w-[min(18rem,85vw)] text-center leading-snug">
                      <p className="font-semibold">{fullWeekdayEs(d.date)} · {fmtDate(d.date)}</p>
                      {hasData ? (
                        <p className="text-[11px] text-gray-200 mt-1">Siesta {d.nap_hours.toFixed(1)}h ({d.nap_count}) · Noche {d.night_hours.toFixed(1)}h · {d.awakenings} despert.</p>
                      ) : (
                        <p className="text-[11px] text-gray-300 mt-1">Sin registro</p>
                      )}
                    </div>

                    {/* Nap count ticks — above bar, near nap section */}
                    {rangeDays <= 14 && (
                      <div className="flex items-center justify-center gap-[2px] h-3 mb-0.5">
                        {d.nap_count > 0 ? (
                          Array.from({ length: d.nap_count }).map((_, i) => (
                            <div key={i} className="w-[2px] h-2.5 bg-cyan-500 rounded-full" />
                          ))
                        ) : hasData ? (
                          <span className="text-[7px] text-gray-300">0</span>
                        ) : null}
                      </div>
                    )}

                    {/* Stacked bar: nap (cyan) on top, night (indigo) on bottom */}
                    {hasData ? (
                      <div className={cn("w-full rounded-lg overflow-hidden flex flex-col justify-end", isLow && "ring-2 ring-red-300 ring-offset-1")} style={{ height: `${Math.max(nightPx + napPx, 4)}px` }}>
                        <div className="bg-cyan-400 w-full" style={{ height: `${napPx}px`, minHeight: d.nap_hours > 0 ? 3 : 0 }} />
                        <div className="bg-indigo-500 w-full" style={{ height: `${nightPx}px`, minHeight: d.night_hours > 0 ? 3 : 0 }} />
                      </div>
                    ) : (
                      <div className="w-full rounded-lg bg-gray-100 flex items-center justify-center" style={{ height: "20px" }}>
                        <span className="text-[7px] text-gray-300">—</span>
                      </div>
                    )}

                    {/* Awakening badge — below bar, near night section */}
                    {d.awakenings > 0 && (
                      <div className="mt-0.5">
                        <div className={cn(
                          "rounded-full flex items-center justify-center font-bold border-2",
                          rangeDays <= 14 ? "w-5 h-5 text-[9px]" : "w-4 h-4 text-[7px]",
                          highWake ? "bg-red-100 text-red-600 border-red-300" : "bg-amber-100 text-amber-700 border-amber-300"
                        )}>
                          {d.awakenings}
                        </div>
                      </div>
                    )}

                    {showDayLabel && (
                      <span
                        className={cn(
                          "font-medium text-center leading-tight mt-1 px-0.5",
                          rangeDays <= 7 ? "text-[10px] sm:text-xs" : rangeDays <= 14 ? "text-[9px] sm:text-[11px]" : "text-[8px] sm:text-[10px]",
                          hasData ? "text-gray-700" : "text-gray-300"
                        )}
                      >
                        {chartDayLabel(d.date, rangeDays)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detalle diario */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-bold text-gray-900 text-base">Detalle diario</h3>
          <span className="text-sm text-gray-500">{daysWithData} días con registro de {rangeDays}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-gray-50/90 border-b border-gray-100">
                <th className="text-left pl-6 pr-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 w-[11rem]">Día</th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Noche</th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Despert.</th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Siestas</th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Nº siestas</th>
                <th className="text-right pl-4 pr-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-800">Total</th>
              </tr>
            </thead>
            <tbody>
              {weeklySleep.map((d, idx) => {
                const hasData = d.total > 0 || d.awakenings > 0;
                const isLowTotal = totalRange && d.total > 0 && d.total < totalRange.min;
                const isLowNight = nightRange && d.night_hours > 0 && d.night_hours < nightRange.min;
                const isHighWake = d.awakenings > benchmark.maxAwakenings;

                return (
                  <tr
                    key={d.date}
                    className={cn(
                      "transition-colors",
                      idx % 2 === 1 ? "bg-gray-50/50" : "bg-white",
                      "hover:bg-nanni-50/40",
                      !hasData && "text-gray-400"
                    )}
                  >
                    <td className="pl-6 pr-4 py-3.5 align-middle">
                      <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0">
                        <span className="font-semibold text-gray-900">{fullWeekdayEs(d.date)}</span>
                        <span className="text-sm text-gray-500 tabular-nums">{fmtDate(d.date)}</span>
                      </span>
                    </td>
                    <td className={cn("text-right px-4 py-3.5 font-mono tabular-nums text-[14px] leading-snug", isLowNight ? "text-red-600 font-semibold" : hasData ? "text-gray-800" : "")}>
                      {hasData ? fmtHoursWithMinutes(d.night_hours) : "—"}
                    </td>
                    <td className={cn("text-right px-4 py-3.5 font-mono tabular-nums text-[15px]", isHighWake ? "text-red-600 font-semibold" : hasData ? "text-gray-800" : "")}>
                      {hasData ? d.awakenings : "—"}
                    </td>
                    <td className={cn("text-right px-4 py-3.5 font-mono tabular-nums text-[14px] leading-snug", hasData ? "text-gray-800" : "")}>
                      {hasData ? fmtHoursWithMinutes(d.nap_hours) : "—"}
                    </td>
                    <td className="text-center px-4 py-3.5">
                      {hasData ? (
                        <span className="inline-flex items-center justify-center gap-1">
                          {Array.from({ length: d.nap_count }).map((_, i) => (
                            <span key={i} className="inline-block w-1 h-3.5 bg-cyan-500 rounded-full" />
                          ))}
                          {d.nap_count === 0 && <span className="text-gray-400 font-mono">0</span>}
                        </span>
                      ) : "—"}
                    </td>
                    <td className={cn("text-right pl-4 pr-6 py-3.5 font-mono tabular-nums text-[14px] font-semibold leading-snug", isLowTotal ? "text-red-600" : hasData ? "text-gray-900" : "text-gray-300")}>
                      {hasData ? fmtHoursWithMinutes(d.total) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className="pl-6 pr-4 py-3.5 font-semibold text-gray-900 align-top">
                  <span className="block">Media</span>
                  {daysWithData > 0 && (
                    <span className="block text-[10px] font-normal text-gray-500 mt-0.5">Solo días con registro ({daysWithData})</span>
                  )}
                </td>
                <td className="text-right px-4 py-3.5 font-mono tabular-nums text-[14px] font-semibold text-gray-800 leading-snug">
                  {daysWithData > 0 ? fmtHoursWithMinutes(avgNight) : "—"}
                </td>
                <td className="text-right px-4 py-3.5 font-mono tabular-nums text-[15px] font-semibold text-gray-800">
                  {daysWithData > 0 ? weekAvgWake.toFixed(1) : "—"}
                </td>
                <td className="text-right px-4 py-3.5 font-mono tabular-nums text-[14px] font-semibold text-gray-800 leading-snug">
                  {daysWithData > 0 ? fmtHoursWithMinutes(avgNap) : "—"}
                </td>
                <td className="text-center px-4 py-3.5 font-mono tabular-nums text-[15px] font-semibold text-gray-800">
                  {daysWithData > 0 ? avgNapCount.toFixed(1) : "—"}
                </td>
                <td className="text-right pl-4 pr-6 py-3.5 font-mono tabular-nums text-[14px] font-semibold text-gray-900 leading-snug">
                  {daysWithData > 0 ? fmtHoursWithMinutes(weekAvgSleep) : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Benchmark reference card */}
      <div className="bg-gradient-to-r from-nanni-50 to-indigo-50 rounded-2xl border border-nanni-100 p-6 md:p-7">
        <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2.5">
          <Info className="w-5 h-5 text-nanni-600 shrink-0" />
          Referencia por edad: {benchmark.label}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white/90 rounded-xl p-4 text-center shadow-sm border border-white/60">
            <p className="text-xs font-medium text-gray-500 mb-2">Sueño nocturno</p>
            <p className="text-base font-bold text-indigo-700">{benchmark.nightSleep}</p>
          </div>
          <div className="bg-white/90 rounded-xl p-4 text-center shadow-sm border border-white/60">
            <p className="text-xs font-medium text-gray-500 mb-2">Siestas</p>
            <p className="text-base font-bold text-cyan-700">{benchmark.naps} ({benchmark.napSleep})</p>
          </div>
          <div className="bg-white/90 rounded-xl p-4 text-center shadow-sm border border-white/60">
            <p className="text-xs font-medium text-gray-500 mb-2">Sueño total</p>
            <p className="text-base font-bold text-nanni-700">{benchmark.totalSleep}</p>
          </div>
          <div className="bg-white/90 rounded-xl p-4 text-center shadow-sm border border-white/60">
            <p className="text-xs font-medium text-gray-500 mb-2">Máx. despertares</p>
            <p className="text-base font-bold text-amber-700">{benchmark.maxAwakenings}</p>
          </div>
          <div className="bg-white/90 rounded-xl p-4 text-center shadow-sm border border-white/60">
            <p className="text-xs font-medium text-gray-500 mb-2">Ventana vigilia</p>
            <p className="text-base font-bold text-gray-800">{benchmark.wakeWindow}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 mt-5 pt-5 border-t border-nanni-200/40">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-500 shrink-0" /><span className="text-sm text-gray-700">Valor por debajo del rango</span></div>
          <div className="flex items-center gap-2"><div className="w-6 h-[2px] border-t-2 border-dashed border-emerald-500 shrink-0" /><span className="text-sm text-gray-700">Mínimo recomendado en gráfico</span></div>
        </div>
      </div>
    </div>
  );
}

const METHOD_LABELS: Record<string, string> = { self: "Solo/a", rocking: "Meciendo", feeding: "Pecho/biberón", white_noise: "Ruido blanco", other: "Otro" };
const METHOD_COLORS: Record<string, string> = { self: "bg-emerald-400", rocking: "bg-blue-400", feeding: "bg-nanni-400", white_noise: "bg-amber-400", other: "bg-gray-300" };
const LOCATION_LABELS: Record<string, string> = { crib: "Cuna", cosleep: "Colecho", arms: "Brazos", stroller: "Carrito", car: "Coche", other: "Otro" };
const FEED_METHOD_LABELS: Record<string, string> = { breast: "Pecho", bottle: "Biberón", solids: "Sólidos", mixed: "Mixto" };
const FEED_METHOD_COLORS: Record<string, string> = { breast: "bg-pink-400", bottle: "bg-blue-400", solids: "bg-amber-400", mixed: "bg-nanni-400" };
const EVENT_TAG_LABELS: Record<string, string> = { teething: "🦷 Dientes", vaccine: "💉 Vacuna", fever: "🤒 Fiebre", travel: "✈️ Viaje", routine_change: "🔄 Cambio rutina" };

function DonutChart({ data, colors, labels, size = 120 }: { data: { [key: string]: number }; colors: Record<string, string>; labels: Record<string, string>; size?: number }) {
  const entries = Object.entries(data).filter(([k]) => k !== "total" && data[k] > 0);
  const total = entries.reduce((a, [, v]) => a + v, 0);
  if (total === 0) return <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>;

  const r = size / 2;
  const strokeW = size * 0.2;
  const innerR = r - strokeW / 2;
  const circum = 2 * Math.PI * innerR;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {entries.map(([key, val]) => {
          const pct = val / total;
          const dashLen = pct * circum;
          const seg = (
            <circle key={key} cx={r} cy={r} r={innerR} fill="none" strokeWidth={strokeW} strokeDasharray={`${dashLen} ${circum - dashLen}`} strokeDashoffset={-offset}
              className={colors[key]?.replace("bg-", "stroke-") || "stroke-gray-300"} transform={`rotate(-90 ${r} ${r})`} />
          );
          offset += dashLen;
          return seg;
        })}
        <text x={r} y={r - 4} textAnchor="middle" className="fill-gray-900 text-lg font-bold">{total}</text>
        <text x={r} y={r + 10} textAnchor="middle" className="fill-gray-400 text-[9px]">registros</text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {entries.map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors[key] || "bg-gray-300"}`} />
            <span className="text-xs text-gray-700 flex-1 truncate">{labels[key] || key}</span>
            <span className="text-xs font-semibold text-gray-900">{Math.round((val / total) * 100)}%</span>
            <span className="text-[10px] text-gray-400">({val})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-16 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-900 w-8 text-right">{value}</span>
    </div>
  );
}

function HabitosTab({ analytics, benchmark }: { analytics: FamilyDeepAnalytics; benchmark: AgeBenchmark }) {
  const sm = analytics.sleepMethods;
  const aq = analytics.awakeningQuality;
  const wm = analytics.wakeupMood;
  const lat = analytics.latency;
  const fd = analytics.feeding;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sleep method */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-1">Cómo se duerme</h3>
          <p className="text-xs text-gray-400 mb-4">Método para conciliar el sueño (14 días)</p>
          <DonutChart data={sm as unknown as { [key: string]: number }} colors={METHOD_COLORS} labels={METHOD_LABELS} />
        </div>

        {/* Sleep location */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-1">Dónde duerme</h3>
          <p className="text-xs text-gray-400 mb-4">Ubicación del sueño (14 días)</p>
          {analytics.sleepLocations.total === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(analytics.sleepLocations).filter(([k, v]) => k !== "total" && v > 0).sort(([, a], [, b]) => b - a).map(([key, val]) => (
                <HorizontalBar key={key} label={LOCATION_LABELS[key] || key} value={val} max={analytics.sleepLocations.total} color="bg-nanni-400" />
              ))}
            </div>
          )}
        </div>

        {/* Latency */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-nanni-600" />
            <h3 className="font-bold text-gray-900">Latencia de sueño</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Tiempo medio para dormirse</p>
          {lat.entries === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Sin datos de latencia</p>
          ) : (
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">{lat.current}<span className="text-lg text-gray-400">min</span></div>
              {lat.previous > 0 && (
                <div className={`flex items-center justify-center gap-1 mt-2 text-sm font-medium ${lat.current <= lat.previous ? "text-emerald-600" : "text-red-500"}`}>
                  {lat.current <= lat.previous ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {lat.current <= lat.previous ? "Mejoró" : "Empeoró"} vs periodo anterior ({lat.previous}min)
                </div>
              )}
              <p className="text-[10px] text-gray-400 mt-2">{lat.entries} registros con latencia</p>
            </div>
          )}
        </div>

        {/* Awakening quality */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-gray-900">Calidad de despertares</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Con llanto vs sin llanto</p>
          {aq.total === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Sin datos de despertares</p>
          ) : (
            <div>
              <div className="flex h-8 rounded-xl overflow-hidden mb-4">
                {aq.withCrying > 0 && (
                  <div className="bg-red-400 flex items-center justify-center text-white text-[10px] font-medium px-2" style={{ width: `${(aq.withCrying / aq.total) * 100}%` }}>
                    {aq.withCrying > 0 ? `${Math.round((aq.withCrying / aq.total) * 100)}% llanto` : ""}
                  </div>
                )}
                {aq.withoutCrying > 0 && (
                  <div className="bg-emerald-400 flex items-center justify-center text-white text-[10px] font-medium px-2" style={{ width: `${(aq.withoutCrying / aq.total) * 100}%` }}>
                    {aq.withoutCrying > 0 ? `${Math.round((aq.withoutCrying / aq.total) * 100)}% tranquilo` : ""}
                  </div>
                )}
                {(aq.total - aq.withCrying - aq.withoutCrying) > 0 && (
                  <div className="bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-medium px-2 flex-1">
                    Sin dato
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-red-50 rounded-xl p-2">
                  <p className="text-lg font-bold text-red-600">{aq.withCrying}</p>
                  <p className="text-[10px] text-gray-500">Con llanto</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-2">
                  <p className="text-lg font-bold text-emerald-600">{aq.withoutCrying}</p>
                  <p className="text-[10px] text-gray-500">Sin llanto</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2">
                  <p className="text-lg font-bold text-gray-600">{aq.total}</p>
                  <p className="text-[10px] text-gray-500">Total</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wakeup mood */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-1">Humor al despertar</h3>
          <p className="text-xs text-gray-400 mb-4">Cómo despierta por las mañanas</p>
          {wm.total === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Sin datos de humor matutino</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: "happy", emoji: "😊", label: "Contento", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                { key: "neutral", emoji: "😐", label: "Neutro", color: "bg-amber-50 border-amber-200 text-amber-700" },
                { key: "cranky", emoji: "😫", label: "Irritable", color: "bg-red-50 border-red-200 text-red-700" },
              ] as const).map((mood) => {
                const val = wm[mood.key];
                const pct = wm.total > 0 ? Math.round((val / wm.total) * 100) : 0;
                return (
                  <div key={mood.key} className={`rounded-xl border p-3 text-center ${mood.color}`}>
                    <div className="text-2xl mb-1">{mood.emoji}</div>
                    <div className="text-lg font-bold">{pct}%</div>
                    <div className="text-[10px]">{mood.label} ({val})</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Feeding */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <UtensilsCrossed className="w-4 h-4 text-sky-600" />
            <h3 className="font-bold text-gray-900">Alimentación</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">{fd.avgPerDay} tomas/día de media</p>
          {fd.methods.total === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Sin datos de alimentación</p>
          ) : (
            <DonutChart data={fd.methods as unknown as { [key: string]: number }} colors={FEED_METHOD_COLORS} labels={FEED_METHOD_LABELS} size={100} />
          )}
        </div>
      </div>

      {/* Feeding by hour */}
      {fd.methods.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-1">Horario de tomas</h3>
          <p className="text-xs text-gray-400 mb-4">Distribución por hora del día</p>
          {(() => {
            const maxCount = Math.max(1, ...fd.byHour.map((h) => h.count));
            const hours = fd.byHour.filter((h) => h.count > 0 || (h.hour >= 6 && h.hour <= 22));
            return (
              <div className="flex items-end gap-1 h-24">
                {hours.map((h) => (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    {h.count > 0 && <span className="text-[8px] text-gray-400">{h.count}</span>}
                    <div className={`w-full rounded-t-sm ${h.count > 0 ? "bg-sky-400" : "bg-gray-100"}`}
                      style={{ height: `${Math.max(h.count > 0 ? 4 : 2, (h.count / maxCount) * 80)}px` }} />
                    <span className="text-[8px] text-gray-400">{h.hour}h</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Feeding amounts */}
      {fd.amounts.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-1">Cantidad por toma</h3>
          <p className="text-xs text-gray-400 mb-4">Distribución del apetito</p>
          <div className="flex h-8 rounded-xl overflow-hidden">
            {fd.amounts.little > 0 && (
              <div className="bg-amber-300 flex items-center justify-center text-amber-900 text-[10px] font-medium px-2" style={{ width: `${(fd.amounts.little / fd.amounts.total) * 100}%` }}>
                Poco {Math.round((fd.amounts.little / fd.amounts.total) * 100)}%
              </div>
            )}
            {fd.amounts.normal > 0 && (
              <div className="bg-emerald-400 flex items-center justify-center text-white text-[10px] font-medium px-2" style={{ width: `${(fd.amounts.normal / fd.amounts.total) * 100}%` }}>
                Normal {Math.round((fd.amounts.normal / fd.amounts.total) * 100)}%
              </div>
            )}
            {fd.amounts.lots > 0 && (
              <div className="bg-blue-400 flex items-center justify-center text-white text-[10px] font-medium px-2" style={{ width: `${(fd.amounts.lots / fd.amounts.total) * 100}%` }}>
                Mucho {Math.round((fd.amounts.lots / fd.amounts.total) * 100)}%
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event correlations */}
      {analytics.eventCorrelations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-1">Impacto de eventos en el sueño</h3>
          <p className="text-xs text-gray-400 mb-4">Cómo afectan los eventos registrados a la calidad del sueño</p>
          <div className="space-y-3">
            {analytics.eventCorrelations.map((ev) => (
              <div key={ev.tag} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm text-gray-900">{EVENT_TAG_LABELS[ev.tag] || ev.tag}</span>
                  <span className="text-[10px] text-gray-400">{ev.count} evento{ev.count > 1 ? "s" : ""}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center bg-white rounded-lg p-2 border border-gray-100">
                    <p className="text-[10px] text-gray-400 mb-1">Sueño (antes → después)</p>
                    <p className="text-sm font-bold text-gray-900">
                      {ev.avgSleepBefore}h → {ev.avgSleepAfter}h
                      <span className={`ml-1 text-xs ${ev.sleepDelta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        ({ev.sleepDelta > 0 ? "+" : ""}{ev.sleepDelta}h)
                      </span>
                    </p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-2 border border-gray-100">
                    <p className="text-[10px] text-gray-400 mb-1">Despertares (antes → después)</p>
                    <p className="text-sm font-bold text-gray-900">
                      {ev.avgAwakeningsBefore} → {ev.avgAwakeningsAfter}
                      <span className={`ml-1 text-xs ${ev.awakeningsDelta <= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        ({ev.awakeningsDelta > 0 ? "+" : ""}{ev.awakeningsDelta})
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
