"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Moon, Sun, Droplets, Baby, Smile, FileText, Activity,
  Plus, X, Clock, Target, TrendingUp,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { createRecordFromParent } from "@/lib/actions";
import { formatTime, babyAgeLabel, cn } from "@/lib/utils";
import type { Family, Brand, ActivityRecord, RecordType, SleepPlan, SleepPlanGoal, SleepPlanStep } from "@/lib/types";

interface ParentAppProps {
  family: Family;
  brand: Brand | null;
  token: string;
  initialRecords: ActivityRecord[];
  activePlan: (SleepPlan & { goals: SleepPlanGoal[]; steps: SleepPlanStep[] }) | null;
  weekSummary: { avgSleep: number; avgAwakenings: number; daysWithData: number };
}

const recordTypes = [
  { type: "sleep" as const, label: "Sueño", icon: Moon, color: "bg-nanni-100 text-nanni-600" },
  { type: "feed" as const, label: "Toma", icon: Droplets, color: "bg-sky-100 text-sky-600" },
  { type: "wake" as const, label: "Despertar", icon: Sun, color: "bg-amber-100 text-amber-600" },
  { type: "diaper" as const, label: "Pañal", icon: Baby, color: "bg-pink-100 text-pink-600" },
  { type: "mood" as const, label: "Humor", icon: Smile, color: "bg-rose-100 text-rose-500" },
  { type: "play" as const, label: "Juego", icon: Activity, color: "bg-emerald-100 text-emerald-600" },
  { type: "note" as const, label: "Nota", icon: FileText, color: "bg-gray-100 text-gray-600" },
];

import { ClipboardList, Frown, Meh, Laugh, type LucideIcon } from "lucide-react";

const typeIconMap: Record<string, LucideIcon> = {
  sleep: Moon, feed: Droplets, wake: Sun, mood: Smile,
  play: Activity, note: FileText, diaper: Baby,
};

export function ParentApp({ family, brand, token, initialRecords, activePlan, weekSummary }: ParentAppProps) {
  const [records, setRecords] = useState<ActivityRecord[]>(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<RecordType>("sleep");
  const [isPending, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<"timeline" | "progress" | "plan">("timeline");
  const [showPlanSteps, setShowPlanSteps] = useState(false);
  const [parentName, setParentName] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(`nanni_parent_${token}`) || "";
    return "";
  });
  const [showNamePrompt, setShowNamePrompt] = useState(!parentName);

  const router = useRouter();
  const primaryColor = brand?.primary_color || "#007A53";
  const brandName = brand?.name || "Nanni";
  const age = babyAgeLabel(family.baby_birth_date);

  function saveName(name: string) {
    setParentName(name);
    setShowNamePrompt(false);
    if (typeof window !== "undefined") localStorage.setItem(`nanni_parent_${token}`, name);
  }

  async function handleSubmit(formData: FormData) {
    const startedAt = formData.get("started_at") as string;
    const durationStr = formData.get("duration_minutes") as string;
    const durationMinutes = durationStr ? parseInt(durationStr) : null;
    const noteText = formData.get("note_text") as string;

    const details: Record<string, unknown> = {};
    if (selectedType === "sleep") details.location = formData.get("location") || "crib";
    if (selectedType === "feed") details.method = formData.get("method") || "breast_left";
    if (selectedType === "mood") details.level = parseInt(formData.get("mood_level") as string) || 3;
    if (selectedType === "note") details.text = noteText;
    if (selectedType === "diaper") details.diaper_type = formData.get("diaper_type") || "wet";

    const endedAt = durationMinutes && startedAt ? new Date(new Date(startedAt).getTime() + durationMinutes * 60000).toISOString() : null;

    startTransition(async () => {
      const result = await createRecordFromParent(token, selectedType, startedAt || new Date().toISOString(), endedAt, durationMinutes, details, parentName);
      if (!result.error) { setShowForm(false); router.refresh(); }
    });
  }

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
        {activeSection === "timeline" && (
          <>
            <h2 className="text-sm font-bold text-gray-900 mb-3">
              Hoy, {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </h2>
            {records.length === 0 ? (
              <div className="text-center py-12">
                <Moon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Aún no hay registros hoy.</p>
                <p className="text-xs text-gray-400 mt-1">Toca los botones de abajo para añadir un registro.</p>
              </div>
            ) : (
              records.map((r) => {
                const RecordIcon = typeIconMap[r.type] || ClipboardList;
                const labels: Record<string, string> = { sleep: "Sueño", feed: "Toma", wake: "Despertar", mood: "Humor", play: "Juego", note: "Nota", diaper: "Pañal" };
                return (
                  <div key={r.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                    <div className="w-9 h-9 rounded-full bg-nanni-50 flex items-center justify-center border border-nanni-100 shrink-0"><RecordIcon className="w-4 h-4 text-nanni-600" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">{labels[r.type]}</p>
                        <span className="text-[10px] text-gray-400">{formatTime(r.started_at)}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {r.duration_minutes ? `${r.duration_minutes} min` : ""}
                        {(r.details as Record<string, unknown>)?.text ? String((r.details as Record<string, unknown>).text) : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

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
              <p className="text-xs text-nanni-700">Cada registro que haces ayuda a tu asesora a personalizar mejor las recomendaciones para {family.baby_name}.</p>
            </div>
          </div>
        )}

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

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex gap-2">
            {recordTypes.slice(0, 4).map((rt) => (
              <button key={rt.type} onClick={() => { setSelectedType(rt.type); setShowForm(true); }} className={`flex-1 ${rt.color} rounded-xl py-2.5 flex flex-col items-center gap-1`}>
                <rt.icon className="w-4 h-4" /><span className="text-[9px] font-medium">{rt.label}</span>
              </button>
            ))}
            <button onClick={() => setShowForm(true)} className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2.5 flex flex-col items-center gap-1">
              <Plus className="w-4 h-4" /><span className="text-[9px] font-medium">Más</span>
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Nuevo registro</h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form action={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {recordTypes.map((rt) => (
                  <button key={rt.type} type="button" onClick={() => setSelectedType(rt.type)} className={cn("rounded-xl p-2.5 flex flex-col items-center gap-1 border-2 transition", selectedType === rt.type ? "border-nanni-500 bg-nanni-50" : "border-gray-100 hover:border-gray-300")}>
                    <rt.icon className="w-4 h-4" /><span className="text-[9px] font-medium">{rt.label}</span>
                  </button>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Hora</label>
                <input name="started_at" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500" />
              </div>
              {["sleep", "feed", "play"].includes(selectedType) && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Duración (minutos)</label>
                  <input name="duration_minutes" type="number" min="1" placeholder="Ej: 90" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500" />
                </div>
              )}
              {selectedType === "sleep" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Lugar</label>
                  <select name="location" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                    <option value="crib">Cuna</option><option value="arms">Brazos</option><option value="stroller">Carrito</option><option value="cosleep">Colecho</option><option value="other">Otro</option>
                  </select>
                </div>
              )}
              {selectedType === "feed" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tipo</label>
                  <select name="method" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                    <option value="breast_left">Pecho izquierdo</option><option value="breast_right">Pecho derecho</option><option value="bottle">Biberón</option><option value="solids">Sólidos</option>
                  </select>
                </div>
              )}
              {selectedType === "diaper" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tipo de pañal</label>
                  <select name="diaper_type" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                    <option value="wet">Pipí</option><option value="dirty">Caca</option><option value="both">Ambos</option>
                  </select>
                </div>
              )}
              {selectedType === "mood" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Estado de ánimo</label>
                  <div className="flex gap-2">
                    {[
                      { v: 1, icon: Frown, label: "Mal" },
                      { v: 2, icon: Meh, label: "Regular" },
                      { v: 3, icon: Smile, label: "Normal" },
                      { v: 4, icon: Smile, label: "Bien" },
                      { v: 5, icon: Laugh, label: "Genial" },
                    ].map((m) => (
                      <label key={m.v} className="flex-1">
                        <input type="radio" name="mood_level" value={m.v} className="sr-only peer" defaultChecked={m.v === 3} />
                        <div className="flex flex-col items-center gap-0.5 py-2 rounded-xl border-2 border-gray-100 peer-checked:border-nanni-500 peer-checked:bg-nanni-50 cursor-pointer transition">
                          <m.icon className="w-6 h-6 text-gray-400 peer-checked:text-nanni-600" />
                          <span className="text-[9px] text-gray-400">{m.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {selectedType === "note" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nota</label>
                  <textarea name="note_text" rows={3} placeholder="Escribe una nota..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none" />
                </div>
              )}
              <button type="submit" disabled={isPending} className="w-full text-white font-medium py-3 rounded-xl transition text-sm disabled:opacity-50" style={{ backgroundColor: primaryColor }}>
                {isPending ? "Guardando..." : "Guardar registro"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
