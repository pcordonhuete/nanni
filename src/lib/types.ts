export type UserRole = "advisor" | "parent";

export type FamilyStatus = "active" | "paused" | "completed";

export type RecordType =
  | "sleep"
  | "feeding"
  | "wakeup"
  | "note"
  // legacy types (kept for backwards compat with existing records)
  | "feed"
  | "diaper"
  | "play"
  | "mood"
  | "wake";

export type PlanStatus = "draft" | "active" | "completed";

export type InsightType = "improvement" | "alert" | "pattern" | "recommendation";

export type NotificationType =
  | "new_record"
  | "family_inactive"
  | "insight"
  | "reminder"
  | "system";

export type SubscriptionPlan = "trial" | "basico" | "premium";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled"
  | "expired";

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
  parent_phone: string | null;
  parent_email: string | null;
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
  trial_ends_at: string;
  max_families: number;
  created_at: string;
  updated_at: string;
}

// ─── Record detail types (JSONB discriminated by RecordType) ───

export type RecordDetails =
  | SleepDetails
  | FeedingDetails
  | WakeupDetails
  | NoteDetails
  // legacy
  | FeedDetails
  | DiaperDetails
  | PlayDetails
  | MoodDetails
  | WakeDetails;

// ─── New detail types ───

export interface SleepDetails {
  sleep_type?: "night" | "nap";
  awakenings?: number;
  location?: "crib" | "cosleep" | "arms" | "stroller" | "car" | "other";
  fell_asleep_method?: "self" | "rocking" | "feeding" | "white_noise" | "other";
  latency_minutes?: number;
  notes?: string;
  recorded_by_name?: string;
  // legacy field
  fell_asleep_alone?: boolean;
}

export interface FeedingDetails {
  method: "breast" | "bottle" | "solids" | "mixed";
  description?: string;
  amount?: "little" | "normal" | "lots";
  notes?: string;
  recorded_by_name?: string;
}

export interface WakeupDetails {
  mood: "happy" | "neutral" | "cranky";
  needed_help?: boolean;
  notes?: string;
  recorded_by_name?: string;
}

export interface NoteDetails {
  text?: string;
  tags?: string[];
  recorded_by_name?: string;
}

// ─── Legacy detail types ───

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

export interface NotificationPreferences {
  id: string;
  advisor_id: string;
  new_record: boolean;
  family_inactive: boolean;
  insight: boolean;
  weekly_summary: boolean;
  created_at: string;
  updated_at: string;
}

export interface SleepPlanTemplate {
  id: string;
  advisor_id: string | null;
  is_system: boolean;
  title: string;
  description: string | null;
  method: string | null;
  age_min_months: number;
  age_max_months: number;
  goals: TemplateGoal[];
  steps: TemplateStep[];
  created_at: string;
}

export interface TemplateGoal {
  description: string;
  target_value: number | null;
  metric: string | null;
}

export interface TemplateStep {
  title: string;
  description: string | null;
  duration_days: number;
}

export interface IntakeTemplate {
  id: string;
  advisor_id: string;
  title: string;
  description: string | null;
  questions: IntakeQuestion[];
  is_active: boolean;
  created_at: string;
}

export interface IntakeQuestion {
  id: string;
  text: string;
  type: "text" | "select" | "number" | "boolean";
  options?: string[];
  required?: boolean;
}

export interface IntakeResponse {
  id: string;
  family_id: string;
  template_id: string | null;
  answers: Record<string, string | number | boolean>;
  submitted_at: string;
}

export interface WeeklySleepData {
  day: string;
  date: string;
  night_hours: number;
  nap_hours: number;
  awakenings: number;
  total: number;
}

// ─── Advanced analytics types ───

export interface PortfolioFamilyHealth {
  family: Family;
  ageMonths: number;
  score: number;
  prevScore: number;
  scoreDelta: number;
  trend: "improving" | "stable" | "worsening";
  avgSleepHours: number;
  avgAwakenings: number;
  lastRecordAt: string | null;
  lastRecordAgoHours: number;
  attentionReason: string | null;
  hasActivePlan: boolean;
}

export interface SleepMethodStats {
  self: number;
  rocking: number;
  feeding: number;
  white_noise: number;
  other: number;
  total: number;
}

export interface SleepLocationStats {
  crib: number;
  cosleep: number;
  arms: number;
  stroller: number;
  car: number;
  other: number;
  total: number;
}

export interface AwakeningQualityStats {
  withCrying: number;
  withoutCrying: number;
  total: number;
}

export interface WakeupMoodStats {
  happy: number;
  neutral: number;
  cranky: number;
  total: number;
}

export interface LatencyStats {
  current: number;
  previous: number;
  entries: number;
}

export interface FeedingMethodStats {
  breast: number;
  bottle: number;
  solids: number;
  mixed: number;
  total: number;
}

export interface FeedingAmountStats {
  little: number;
  normal: number;
  lots: number;
  total: number;
}

export interface FeedingAnalytics {
  methods: FeedingMethodStats;
  amounts: FeedingAmountStats;
  avgPerDay: number;
  byHour: { hour: number; count: number }[];
}

export interface EventSleepCorrelation {
  tag: string;
  label: string;
  count: number;
  avgSleepBefore: number;
  avgSleepAfter: number;
  avgAwakeningsBefore: number;
  avgAwakeningsAfter: number;
  sleepDelta: number;
  awakeningsDelta: number;
}

export interface PlanProgressData {
  planId: string;
  planTitle: string;
  planStatus: PlanStatus;
  startedAt: string;
  scoreBefore: number;
  scoreNow: number;
  scoreDelta: number;
  goalsTotal: number;
  goalsAchieved: number;
  stepsTotal: number;
  stepsCompleted: number;
}

export interface FamilyDeepAnalytics {
  sleepMethods: SleepMethodStats;
  sleepLocations: SleepLocationStats;
  awakeningQuality: AwakeningQualityStats;
  wakeupMood: WakeupMoodStats;
  latency: LatencyStats;
  feeding: FeedingAnalytics;
  eventCorrelations: EventSleepCorrelation[];
  planProgress: PlanProgressData[];
}

// ─── Plan limits per subscription ───

export const PLAN_LIMITS: Record<
  SubscriptionPlan,
  { max_families: number; ai: boolean; whitelabel: boolean; pdf: boolean; team: number }
> = {
  trial: { max_families: 999, ai: true, whitelabel: true, pdf: true, team: 1 },
  basico: { max_families: 10, ai: false, whitelabel: false, pdf: true, team: 1 },
  premium: { max_families: 999, ai: true, whitelabel: true, pdf: true, team: 5 },
};

export const PLAN_PRICES = {
  basico: { monthly: 49, discounted: 24.5, currency: "€" },
  premium: { monthly: 79, discounted: 39.5, currency: "€" },
} as const;

export function isTrialExpired(subscription: Subscription | null): boolean {
  if (!subscription) return true;
  if (subscription.status === "active") return false;
  if (subscription.status === "trialing") {
    return new Date(subscription.trial_ends_at) < new Date();
  }
  return true;
}

export function trialDaysLeft(subscription: Subscription | null): number {
  if (!subscription) return 0;
  const end = new Date(subscription.trial_ends_at);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
