"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitIntakeResponse } from "@/lib/actions";
import { Moon, Send, CheckCircle } from "lucide-react";
import type { IntakeTemplate, IntakeQuestion } from "@/lib/types";

export default function IntakePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState("");
  const [template, setTemplate] = useState<IntakeTemplate | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [brandName, setBrandName] = useState("Nanni");
  const [primaryColor, setPrimaryColor] = useState("#188d91");
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      const resolvedParams = await params;
      setToken(resolvedParams.token);

      const supabase = createClient();

      const { data: family } = await supabase
        .from("families")
        .select("id, baby_name, advisor_id, invite_token")
        .eq("invite_token", resolvedParams.token)
        .single();

      if (!family) { setLoading(false); return; }
      setFamilyName(family.baby_name);

      const [{ data: brand }, { data: templates }] = await Promise.all([
        supabase.from("brands").select("name, primary_color").eq("advisor_id", family.advisor_id).single(),
        supabase.from("intake_templates").select("*").eq("advisor_id", family.advisor_id).eq("is_active", true).limit(1).single(),
      ]);

      if (brand) {
        setBrandName(brand.name || "Nanni");
        setPrimaryColor(brand.primary_color || "#188d91");
      }
      if (templates) setTemplate(templates as IntakeTemplate);
      setLoading(false);
    }
    load();
  }, [params]);

  async function handleSubmit() {
    if (!template) return;
    startTransition(async () => {
      const result = await submitIntakeResponse(token, template.id, answers);
      if (!result.error) setSubmitted(true);
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Cargando...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <Moon className="w-10 h-10 mx-auto mb-4" style={{ color: primaryColor }} />
          <h1 className="text-xl font-bold text-gray-900 mb-2">No hay cuestionario disponible</h1>
          <p className="text-sm text-gray-500">Tu asesora no ha configurado un cuestionario de inicio todavía.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Cuestionario enviado</h1>
          <p className="text-sm text-gray-500">Gracias por completar el cuestionario. Tu asesora podrá ver las respuestas para preparar el plan de {familyName}.</p>
        </div>
      </div>
    );
  }

  const questions: IntakeQuestion[] = template.questions || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: primaryColor + "20" }}>
            <Moon className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{template.title}</h1>
          {template.description && <p className="text-sm text-gray-500 mt-2">{template.description}</p>}
          <p className="text-xs text-gray-400 mt-1">{brandName} · {familyName}</p>
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <label className="text-sm font-medium text-gray-900 mb-2 block">
                {i + 1}. {q.text}
                {q.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {q.type === "text" && (
                <textarea
                  rows={2}
                  value={(answers[q.id] as string) || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500 resize-none"
                />
              )}
              {q.type === "number" && (
                <input
                  type="number"
                  value={(answers[q.id] as number) || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500"
                />
              )}
              {q.type === "boolean" && (
                <div className="flex gap-3">
                  {["Sí", "No"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt === "Sí" }))}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                        answers[q.id] === (opt === "Sí")
                          ? "border-nanni-500 bg-nanni-50 text-nanni-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {q.type === "select" && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm transition ${
                        answers[q.id] === opt
                          ? "border-nanni-500 bg-nanni-50 text-nanni-700 font-medium"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full mt-6 text-white font-medium py-3 rounded-xl transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {isPending ? "Enviando..." : <><Send className="w-4 h-4" /> Enviar respuestas</>}
        </button>
      </div>
    </div>
  );
}
