import { formatDistanceToNow, differenceInMonths, format } from "date-fns";
import { es } from "date-fns/locale";

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function babyAgeMonths(birthDate: string): number {
  return differenceInMonths(new Date(), new Date(birthDate));
}

export function babyAgeLabel(birthDate: string): string {
  const months = babyAgeMonths(birthDate);
  if (months < 1) return "recién nacido";
  return `${months} ${months === 1 ? "mes" : "meses"}`;
}

export function formatDate(date: string | Date, fmt = "d MMM yyyy"): string {
  return format(new Date(date), fmt, { locale: es });
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), "HH:mm");
}

export function formatDateLong(date: string | Date): string {
  return format(new Date(date), "EEEE, d 'de' MMMM", { locale: es });
}

export function sleepScore(
  sleepHours: number,
  awakenings: number,
  ageMonths: number
): number {
  const expectedSleep =
    ageMonths <= 3 ? 16 : ageMonths <= 6 ? 14.5 : ageMonths <= 12 ? 14 : 13;
  const sleepRatio = Math.min(sleepHours / expectedSleep, 1);
  const maxAwakenings = ageMonths <= 3 ? 4 : ageMonths <= 6 ? 3 : 2;
  const awakeningPenalty = Math.max(0, 1 - (awakenings - maxAwakenings) * 0.15);
  return Math.round(sleepRatio * awakeningPenalty * 10 * 10) / 10;
}

export function statusFromScore(score: number): {
  label: string;
  color: string;
} {
  if (score >= 8) return { label: "Mejorando", color: "bg-emerald-100 text-emerald-700" };
  if (score >= 6) return { label: "En proceso", color: "bg-amber-100 text-amber-700" };
  if (score >= 4) return { label: "Atención", color: "bg-red-100 text-red-700" };
  return { label: "Crítico", color: "bg-red-200 text-red-800" };
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function inviteUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/invite/${token}`;
}

export function parentAppUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/p/${token}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
