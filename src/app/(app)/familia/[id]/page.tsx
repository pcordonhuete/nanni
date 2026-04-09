import { notFound } from "next/navigation";
import {
  getFamilyWithStats, getTodayRecords, getWeeklySleep, getInsights,
  getNotes, getPlans, getPlanWithDetails, getSleepPlanTemplates,
  getFamilyDeepAnalytics, getFamilyScoreTrend,
} from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { createNote } from "@/lib/actions";
import { babyAgeLabel, formatTime, statusFromScore, babyAgeMonths } from "@/lib/utils";
import {
  FamilyDetailTabs, type PlanWithDetails, type TimelineEntry,
} from "./family-detail-tabs";
import type { ActivityRecord, FamilyMember, FamilyDeepAnalytics } from "@/lib/types";
import {
  Moon, Sun, Droplets, Baby, Activity, Smile, FileText, UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

async function createNoteFormAction(formData: FormData) {
  "use server";
  const familyId = formData.get("family_id") as string;
  const content = (formData.get("content") as string)?.trim();
  if (!familyId || !content) return;
  await createNote(familyId, content);
}

const RECORD_META: Record<string, { icon: LucideIcon; label: string }> = {
  sleep: { icon: Moon, label: "Sueño" },
  feeding: { icon: UtensilsCrossed, label: "Cena" },
  wakeup: { icon: Sun, label: "Despertar" },
  note: { icon: FileText, label: "Nota" },
  wake: { icon: Sun, label: "Despertar" },
  feed: { icon: Droplets, label: "Toma" },
  diaper: { icon: Baby, label: "Pañal" },
  play: { icon: Activity, label: "Juego" },
  mood: { icon: Smile, label: "Humor" },
};

function formatDurationMinutes(mins: number | null): string {
  if (mins == null || mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

function buildRecordDetail(rec: ActivityRecord): string {
  const dur = formatDurationMinutes(rec.duration_minutes);
  const det = rec.details as Record<string, unknown>;
  const displayType = (det?._ui_type as string) || rec.type;

  switch (displayType) {
    case "sleep": {
      const locLabels: Record<string, string> = { crib: "Cuna", cosleep: "Colecho", arms: "Brazos", stroller: "Carrito", car: "Coche" };
      const methodLabels: Record<string, string> = { self: "Solo/a", rocking: "Meciendo", feeding: "Pecho/biberón", white_noise: "Ruido blanco" };
      const st = det?.sleep_type as string | undefined;
      const bits: string[] = [];
      if (st === "night") bits.push("Nocturno");
      else if (st === "nap") bits.push("Siesta");
      bits.push(dur);
      if (rec.ended_at) bits.push(`→ ${formatTime(rec.ended_at)}`);
      const aw = det?.awakenings as number | undefined;
      if (typeof aw === "number" && aw > 0) bits.push(`${aw} despertares`);
      const loc = det?.location as string;
      if (loc && locLabels[loc]) bits.push(locLabels[loc]);
      const meth = det?.fell_asleep_method as string;
      if (meth && methodLabels[meth]) bits.push(methodLabels[meth]);
      if (det?.fell_asleep_alone != null) bits.push(det.fell_asleep_alone ? "Solo/a" : "Con ayuda");
      const lat = det?.latency_minutes as number | undefined;
      if (typeof lat === "number") bits.push(`Latencia ~${lat}min`);
      return bits.filter(Boolean).join(" · ") || "Sueño";
    }
    case "feeding": {
      const mLabels: Record<string, string> = { breast: "Pecho", bottle: "Biberón", solids: "Sólidos", mixed: "Mixto" };
      const aLabels: Record<string, string> = { little: "Poco", normal: "Normal", lots: "Mucho" };
      const fm = det?.method as string;
      const fa = det?.amount as string;
      return [fm && mLabels[fm], det?.description as string, fa && aLabels[fa]].filter(Boolean).join(" · ") || "Cena";
    }
    case "wakeup": {
      const moods: Record<string, string> = { happy: "😊 Contento", neutral: "😐 Neutro", cranky: "😫 Malhumorado" };
      const wm = det?.mood as string;
      return [wm && moods[wm], det?.needed_help ? "Necesitó ayuda" : ""].filter(Boolean).join(" · ") || "Despertar";
    }
    case "feed": {
      const bits = [det?.food_description as string, det?.amount_ml != null ? `${det.amount_ml} ml` : "", det?.method as string].filter(Boolean);
      return [dur, ...bits].filter(Boolean).join(" · ") || "Toma";
    }
    case "diaper": {
      return [det?.diaper_type as string, det?.color as string, det?.notes as string].filter(Boolean).join(" · ") || "Pañal";
    }
    case "play": {
      return [det?.activity as string, det?.location as string].filter(Boolean).join(" · ") || "Juego";
    }
    case "mood": {
      return (det?.label as string) || (det?.level != null ? `Nivel ${det.level}` : "Humor");
    }
    case "note": {
      const tagLabels: Record<string, string> = { teething: "🦷", vaccine: "💉", fever: "🤒", travel: "✈️", routine_change: "🔄" };
      const tags = (det?.tags as string[] | undefined)?.map((t: string) => tagLabels[t] || t).join(" ") || "";
      return [tags, det?.text as string].filter(Boolean).join(" · ") || "";
    }
    case "wake": {
      const moods: Record<string, string> = { happy: "😊 Contento", neutral: "😐 Neutro", crying: "😫 Llorando" };
      const wakeMood = det?.mood as string;
      return wakeMood ? moods[wakeMood] : dur || "Despertar";
    }
    default:
      return dur;
  }
}

function registrarLabel(rec: ActivityRecord, memberByProfile: Map<string, string>): string {
  const fromDetails = rec.details && typeof rec.details === "object" && "recorded_by_name" in rec.details && typeof (rec.details as { recorded_by_name?: unknown }).recorded_by_name === "string"
    ? (rec.details as { recorded_by_name: string }).recorded_by_name : null;
  if (fromDetails) return fromDetails;
  if (rec.recorded_by && memberByProfile.has(rec.recorded_by)) return memberByProfile.get(rec.recorded_by)!;
  return "Familia";
}

function buildTimeline(records: ActivityRecord[], members: FamilyMember[]): TimelineEntry[] {
  const memberByProfile = new Map(members.map((m) => [m.profile_id, m.name]));
  const sorted = [...records].sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
  return sorted.map((rec) => {
    const det = rec.details as Record<string, unknown>;
    const displayType = (det?._ui_type as string) || rec.type;
    const meta = RECORD_META[displayType] || RECORD_META[rec.type] || { label: rec.type };
    return {
      id: rec.id,
      time: formatTime(rec.started_at),
      iconName: displayType,
      label: meta.label,
      detail: buildRecordDetail(rec),
      by: registrarLabel(rec, memberByProfile),
      type: rec.type,
    };
  });
}

function weeklyTrendLabel(weekly: { awakenings: number; total: number }[]): { label: string; positive: boolean } {
  if (weekly.length < 2) return { label: "Sin tendencia", positive: true };
  const mid = Math.floor(weekly.length / 2) || 1;
  const first = weekly.slice(0, mid);
  const second = weekly.slice(mid);
  const a1 = first.reduce((s, d) => s + d.awakenings, 0) / Math.max(first.length, 1);
  const a2 = second.reduce((s, d) => s + d.awakenings, 0) / Math.max(second.length, 1);
  const diff = a2 - a1;
  if (Math.abs(diff) < 0.35) return { label: "Estable", positive: true };
  if (diff < 0) return { label: "Despertares a la baja", positive: true };
  return { label: "Despertares al alza", positive: false };
}

function parentsLabel(members: FamilyMember[]): string {
  const names = members.filter((m) => ["mother", "father", "caregiver"].includes(m.relationship)).map((m) => m.name);
  if (names.length === 0) return "Sin padres vinculados";
  return names.join(" · ");
}

export default async function FamiliaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const stats = await getFamilyWithStats(id);
  if (!stats) notFound();
  if (stats.advisor_id !== user.id) notFound();

  const advisorName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Asesora";

  const [todayRecords, weeklySleep, insights, notes, plansRaw, templates, deepAnalytics, scoreTrend] = await Promise.all([
    getTodayRecords(id),
    getWeeklySleep(id),
    getInsights(stats.advisor_id, { familyId: id }),
    getNotes(id),
    getPlans(id),
    getSleepPlanTemplates(stats.advisor_id),
    getFamilyDeepAnalytics(id, 14),
    getFamilyScoreTrend(id, 14),
  ]);

  const planDetails = await Promise.all(plansRaw.map((p) => getPlanWithDetails(p.id)));
  const plans: PlanWithDetails[] = planDetails.filter((p): p is PlanWithDetails => p != null);

  const timeline = buildTimeline(todayRecords, stats.members);
  const trend = weeklyTrendLabel(weeklySleep);
  const { label: statusLabel, color: statusColorClass } = statusFromScore(stats.score);
  const daysWithData = weeklySleep.filter((d) => d.total > 0 || d.awakenings > 0).length;
  const babyInitial = stats.baby_name.trim().charAt(0).toUpperCase() || "?";
  const babyFullName = [stats.baby_name, stats.baby_last_name].filter(Boolean).join(" ");
  const sinceLabel = new Date(stats.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

  return (
    <FamilyDetailTabs
      familyId={stats.id}
      advisorId={stats.advisor_id}
      babyName={babyFullName}
      babyInitial={babyInitial}
      ageLabel={babyAgeLabel(stats.baby_birth_date)}
      ageMonths={babyAgeMonths(stats.baby_birth_date)}
      parentsLabel={parentsLabel(stats.members)}
      city={stats.city}
      sinceLabel={sinceLabel}
      statusLabel={statusLabel}
      statusColorClass={statusColorClass}
      familyStatus={stats.status}
      totalSleepToday={stats.total_sleep_today}
      awakeningsLastNight={stats.awakenings_last_night}
      score={stats.score}
      trendLabel={trend.label}
      trendPositive={trend.positive}
      weeklySleep={weeklySleep}
      daysWithData={daysWithData}
      timeline={timeline}
      insights={insights}
      notes={notes}
      plans={plans}
      inviteToken={stats.invite_token}
      parentPhone={stats.parent_phone}
      parentEmail={stats.parent_email}
      templates={templates}
      advisorName={advisorName}
      deepAnalytics={deepAnalytics}
      scoreTrend={scoreTrend}
      createNoteAction={createNoteFormAction}
    />
  );
}
