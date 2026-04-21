"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, X, ChevronDown, ChevronUp, Trash2, Pencil,
  BookOpen, Target, ListOrdered, Clock, Baby, FileText,
} from "lucide-react";
import { createSleepPlanTemplate, updateSleepPlanTemplate, deleteSleepPlanTemplate } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";
import type { SleepPlanTemplate, TemplateGoal, TemplateStep } from "@/lib/types";
import { cn } from "@/lib/utils";

const METHOD_OPTIONS = [
  { value: "gradual_extinction", label: "Extinción gradual" },
  { value: "chair_method", label: "Método de la silla" },
  { value: "pick_up_put_down", label: "Coger y dejar" },
  { value: "fading", label: "Fading / Retirada" },
  { value: "camping_out", label: "Camping out" },
  { value: "custom", label: "Personalizado" },
];

function emptyStep(): TemplateStep {
  return { title: "", description: null, duration_days: 7, advisor_notes: null, guidelines: [] };
}

function emptyGoal(): TemplateGoal {
  return { description: "", target_value: null, metric: null };
}

export default function PlanesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<SleepPlanTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState("");
  const [ageMin, setAgeMin] = useState(0);
  const [ageMax, setAgeMax] = useState(36);
  const [goals, setGoals] = useState<TemplateGoal[]>([emptyGoal()]);
  const [steps, setSteps] = useState<TemplateStep[]>([emptyStep()]);

  useEffect(() => {
    async function load() {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb
        .from("sleep_plan_templates")
        .select("*")
        .or(`advisor_id.eq.${user.id},is_system.eq.true`)
        .order("is_system", { ascending: false });
      setTemplates(data || []);
      setLoading(false);
    }
    load();
  }, []);

  function resetForm() {
    setTitle(""); setDescription(""); setMethod("");
    setAgeMin(0); setAgeMax(36);
    setGoals([emptyGoal()]); setSteps([emptyStep()]);
    setEditingId(null); setShowForm(false);
  }

  function editTemplate(t: SleepPlanTemplate) {
    setTitle(t.title);
    setDescription(t.description || "");
    setMethod(t.method || "");
    setAgeMin(t.age_min_months);
    setAgeMax(t.age_max_months);
    setGoals(t.goals.length > 0 ? t.goals : [emptyGoal()]);
    setSteps(t.steps.length > 0 ? t.steps.map((s) => ({ ...s, guidelines: s.guidelines || [] })) : [emptyStep()]);
    setEditingId(t.id);
    setShowForm(true);
  }

  function handleSubmit() {
    if (!title.trim()) return;
    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("description", description.trim());
    fd.set("method", method);
    fd.set("age_min_months", String(ageMin));
    fd.set("age_max_months", String(ageMax));
    fd.set("goals", JSON.stringify(goals.filter((g) => g.description.trim())));
    fd.set("steps", JSON.stringify(steps.filter((s) => s.title.trim()).map((s) => ({
      ...s,
      guidelines: (s.guidelines || []).filter((g) => g.trim()),
    }))));

    startTransition(async () => {
      if (editingId) {
        await updateSleepPlanTemplate(editingId, fd);
      } else {
        await createSleepPlanTemplate(fd);
      }
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const { data } = await sb
          .from("sleep_plan_templates")
          .select("*")
          .or(`advisor_id.eq.${user.id},is_system.eq.true`)
          .order("is_system", { ascending: false });
        setTemplates(data || []);
      }
      resetForm();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteSleepPlanTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    });
  }

  function updateStep(idx: number, patch: Partial<TemplateStep>) {
    setSteps((prev) => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
  }

  function updateGoal(idx: number, patch: Partial<TemplateGoal>) {
    setGoals((prev) => prev.map((g, i) => i === idx ? { ...g, ...patch } : g));
  }

  function addGuidelineToStep(stepIdx: number) {
    setSteps((prev) => prev.map((s, i) => i === stepIdx ? { ...s, guidelines: [...(s.guidelines || []), ""] } : s));
  }

  function updateGuideline(stepIdx: number, gIdx: number, text: string) {
    setSteps((prev) => prev.map((s, i) => {
      if (i !== stepIdx) return s;
      const gl = [...(s.guidelines || [])];
      gl[gIdx] = text;
      return { ...s, guidelines: gl };
    }));
  }

  function removeGuideline(stepIdx: number, gIdx: number) {
    setSteps((prev) => prev.map((s, i) => {
      if (i !== stepIdx) return s;
      return { ...s, guidelines: (s.guidelines || []).filter((_, j) => j !== gIdx) };
    }));
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-6 h-6 border-2 border-nanni-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planes de sueño</h1>
          <p className="text-sm text-gray-500 mt-1">Crea planes reutilizables y asígnalos a tus familias</p>
        </div>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-nanni-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-nanni-700 transition">
            <Plus className="w-4 h-4" /> Nuevo plan
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">{editingId ? "Editar plan" : "Nuevo plan de sueño"}</h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-6">
            {/* Basic info */}
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Título del plan *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Extinción gradual 4-8 meses"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-nanni-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                  placeholder="Método, enfoque y en qué casos aplicar este plan..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-nanni-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Método</label>
                  <select value={method} onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-nanni-500">
                    <option value="">Seleccionar...</option>
                    {METHOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Edad mín (meses)</label>
                  <input type="number" min={0} max={36} value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-nanni-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Edad máx (meses)</label>
                  <input type="number" min={0} max={36} value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-nanni-500" />
                </div>
              </div>
            </div>

            {/* Goals */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Target className="w-4 h-4 text-nanni-600" /> Objetivos</h3>
                <button type="button" onClick={() => setGoals([...goals, emptyGoal()])}
                  className="text-xs text-nanni-600 font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Añadir</button>
              </div>
              <div className="space-y-2">
                {goals.map((g, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={g.description} onChange={(e) => updateGoal(i, { description: e.target.value })}
                      placeholder="Ej: Reducir despertares a ≤1"
                      className="flex-1 px-3 py-2 rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-nanni-500" />
                    {goals.length > 1 && (
                      <button onClick={() => setGoals(goals.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Phases */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><ListOrdered className="w-4 h-4 text-nanni-600" /> Fases</h3>
                <button type="button" onClick={() => setSteps([...steps, emptyStep()])}
                  className="text-xs text-nanni-600 font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Añadir fase</button>
              </div>
              <div className="space-y-4">
                {steps.map((s, si) => (
                  <div key={si} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-nanni-100 text-nanni-700 flex items-center justify-center text-xs font-bold shrink-0">{si + 1}</span>
                      <input value={s.title} onChange={(e) => updateStep(si, { title: e.target.value })}
                        placeholder="Nombre de la fase"
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-nanni-500" />
                      <div className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <input type="number" min={1} max={60} value={s.duration_days}
                          onChange={(e) => updateStep(si, { duration_days: Number(e.target.value) })}
                          className="w-12 px-2 py-1.5 rounded-lg text-xs text-center border border-gray-200" />
                        <span className="text-xs text-gray-400">días</span>
                      </div>
                      {steps.length > 1 && (
                        <button onClick={() => setSteps(steps.filter((_, j) => j !== si))} className="text-gray-300 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <textarea value={s.description || ""} onChange={(e) => updateStep(si, { description: e.target.value })}
                      rows={1} placeholder="Descripción para la familia (visible en su app)"
                      className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-nanni-500" />
                    <textarea value={s.advisor_notes || ""} onChange={(e) => updateStep(si, { advisor_notes: e.target.value })}
                      rows={1} placeholder="Notas internas (solo tú las ves)"
                      className="w-full px-3 py-2 rounded-lg text-xs border border-gray-100 bg-amber-50/50 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400" />

                    {/* Guidelines */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-gray-500">Pautas para la familia</label>
                        <button type="button" onClick={() => addGuidelineToStep(si)}
                          className="text-[11px] text-nanni-600 font-medium flex items-center gap-0.5"><Plus className="w-3 h-3" /> Pauta</button>
                      </div>
                      {(s.guidelines || []).length === 0 && (
                        <p className="text-xs text-gray-400 italic">Sin pautas aún. Añade lo que la familia debe hacer en esta fase.</p>
                      )}
                      <div className="space-y-1.5">
                        {(s.guidelines || []).map((g, gi) => (
                          <div key={gi} className="flex items-center gap-2">
                            <span className="text-xs text-gray-300 w-4 text-right shrink-0">{gi + 1}.</span>
                            <input value={g} onChange={(e) => updateGuideline(si, gi, e.target.value)}
                              placeholder="Ej: Baño → pijama → cuento → cuna, siempre igual"
                              className="flex-1 px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-nanni-500" />
                            <button onClick={() => removeGuideline(si, gi)} className="text-gray-300 hover:text-red-400">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSubmit} disabled={pending || !title.trim()}
                className="flex-1 bg-nanni-600 text-white text-sm font-medium py-3 rounded-xl hover:bg-nanni-700 transition disabled:opacity-50">
                {pending ? "Guardando..." : editingId ? "Guardar cambios" : "Crear plan"}
              </button>
              <button onClick={resetForm} className="px-6 py-3 text-sm font-medium text-gray-500 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template list */}
      {templates.length === 0 && !showForm && (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Tu biblioteca de planes</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Crea planes de sueño con fases y pautas. Cuando los asignes a una familia,
            podrás ir desbloqueando fases según el progreso.
          </p>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 bg-nanni-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-nanni-700 transition">
            <Plus className="w-4 h-4" /> Crear mi primer plan
          </button>
        </div>
      )}

      <div className="space-y-3">
        {templates.map((t) => {
          const isExpanded = expandedId === t.id;
          const methodLabel = METHOD_OPTIONS.find((m) => m.value === t.method)?.label;
          return (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button onClick={() => setExpandedId(isExpanded ? null : t.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50/50 transition">
                <div className="w-10 h-10 rounded-xl bg-nanni-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-nanni-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{t.title}</h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    {methodLabel && <span className="text-xs text-gray-500">{methodLabel}</span>}
                    <span className="text-xs text-gray-400"><Baby className="w-3 h-3 inline mr-0.5" />{t.age_min_months}-{t.age_max_months} meses</span>
                    <span className="text-xs text-gray-400">{t.steps.length} fases</span>
                    <span className="text-xs text-gray-400">{t.goals.length} objetivos</span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                  {t.description && <p className="text-sm text-gray-600">{t.description}</p>}

                  {t.goals.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Objetivos</h4>
                      <ul className="space-y-1">
                        {t.goals.map((g, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <Target className="w-3.5 h-3.5 text-nanni-500 shrink-0" />
                            {g.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {t.steps.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Fases</h4>
                      <div className="space-y-3">
                        {t.steps.map((s, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 mt-0.5">{i + 1}</div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{s.title} <span className="text-xs text-gray-400 font-normal">({s.duration_days} días)</span></p>
                              {s.description && <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>}
                              {s.guidelines && s.guidelines.length > 0 && (
                                <ul className="mt-1.5 space-y-0.5">
                                  {s.guidelines.map((g, gi) => (
                                    <li key={gi} className="text-xs text-gray-600 flex items-start gap-1.5">
                                      <span className="text-nanni-500 mt-0.5">•</span> {g}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => editTemplate(t)} className="flex items-center gap-1.5 text-sm text-gray-600 font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button onClick={() => handleDelete(t.id)} disabled={pending}
                      className="flex items-center gap-1.5 text-sm text-red-500 font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition disabled:opacity-50">
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
