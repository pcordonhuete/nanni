"use server";

import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
  }
  return _openai;
}

export async function generateInsights(familyId: string, advisorId: string) {
  if (!process.env.OPENAI_API_KEY) {
    return { error: "OPENAI_API_KEY no configurada" };
  }

  const supabase = await createClient();

  const { data: family } = await supabase
    .from("families")
    .select("*")
    .eq("id", familyId)
    .single();

  if (!family) return { error: "Familia no encontrada" };

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: records } = await supabase
    .from("activity_records")
    .select("*")
    .eq("family_id", familyId)
    .gte("started_at", weekAgo.toISOString())
    .order("started_at");

  if (!records || records.length < 3) {
    return { error: "Insuficientes datos (mínimo 3 registros en la última semana)" };
  }

  const birthDate = new Date(family.baby_birth_date);
  const ageMonths = Math.floor(
    (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );

  const recordSummary = records.map((r) => ({
    type: r.type,
    started_at: r.started_at,
    ended_at: r.ended_at,
    duration_minutes: r.duration_minutes,
    details: r.details,
  }));

  const prompt = `Eres un experto en sueño infantil. Analiza los registros de actividad de un bebé de ${ageMonths} meses llamado ${family.baby_name}.

DATOS DE LA ÚLTIMA SEMANA:
${JSON.stringify(recordSummary, null, 2)}

Genera exactamente 3 insights en JSON con este formato:
[
  {
    "type": "improvement" | "alert" | "pattern" | "recommendation",
    "title": "título corto",
    "description": "descripción de 1-2 frases con datos concretos y recomendación accionable"
  }
]

Reglas:
- Al menos 1 debe ser una alerta si hay algo preocupante, o una mejora si todo va bien
- Menciona datos concretos (horas, porcentajes, tendencias)
- Las recomendaciones deben ser específicas y accionables
- Escribe en español
- Sé conciso pero preciso
- Considera las ventanas de vigilia recomendadas para la edad

Responde SOLO con el JSON, sin texto adicional.`;

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) return { error: "Sin respuesta de la IA" };

    const insights = JSON.parse(content);

    if (!Array.isArray(insights)) return { error: "Formato de respuesta inválido" };

    for (const insight of insights) {
      await supabase.from("insights").insert({
        family_id: familyId,
        advisor_id: advisorId,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        data: {},
      });
    }

    await supabase.from("notifications").insert({
      user_id: advisorId,
      type: "insight",
      title: `Nuevas observaciones de ${family.baby_name}`,
      body: `Tienes ${insights.length} nuevas observaciones basadas en los registros recientes`,
      link: `/familia/${familyId}`,
    });

    return { success: true, count: insights.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { error: `Error de IA: ${msg}` };
  }
}

export async function generateAllInsights(advisorId: string) {
  const supabase = await createClient();
  const { data: families } = await supabase
    .from("families")
    .select("id")
    .eq("advisor_id", advisorId)
    .eq("status", "active");

  if (!families) return { error: "No hay familias" };

  let total = 0;
  for (const family of families) {
    const result = await generateInsights(family.id, advisorId);
    if (result && "count" in result && typeof result.count === "number") total += result.count;
  }

  return { success: true, total };
}
