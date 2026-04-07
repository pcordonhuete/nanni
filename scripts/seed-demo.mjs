/**
 * Seed demo data for Nanni — run with: node scripts/seed-demo.mjs
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Load .env.local ───
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const DEMO_EMAIL = "demo@nanniapp.com";
const DEMO_PASSWORD = "demo123456";
const DEMO_NAME = "Ana García";

// Use service role if available (bypasses RLS), otherwise anon
const adminClient = SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helpers ───
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function uuid() {
  return crypto.randomUUID();
}

// ─── Demo families config ───
const FAMILIES = [
  { baby_name: "Mateo",   birth_offset_months: 7,  status: "active",    trend: "improving",  parent_email: "mateo.padres@demo.com",   parent_phone: "+34 612 111 001" },
  { baby_name: "Lucía",   birth_offset_months: 5,  status: "active",    trend: "stable",     parent_email: "lucia.padres@demo.com",   parent_phone: "+34 612 111 002" },
  { baby_name: "Hugo",    birth_offset_months: 10, status: "active",    trend: "slow",       parent_email: "hugo.padres@demo.com",    parent_phone: "+34 612 111 003" },
  { baby_name: "Martina", birth_offset_months: 4,  status: "active",    trend: "new",        parent_email: "martina.padres@demo.com", parent_phone: "+34 612 111 004" },
  { baby_name: "Leo",     birth_offset_months: 8,  status: "active",    trend: "struggling", parent_email: "leo.padres@demo.com",     parent_phone: "+34 612 111 005" },
  { baby_name: "Emma",    birth_offset_months: 3,  status: "active",    trend: "improving",  parent_email: "emma.padres@demo.com",    parent_phone: "+34 612 111 006" },
  { baby_name: "Sofía",   birth_offset_months: 14, status: "completed", trend: "stable",     parent_email: "sofia.padres@demo.com",   parent_phone: "+34 612 111 007" },
  { baby_name: "Daniel",  birth_offset_months: 6,  status: "paused",    trend: "stable",     parent_email: "daniel.padres@demo.com",  parent_phone: "+34 612 111 008" },
];

function birthDate(offsetMonths) {
  const d = new Date();
  d.setMonth(d.getMonth() - offsetMonths);
  return d.toISOString().split("T")[0];
}

// ─── Generate records for a day (new data model) ───
function generateDayRecords(familyId, day, dayIndex, trend, ageMonths) {
  const records = [];
  const improveFactor = trend === "improving" ? Math.min(dayIndex / 30, 1) : trend === "slow" ? Math.min(dayIndex / 60, 0.5) : trend === "struggling" ? 0.1 : trend === "new" ? 0.3 : 0.7;

  const locations = ["crib", "cosleep", "arms", "stroller", "car"];
  const methods = ["self", "rocking", "feeding", "white_noise"];
  const latencies = [3, 7, 15, 25, 31];

  // Night sleep
  const nightStart = new Date(day);
  nightStart.setDate(nightStart.getDate() - 1);
  nightStart.setHours(19 + randomInt(0, 1), randomInt(30, 59), 0, 0);
  const nightDurationMin = Math.round(randomBetween(480, 600) + improveFactor * 60);
  const nightEnd = new Date(nightStart.getTime() + nightDurationMin * 60000);
  const maxWakes = trend === "struggling" ? 4 : trend === "new" ? 3 : Math.max(0, Math.round(3 - improveFactor * 3));
  const nightAwakenings = randomInt(Math.max(0, maxWakes - 1), maxWakes);

  records.push({
    id: uuid(), family_id: familyId, type: "sleep",
    started_at: nightStart.toISOString(),
    ended_at: nightEnd.toISOString(),
    duration_minutes: nightDurationMin,
    details: {
      sleep_type: "night",
      awakenings: nightAwakenings,
      location: locations[randomInt(0, 2)],
      fell_asleep_method: improveFactor > 0.5 ? "self" : methods[randomInt(0, 3)],
      latency_minutes: latencies[randomInt(0, improveFactor > 0.5 ? 1 : 4)],
    },
    created_at: nightStart.toISOString(),
  });

  // Morning wakeup
  const wakeupTime = new Date(nightEnd.getTime() + randomInt(0, 15) * 60000);
  const wakeupMoods = improveFactor > 0.5 ? ["happy", "happy", "neutral"] : ["neutral", "cranky", "happy"];
  records.push({
    id: uuid(), family_id: familyId, type: "wakeup",
    started_at: wakeupTime.toISOString(), ended_at: null, duration_minutes: null,
    details: {
      mood: wakeupMoods[randomInt(0, 2)],
      needed_help: improveFactor < 0.4 && Math.random() > 0.5,
    },
    created_at: wakeupTime.toISOString(),
  });

  // Naps
  const napCount = ageMonths <= 4 ? randomInt(2, 3) : ageMonths <= 9 ? randomInt(2, 3) : randomInt(1, 2);
  const napStarts = [9, 12, 15].slice(0, napCount);
  for (const h of napStarts) {
    const napStart = new Date(day);
    napStart.setHours(h + randomInt(0, 1), randomInt(0, 30), 0, 0);
    const napDur = Math.round(randomBetween(30, 90) + improveFactor * 20);
    records.push({
      id: uuid(), family_id: familyId, type: "sleep",
      started_at: napStart.toISOString(),
      ended_at: new Date(napStart.getTime() + napDur * 60000).toISOString(),
      duration_minutes: napDur,
      details: {
        sleep_type: "nap",
        awakenings: 0,
        location: "crib",
        fell_asleep_method: improveFactor > 0.4 ? "self" : methods[randomInt(0, 3)],
        latency_minutes: latencies[randomInt(0, 2)],
      },
      created_at: napStart.toISOString(),
    });
  }

  // Dinner (feeding)
  const dinnerTime = new Date(day);
  dinnerTime.setHours(18 + randomInt(0, 1), randomInt(0, 45), 0, 0);
  const dinnerMethods = ageMonths < 6 ? ["breast", "bottle"] : ["solids", "mixed", "bottle"];
  const dinnerDescs = ["Puré de verduras", "Papilla de frutas", "Pollo con arroz", "Crema de calabaza", "Biberón 200ml"];
  const amounts = ["little", "normal", "lots"];
  records.push({
    id: uuid(), family_id: familyId, type: "feeding",
    started_at: dinnerTime.toISOString(), ended_at: null, duration_minutes: null,
    details: {
      method: dinnerMethods[randomInt(0, dinnerMethods.length - 1)],
      description: ageMonths >= 6 ? dinnerDescs[randomInt(0, dinnerDescs.length - 1)] : undefined,
      amount: amounts[randomInt(0, 2)],
    },
    created_at: dinnerTime.toISOString(),
  });

  // Note (occasionally)
  if (Math.random() > 0.6) {
    const noteTime = new Date(day);
    noteTime.setHours(randomInt(8, 20), randomInt(0, 59), 0, 0);
    const noteTexts = [
      "Le están saliendo los dientes, molestias todo el día",
      "Ha dormido en casa de los abuelos",
      "Vacuna hoy, algo inquieto por la tarde",
      "Día muy activo en el parque, agotado por la noche",
      "Resfriado leve, nariz congestionada",
      "Primer día de guardería",
      "Ha empezado a gatear, muy excitado",
    ];
    const tagOptions = [["teething"], ["travel"], ["vaccine"], [], ["fever"], ["routine_change"], []];
    const idx = randomInt(0, noteTexts.length - 1);
    records.push({
      id: uuid(), family_id: familyId, type: "note",
      started_at: noteTime.toISOString(), ended_at: null, duration_minutes: null,
      details: {
        text: noteTexts[idx],
        tags: tagOptions[idx].length > 0 ? tagOptions[idx] : undefined,
      },
      created_at: noteTime.toISOString(),
    });
  }

  return records;
}

// ─── Insights templates ───
function generateInsights(familyId, advisorId, babyName) {
  return [
    {
      id: uuid(), family_id: familyId, advisor_id: advisorId, type: "improvement",
      title: `Mejora detectada en ${babyName}`,
      description: `Los despertares nocturnos de ${babyName} se han reducido un 40% en la última semana. Adelantar la hora de acostarse 15 minutos está funcionando.`,
      data: { metric: "awakenings", change: -40 }, is_read: false, created_at: daysAgo(1).toISOString(),
    },
    {
      id: uuid(), family_id: familyId, advisor_id: advisorId, type: "pattern",
      title: `Patrón de siestas de ${babyName}`,
      description: `${babyName} duerme mejor las siestas cuando la siesta de la mañana es antes de las 10:00. Las siestas tardías correlacionan con más despertares nocturnos.`,
      data: { metric: "nap_timing" }, is_read: false, created_at: daysAgo(3).toISOString(),
    },
    {
      id: uuid(), family_id: familyId, advisor_id: advisorId, type: "recommendation",
      title: `Sugerencia para ${babyName}`,
      description: `La ventana de vigilia antes de acostarse supera las 3h. Prueba una siesta corta a las 16:30 para evitar sobre-cansancio.`,
      data: { metric: "wake_window" }, is_read: true, created_at: daysAgo(5).toISOString(),
    },
  ];
}

// ─── Sleep plans ───
function generatePlan(familyId, advisorId, babyName, trend) {
  const planId = uuid();
  const plan = {
    id: planId, family_id: familyId, advisor_id: advisorId,
    title: `Plan de sueño — ${babyName}`,
    description: `Método de extinción gradual adaptado a la edad y temperamento de ${babyName}. Objetivo: consolidar sueño nocturno y reducir despertares.`,
    status: trend === "stable" || trend === "improving" ? "active" : "draft",
    created_at: daysAgo(20).toISOString(), updated_at: daysAgo(2).toISOString(),
  };

  const goals = [
    { id: uuid(), plan_id: planId, description: "Reducir despertares nocturnos a ≤1", target_value: 1, current_value: trend === "improving" ? 1.2 : 2.5, metric: "awakenings", achieved: trend === "improving", created_at: daysAgo(20).toISOString() },
    { id: uuid(), plan_id: planId, description: "Sueño nocturno ≥10.5h", target_value: 10.5, current_value: trend === "improving" ? 10.8 : 9.5, metric: "night_hours", achieved: trend === "improving", created_at: daysAgo(20).toISOString() },
    { id: uuid(), plan_id: planId, description: "Se duerme solo/a en la cuna", target_value: null, current_value: null, metric: "self_soothe", achieved: false, created_at: daysAgo(20).toISOString() },
  ];

  const steps = [
    { id: uuid(), plan_id: planId, step_order: 1, title: "Rutina predecible", description: "Establecer rutina fija: baño → pijama → cuento → canción → cuna.", duration_days: 7, completed: true, completed_at: daysAgo(13).toISOString(), created_at: daysAgo(20).toISOString() },
    { id: uuid(), plan_id: planId, step_order: 2, title: "Hora fija de acostarse", description: "Acostarse entre 19:30-20:00 cada noche. No variar más de 15 min.", duration_days: 7, completed: trend === "improving", completed_at: trend === "improving" ? daysAgo(6).toISOString() : null, created_at: daysAgo(13).toISOString() },
    { id: uuid(), plan_id: planId, step_order: 3, title: "Retirada gradual", description: "Ir reduciendo la presencia: al lado de la cuna → en la puerta → fuera.", duration_days: 10, completed: false, completed_at: null, created_at: daysAgo(6).toISOString() },
    { id: uuid(), plan_id: planId, step_order: 4, title: "Autonomía nocturna", description: "Esperar 2-3 min antes de intervenir en despertares. Dar oportunidad de reconectar ciclos.", duration_days: 7, completed: false, completed_at: null, created_at: daysAgo(6).toISOString() },
  ];

  return { plan, goals, steps };
}

// ─── Notes ───
function generateNotes(familyId, advisorId, babyName) {
  return [
    { id: uuid(), family_id: familyId, advisor_id: advisorId, content: `Primera sesión con los padres de ${babyName}. Muy motivados. El principal problema son los despertares nocturnos (3-4 por noche). La madre colecha desde el nacimiento. Objetivo: transición gradual a cuna.`, created_at: daysAgo(25).toISOString() },
    { id: uuid(), family_id: familyId, advisor_id: advisorId, content: `Seguimiento semana 1: la rutina de baño-cuento-cuna está funcionando. ${babyName} ya no llora al entrar en la habitación. Los padres están contentos con el progreso.`, created_at: daysAgo(18).toISOString() },
    { id: uuid(), family_id: familyId, advisor_id: advisorId, content: `La siesta de la tarde sigue siendo irregular. Recomendado ajustar la ventana de vigilia a 2.5h antes de la siesta y usar oscuridad total + ruido blanco.`, created_at: daysAgo(10).toISOString() },
    { id: uuid(), family_id: familyId, advisor_id: advisorId, content: `Gran avance: ${babyName} ha dormido 3 noches seguidas con solo 1 despertar. Los padres dicen que la diferencia es "de noche a día". Seguimos con el paso 3 del plan.`, created_at: daysAgo(3).toISOString() },
  ];
}

// ─── Notifications ───
function generateNotifications(userId, families) {
  const notifs = [];
  for (const f of families.slice(0, 5)) {
    notifs.push(
      { id: uuid(), user_id: userId, type: "new_record", title: `Nuevo registro de ${f.baby_name}`, body: `Los padres de ${f.baby_name} han registrado la actividad de hoy.`, is_read: Math.random() > 0.4, link: null, created_at: daysAgo(randomInt(0, 2)).toISOString() },
      { id: uuid(), user_id: userId, type: "insight", title: `Nuevo insight para ${f.baby_name}`, body: `La IA ha detectado un nuevo patrón en los datos de ${f.baby_name}.`, is_read: Math.random() > 0.6, link: null, created_at: daysAgo(randomInt(1, 4)).toISOString() },
    );
  }
  notifs.push(
    { id: uuid(), user_id: userId, type: "weekly_summary", title: "Resumen semanal disponible", body: "Tu resumen semanal está listo. 6 de 8 familias registraron actividad.", is_read: false, link: null, created_at: daysAgo(1).toISOString() },
    { id: uuid(), user_id: userId, type: "family_inactive", title: `${families[4]?.baby_name || "Leo"} sin registrar (24h)`, body: "No se han registrado actividades en las últimas 24 horas.", is_read: false, link: null, created_at: daysAgo(0).toISOString() },
  );
  return notifs;
}

// ════════════════════════════════════════
// MAIN
// ════════════════════════════════════════
async function main() {
  console.log("🌱 Nanni Demo Seed\n");

  // 1. Create or sign in demo user
  let userId;
  const sb = adminClient || anonClient;

  if (adminClient) {
    console.log("  Using service_role key (admin)");
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === DEMO_EMAIL);

    if (existing) {
      userId = existing.id;
      console.log(`  ✓ Demo user exists: ${userId}`);
    } else {
      const { data, error } = await adminClient.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: DEMO_NAME },
      });
      if (error) { console.error("  ❌ Failed to create user:", error.message); process.exit(1); }
      userId = data.user.id;
      console.log(`  ✓ Created demo user: ${userId}`);
    }
  } else {
    console.log("  No service_role key — using signUp/signIn flow");
    const { data: signUpData, error: signUpErr } = await anonClient.auth.signUp({
      email: DEMO_EMAIL, password: DEMO_PASSWORD,
      options: { data: { full_name: DEMO_NAME } },
    });

    if (signUpErr && signUpErr.message.includes("already registered")) {
      const { data: signInData, error: signInErr } = await anonClient.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
      if (signInErr) { console.error("  ❌ Sign in failed:", signInErr.message); process.exit(1); }
      userId = signInData.user.id;
      console.log(`  ✓ Signed in as demo user: ${userId}`);
    } else if (signUpData?.user) {
      if (!signUpData.session) {
        console.log("  ⚠ Email confirmation required. Please:");
        console.log("    1. Go to Supabase Dashboard → Authentication → Users");
        console.log("    2. Find demo@nanniapp.com and confirm their email");
        console.log("    3. Run this script again");
        process.exit(1);
      }
      userId = signUpData.user.id;
      console.log(`  ✓ Created & signed in demo user: ${userId}`);
    } else {
      console.error("  ❌ Unexpected signup result");
      process.exit(1);
    }
  }

  // 2. Ensure profile exists (upsert via admin or via RLS-compliant client)
  console.log("\n📝 Ensuring profile, brand & subscription...");
  await sb.from("profiles").upsert({
    id: userId, email: DEMO_EMAIL, full_name: DEMO_NAME, role: "advisor",
  }, { onConflict: "id" });

  await sb.from("brands").upsert({
    advisor_id: userId, name: "Dulces Sueños",
    primary_color: "#188d91", headline: "Asesoría de sueño infantil",
    description: "Ayudamos a las familias a dormir mejor con un enfoque respetuoso y basado en evidencia.",
  }, { onConflict: "advisor_id" });

  await sb.from("subscriptions").upsert({
    advisor_id: userId, plan: "premium", status: "active", max_families: 999,
  }, { onConflict: "advisor_id" });
  console.log("  ✓ Profile, brand & subscription ready");

  // 3. Clean old demo data
  console.log("\n🧹 Cleaning previous demo data...");
  const { data: oldFamilies } = await sb.from("families").select("id").eq("advisor_id", userId);
  if (oldFamilies?.length) {
    const fids = oldFamilies.map((f) => f.id);
    await sb.from("activity_records").delete().in("family_id", fids);
    await sb.from("advisor_notes").delete().in("family_id", fids);
    await sb.from("insights").delete().in("family_id", fids);
    await sb.from("sleep_plan_steps").delete().in("plan_id",
      (await sb.from("sleep_plans").select("id").in("family_id", fids)).data?.map(p => p.id) || []);
    await sb.from("sleep_plan_goals").delete().in("plan_id",
      (await sb.from("sleep_plans").select("id").in("family_id", fids)).data?.map(p => p.id) || []);
    await sb.from("sleep_plans").delete().in("family_id", fids);
    await sb.from("families").delete().eq("advisor_id", userId);
  }
  await sb.from("notifications").delete().eq("user_id", userId);
  console.log("  ✓ Cleaned");

  // 4. Create families
  console.log("\n👶 Creating families...");
  const familyRows = FAMILIES.map((f) => ({
    id: uuid(),
    advisor_id: userId,
    baby_name: f.baby_name,
    baby_birth_date: birthDate(f.birth_offset_months),
    status: f.status,
  }));

  const { error: famErr } = await sb.from("families").insert(familyRows);
  if (famErr) { console.error("  ❌ Families:", famErr.message); process.exit(1); }
  console.log(`  ✓ ${familyRows.length} families created`);

  // 5. Generate activity records (30 days per active family)
  console.log("\n📊 Generating activity records (30 days × 6 active families)...");
  let totalRecords = 0;
  const activeFamilies = familyRows.filter((_, i) => FAMILIES[i].status === "active");

  for (let fi = 0; fi < activeFamilies.length; fi++) {
    const family = activeFamilies[fi];
    const config = FAMILIES[fi];
    const ageMonths = config.birth_offset_months;
    const allRecords = [];

    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const day = daysAgo(dayOffset);
      day.setHours(0, 0, 0, 0);
      const dayRecords = generateDayRecords(family.id, day, 30 - dayOffset, config.trend, ageMonths);
      allRecords.push(...dayRecords);
    }

    // Insert in batches of 200
    for (let i = 0; i < allRecords.length; i += 200) {
      const batch = allRecords.slice(i, i + 200);
      const { error } = await sb.from("activity_records").insert(batch);
      if (error) { console.error(`  ❌ Records for ${config.baby_name}:`, error.message); break; }
    }
    totalRecords += allRecords.length;
    process.stdout.write(`  ✓ ${config.baby_name}: ${allRecords.length} records\n`);
  }
  console.log(`  Total: ${totalRecords} records`);

  // 6. Sleep plans
  console.log("\n📋 Creating sleep plans...");
  let planCount = 0;
  for (let fi = 0; fi < activeFamilies.length; fi++) {
    const family = activeFamilies[fi];
    const config = FAMILIES[fi];
    const { plan, goals, steps } = generatePlan(family.id, userId, config.baby_name, config.trend);

    await sb.from("sleep_plans").insert(plan);
    await sb.from("sleep_plan_goals").insert(goals);
    await sb.from("sleep_plan_steps").insert(steps);
    planCount++;
  }
  console.log(`  ✓ ${planCount} plans with goals & steps`);

  // 7. Insights
  console.log("\n🧠 Creating AI insights...");
  let insightCount = 0;
  for (let fi = 0; fi < activeFamilies.length; fi++) {
    const family = activeFamilies[fi];
    const config = FAMILIES[fi];
    const insights = generateInsights(family.id, userId, config.baby_name);
    await sb.from("insights").insert(insights);
    insightCount += insights.length;
  }
  console.log(`  ✓ ${insightCount} insights`);

  // 8. Advisor notes
  console.log("\n📝 Creating advisor notes...");
  let noteCount = 0;
  for (let fi = 0; fi < Math.min(activeFamilies.length, 4); fi++) {
    const family = activeFamilies[fi];
    const config = FAMILIES[fi];
    const notes = generateNotes(family.id, userId, config.baby_name);
    await sb.from("advisor_notes").insert(notes);
    noteCount += notes.length;
  }
  console.log(`  ✓ ${noteCount} notes`);

  // 9. Notifications
  console.log("\n🔔 Creating notifications...");
  const notifs = generateNotifications(userId, FAMILIES);
  await sb.from("notifications").insert(notifs);
  console.log(`  ✓ ${notifs.length} notifications`);

  // Done
  console.log("\n════════════════════════════════════════");
  console.log("✅ Demo seed complete!");
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log(`   Families: ${familyRows.length}`);
  console.log(`   Records:  ${totalRecords}`);
  console.log("════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
