import { createClient } from "@/lib/supabase/server";
import { getFamily, getWeeklySleep, getInsights, getNotes, getFamilyMembers } from "@/lib/db";
import { babyAgeLabel, formatDate, sleepScore, statusFromScore, averageSleepMetric } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ familyId: string }> }
) {
  const { familyId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [family, weeklySleep, insights, notes, members] = await Promise.all([
    getFamily(familyId),
    getWeeklySleep(familyId),
    getInsights(user.id, { familyId }),
    getNotes(familyId),
    getFamilyMembers(familyId),
  ]);

  if (!family || family.advisor_id !== user.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("advisor_id", user.id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const age = babyAgeLabel(family.baby_birth_date);
  const avgSleep = averageSleepMetric(weeklySleep, (d) => d.total);
  const avgAwakenings = averageSleepMetric(weeklySleep, (d) => d.awakenings);

  const ageMonths = Math.floor(
    (Date.now() - new Date(family.baby_birth_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );
  const score = sleepScore(avgSleep, avgAwakenings, ageMonths);
  const { label: statusLabel } = statusFromScore(score);

  const primaryColor = brand?.primary_color || "#188d91";
  const brandName = brand?.name || "Nanni";
  const advisorName = profile?.full_name || "Asesora";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe de ${family.baby_name} — ${brandName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 3px solid ${primaryColor}; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand { font-size: 22px; font-weight: 700; color: ${primaryColor}; }
    .subtitle { font-size: 12px; color: #666; }
    h1 { font-size: 28px; margin-bottom: 4px; }
    h2 { font-size: 18px; color: ${primaryColor}; margin: 30px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 30px; }
    .stat { background: #f8f8f8; border-radius: 10px; padding: 16px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: 700; color: ${primaryColor}; }
    .stat-label { font-size: 11px; color: #888; }
    .sleep-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .sleep-bar-label { width: 30px; text-align: right; font-size: 12px; color: #888; }
    .sleep-bar-track { flex: 1; height: 18px; background: #f0f0f0; border-radius: 4px; overflow: hidden; display: flex; }
    .sleep-bar-night { background: ${primaryColor}; }
    .sleep-bar-nap { background: ${primaryColor}88; }
    .sleep-bar-val { width: 40px; font-size: 11px; color: #888; text-align: right; }
    .insight { background: #f8f8f8; border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 3px solid ${primaryColor}; }
    .insight-title { font-weight: 600; font-size: 13px; margin-bottom: 2px; }
    .insight-desc { font-size: 12px; color: #555; }
    .note { border-bottom: 1px solid #eee; padding: 10px 0; }
    .note-date { font-size: 11px; color: #888; }
    .note-text { font-size: 13px; }
    .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">${brandName}</div>
      <div class="subtitle">${advisorName} · Asesora de sueño</div>
    </div>
    <div class="subtitle">${formatDate(new Date())}</div>
  </div>

  <h1>${family.baby_name}</h1>
  <p style="color:#888;margin-bottom:20px">${age} · Nacimiento: ${formatDate(family.baby_birth_date)} · ${members.map((m) => m.name).join(" y ") || "Sin padres registrados"}</p>

  <div class="stats">
    <div class="stat"><div class="stat-value">${avgSleep.toFixed(1)}h</div><div class="stat-label">Media sueño/día</div></div>
    <div class="stat"><div class="stat-value">${avgAwakenings.toFixed(1)}</div><div class="stat-label">Media despertares</div></div>
    <div class="stat"><div class="stat-value">${score}</div><div class="stat-label">Puntuación</div></div>
    <div class="stat"><div class="stat-value">${statusLabel}</div><div class="stat-label">Estado</div></div>
  </div>

  <h2>Sueño semanal</h2>
  ${weeklySleep.map((d) => `
    <div class="sleep-bar">
      <span class="sleep-bar-label">${d.day}</span>
      <div class="sleep-bar-track">
        <div class="sleep-bar-night" style="width:${(d.night_hours / 16) * 100}%"></div>
        <div class="sleep-bar-nap" style="width:${(d.nap_hours / 16) * 100}%"></div>
      </div>
      <span class="sleep-bar-val">${d.total}h</span>
    </div>
  `).join("")}

  ${insights.length > 0 ? `
    <h2>Observaciones</h2>
    ${insights.slice(0, 5).map((i) => `
      <div class="insight">
        <div class="insight-title">${i.title}</div>
        <div class="insight-desc">${i.description}</div>
      </div>
    `).join("")}
  ` : ""}

  ${notes.length > 0 ? `
    <h2>Notas</h2>
    ${notes.slice(0, 5).map((n) => `
      <div class="note">
        <div class="note-date">${formatDate(n.created_at)}</div>
        <div class="note-text">${n.content}</div>
      </div>
    `).join("")}
  ` : ""}

  <div class="footer">
    Generado por ${brandName} · nanni.app · ${formatDate(new Date())}
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
