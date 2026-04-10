import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getWeeklySleep } from "@/lib/db";
import { averageSleepMetric, countDaysWithSleepRecords } from "@/lib/utils";
import { ParentApp } from "./parent-app";

export default async function ParentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: family } = await supabase
    .from("families")
    .select("*")
    .eq("invite_token", token)
    .single();

  if (!family) notFound();

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("advisor_id", family.advisor_id)
    .single();

  const { data: advisor } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", family.advisor_id)
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

  const daysWithData = countDaysWithSleepRecords(weeklySleep);
  const weekAvgSleep = averageSleepMetric(weeklySleep, (d) => d.total);
  const weekAvgAwakenings = averageSleepMetric(weeklySleep, (d) => d.awakenings);

  return (
    <ParentApp
      family={family}
      brand={brand}
      advisorName={advisor?.full_name || null}
      token={token}
      initialRecords={weekRecords || []}
      activePlan={activePlan}
      weekSummary={{
        avgSleep: Math.round(weekAvgSleep * 10) / 10,
        avgAwakenings: Math.round(weekAvgAwakenings * 10) / 10,
        daysWithData,
      }}
    />
  );
}
