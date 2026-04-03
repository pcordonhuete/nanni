export type UserRole = "advisor" | "parent";

export type FamilyStatus = "active" | "paused" | "completed";

export type RecordType =
  | "sleep"
  | "feed"
  | "diaper"
  | "play"
  | "mood"
  | "note"
  | "wake";

export type PlanStatus = "draft" | "active" | "completed";

export type InsightType = "improvement" | "alert" | "pattern" | "recommendation";

export type NotificationType =
  | "new_record"
  | "family_inactive"
  | "insight"
  | "reminder"
  | "system";

export type SubscriptionPlan = "starter" | "pro" | "clinica";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled";

export type Relationship = "mother" | "father" | "caregiver";

// ─── Database row types ───

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  advisor_id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string;
  headline: string | null;
  description: string | null;
  calendly_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  advisor_id: string;
  baby_name: string;
  baby_birth_date: string;
  status: FamilyStatus;
  invite_token: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  profile_id: string;
  name: string;
  relationship: Relationship;
  created_at: string;
}

export interface ActivityRecord {
  id: string;
  family_id: string;
  recorded_by: string | null;
  type: RecordType;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  details: RecordDetails;
  created_at: string;
}

export interface SleepPlan {
  id: string;
  family_id: string;
  advisor_id: string;
  title: string;
  description: string | null;
  status: PlanStatus;
  created_at: string;
  updated_at: string;
}

export interface SleepPlanGoal {
  id: string;
  plan_id: string;
  description: string;
  target_value: number | null;
  current_value: number | null;
  metric: string | null;
  achieved: boolean;
  created_at: string;
}

export interface SleepPlanStep {
  id: string;
  plan_id: string;
  step_order: number;
  title: string;
  description: string | null;
  duration_days: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface AdvisorNote {
  id: string;
  family_id: string;
  advisor_id: string;
  content: string;
  created_at: string;
}

export interface Insight {
  id: string;
  family_id: string;
  advisor_id: string;
  type: InsightType;
  title: string;
  description: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  advisor_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  max_families: number;
  created_at: string;
  updated_at: string;
}

// ─── Record detail types (JSONB discriminated by RecordType) ───

export type RecordDetails =
  | SleepDetails
  | FeedDetails
  | DiaperDetails
  | PlayDetails
  | MoodDetails
  | NoteDetails
  | WakeDetails;

export interface SleepDetails {
  location?: "crib" | "arms" | "stroller" | "cosleep" | "other";
  fell_asleep_alone?: boolean;
}

export interface FeedDetails {
  method?: "breast_left" | "breast_right" | "bottle" | "solids";
  amount_ml?: number;
  food_description?: string;
}

export interface DiaperDetails {
  diaper_type?: "wet" | "dirty" | "both";
  color?: string;
  notes?: string;
}

export interface PlayDetails {
  activity?: string;
  location?: string;
}

export interface MoodDetails {
  level?: 1 | 2 | 3 | 4 | 5;
  label?: string;
}

export interface NoteDetails {
  text?: string;
}

export interface WakeDetails {
  mood?: "happy" | "neutral" | "crying";
}

// ─── Computed/joined types used in the UI ───

export interface FamilyWithStats extends Family {
  baby_age_months: number;
  members: FamilyMember[];
  total_sleep_today: number;
  awakenings_last_night: number;
  last_record_at: string | null;
  score: number;
  status_label: string;
  active_plan: SleepPlan | null;
}

export interface DashboardStats {
  active_families: number;
  families_trend: number;
  records_today_pct: number;
  records_trend: number;
  families_needing_attention: number;
  attention_trend: number;
  avg_sleep_hours: number;
  sleep_trend: number;
}

export interface AgendaItem {
  id: string;
  time: string;
  title: string;
  type: "call" | "session" | "review" | "reminder";
  family_id?: string;
}

export interface WeeklySleepData {
  day: string;
  date: string;
  night_hours: number;
  nap_hours: number;
  awakenings: number;
  total: number;
}

// ─── Plan limits per subscription ───

export const PLAN_LIMITS: Record<
  SubscriptionPlan,
  { max_families: number; ai: boolean; whitelabel: boolean; pdf: boolean; team: number }
> = {
  starter: { max_families: 3, ai: false, whitelabel: false, pdf: false, team: 1 },
  pro: { max_families: 20, ai: true, whitelabel: true, pdf: true, team: 1 },
  clinica: { max_families: 999, ai: true, whitelabel: true, pdf: true, team: 5 },
};
