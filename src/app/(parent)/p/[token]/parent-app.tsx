"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Moon, Sun, UtensilsCrossed, FileText, X, Clock, Target,
  TrendingUp, ChevronDown, ChevronUp, Plus, Minus,
  Smile, Meh, Frown,
} from "lucide-react";
import { createRecordFromParent } from "@/lib/actions";
import { formatTime, babyAgeLabel, cn } from "@/lib/utils";
import type {
  Family, Brand, ActivityRecord, RecordType, SleepPlan,
  SleepPlanGoal, SleepPlanStep,
} from "@/lib/types";

interface ParentAppProps {
  family: Family;
  brand: Brand | null;
  token: string;
  initialRecords: ActivityRecord[];
  activePlan: (SleepPlan & { goals: SleepPlanGoal[]; steps: SleepPlanStep[] }) | null;
  weekSummary: { avgSleep: number; avgAwakenings: number; daysWithData: number };
}

type FormType = "sleep" | "feeding" | "wakeup" | "note";

const QUICK_BUTTONS: { type: FormType; label: string; icon: typeof Moon; color: string }[] = [
  { type: "sleep", label: "Sueño", icon: Moon, color: "bg-indigo-100 text-indigo-600" },
  { type: "wakeup", label: "Despertar", icon: Sun, color: "bg-amber-100 text-amber-600" },
  { type: "feeding", label: "Cena", icon: UtensilsCrossed, color: "bg-sky-100 text-sky-600" },
  { type: "note", label: "Nota", icon: FileText, color: "bg-gray-100 text-gray-600" },
];

const LOCATION_OPTIONS = [
  { value: "crib", label: "Cuna" },
  { value: "cosleep", label: "Colecho" },
  { value: "arms", label: "Brazos" },
  { value: "stroller", label: "Carrito" },
  { value: "car", label: "Coche" },
  { value: "other", label: "Otro" },
] as const;

const METHOD_OPTIONS = [
  { value: "self", label: "Solo/a" },
  { value: "rocking", label: "Meciendo" },
  { value: "feeding", label: "Pecho/biberón" },
  { value: "white_noise", label: "Ruido blanco" },
  { value: "other", label: "Otro" },
] as const;

const LATENCY_OPTIONS = [
  { value: 3, label: "<5 min" },
  { value: 7, label: "5-10" },
  { value: 15, label: "10-20" },
  { value: 25, label: "20-30" },
  { value: 31, label: "30+" },
] as const;

const FEED_METHOD_OPTIONS = [
  { value: "breast", label: "Pecho" },
  { value: "bottle", label: "Biberón" },
  { value: "solids", label: "Sólidos" },
  { value: "mixed", label: "Mixto" },
] as const;

const FEED_AMOUNT_OPTIONS = [
  { value: "little", label: "Poco" },
  { value: "normal", label: "Normal" },
  { value: "lots", label: "Mucho" },
] as const;

const NOTE_TAGS = [
  { value: "teething", label: "🦷 Dientes" },
  { value: "vaccine", label: "💉 Vacuna" },
  { value: "fever", label: "🤒 Fiebre" },
  { value: "travel", label: "✈️ Viaje" },
  { value: "routine_change", label: "🔄 Cambio rutina" },
] as const;

function nowTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function isDarkHour(): boolean {
  const h = new Date().getHours();
  return h >= 20 || h < 7;
}

function calcDurationMinutes(startTime: string, endTime: string, crossesMidnight: boolean): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (crossesMidnight || endMin < startMin) endMin += 24 * 60;
  return endMin - startMin;
}

function buildISOFromTime(time: string, dateOffset = 0): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setDate(d.getDate() + dateOffset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

// ─── Record label helpers ───
const TYPE_LABELS: Record<string, string> = {
  sleep: "Sueño", feeding: "Cena", wakeup: "Despertar", note: "Nota",
  feed: "Toma", diaper: "Pañal", play: "Juego", mood: "Humor", wake: "Despertar",
};

const TYPE_ICONS: Record<string, typeof Moon> = {
  sleep: Moon, feeding: UtensilsCrossed, wakeup: Sun, note: FileText,
  feed: UtensilsCrossed, diaper: FileText, play: FileText, mood: Smile, wake: Sun,
};

const MOOD_ICONS = {
  happy: { icon: Smile, label: "Contento", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  neutral: { icon: Meh, label: "Neutro", color: "text-amber-600 bg-amber-50 border-amber-200" },
  cranky: { icon: Frown, label: "Malhumorado", color: "text-red-600 bg-red-50 border-red-200" },
} as const;

function sleepDetailLine(r: ActivityRecord): string {
  const d = r.details as Record<string, unknown>;
  const parts: string[] = [];
  const st = d?.sleep_type as string | undefined;
  if (st === "night") parts.push("Nocturno");
  else if (st === "nap") parts.push("Siesta");
  else {
    const h = new Date(r.started_at).getHours();
    parts.push(h >= 19 || h < 7 ? "Nocturno" : "Siesta");
  }
  if (r.duration_minutes) {
    const hrs = Math.floor(r.duration_minutes / 60);
    const mins = r.duration_minutes % 60;
    parts.push(hrs > 0 ? `${hrs}h ${mins > 0 ? `${mins}min` : ""}` : `${mins}min`);
  }
  if (r.ended_at) parts.push(`→ ${formatTime(r.ended_at)}`);
  const aw = d?.awakenings as number | undefined;
  if (typeof aw === "number" && aw > 0) parts.push(`${aw} despertares`);
  const loc = d?.location as string | undefined;
  const locLabels: Record<string, string> = { crib: "Cuna", cosleep: "Colecho", arms: "Brazos", stroller: "Carrito", car: "Coche" };
  if (loc && locLabels[loc]) parts.push(locLabels[loc]);
  return parts.join(" · ");
}

function feedingDetailLine(r: ActivityRecord): string {
  const d = r.details as Record<string, unknown>;
  const parts: string[] = [];
  const methodLabels: Record<string, string> = { breast: "Pecho", bottle: "Biberón", solids: "Sólidos", mixed: "Mixto", breast_left: "Pecho izq", breast_right: "Pecho der" };
  const m = d?.method as string;
  if (m && methodLabels[m]) parts.push(methodLabels[m]);
  if (d?.description) parts.push(String(d.description));
  const amtLabels: Record<string, string> = { little: "Poco", normal: "Normal", lots: "Mucho" };
  const amt = d?.amount as string;
  if (amt && amtLabels[amt]) parts.push(amtLabels[amt]);
  return parts.join(" · ");
}

function wakeupDetailLine(r: ActivityRecord): string {
  const d = r.details as Record<string, unknown>;
  const mood = d?.mood as string;
  const moodLabels: Record<string, string> = { happy: "😊 Contento", neutral: "😐 Neutro", cranky: "😫 Malhumorado", crying: "😫 Llorando" };
  const parts: string[] = [];
  if (mood && moodLabels[mood]) parts.push(moodLabels[mood]);
  if (d?.needed_help) parts.push("Necesitó ayuda");
  return parts.join(" · ");
}

function noteDetailLine(r: ActivityRecord): string {
  const d = r.details as Record<string, unknown>;
  const tags = d?.tags as string[] | undefined;
  const tagLabels: Record<string, string> = { teething: "🦷", vaccine: "💉", fever: "🤒", travel: "✈️", routine_change: "🔄" };
  const parts: string[] = [];
  if (tags?.length) parts.push(tags.map((t) => tagLabels[t] || t).join(" "));
  if (d?.text) parts.push(String(d.text));
  return parts.join(" · ");
}

function recordDetail(r: ActivityRecord): string {
  if (r.type === "sleep") return sleepDetailLine(r);
  if (r.type === "feeding" || r.type === "feed") return feedingDetailLine(r);
  if (r.type === "wakeup" || r.type === "wake") return wakeupDetailLine(r);
  if (r.type === "note") return noteDetailLine(r);
  if (r.type === "mood") {
    const d = r.details as Record<string, unknown>;
    return d?.label ? String(d.label) : "";
  }
  if (r.type === "diaper") {
    const d = r.details as Record<string, unknown>;
    const dt = d?.diaper_type as string;
    const labels: Record<string, string> = { wet: "Pipí", dirty: "Caca", both: "Ambos" };
    return labels[dt] || "";
  }
  return r.duration_minutes ? `${r.duration_minutes} min` : "";
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════

export function ParentApp({ family, brand, token, initialRecords, activePlan, weekSummary }: ParentAppProps) {
  const [records, setRecords] = useState<ActivityRecord[]>(initialRecords);
  const [showForm, setShowForm] = useState<FormType | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<"timeline" | "progress" | "plan">("timeline");
  const [showPlanSteps, setShowPlanSteps] = useState(false);
  const [parentName, setParentName] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`nanni_parent_${token}`) || "";
    return "";
  });
  const [showNamePrompt, setShowNamePrompt] = useState(!parentName);

  // Check for morning wakeup prompt
  const [showWakeupBanner, setShowWakeupBanner] = useState(false);
  useEffect(() => {
    const h = new Date().getHours();
    const hasTodayWakeup = records.some((r) => r.type === "wakeup" || r.type === "wake");
    if (h >= 5 && h < 12 && !hasTodayWakeup && parentName) {
      setShowWakeupBanner(true);
    }
  }, [records, parentName]);

  const router = useRouter();
  const primaryColor = brand?.primary_color || "#188d91";
  const brandName = brand?.name || "Nanni";
  const age = babyAgeLabel(family.baby_birth_date);
  const darkSheet = isDarkHour();

  function saveName(name: string) {
    setParentName(name);
    setShowNamePrompt(false);
    if (typeof window !== "undefined") localStorage.setItem(`nanni_parent_${token}`, name);
  }

  // ─── Quick wakeup from banner ───
  function handleQuickWakeup(mood: "happy" | "neutral" | "cranky") {
    setShowWakeupBanner(false);
    startTransition(async () => {
      await createRecordFromParent(
        token, "wakeup", new Date().toISOString(), null, null,
        { mood, recorded_by_name: parentName }, parentName
      );
      router.refresh();
    });
  }

  // ─── Name prompt ───
  if (showNamePrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: primaryColor + "20" }}>
            <Moon className="w-7 h-7" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{brandName}</h1>
          <p className="text-sm text-gray-500 mb-6">Diario de <strong>{family.baby_name}</strong></p>
          <form onSubmit={(e) => { e.preventDefault(); const name = (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value; if (name.trim()) saveName(name.trim()); }} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block text-left">Tu nombre</label>
              <input name="name" type="text" required placeholder="Ej: Ana" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent" style={{ "--tw-ring-color": primaryColor } as React.CSSProperties} />
            </div>
            <button type="submit" className="w-full text-white font-medium py-3 rounded-xl transition text-sm" style={{ backgroundColor: primaryColor }}>Empezar a registrar</button>
          </form>
        </div>
      </div>
    );
  }

  const completedGoals = activePlan?.goals.filter((g) => g.achieved).length || 0;
  const totalGoals = activePlan?.goals.length || 0;
  const completedSteps = activePlan?.steps.filter((s) => s.completed).length || 0;
  const totalSteps = activePlan?.steps.length || 0;

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
              <Moon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: primaryColor }}>{brandName}</p>
              <p className="text-[10px] text-gray-400">{family.baby_name} · {age}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">{parentName}</p>
        </div>
        <div className="flex border-b border-gray-100">
          {([
            { key: "timeline" as const, label: "Hoy" },
            { key: "progress" as const, label: "Progreso" },
            ...(activePlan ? [{ key: "plan" as const, label: "Plan" }] : []),
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={cn("flex-1 text-xs font-medium py-2.5 border-b-2 transition",
                activeSection === tab.key ? "border-current" : "border-transparent text-gray-400"
              )}
              style={activeSection === tab.key ? { color: primaryColor, borderColor: primaryColor } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-3 pb-24">
        {/* Morning wakeup banner */}
        {showWakeupBanner && activeSection === "timeline" && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-sm font-semibold text-amber-900 mb-2">
              Buenos días, ¿cómo se ha despertado {family.baby_name}?
            </p>
            <div className="flex gap-2">
              {(["happy", "neutral", "cranky"] as const).map((mood) => {
                const mi = MOOD_ICONS[mood];
                const Icon = mi.icon;
                return (
                  <button key={mood} onClick={() => handleQuickWakeup(mood)} disabled={isPending}
                    className={cn("flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition", mi.color)}>
                    <Icon className="w-7 h-7" />
                    <span className="text-[10px] font-medium">{mi.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeSection === "timeline" && (
          <>
            <h2 className="text-sm font-bold text-gray-900 mb-3">
              Hoy, {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </h2>
            {records.length === 0 ? (
              <div className="text-center py-12">
                <Moon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Aún no hay registros hoy.</p>
                <p className="text-xs text-gray-400 mt-1">Toca los botones de abajo para añadir.</p>
              </div>
            ) : (
              records.map((r) => {
                const Icon = TYPE_ICONS[r.type] || FileText;
                const detail = recordDetail(r);
                return (
                  <div key={r.id} className={cn(
                    "flex items-start gap-3 bg-white rounded-xl p-3 border shadow-sm",
                    r.type === "sleep" ? "border-indigo-100" : "border-gray-100"
                  )}>
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      r.type === "sleep" ? "bg-indigo-50 border border-indigo-100" :
                      r.type === "wakeup" || r.type === "wake" ? "bg-amber-50 border border-amber-100" :
                      r.type === "feeding" || r.type === "feed" ? "bg-sky-50 border border-sky-100" :
                      "bg-gray-50 border border-gray-100"
                    )}>
                      <Icon className={cn("w-4 h-4",
                        r.type === "sleep" ? "text-indigo-600" :
                        r.type === "wakeup" || r.type === "wake" ? "text-amber-600" :
                        r.type === "feeding" || r.type === "feed" ? "text-sky-600" :
                        "text-gray-500"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">{TYPE_LABELS[r.type] || r.type}</p>
                        <span className="text-[10px] text-gray-400">{formatTime(r.started_at)}</span>
                      </div>
                      {detail && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{detail}</p>}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* PROGRESS TAB */}
        {activeSection === "progress" && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Resumen de esta semana</h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                <p className="text-lg font-bold" style={{ color: primaryColor }}>{weekSummary.avgSleep.toFixed(1)}h</p>
                <p className="text-[10px] text-gray-400">Media sueño</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                <p className="text-lg font-bold text-amber-600">{weekSummary.avgAwakenings.toFixed(1)}</p>
                <p className="text-[10px] text-gray-400">Despertares</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                <p className="text-lg font-bold text-emerald-600">{weekSummary.daysWithData}/7</p>
                <p className="text-[10px] text-gray-400">Días registro</p>
              </div>
            </div>
            {activePlan && (
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4" style={{ color: primaryColor }} />
                  <h3 className="text-sm font-bold text-gray-900">Plan activo</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">{activePlan.title}</p>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-sm font-bold text-gray-900">{completedGoals}/{totalGoals}</p>
                    <p className="text-[10px] text-gray-400">Objetivos</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-sm font-bold text-gray-900">{completedSteps}/{totalSteps}</p>
                    <p className="text-[10px] text-gray-400">Pasos</p>
                  </div>
                </div>
                {totalGoals > 0 && (
                  <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(completedGoals / totalGoals) * 100}%`, backgroundColor: primaryColor }} />
                  </div>
                )}
              </div>
            )}
            <div className="bg-gradient-to-br from-nanni-50 to-nanni-50 rounded-xl p-4 border border-nanni-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-nanni-600" />
                <h3 className="text-sm font-bold text-nanni-900">Sigue así</h3>
              </div>
              <p className="text-xs text-nanni-700">Cada registro ayuda a tu asesora a personalizar las recomendaciones para {family.baby_name}.</p>
            </div>
          </div>
        )}

        {/* PLAN TAB */}
        {activeSection === "plan" && activePlan && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-900">{activePlan.title}</h2>
            {activePlan.description && <p className="text-xs text-gray-500">{activePlan.description}</p>}
            {activePlan.goals.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Objetivos</h3>
                <ul className="space-y-2">
                  {activePlan.goals.map((g) => (
                    <li key={g.id} className="flex items-start gap-2 text-sm">
                      <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5", g.achieved ? "border-emerald-500 bg-emerald-500" : "border-gray-300")}>
                        {g.achieved && <span className="text-white text-[10px]">✓</span>}
                      </div>
                      <span className={cn(g.achieved && "text-gray-400 line-through")}>{g.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activePlan.steps.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <button onClick={() => setShowPlanSteps(!showPlanSteps)} className="flex items-center justify-between w-full">
                  <h3 className="text-xs font-bold text-gray-500 uppercase">Pasos del plan</h3>
                  {showPlanSteps ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showPlanSteps && (
                  <ul className="space-y-3 mt-3">
                    {activePlan.steps.map((s) => (
                      <li key={s.id} className="flex items-start gap-3">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0", s.completed ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500")}>{s.step_order}</div>
                        <div>
                          <p className={cn("text-sm font-medium", s.completed && "line-through text-gray-400")}>{s.title}</p>
                          {s.description && <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>}
                          <p className="text-[10px] text-gray-400 mt-0.5">{s.duration_days} días</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex gap-2">
            {QUICK_BUTTONS.map((btn) => (
              <button key={btn.type} onClick={() => setShowForm(btn.type)}
                className={`flex-1 ${btn.color} rounded-xl py-2.5 flex flex-col items-center gap-1 active:scale-95 transition`}>
                <btn.icon className="w-4 h-4" />
                <span className="text-[9px] font-medium">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom sheet forms */}
      {showForm && (
        <FormSheet
          type={showForm}
          dark={darkSheet && showForm === "sleep"}
          primaryColor={primaryColor}
          isPending={isPending}
          babyName={family.baby_name}
          onClose={() => setShowForm(null)}
          onSubmit={(type, startedAt, endedAt, durationMinutes, details) => {
            startTransition(async () => {
              const result = await createRecordFromParent(
                token, type, startedAt, endedAt, durationMinutes,
                { ...details, recorded_by_name: parentName }, parentName
              );
              if (!result.error) {
                setShowForm(null);
                router.refresh();
              }
            });
          }}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════
// FORM BOTTOM SHEET
// ════════════════════════════════════════

function FormSheet({
  type, dark, primaryColor, isPending, babyName, onClose,
  onSubmit,
}: {
  type: FormType;
  dark: boolean;
  primaryColor: string;
  isPending: boolean;
  babyName: string;
  onClose: () => void;
  onSubmit: (type: FormType, startedAt: string, endedAt: string | null, durationMinutes: number | null, details: Record<string, unknown>) => void;
}) {
  // Sleep state
  const [sleepType, setSleepType] = useState<"night" | "nap">(() => {
    const h = new Date().getHours();
    return h >= 19 || h < 7 ? "night" : "nap";
  });
  const [startTime, setStartTime] = useState(nowTimeStr);
  const [endTime, setEndTime] = useState(nowTimeStr);
  const [awakenings, setAwakenings] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [location, setLocation] = useState<string>("");
  const [fellAsleepMethod, setFellAsleepMethod] = useState<string>("");
  const [latency, setLatency] = useState<number | null>(null);
  const [sleepNotes, setSleepNotes] = useState("");

  // Wakeup state
  const [wakeupTime, setWakeupTime] = useState(nowTimeStr);
  const [wakeupMood, setWakeupMood] = useState<"happy" | "neutral" | "cranky">("neutral");
  const [neededHelp, setNeededHelp] = useState(false);
  const [wakeupNotes, setWakeupNotes] = useState("");

  // Feeding state
  const [feedTime, setFeedTime] = useState(nowTimeStr);
  const [feedMethod, setFeedMethod] = useState<string>("solids");
  const [feedDescription, setFeedDescription] = useState("");
  const [feedAmount, setFeedAmount] = useState<string>("normal");

  // Note state
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [noteText, setNoteText] = useState("");

  const durationMin = type === "sleep"
    ? calcDurationMinutes(startTime, endTime, sleepType === "night")
    : null;

  function handleSubmit() {
    if (type === "sleep") {
      const startedAt = buildISOFromTime(startTime, sleepType === "night" && new Date().getHours() < 12 ? -1 : 0);
      const dur = calcDurationMinutes(startTime, endTime, sleepType === "night");
      const endedAt = new Date(new Date(startedAt).getTime() + dur * 60000).toISOString();
      const details: Record<string, unknown> = {
        sleep_type: sleepType,
        awakenings,
      };
      if (location) details.location = location;
      if (fellAsleepMethod) details.fell_asleep_method = fellAsleepMethod;
      if (latency !== null) details.latency_minutes = latency;
      if (sleepNotes) details.notes = sleepNotes;
      onSubmit("sleep", startedAt, endedAt, dur, details);

    } else if (type === "wakeup") {
      const startedAt = buildISOFromTime(wakeupTime);
      onSubmit("wakeup", startedAt, null, null, {
        mood: wakeupMood,
        needed_help: neededHelp || undefined,
        notes: wakeupNotes || undefined,
      });

    } else if (type === "feeding") {
      const startedAt = buildISOFromTime(feedTime);
      onSubmit("feeding", startedAt, null, null, {
        method: feedMethod,
        description: feedDescription || undefined,
        amount: feedAmount,
        notes: undefined,
      });

    } else if (type === "note") {
      if (!noteText.trim() && noteTags.length === 0) return;
      onSubmit("note", new Date().toISOString(), null, null, {
        text: noteText || undefined,
        tags: noteTags.length > 0 ? noteTags : undefined,
      });
    }
  }

  const bg = dark ? "bg-gray-900" : "bg-white";
  const text = dark ? "text-gray-100" : "text-gray-900";
  const textSub = dark ? "text-gray-400" : "text-gray-500";
  const textMuted = dark ? "text-gray-500" : "text-gray-400";
  const inputBg = dark ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-900";
  const chipBase = dark ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-600";
  const chipActive = dark ? "border-indigo-400 bg-indigo-900/40 text-indigo-300" : "border-indigo-500 bg-indigo-50 text-indigo-700";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className={cn("relative rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]", bg)}>
        <div className={cn("flex items-center justify-between p-4 border-b", dark ? "border-gray-800" : "border-gray-100")}>
          <h3 className={cn("font-bold", text)}>
            {type === "sleep" && "Registrar sueño"}
            {type === "wakeup" && "Despertar matutino"}
            {type === "feeding" && "Registrar cena"}
            {type === "note" && "Añadir nota"}
          </h3>
          <button onClick={onClose} className={cn("p-1", textMuted)}><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-5">

          {/* ─── SLEEP FORM ─── */}
          {type === "sleep" && (
            <>
              {/* Night / Nap toggle */}
              <div className="flex gap-2">
                {(["night", "nap"] as const).map((st) => (
                  <button key={st} onClick={() => setSleepType(st)}
                    className={cn("flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition",
                      sleepType === st ? chipActive : chipBase
                    )}>
                    {st === "night" ? "🌙 Noche" : "☀️ Siesta"}
                  </button>
                ))}
              </div>

              {/* Time pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cn("text-sm font-medium mb-1.5 block", textSub)}>Hora inicio</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                    className={cn("w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500", inputBg)} />
                </div>
                <div>
                  <label className={cn("text-sm font-medium mb-1.5 block", textSub)}>Hora fin</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                    className={cn("w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500", inputBg)} />
                </div>
              </div>

              {/* Duration display */}
              {durationMin !== null && durationMin > 0 && (
                <div className={cn("text-center py-2 rounded-xl text-sm font-medium",
                  dark ? "bg-indigo-900/30 text-indigo-300" : "bg-indigo-50 text-indigo-700")}>
                  <Clock className="w-4 h-4 inline mr-1.5" />
                  {Math.floor(durationMin / 60)}h {durationMin % 60 > 0 ? `${durationMin % 60}min` : ""} ({durationMin} min total)
                </div>
              )}

              {/* Awakenings stepper */}
              <div>
                <label className={cn("text-sm font-medium mb-1.5 block", textSub)}>Despertares</label>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setAwakenings(Math.max(0, awakenings - 1))}
                    className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center transition", chipBase, "hover:border-indigo-400")}>
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className={cn("text-2xl font-bold w-8 text-center", text)}>{awakenings}</span>
                  <button type="button" onClick={() => setAwakenings(Math.min(10, awakenings + 1))}
                    className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center transition", chipBase, "hover:border-indigo-400")}>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Collapsible details */}
              <button type="button" onClick={() => setShowDetails(!showDetails)}
                className={cn("flex items-center gap-2 text-sm font-medium", textSub)}>
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Más detalles
              </button>
              {showDetails && (
                <div className="space-y-4 pl-1">
                  {/* Location chips */}
                  <div>
                    <label className={cn("text-xs font-medium mb-1.5 block", textMuted)}>Dónde durmió</label>
                    <div className="flex flex-wrap gap-1.5">
                      {LOCATION_OPTIONS.map((opt) => (
                        <button key={opt.value} type="button" onClick={() => setLocation(location === opt.value ? "" : opt.value)}
                          className={cn("px-3 py-1.5 rounded-lg text-xs border transition",
                            location === opt.value ? chipActive : chipBase)}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Method chips */}
                  <div>
                    <label className={cn("text-xs font-medium mb-1.5 block", textMuted)}>Cómo se durmió</label>
                    <div className="flex flex-wrap gap-1.5">
                      {METHOD_OPTIONS.map((opt) => (
                        <button key={opt.value} type="button" onClick={() => setFellAsleepMethod(fellAsleepMethod === opt.value ? "" : opt.value)}
                          className={cn("px-3 py-1.5 rounded-lg text-xs border transition",
                            fellAsleepMethod === opt.value ? chipActive : chipBase)}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Latency */}
                  <div>
                    <label className={cn("text-xs font-medium mb-1.5 block", textMuted)}>Tiempo en dormirse</label>
                    <div className="flex flex-wrap gap-1.5">
                      {LATENCY_OPTIONS.map((opt) => (
                        <button key={opt.value} type="button" onClick={() => setLatency(latency === opt.value ? null : opt.value)}
                          className={cn("px-3 py-1.5 rounded-lg text-xs border transition",
                            latency === opt.value ? chipActive : chipBase)}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className={cn("text-xs font-medium mb-1.5 block", textMuted)}>Notas</label>
                    <textarea value={sleepNotes} onChange={(e) => setSleepNotes(e.target.value)}
                      rows={2} placeholder="Ej: Le están saliendo los dientes..."
                      className={cn("w-full px-3 py-2 rounded-xl text-sm border resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500", inputBg)} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── WAKEUP FORM ─── */}
          {type === "wakeup" && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1.5 block">Hora de despertar</label>
                <input type="time" value={wakeupTime} onChange={(e) => setWakeupTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">¿Cómo se ha despertado?</label>
                <div className="flex gap-2">
                  {(["happy", "neutral", "cranky"] as const).map((mood) => {
                    const mi = MOOD_ICONS[mood];
                    const Icon = mi.icon;
                    return (
                      <button key={mood} type="button" onClick={() => setWakeupMood(mood)}
                        className={cn("flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition",
                          wakeupMood === mood ? mi.color : "border-gray-200 text-gray-400")}>
                        <Icon className="w-7 h-7" />
                        <span className="text-[10px] font-medium">{mi.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-500">¿Necesitó ayuda?</label>
                <button type="button" onClick={() => setNeededHelp(!neededHelp)}
                  className={cn("w-12 h-7 rounded-full transition relative",
                    neededHelp ? "bg-amber-500" : "bg-gray-200")}>
                  <div className={cn("w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-transform",
                    neededHelp ? "translate-x-6" : "translate-x-1")} />
                </button>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1.5 block">Notas</label>
                <textarea value={wakeupNotes} onChange={(e) => setWakeupNotes(e.target.value)}
                  rows={2} placeholder="Opcional..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </>
          )}

          {/* ─── FEEDING FORM ─── */}
          {type === "feeding" && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1.5 block">Hora de cena</label>
                <input type="time" value={feedTime} onChange={(e) => setFeedTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Tipo</label>
                <div className="flex flex-wrap gap-1.5">
                  {FEED_METHOD_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setFeedMethod(opt.value)}
                      className={cn("px-4 py-2 rounded-xl text-sm border-2 font-medium transition",
                        feedMethod === opt.value ? "border-sky-500 bg-sky-50 text-sky-700" : "border-gray-200 text-gray-500")}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1.5 block">¿Qué cenó?</label>
                <input type="text" value={feedDescription} onChange={(e) => setFeedDescription(e.target.value)}
                  placeholder="Ej: Puré de verduras con pollo"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Cantidad</label>
                <div className="flex gap-2">
                  {FEED_AMOUNT_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setFeedAmount(opt.value)}
                      className={cn("flex-1 py-2 rounded-xl text-sm border-2 font-medium transition",
                        feedAmount === opt.value ? "border-sky-500 bg-sky-50 text-sky-700" : "border-gray-200 text-gray-500")}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ─── NOTE FORM ─── */}
          {type === "note" && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Etiquetas rápidas</label>
                <div className="flex flex-wrap gap-1.5">
                  {NOTE_TAGS.map((tag) => (
                    <button key={tag.value} type="button"
                      onClick={() => setNoteTags((prev) =>
                        prev.includes(tag.value) ? prev.filter((t) => t !== tag.value) : [...prev, tag.value]
                      )}
                      className={cn("px-3 py-1.5 rounded-lg text-sm border-2 transition",
                        noteTags.includes(tag.value) ? "border-gray-500 bg-gray-100 text-gray-800 font-medium" : "border-gray-200 text-gray-500")}>
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1.5 block">Nota</label>
                <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
                  rows={4} placeholder={`Escribe algo sobre ${babyName}...`}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-400" />
              </div>
            </>
          )}

          {/* Submit button */}
          <button type="button" onClick={handleSubmit} disabled={isPending}
            className="w-full text-white font-medium py-3 rounded-xl transition text-sm disabled:opacity-50 active:scale-[0.98]"
            style={{ backgroundColor: primaryColor }}>
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
