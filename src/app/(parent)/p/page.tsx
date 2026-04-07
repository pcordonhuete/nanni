import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getWeeklySleep } from "@/lib/db";
import { ParentApp } from "./[token]/parent-app";

export default async function AuthenticatedParentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id, name")
    .eq("profile_id", user.id)
    .limit(1)
    .single();

  if (!membership) redirect("/login");

  const { data: family } = await supabase
    .from("families")
    .select("*")
    .eq("id", membership.family_id)
    .single();

  if (!family) redirect("/login");

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("advisor_id", family.advisor_id)
    .single();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);

  const [{ data: weekRecords }, weeklySleep] = await Promise.all([
    supabase
      .from("activity_records")
      .select("*")
      .eq("family_id", family.id)
      .gte("started_at", weekStart.toISOString())
      .order("started_at", { ascending: true }),
    getWeeklySleep(family.id),
  ]);

  const { data: activePlanRow } = await supabase
    .from("sleep_plans")
    .select("*")
    .eq("family_id", family.id)
    .eq("status", "active")
    .limit(1)
    .single();

  let activePlan = null;
  if (activePlanRow) {
    const [{ data: goals }, { data: steps }] = await Promise.all([
      supabase.from("sleep_plan_goals").select("*").eq("plan_id", activePlanRow.id).order("created_at"),
      supabase.from("sleep_plan_steps").select("*").eq("plan_id", activePlanRow.id).order("step_order"),
    ]);
    activePlan = { ...activePlanRow, goals: goals || [], steps: steps || [] };
  }

  const weekAvgSleep = weeklySleep.length > 0
    ? weeklySleep.reduce((a, d) => a + d.total, 0) / weeklySleep.length : 0;
  const weekAvgAwakenings = weeklySleep.length > 0
    ? weeklySleep.reduce((a, d) => a + d.awakenings, 0) / weeklySleep.length : 0;
  const daysWithData = weeklySleep.filter((d) => d.total > 0 || d.awakenings > 0).length;

  return (
    <ParentApp
      family={family}
      brand={brand}
      token=""
      initialRecords={weekRecords || []}
      activePlan={activePlan}
      weekSummary={{
        avgSleep: Math.round(weekAvgSleep * 10) / 10,
        avgAwakenings: Math.round(weekAvgAwakenings * 10) / 10,
        daysWithData,
      }}
      authenticatedParentName={membership.name}
    />
  );
}
