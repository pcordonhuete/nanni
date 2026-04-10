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
  PortfolioFamilyHealth,
  SleepMethodStats,
  SleepLocationStats,
  AwakeningQualityStats,
  WakeupMoodStats,
  LatencyStats,
  FeedingAnalytics,
  EventSleepCorrelation,
  PlanProgressData,
  FamilyDeepAnalytics,
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
  const totalFamilies = activeFamilies.length;
  if (totalFamilies === 0) {
    return { active_families: 0, families_trend: 0, records_today_pct: 0, records_trend: 0, families_needing_attention: 0, attention_trend: 0, avg_sleep_hours: 0, sleep_trend: 0 };
  }

  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(today); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const familyIds = activeFamilies.map((f) => f.id);
  const supabase = await createClient();

  const [{ data: thisWeekRecs }, { data: prevWeekRecs }, { data: todayRecs }] = await Promise.all([
    supabase.from("activity_records").select("family_id, type, duration_minutes, started_at, details").in("family_id", familyIds).gte("started_at", weekAgo.toISOString()),
    supabase.from("activity_records").select("family_id, type, duration_minutes, started_at, details").in("family_id", familyIds).gte("started_at", twoWeeksAgo.toISOString()).lt("started_at", weekAgo.toISOString()),
    supabase.from("activity_records").select("family_id").in("family_id", familyIds).gte("started_at", today.toISOString()),
  ]);

  const tw = thisWeekRecs || [];
  const pw = prevWeekRecs || [];
  const td = todayRecs || [];

  const familiesWithRecordsToday = new Set(td.map((r) => r.family_id)).size;
  const recordsPct = Math.round((familiesWithRecordsToday / totalFamilies) * 100);

  const calcAvgSleep = (recs: typeof tw) => {
    let total = 0; let fams = 0;
    for (const fid of familyIds) {
      const sleepMins = recs.filter((r) => r.family_id === fid && r.type === "sleep").reduce((a, r) => a + (r.duration_minutes || 0), 0);
      if (sleepMins > 0) { total += sleepMins / 7 / 60; fams++; }
    }
    return fams > 0 ? Math.round((total / fams) * 10) / 10 : 0;
  };

  const avgSleep = calcAvgSleep(tw);
  const prevAvgSleep = calcAvgSleep(pw);
  const sleepTrend = prevAvgSleep > 0 ? Math.round((avgSleep - prevAvgSleep) * 10) / 10 : 0;

  const twFamilyDays = new Set(tw.map((r) => `${r.family_id}_${localDateKey(r.started_at)}`)).size;
  const pwFamilyDays = new Set(pw.map((r) => `${r.family_id}_${localDateKey(r.started_at)}`)).size;
  const twAdherence = totalFamilies > 0 ? Math.round((twFamilyDays / (totalFamilies * 7)) * 100) : 0;
  const pwAdherence = totalFamilies > 0 ? Math.round((pwFamilyDays / (totalFamilies * 7)) * 100) : 0;
  const recordsTrend = pwAdherence > 0 ? twAdherence - pwAdherence : 0;

  let needAttention = 0;
  for (const fid of familyIds) {
    const lastRec = tw.filter((r) => r.family_id === fid).sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
    if (!lastRec || (now.getTime() - new Date(lastRec.started_at).getTime()) > 48 * 3600 * 1000) needAttention++;
  }

  const prevNeedAttention = (() => {
    let count = 0;
    for (const fid of familyIds) {
      const lastRec = pw.filter((r) => r.family_id === fid).sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
      if (!lastRec) count++;
    }
    return count;
  })();

  return {
    active_families: totalFamilies,
    families_trend: 0,
    records_today_pct: recordsPct,
    records_trend: recordsTrend,
    families_needing_attention: needAttention,
    attention_trend: needAttention - prevNeedAttention,
    avg_sleep_hours: avgSleep,
    sleep_trend: sleepTrend,
  };
}

export async function getWeeklySleep(familyId: string, numDays = 7): Promise<WeeklySleepData[]> {
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const result: WeeklySleepData[] = [];

  const supabase = await createClient();
  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  rangeStart.setDate(rangeStart.getDate() - (numDays - 1));
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

  for (let i = numDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayKey = localDateKeyFromDate(dayStart);

    let nightHours = 0;
    let napHours = 0;
    let napCount = 0;
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
          napCount += 1;
        }
      }
    }

    const wakeCount = wakeRecs?.filter((w) => localDateKey(w.started_at) === dayKey).length || 0;
    const totalAwakenings = embeddedAwakenings + wakeCount;

    result.push({
      day: dayNames[date.getDay()],
      date: localDateKeyFromDate(dayStart),
      night_hours: Math.round(nightHours * 10) / 10,
      nap_hours: Math.round(napHours * 10) / 10,
      nap_count: napCount,
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
    return localDateKey(rec.started_at);
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

// ─── Portfolio Health (all families at a glance) ───

export async function getPortfolioHealth(advisorId: string): Promise<PortfolioFamilyHealth[]> {
  const families = await getFamilies(advisorId);
  const active = families.filter((f) => f.status === "active");
  if (active.length === 0) return [];

  const now = new Date();
  const weekEnd = new Date(now); weekEnd.setHours(23, 59, 59, 999);
  const weekStart = new Date(weekEnd); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0, 0, 0, 0);
  const prevEnd = new Date(weekStart); prevEnd.setDate(prevEnd.getDate() - 1); prevEnd.setHours(23, 59, 59, 999);
  const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - 6); prevStart.setHours(0, 0, 0, 0);

  const familyIds = active.map((f) => f.id);
  const supabase = await createClient();

  const [{ data: currRecs }, { data: prevRecs }, { data: lastRecs }, { data: plans }] = await Promise.all([
    supabase.from("activity_records").select("family_id, type, started_at, ended_at, duration_minutes, details").in("family_id", familyIds).gte("started_at", weekStart.toISOString()).lte("started_at", weekEnd.toISOString()),
    supabase.from("activity_records").select("family_id, type, started_at, ended_at, duration_minutes, details").in("family_id", familyIds).gte("started_at", prevStart.toISOString()).lte("started_at", prevEnd.toISOString()),
    supabase.from("activity_records").select("family_id, created_at").in("family_id", familyIds).order("created_at", { ascending: false }),
    supabase.from("sleep_plans").select("family_id, status").in("family_id", familyIds).eq("status", "active"),
  ]);

  const cr = currRecs || [];
  const pr = prevRecs || [];
  const activePlanFamilies = new Set((plans || []).map((p) => p.family_id));

  const lastRecMap = new Map<string, string>();
  for (const r of lastRecs || []) {
    if (!lastRecMap.has(r.family_id)) lastRecMap.set(r.family_id, r.created_at);
  }

  const calcFamilyScore = (recs: typeof cr, fid: string, family: Family) => {
    const sleepRecs = recs.filter((r) => r.family_id === fid && r.type === "sleep");
    const wakeRecs = recs.filter((r) => r.family_id === fid && (r.type === "wake" || r.type === "wakeup"));
    let totalSleep = 0;
    let totalWakes = wakeRecs.length;
    for (const s of sleepRecs) {
      totalSleep += (s.duration_minutes || 0) / 60;
      const d = s.details as Record<string, unknown> | null;
      if (typeof d?.awakenings === "number") totalWakes += d.awakenings;
    }
    const avgSleep = totalSleep / 7;
    const avgWakes = totalWakes / 7;
    const ageMonths = babyAgeMonths(family.baby_birth_date);
    return { score: sleepScore(avgSleep, avgWakes, ageMonths), avgSleep: Math.round(avgSleep * 10) / 10, avgWakes: Math.round(avgWakes * 10) / 10 };
  };

  return active.map((f) => {
    const curr = calcFamilyScore(cr, f.id, f);
    const prev = calcFamilyScore(pr, f.id, f);
    const delta = Math.round((curr.score - prev.score) * 10) / 10;
    const trend: PortfolioFamilyHealth["trend"] = delta >= 0.5 ? "improving" : delta <= -0.5 ? "worsening" : "stable";
    const lastAt = lastRecMap.get(f.id) || null;
    const lastAgoH = lastAt ? (now.getTime() - new Date(lastAt).getTime()) / 3600000 : 9999;
    let attentionReason: string | null = null;
    if (lastAgoH > 48) attentionReason = `Sin registrar hace ${Math.round(lastAgoH / 24)}d`;
    else if (curr.score < 4) attentionReason = "Score crítico";
    else if (delta <= -1) attentionReason = "Empeorando rápido";
    return {
      family: f, ageMonths: babyAgeMonths(f.baby_birth_date),
      score: curr.score, prevScore: prev.score, scoreDelta: delta, trend,
      avgSleepHours: curr.avgSleep, avgAwakenings: curr.avgWakes,
      lastRecordAt: lastAt, lastRecordAgoHours: Math.round(lastAgoH),
      attentionReason, hasActivePlan: activePlanFamilies.has(f.id),
    };
  });
}

// ─── Portfolio sleep methods (aggregated) ───

export async function getPortfolioSleepMethods(familyIds: string[]): Promise<Record<string, number>> {
  if (familyIds.length === 0) return {};
  const supabase = await createClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const { data } = await supabase
    .from("activity_records")
    .select("details")
    .in("family_id", familyIds)
    .eq("type", "sleep")
    .gte("started_at", cutoff.toISOString());

  const methods: Record<string, number> = {};
  for (const rec of data || []) {
    const d = rec.details as Record<string, unknown> | null;
    const m = d?.fell_asleep_method as string | undefined;
    if (m) methods[m] = (methods[m] || 0) + 1;
  }
  return methods;
}

// ─── Family deep analytics ───

export async function getFamilyDeepAnalytics(familyId: string, days = 7): Promise<FamilyDeepAnalytics> {
  const supabase = await createClient();
  const now = new Date();
  const start = new Date(now); start.setDate(start.getDate() - days); start.setHours(0, 0, 0, 0);
  const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - days);
  const halfDays = Math.ceil(days / 2);

  const [{ data: allRecs }, { data: prevSleepRecs }, { data: planRows }] = await Promise.all([
    supabase.from("activity_records").select("*").eq("family_id", familyId).gte("started_at", start.toISOString()).order("started_at", { ascending: false }),
    supabase.from("activity_records").select("started_at, ended_at, duration_minutes, details").eq("family_id", familyId).eq("type", "sleep").gte("started_at", prevStart.toISOString()).lt("started_at", start.toISOString()),
    supabase.from("sleep_plans").select("*, goals:sleep_plan_goals(*), steps:sleep_plan_steps(*)").eq("family_id", familyId).order("created_at", { ascending: false }),
  ]);

  const recs = allRecs || [];
  const sleepRecs = recs.filter((r) => r.type === "sleep");
  const feedRecs = recs.filter((r) => r.type === "feeding" || r.type === "feed");
  const noteRecs = recs.filter((r) => r.type === "note");

  // Sleep method distribution
  const sleepMethods: SleepMethodStats = { self: 0, rocking: 0, feeding: 0, white_noise: 0, other: 0, total: 0 };
  const sleepLocations: SleepLocationStats = { crib: 0, cosleep: 0, arms: 0, stroller: 0, car: 0, other: 0, total: 0 };
  let latencySum = 0; let latencyCount = 0;
  let prevLatencySum = 0; let prevLatencyCount = 0;
  const awakeningQuality: AwakeningQualityStats = { withCrying: 0, withoutCrying: 0, total: 0 };
  const wakeupMood: WakeupMoodStats = { happy: 0, neutral: 0, cranky: 0, total: 0 };

  for (const rec of sleepRecs) {
    const d = rec.details as Record<string, unknown> | null;
    if (!d) continue;
    const method = d.fell_asleep_method as string | undefined;
    if (method && method in sleepMethods) { sleepMethods[method as keyof SleepMethodStats] = (sleepMethods[method as keyof SleepMethodStats] as number) + 1; sleepMethods.total++; }
    const loc = d.location as string | undefined;
    if (loc && loc in sleepLocations) { sleepLocations[loc as keyof SleepLocationStats] = (sleepLocations[loc as keyof SleepLocationStats] as number) + 1; sleepLocations.total++; }
    const lat = d.latency_minutes as number | undefined;
    if (typeof lat === "number") { latencySum += lat; latencyCount++; }
    const aw = d.awakenings as number | undefined;
    if (typeof aw === "number" && aw > 0) {
      const crying = d.awakening_crying;
      if (crying === true) { awakeningQuality.withCrying += aw; awakeningQuality.total += aw; }
      else if (crying === false) { awakeningQuality.withoutCrying += aw; awakeningQuality.total += aw; }
      else { awakeningQuality.total += aw; }
    }
    const mood = d.wakeup_mood as string | undefined;
    if (mood && mood in wakeupMood) { wakeupMood[mood as keyof WakeupMoodStats] = (wakeupMood[mood as keyof WakeupMoodStats] as number) + 1; wakeupMood.total++; }
  }

  for (const rec of (prevSleepRecs || [])) {
    const d = rec.details as Record<string, unknown> | null;
    const lat = d?.latency_minutes as number | undefined;
    if (typeof lat === "number") { prevLatencySum += lat; prevLatencyCount++; }
  }

  const latency: LatencyStats = {
    current: latencyCount > 0 ? Math.round((latencySum / latencyCount) * 10) / 10 : 0,
    previous: prevLatencyCount > 0 ? Math.round((prevLatencySum / prevLatencyCount) * 10) / 10 : 0,
    entries: latencyCount,
  };

  // Feeding analytics
  const feedMethods = { breast: 0, bottle: 0, solids: 0, mixed: 0, total: 0 };
  const feedAmounts = { little: 0, normal: 0, lots: 0, total: 0 };
  const feedByHour = new Map<number, number>();
  for (const rec of feedRecs) {
    const d = rec.details as Record<string, unknown> | null;
    const method = d?.method as string | undefined;
    if (method && method in feedMethods) { feedMethods[method as keyof typeof feedMethods] = (feedMethods[method as keyof typeof feedMethods] as number) + 1; feedMethods.total++; }
    const amount = d?.amount as string | undefined;
    if (amount && amount in feedAmounts) { feedAmounts[amount as keyof typeof feedAmounts] = (feedAmounts[amount as keyof typeof feedAmounts] as number) + 1; feedAmounts.total++; }
    const h = new Date(rec.started_at).getHours();
    feedByHour.set(h, (feedByHour.get(h) || 0) + 1);
  }
  const byHour = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: feedByHour.get(i) || 0 }));
  const feeding: FeedingAnalytics = {
    methods: feedMethods,
    amounts: feedAmounts,
    avgPerDay: days > 0 ? Math.round((feedRecs.length / days) * 10) / 10 : 0,
    byHour,
  };

  // Event-sleep correlations
  const tagLabels: Record<string, string> = { teething: "Dientes", vaccine: "Vacuna", fever: "Fiebre", travel: "Viaje", routine_change: "Cambio rutina" };
  const eventCorrelations: EventSleepCorrelation[] = [];
  const tagDates = new Map<string, string[]>();
  for (const note of noteRecs) {
    const d = note.details as Record<string, unknown> | null;
    const tags = d?.tags as string[] | undefined;
    if (!tags?.length) continue;
    const dk = localDateKey(note.started_at);
    for (const tag of tags) {
      const arr = tagDates.get(tag) || [];
      arr.push(dk);
      tagDates.set(tag, arr);
    }
  }

  for (const [tag, dates] of tagDates) {
    if (dates.length === 0) continue;
    let sumBefore = 0; let sumAfter = 0; let sumWBefore = 0; let sumWAfter = 0; let nBefore = 0; let nAfter = 0;
    for (const dk of dates) {
      const eventDate = new Date(dk + "T12:00:00");
      for (const sr of sleepRecs) {
        const sd = new Date(sr.started_at);
        const diffDays = (sd.getTime() - eventDate.getTime()) / 86400000;
        const mins = sr.duration_minutes || 0;
        const aw = (sr.details as Record<string, unknown>)?.awakenings as number || 0;
        if (diffDays >= -2 && diffDays < 0) { sumBefore += mins / 60; sumWBefore += aw; nBefore++; }
        else if (diffDays >= 0 && diffDays <= 2) { sumAfter += mins / 60; sumWAfter += aw; nAfter++; }
      }
    }
    const avgBefore = nBefore > 0 ? Math.round((sumBefore / nBefore) * 10) / 10 : 0;
    const avgAfter = nAfter > 0 ? Math.round((sumAfter / nAfter) * 10) / 10 : 0;
    const avgWB = nBefore > 0 ? Math.round((sumWBefore / nBefore) * 10) / 10 : 0;
    const avgWA = nAfter > 0 ? Math.round((sumWAfter / nAfter) * 10) / 10 : 0;
    eventCorrelations.push({
      tag, label: tagLabels[tag] || tag, count: dates.length,
      avgSleepBefore: avgBefore, avgSleepAfter: avgAfter,
      avgAwakeningsBefore: avgWB, avgAwakeningsAfter: avgWA,
      sleepDelta: Math.round((avgAfter - avgBefore) * 10) / 10,
      awakeningsDelta: Math.round((avgWA - avgWB) * 10) / 10,
    });
  }

  // Plan progress
  const family = await getFamily(familyId);
  const planProgress: PlanProgressData[] = [];
  for (const plan of (planRows || []) as (SleepPlan & { goals: SleepPlanGoal[]; steps: SleepPlanStep[] })[]) {
    const planStart = new Date(plan.created_at);
    const beforeEnd = new Date(planStart);
    const beforeStart = new Date(planStart); beforeStart.setDate(beforeStart.getDate() - 7);
    const { data: beforeRecs } = await supabase.from("activity_records").select("duration_minutes, details, type, started_at").eq("family_id", familyId).gte("started_at", beforeStart.toISOString()).lt("started_at", beforeEnd.toISOString());
    const calcScore = (rs: typeof beforeRecs) => {
      if (!rs?.length || !family) return 0;
      let sleepH = 0; let wakes = 0;
      for (const r of rs) {
        if (r.type === "sleep") { sleepH += (r.duration_minutes || 0) / 60; const aw = (r.details as Record<string, unknown>)?.awakenings; if (typeof aw === "number") wakes += aw; }
        if (r.type === "wake" || r.type === "wakeup") wakes++;
      }
      const d = Math.max(1, Math.ceil((new Date(rs[0].started_at).getTime() - new Date(rs[rs.length - 1].started_at).getTime()) / 86400000) || 7);
      return sleepScore(sleepH / d, wakes / d, babyAgeMonths(family.baby_birth_date));
    };
    const scoreBefore = calcScore(beforeRecs);
    const recentForPlan = sleepRecs.slice(0, 20);
    const scoreNow = calcScore(recentForPlan.length > 0 ? recentForPlan : null);
    planProgress.push({
      planId: plan.id, planTitle: plan.title, planStatus: plan.status, startedAt: plan.created_at,
      scoreBefore, scoreNow, scoreDelta: Math.round((scoreNow - scoreBefore) * 10) / 10,
      goalsTotal: plan.goals.length, goalsAchieved: plan.goals.filter((g) => g.achieved).length,
      stepsTotal: plan.steps.length, stepsCompleted: plan.steps.filter((s) => s.completed).length,
    });
  }

  return { sleepMethods, sleepLocations, awakeningQuality, wakeupMood, latency, feeding, eventCorrelations, planProgress };
}

// ─── Score trend over time (daily score for one family) ───

export async function getFamilyScoreTrend(familyId: string, days = 14): Promise<{ date: string; score: number }[]> {
  const family = await getFamily(familyId);
  if (!family) return [];
  const supabase = await createClient();
  const end = new Date(); end.setHours(23, 59, 59, 999);
  const start = new Date(end); start.setDate(start.getDate() - days - 7);
  start.setHours(0, 0, 0, 0);

  const { data: recs } = await supabase.from("activity_records").select("type, started_at, ended_at, duration_minutes, details").eq("family_id", familyId).gte("started_at", start.toISOString()).lte("started_at", end.toISOString());
  if (!recs?.length) return [];

  const ageMonths = babyAgeMonths(family.baby_birth_date);
  const result: { date: string; score: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    const windowEnd = new Date(d); windowEnd.setHours(23, 59, 59, 999);
    const windowStart = new Date(d); windowStart.setDate(windowStart.getDate() - 6); windowStart.setHours(0, 0, 0, 0);
    const window = recs.filter((r) => new Date(r.started_at) >= windowStart && new Date(r.started_at) <= windowEnd);
    let sleepH = 0; let wakes = 0;
    for (const r of window) {
      if (r.type === "sleep") { sleepH += (r.duration_minutes || 0) / 60; const aw = (r.details as Record<string, unknown>)?.awakenings; if (typeof aw === "number") wakes += aw; }
      if (r.type === "wake" || r.type === "wakeup") wakes++;
    }
    result.push({ date: localDateKeyFromDate(d), score: sleepScore(sleepH / 7, wakes / 7, ageMonths) });
  }
  return result;
}

// ─── Portfolio score trend (avg across all families) ───

export async function getPortfolioScoreTrend(advisorId: string, days = 14): Promise<{ date: string; score: number; improving: number; worsening: number }[]> {
  const families = await getFamilies(advisorId);
  const active = families.filter((f) => f.status === "active");
  if (active.length === 0) return [];

  const supabase = await createClient();
  const end = new Date(); end.setHours(23, 59, 59, 999);
  const start = new Date(end); start.setDate(start.getDate() - days - 7);
  start.setHours(0, 0, 0, 0);
  const familyIds = active.map((f) => f.id);

  const { data: recs } = await supabase.from("activity_records").select("family_id, type, started_at, duration_minutes, details").in("family_id", familyIds).gte("started_at", start.toISOString()).lte("started_at", end.toISOString());
  if (!recs?.length) return [];

  const result: { date: string; score: number; improving: number; worsening: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    const windowEnd = new Date(d); windowEnd.setHours(23, 59, 59, 999);
    const windowStart = new Date(d); windowStart.setDate(windowStart.getDate() - 6); windowStart.setHours(0, 0, 0, 0);
    const prevWindowStart = new Date(windowStart); prevWindowStart.setDate(prevWindowStart.getDate() - 7);
    let totalScore = 0; let improving = 0; let worsening = 0;
    for (const f of active) {
      const window = recs.filter((r) => r.family_id === f.id && new Date(r.started_at) >= windowStart && new Date(r.started_at) <= windowEnd);
      const prevWindow = recs.filter((r) => r.family_id === f.id && new Date(r.started_at) >= prevWindowStart && new Date(r.started_at) < windowStart);
      const calcW = (w: typeof window) => {
        let sh = 0; let wk = 0;
        for (const r of w) { if (r.type === "sleep") { sh += (r.duration_minutes || 0) / 60; const aw = (r.details as Record<string, unknown>)?.awakenings; if (typeof aw === "number") wk += aw; } if (r.type === "wake" || r.type === "wakeup") wk++; }
        return sleepScore(sh / 7, wk / 7, babyAgeMonths(f.baby_birth_date));
      };
      const cs = calcW(window);
      const ps = calcW(prevWindow);
      totalScore += cs;
      if (cs - ps >= 0.5) improving++;
      if (cs - ps <= -0.5) worsening++;
    }
    result.push({ date: localDateKeyFromDate(d), score: Math.round((totalScore / active.length) * 10) / 10, improving, worsening });
  }
  return result;
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
    let napCount = 0;
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
          napCount += 1;
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
      nap_count: napCount,
      awakenings: totalAwakenings,
      total: Math.round((nightHours + napHours) * 10) / 10,
    });
  }

  return result;
}
