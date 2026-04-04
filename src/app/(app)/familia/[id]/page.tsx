import { notFound } from "next/navigation";
import {
  getFamilyWithStats, getTodayRecords, getWeeklySleep, getInsights,
  getNotes, getPlans, getPlanWithDetails, getSleepPlanTemplates,
} from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { createNote } from "@/lib/actions";
import { babyAgeLabel, formatTime, statusFromScore, babyAgeMonths } from "@/lib/utils";
import {
  FamilyDetailTabs, type PlanWithDetails, type TimelineEntry,
} from "./family-detail-tabs";
import type {
  ActivityRecord, FamilyMember, FeedDetails, DiaperDetails,
  PlayDetails, MoodDetails, NoteDetails, WakeDetails,
} from "@/lib/types";
import {
  Moon, Sun, Droplets, Baby, Activity, Smile, FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

async function createNoteFormAction(formData: FormData) {
  "use server";
  const familyId = formData.get("family_id") as string;
  const content = (formData.get("content") as string)?.trim();
  if (!familyId || !content) return;
  await createNote(familyId, content);
}

const RECORD_META: Record<ActivityRecord["type"], { icon: LucideIcon; label: string }> = {
  sleep: { icon: Moon, label: "Sueño" },
  wake: { icon: Sun, label: "Despertar" },
  feed: { icon: Droplets, label: "Toma" },
  diaper: { icon: Baby, label: "Pañal" },
  play: { icon: Activity, label: "Juego" },
  mood: { icon: Smile, label: "Humor" },
  note: { icon: FileText, label: "Nota" },
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
  const det = rec.details;

  switch (rec.type) {
    case "sleep": {
      const d = det as { location?: string; fell_asleep_alone?: boolean };
      const bits = [dur, d?.location, d?.fell_asleep_alone != null ? (d.fell_asleep_alone ? "Se durmió solo/a" : "Con ayuda") : ""].filter(Boolean);
      return bits.join(" · ") || "Registro de sueño";
    }
    case "feed": {
      const d = det as FeedDetails;
      const bits = [d?.food_description, d?.amount_ml != null ? `${d.amount_ml} ml` : "", d?.method].filter(Boolean);
      return [dur, ...bits].filter(Boolean).join(" · ") || "Toma";
    }
    case "diaper": {
      const d = det as DiaperDetails;
      return [d?.diaper_type, d?.color, d?.notes].filter(Boolean).join(" · ") || "Cambio de pañal";
    }
    case "play": {
      const d = det as PlayDetails;
      return [d?.activity, d?.location].filter(Boolean).join(" · ") || "Juego";
    }
    case "mood": {
      const d = det as MoodDetails;
      return d?.label || (d?.level != null ? `Nivel ${d.level}` : "Humor");
    }
    case "note": {
      const d = det as NoteDetails;
      return d?.text || "";
    }
    case "wake": {
      const d = det as WakeDetails;
      return d?.mood ? `Humor: ${d.mood}` : dur || "Despertar";
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
    const meta = RECORD_META[rec.type];
    return {
      id: rec.id,
      time: formatTime(rec.started_at),
      iconName: rec.type,
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

  const advisorName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Asesora";

  const [todayRecords, weeklySleep, insights, notes, plansRaw, templates] = await Promise.all([
    getTodayRecords(id),
    getWeeklySleep(id),
    getInsights(stats.advisor_id, { familyId: id }),
    getNotes(id),
    getPlans(id),
    getSleepPlanTemplates(stats.advisor_id),
  ]);

  const planDetails = await Promise.all(plansRaw.map((p) => getPlanWithDetails(p.id)));
  const plans: PlanWithDetails[] = planDetails.filter((p): p is PlanWithDetails => p != null);

  const timeline = buildTimeline(todayRecords, stats.members);
  const trend = weeklyTrendLabel(weeklySleep);
  const { label: statusLabel, color: statusColorClass } = statusFromScore(stats.score);
  const daysWithData = weeklySleep.filter((d) => d.total > 0 || d.awakenings > 0).length;
  const babyInitial = stats.baby_name.trim().charAt(0).toUpperCase() || "?";
  const sinceLabel = new Date(stats.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

  return (
    <FamilyDetailTabs
      familyId={stats.id}
      advisorId={stats.advisor_id}
      babyName={stats.baby_name}
      babyInitial={babyInitial}
      ageLabel={babyAgeLabel(stats.baby_birth_date)}
      ageMonths={babyAgeMonths(stats.baby_birth_date)}
      parentsLabel={parentsLabel(stats.members)}
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
      createNoteAction={createNoteFormAction}
    />
  );
}
