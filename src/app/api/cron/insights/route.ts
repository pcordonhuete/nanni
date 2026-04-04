import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  const { data: advisors } = await supabaseAdmin
    .from("subscriptions")
    .select("advisor_id")
    .in("status", ["active", "trialing"]);

  if (!advisors || advisors.length === 0) {
    return NextResponse.json({ message: "No active advisors", processed: 0 });
  }

  let totalInsights = 0;
  let processedFamilies = 0;

  for (const advisor of advisors) {
    const { data: families } = await supabaseAdmin
      .from("families")
      .select("id, baby_name, baby_birth_date")
      .eq("advisor_id", advisor.advisor_id)
      .eq("status", "active");

    if (!families) continue;

    for (const family of families) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: records } = await supabaseAdmin
        .from("activity_records")
        .select("type, started_at, ended_at, duration_minutes, details")
        .eq("family_id", family.id)
        .gte("started_at", weekAgo.toISOString())
        .order("started_at");

      if (!records || records.length < 3) continue;

      const { data: recentInsight } = await supabaseAdmin
        .from("insights")
        .select("created_at")
        .eq("family_id", family.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (recentInsight) {
        const lastInsightAge = Date.now() - new Date(recentInsight.created_at).getTime();
        if (lastInsightAge < 24 * 60 * 60 * 1000) continue;
      }

      const birthDate = new Date(family.baby_birth_date);
      const ageMonths = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));

      const recordSummary = records.map((r) => ({
        type: r.type, started_at: r.started_at, ended_at: r.ended_at,
        duration_minutes: r.duration_minutes, details: r.details,
      }));

      try {
        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{
            role: "user",
            content: `Eres un experto en sueño infantil. Analiza los registros de actividad de un bebé de ${ageMonths} meses llamado ${family.baby_name}.

DATOS DE LA ÚLTIMA SEMANA:
${JSON.stringify(recordSummary, null, 2)}

Genera exactamente 3 insights en JSON:
[{"type":"improvement"|"alert"|"pattern"|"recommendation","title":"título corto","description":"1-2 frases con datos concretos"}]

Reglas: menciona datos concretos, recomendaciones accionables, en español, considera ventanas de vigilia para la edad. Responde SOLO JSON.`,
          }],
          temperature: 0.3,
          max_tokens: 800,
        });

        const content = completion.choices[0]?.message?.content?.trim();
        if (!content) continue;

        const insights = JSON.parse(content);
        if (!Array.isArray(insights)) continue;

        for (const insight of insights) {
          await supabaseAdmin.from("insights").insert({
            family_id: family.id,
            advisor_id: advisor.advisor_id,
            type: insight.type,
            title: insight.title,
            description: insight.description,
            data: { auto_generated: true },
          });
          totalInsights++;
        }

        await supabaseAdmin.from("notifications").insert({
          user_id: advisor.advisor_id,
          type: "insight",
          title: `Nuevos insights para ${family.baby_name}`,
          body: `La IA ha generado ${insights.length} insights automáticamente`,
          link: `/familia/${family.id}`,
        });

        processedFamilies++;
      } catch {
        continue;
      }
    }
  }

  return NextResponse.json({
    message: "Insights generated",
    processedFamilies,
    totalInsights,
  });
}
