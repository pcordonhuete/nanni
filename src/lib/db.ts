import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  Brand,
  Family,
  FamilyMember,
  ActivityRecord,
  SleepPlan,
  SleepPlanGoal,
  SleepPlanStep,
  AdvisorNote,
  Insight,
  Notification,
  Subscription,
  DashboardStats,
  WeeklySleepData,
  NotificationPreferences,
  SleepPlanTemplate,
  IntakeTemplate,
  IntakeResponse,
} from "@/lib/types";
import { format, eachDayOfInterval, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import { sleepScore, statusFromScore, babyAgeMonths } from "@/lib/utils";

// ─── Profile ───

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export async function getSubscription(advisorId: string): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("advisor_id", advisorId)
    .single();
  return data;
}

export async function getBrand(advisorId: string): Promise<Brand | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("brands")
    .select("*")
    .eq("advisor_id", advisorId)
    .single();
  return data;
}

// ─── Families ───

export async function getFamilies(advisorId: string): Promise<Family[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("families")
    .select("*")
    .eq("advisor_id", advisorId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getFamily(familyId: string): Promise<Family | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("families")
    .select("*")
    .eq("id", familyId)
    .single();
  return data;
}

export async function getFamilyByToken(token: string): Promise<Family | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("families")
    .select("*")
    .eq("invite_token", token)
    .single();
  return data;
}

export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("family_members")
    .select("*")
    .eq("family_id", familyId);
  return data || [];
}

// ─── Activity Records ───

export async function getRecords(
  familyId: string,
  options?: { from?: string; to?: string; type?: string; limit?: number }
): Promise<ActivityRecord[]> {
  const supabase = await createClient();
  let query = supabase
    .from("activity_records")
    .select("*")
    .eq("family_id", familyId)
    .order("started_at", { ascending: false });

  if (options?.from) query = query.gte("started_at", options.from);
  if (options?.to) query = query.lte("started_at", options.to);
  if (options?.type) query = query.eq("type", options.type);
  if (options?.limit) query = query.limit(options.limit);

  const { data } = await query;
  return data || [];
}

export async function getTodayRecords(familyId: string): Promise<ActivityRecord[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getRecords(familyId, { from: today.toISOString() });
}

export async function getRecentRecordsAllFamilies(
  advisorId: string,
  limit = 10
): Promise<(ActivityRecord & { family: Family })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_records")
    .select("*, family:families!inner(*)")
    .eq("family.advisor_id", advisorId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as (ActivityRecord & { family: Family })[]) || [];
}

// ─── Dashboard aggregations ───

export async function getDashboardStats(advisorId: string): Promise<DashboardStats> {
  const families = await getFamilies(advisorId);
  const activeFamilies = families.filter((f) => f.status === "active");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const supabase = await createClient();

  let familiesWithRecordsToday = 0;
  let totalSleepMinutes = 0;
  let sleepFamilyCount = 0;
  let needAttention = 0;

  for (const family of activeFamilies) {
    const { data: todayRecs } = await supabase
      .from("activity_records")
      .select("type, duration_minutes")
      .eq("family_id", family.id)
      .gte("started_at", today.toISOString());

    if (todayRecs && todayRecs.length > 0) {
      familiesWithRecordsToday++;
    }

    const { data: sleepRecs } = await supabase
      .from("activity_records")
      .select("duration_minutes")
      .eq("family_id", family.id)
      .eq("type", "sleep")
      .gte("started_at", weekAgo.toISOString());

    if (sleepRecs && sleepRecs.length > 0) {
      const totalMin = sleepRecs.reduce((a, r) => a + (r.duration_minutes || 0), 0);
      totalSleepMinutes += totalMin / 7;
      sleepFamilyCount++;
    }

    const { data: lastRec } = await supabase
      .from("activity_records")
      .select("created_at")
      .eq("family_id", family.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!lastRec || new Date(lastRec.created_at) < weekAgo) {
      needAttention++;
    }
  }

  const totalFamilies = activeFamilies.length;
  const recordsPct = totalFamilies > 0
    ? Math.round((familiesWithRecordsToday / totalFamilies) * 100)
    : 0;
  const avgSleep = sleepFamilyCount > 0
    ? Math.round((totalSleepMinutes / sleepFamilyCount / 60) * 10) / 10
    : 0;

  return {
    active_families: totalFamilies,
    families_trend: 0,
    records_today_pct: recordsPct,
    records_trend: 0,
    families_needing_attention: needAttention,
    attention_trend: 0,
    avg_sleep_hours: avgSleep,
    sleep_trend: 0,
  };
}

export async function getWeeklySleep(familyId: string): Promise<WeeklySleepData[]> {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const result: WeeklySleepData[] = [];

  const supabase = await createClient();
  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  rangeStart.setDate(rangeStart.getDate() - 6);
  const rangeEnd = new Date();
  rangeEnd.setHours(23, 59, 59, 999);
  const queryStart = new Date(rangeStart);
  queryStart.setDate(queryStart.getDate() - 1);

  const { data: sleepRecs } = await supabase
    .from("activity_records")
    .select("started_at, ended_at, duration_minutes, details")
    .eq("family_id", familyId)
    .eq("type", "sleep")
    .gte("started_at", queryStart.toISOString())
    .lte("started_at", rangeEnd.toISOString());

  const { data: wakeRecs } = await supabase
    .from("activity_records")
    .select("id, started_at")
    .eq("family_id", familyId)
    .eq("type", "wake")
    .gte("started_at", rangeStart.toISOString())
    .lte("started_at", rangeEnd.toISOString());

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayKey = localDateKeyFromDate(dayStart);

    let nightHours = 0;
    let napHours = 0;
    let embeddedAwakenings = 0;
    if (sleepRecs) {
      for (const rec of sleepRecs) {
        const recDayKey = sleepDayKey(rec);
        if (recDayKey !== dayKey) continue;
        const mins = rec.duration_minutes || 0;
        const details = rec.details as Record<string, unknown> | null;
        const sleepType = details?.sleep_type as string | undefined;
        const isNight = sleepType ? sleepType === "night" : new Date(rec.started_at).getHours() >= 19 || new Date(rec.started_at).getHours() < 7;

        if (isNight) {
          nightHours += mins / 60;
          embeddedAwakenings += (typeof details?.awakenings === "number" ? details.awakenings : 0) as number;
        } else {
          napHours += mins / 60;
        }
      }
    }

    const wakeCount = wakeRecs?.filter((w) => localDateKey(w.started_at) === dayKey).length || 0;
    const totalAwakenings = embeddedAwakenings + wakeCount;

    result.push({
      day: days[date.getDay()],
      date: dayStart.toISOString(),
      night_hours: Math.round(nightHours * 10) / 10,
      nap_hours: Math.round(napHours * 10) / 10,
      awakenings: totalAwakenings,
      total: Math.round((nightHours + napHours) * 10) / 10,
    });
  }

  return result;
}

export async function getFamilyWithStats(familyId: string) {
  const family = await getFamily(familyId);
  if (!family) return null;

  const members = await getFamilyMembers(familyId);
  const todayRecords = await getTodayRecords(familyId);
  const weeklySleep = await getWeeklySleep(familyId);

  const sleepToday = todayRecords
    .filter((r) => r.type === "sleep")
    .reduce((a, r) => a + (r.duration_minutes || 0), 0) / 60;

  const lastNightAwakenings = weeklySleep[weeklySleep.length - 1]?.awakenings || 0;
  const ageMonths = babyAgeMonths(family.baby_birth_date);
  const avgSleep = weeklySleep.length > 0
    ? weeklySleep.reduce((a, d) => a + d.total, 0) / weeklySleep.length
    : 0;
  const avgAwakenings = weeklySleep.length > 0
    ? weeklySleep.reduce((a, d) => a + d.awakenings, 0) / weeklySleep.length
    : 0;

  const score = sleepScore(avgSleep, avgAwakenings, ageMonths);
  const { label: status_label } = statusFromScore(score);

  const supabase = await createClient();
  const { data: lastRec } = await supabase
    .from("activity_records")
    .select("created_at")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: activePlan } = await supabase
    .from("sleep_plans")
    .select("*")
    .eq("family_id", familyId)
    .eq("status", "active")
    .limit(1)
    .single();

  return {
    ...family,
    baby_age_months: ageMonths,
    members,
    total_sleep_today: Math.round(sleepToday * 10) / 10,
    awakenings_last_night: lastNightAwakenings,
    last_record_at: lastRec?.created_at || null,
    score,
    status_label,
    active_plan: activePlan || null,
  };
}

// ─── Sleep Plans ───

export async function getPlans(familyId: string): Promise<SleepPlan[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sleep_plans")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getPlanWithDetails(planId: string) {
  const supabase = await createClient();
  const { data: plan } = await supabase
    .from("sleep_plans")
    .select("*")
    .eq("id", planId)
    .single();
  if (!plan) return null;

  const { data: goals } = await supabase
    .from("sleep_plan_goals")
    .select("*")
    .eq("plan_id", planId)
    .order("created_at");

  const { data: steps } = await supabase
    .from("sleep_plan_steps")
    .select("*")
    .eq("plan_id", planId)
    .order("step_order");

  return { ...plan, goals: goals || [], steps: steps || [] };
}

// ─── Notes ───

export async function getNotes(familyId: string): Promise<AdvisorNote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("advisor_notes")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });
  return data || [];
}

// ─── Insights ───

export async function getInsights(
  advisorId: string,
  options?: { familyId?: string; unreadOnly?: boolean; limit?: number }
): Promise<Insight[]> {
  const supabase = await createClient();
  let query = supabase
    .from("insights")
    .select("*")
    .eq("advisor_id", advisorId)
    .order("created_at", { ascending: false });

  if (options?.familyId) query = query.eq("family_id", options.familyId);
  if (options?.unreadOnly) query = query.eq("is_read", false);
  if (options?.limit) query = query.limit(options.limit);

  const { data } = await query;
  return data || [];
}

// ─── Advisor analytics (aggregate across families) ───

export type AnalyticsPeriodKey = "week" | "month" | "quarter";

export interface AnalyticsChartBucket {
  label: string;
  avgNightHours: number;
  avgNapHours: number;
  avgAwakenings: number;
  adherencePct: number;
}

export interface FamilyAnalyticsRank {
  family: Family;
  score: number;
  avgSleepHours: number;
  avgAwakenings: number;
  statusLabel: string;
  statusColor: string;
}

export interface AdvisorAnalytics {
  period: AnalyticsPeriodKey;
  totalFamilies: number;
  overview: {
    avgSleepHours: number;
    avgAwakenings: number;
    adherencePct: number;
  };
  previousOverview: {
    avgSleepHours: number;
    avgAwakenings: number;
    adherencePct: number;
  } | null;
  chart: AnalyticsChartBucket[];
  rankings: FamilyAnalyticsRank[];
}

function localDateKey(iso: string): string {
  const d = new Date(iso);
  return localDateKeyFromDate(d);
}

function localDateKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sleepDayKey(rec: {
  started_at: string;
  ended_at?: string | null;
  details?: Record<string, unknown> | null;
}): string {
  const details = rec.details || {};
  const sleepType = details?.sleep_type as string | undefined;
  if (sleepType === "night") {
    const tagged = details?.night_date as string | undefined;
    if (tagged) return tagged;
    if (rec.ended_at) return localDateKey(rec.ended_at);
  }
  return localDateKey(rec.started_at);
}

function addSleepToDay(
  target: Map<string, { night: number; nap: number; wakes: number; anyRecord: boolean }>,
  familyId: string,
  night: number,
  nap: number
) {
  let row = target.get(familyId);
  if (!row) {
    row = { night: 0, nap: 0, wakes: 0, anyRecord: true };
    target.set(familyId, row);
  }
  row.night += night;
  row.nap += nap;
  row.anyRecord = true;
}

function addWakeToDay(
  target: Map<string, { night: number; nap: number; wakes: number; anyRecord: boolean }>,
  familyId: string
) {
  let row = target.get(familyId);
  if (!row) {
    row = { night: 0, nap: 0, wakes: 0, anyRecord: true };
    target.set(familyId, row);
  }
  row.wakes += 1;
  row.anyRecord = true;
}

function markAnyRecord(
  target: Map<string, { night: number; nap: number; wakes: number; anyRecord: boolean }>,
  familyId: string
) {
  let row = target.get(familyId);
  if (!row) {
    row = { night: 0, nap: 0, wakes: 0, anyRecord: true };
    target.set(familyId, row);
  } else {
    row.anyRecord = true;
  }
}

function buildDayMap(
  records: {
    family_id: string;
    type: string;
    started_at: string;
    ended_at?: string | null;
    duration_minutes: number | null;
    details?: Record<string, unknown> | null;
  }[],
  dayKeys: string[]
): Map<string, Map<string, { night: number; nap: number; wakes: number; anyRecord: boolean }>> {
  const byDay = new Map<string, Map<string, { night: number; nap: number; wakes: number; anyRecord: boolean }>>();
  for (const k of dayKeys) {
    byDay.set(k, new Map());
  }

  const keySet = new Set(dayKeys);

  for (const rec of records) {
    if (rec.type === "sleep") {
      const dk = sleepDayKey(rec);
      if (!keySet.has(dk)) continue;
      const dayMap = byDay.get(dk)!;
      const mins = rec.duration_minutes || 0;
      const hours = mins / 60;
      const details = rec.details;
      const sleepType = details?.sleep_type as string | undefined;
      const hour = new Date(rec.started_at).getHours();
      const isNight = sleepType ? sleepType === "night" : (hour >= 19 || hour < 7);
      if (isNight) {
        addSleepToDay(dayMap, rec.family_id, hours, 0);
        const aw = typeof details?.awakenings === "number" ? details.awakenings : 0;
        for (let w = 0; w < aw; w++) addWakeToDay(dayMap, rec.family_id);
      } else {
        addSleepToDay(dayMap, rec.family_id, 0, hours);
      }
      continue;
    }

    const dk = localDateKey(rec.started_at);
    if (!keySet.has(dk)) continue;
    const dayMap = byDay.get(dk)!;
    if (rec.type === "wake") {
      addWakeToDay(dayMap, rec.family_id);
    } else {
      markAnyRecord(dayMap, rec.family_id);
    }
  }

  return byDay;
}

function aggregateOverviewAndRankings(
  families: Family[],
  records: {
    family_id: string;
    type: string;
    started_at: string;
    ended_at?: string | null;
    duration_minutes: number | null;
    details?: Record<string, unknown> | null;
  }[],
  rangeStart: Date,
  rangeEnd: Date,
  totalDays: number
): {
  overview: { avgSleepHours: number; avgAwakenings: number; adherencePct: number };
  rankings: FamilyAnalyticsRank[];
} {
  const dayKeys = eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map((d) =>
    localDateKeyFromDate(d)
  );

  const byDay = buildDayMap(records, dayKeys);
  const totalFamilies = families.length;

  let sumAdherence = 0;
  for (const dk of dayKeys) {
    const dayMap = byDay.get(dk)!;
    const withRecord = [...dayMap.values()].filter((v) => v.anyRecord).length;
    sumAdherence += totalFamilies > 0 ? (withRecord / totalFamilies) * 100 : 0;
  }
  const adherencePct =
    dayKeys.length > 0 ? Math.round((sumAdherence / dayKeys.length) * 10) / 10 : 0;

  const familyTotals = new Map<string, { sleepHours: number; wakes: number }>();
  for (const f of families) {
    familyTotals.set(f.id, { sleepHours: 0, wakes: 0 });
  }

  for (const dk of dayKeys) {
    const dayMap = byDay.get(dk)!;
    for (const f of families) {
      const row = dayMap.get(f.id);
      const t = familyTotals.get(f.id)!;
      if (row) {
        t.sleepHours += row.night + row.nap;
        t.wakes += row.wakes;
      }
    }
  }

  let sumFamilyAvgSleep = 0;
  let sumFamilyAvgWake = 0;
  let nFam = 0;
  const rankings: FamilyAnalyticsRank[] = [];

  for (const f of families) {
    const t = familyTotals.get(f.id)!;
    const avgSleepHours = totalDays > 0 ? Math.round((t.sleepHours / totalDays) * 10) / 10 : 0;
    const avgAwakenings = totalDays > 0 ? Math.round((t.wakes / totalDays) * 10) / 10 : 0;
    const ageMonths = babyAgeMonths(f.baby_birth_date);
    const score = sleepScore(avgSleepHours, avgAwakenings, ageMonths);
    const { label: statusLabel, color: statusColor } = statusFromScore(score);

    sumFamilyAvgSleep += avgSleepHours;
    sumFamilyAvgWake += avgAwakenings;
    nFam += 1;

    rankings.push({
      family: f,
      score,
      avgSleepHours,
      avgAwakenings,
      statusLabel,
      statusColor,
    });
  }

  rankings.sort((a, b) => b.score - a.score);

  const overview = {
    avgSleepHours: nFam > 0 ? Math.round((sumFamilyAvgSleep / nFam) * 10) / 10 : 0,
    avgAwakenings: nFam > 0 ? Math.round((sumFamilyAvgWake / nFam) * 10) / 10 : 0,
    adherencePct,
  };

  return { overview, rankings };
}

function bucketsFromDays(
  dayKeys: string[],
  byDay: Map<string, Map<string, { night: number; nap: number; wakes: number; anyRecord: boolean }>>,
  totalFamilies: number
): AnalyticsChartBucket[] {
  return dayKeys.map((dk) => {
    const dayMap = byDay.get(dk)!;
    const d = new Date(dk + "T12:00:00");
    const label = format(d, "EEE", { locale: es });
    let sumNight = 0;
    let sumNap = 0;
    let sumWake = 0;
    let nSleep = 0;
    const withRecord = [...dayMap.values()].filter((v) => v.anyRecord).length;
    for (const row of dayMap.values()) {
      const s = row.night + row.nap;
      if (s > 0) {
        sumNight += row.night;
        sumNap += row.nap;
        sumWake += row.wakes;
        nSleep += 1;
      }
    }
    const avgNightHours = nSleep > 0 ? Math.round((sumNight / nSleep) * 10) / 10 : 0;
    const avgNapHours = nSleep > 0 ? Math.round((sumNap / nSleep) * 10) / 10 : 0;
    const avgAwakenings = nSleep > 0 ? Math.round((sumWake / nSleep) * 10) / 10 : 0;
    const adherencePct =
      totalFamilies > 0 ? Math.round((withRecord / totalFamilies) * 100) : 0;
    return {
      label: label.charAt(0).toUpperCase() + label.slice(1),
      avgNightHours,
      avgNapHours,
      avgAwakenings,
      adherencePct,
    };
  });
}

function mergeBuckets(buckets: AnalyticsChartBucket[], groupSize: number): AnalyticsChartBucket[] {
  const out: AnalyticsChartBucket[] = [];
  for (let i = 0; i < buckets.length; i += groupSize) {
    const slice = buckets.slice(i, i + groupSize);
    if (slice.length === 0) continue;
    const avgNight =
      slice.reduce((a, b) => a + b.avgNightHours, 0) / slice.length;
    const avgNap = slice.reduce((a, b) => a + b.avgNapHours, 0) / slice.length;
    const avgWake = slice.reduce((a, b) => a + b.avgAwakenings, 0) / slice.length;
    const avgAdh = slice.reduce((a, b) => a + b.adherencePct, 0) / slice.length;
    out.push({
      label: `S${out.length + 1}`,
      avgNightHours: Math.round(avgNight * 10) / 10,
      avgNapHours: Math.round(avgNap * 10) / 10,
      avgAwakenings: Math.round(avgWake * 10) / 10,
      adherencePct: Math.round(avgAdh),
    });
  }
  return out;
}

export async function getAdvisorAnalytics(
  advisorId: string,
  period: AnalyticsPeriodKey,
  existingFamilies?: Family[]
): Promise<AdvisorAnalytics | null> {
  const families = existingFamilies ?? (await getFamilies(advisorId));
  if (families.length === 0) return null;

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  let start = new Date(end);
  let prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  prevEnd.setHours(23, 59, 59, 999);

  if (period === "week") {
    start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    start = new Date(end);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  } else {
    start = new Date(end);
    start.setDate(start.getDate() - 83);
    start.setHours(0, 0, 0, 0);
  }

  const periodDays = differenceInCalendarDays(end, start) + 1;
  let prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - periodDays);
  prevStart.setHours(0, 0, 0, 0);

  const familyIds = families.map((f) => f.id);
  const supabase = await createClient();

  const { data: recordsCurrent } = await supabase
    .from("activity_records")
    .select("family_id, type, started_at, ended_at, duration_minutes, details")
    .in("family_id", familyIds)
    .gte("started_at", start.toISOString())
    .lte("started_at", end.toISOString());

  const { data: recordsPrev } = await supabase
    .from("activity_records")
    .select("family_id, type, started_at, ended_at, duration_minutes, details")
    .in("family_id", familyIds)
    .gte("started_at", prevStart.toISOString())
    .lte("started_at", prevEnd.toISOString());

  const rc = recordsCurrent || [];
  const rp = recordsPrev || [];

  const totalDays = periodDays;
  const { overview, rankings } = aggregateOverviewAndRankings(families, rc, start, end, totalDays);
  const prevAgg = aggregateOverviewAndRankings(families, rp, prevStart, prevEnd, totalDays);

  const dayKeys = eachDayOfInterval({ start, end }).map((d) => localDateKeyFromDate(d));
  const byDay = buildDayMap(rc, dayKeys);

  let chart: AnalyticsChartBucket[];
  if (period === "quarter") {
    const daily = bucketsFromDays(dayKeys, byDay, families.length);
    chart = mergeBuckets(daily, 7);
  } else {
    chart = bucketsFromDays(dayKeys, byDay, families.length);
  }

  return {
    period,
    totalFamilies: families.length,
    overview,
    previousOverview: rp.length > 0 ? prevAgg.overview : null,
    chart,
    rankings,
  };
}

// ─── Notifications ───

export async function getNotifications(
  userId: string,
  limit = 20
): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count || 0;
}

// ─── Notification Preferences ───

export async function getNotificationPreferences(
  advisorId: string
): Promise<NotificationPreferences | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("advisor_id", advisorId)
    .single();
  return data;
}

// ─── Sleep Plan Templates ───

export async function getSleepPlanTemplates(
  advisorId: string
): Promise<SleepPlanTemplate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sleep_plan_templates")
    .select("*")
    .or(`advisor_id.eq.${advisorId},is_system.eq.true`)
    .order("is_system", { ascending: false });
  return data || [];
}

// ─── Intake Questionnaires ───

export async function getIntakeTemplates(
  advisorId: string
): Promise<IntakeTemplate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("intake_templates")
    .select("*")
    .eq("advisor_id", advisorId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getIntakeResponses(
  familyId: string
): Promise<IntakeResponse[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("intake_responses")
    .select("*")
    .eq("family_id", familyId)
    .order("submitted_at", { ascending: false });
  return data || [];
}

// ─── Records with date range ───

export async function getRecordsInRange(
  familyId: string,
  from: string,
  to: string
): Promise<ActivityRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_records")
    .select("*")
    .eq("family_id", familyId)
    .gte("started_at", from)
    .lte("started_at", to)
    .order("started_at", { ascending: false });
  return data || [];
}

export async function getWeeklySleepForRange(
  familyId: string,
  startDate: Date,
  numDays: number
): Promise<WeeklySleepData[]> {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const result: WeeklySleepData[] = [];
  const supabase = await createClient();
  const rangeStart = new Date(startDate);
  rangeStart.setDate(rangeStart.getDate() - (numDays - 1));
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(startDate);
  rangeEnd.setHours(23, 59, 59, 999);
  const queryStart = new Date(rangeStart);
  queryStart.setDate(queryStart.getDate() - 1);

  const { data: sleepRecs } = await supabase
    .from("activity_records")
    .select("started_at, ended_at, duration_minutes, details")
    .eq("family_id", familyId)
    .eq("type", "sleep")
    .gte("started_at", queryStart.toISOString())
    .lte("started_at", rangeEnd.toISOString());

  const { data: wakeRecs } = await supabase
    .from("activity_records")
    .select("id, started_at")
    .eq("family_id", familyId)
    .eq("type", "wake")
    .gte("started_at", rangeStart.toISOString())
    .lte("started_at", rangeEnd.toISOString());

  for (let i = numDays - 1; i >= 0; i--) {
    const date = new Date(startDate);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayKey = localDateKeyFromDate(dayStart);

    let nightHours = 0;
    let napHours = 0;
    let embeddedAwakenings = 0;
    if (sleepRecs) {
      for (const rec of sleepRecs) {
        const recDayKey = sleepDayKey(rec);
        if (recDayKey !== dayKey) continue;
        const mins = rec.duration_minutes || 0;
        const details = rec.details as Record<string, unknown> | null;
        const sleepType = details?.sleep_type as string | undefined;
        const isNight = sleepType
          ? sleepType === "night"
          : new Date(rec.started_at).getHours() >= 19 || new Date(rec.started_at).getHours() < 7;

        if (isNight) {
          nightHours += mins / 60;
          embeddedAwakenings += (typeof details?.awakenings === "number" ? details.awakenings : 0) as number;
        } else {
          napHours += mins / 60;
        }
      }
    }

    const wakeCount = wakeRecs?.filter((w) => localDateKey(w.started_at) === dayKey).length || 0;
    const totalAwakenings = embeddedAwakenings + wakeCount;

    result.push({
      day: days[date.getDay()],
      date: dayStart.toISOString(),
      night_hours: Math.round(nightHours * 10) / 10,
      nap_hours: Math.round(napHours * 10) / 10,
      awakenings: totalAwakenings,
      total: Math.round((nightHours + napHours) * 10) / 10,
    });
  }

  return result;
}
