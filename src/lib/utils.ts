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
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://nanniapp.com";
  return `${base}/invite/${token}`;
}

export function parentAppUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://nanniapp.com";
  return `${base}/p/${token}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export interface AgeBenchmark {
  label: string;
  totalSleep: string;
  nightSleep: string;
  napSleep: string;
  naps: string;
  maxAwakenings: number;
  wakeWindow: string;
}

export function getAgeBenchmark(ageMonths: number): AgeBenchmark {
  if (ageMonths <= 1)
    return { label: "0-1 mes", totalSleep: "15-18h", nightSleep: "8-9h", napSleep: "7-9h", naps: "4-5", maxAwakenings: 4, wakeWindow: "45-60 min" };
  if (ageMonths <= 3)
    return { label: "1-3 meses", totalSleep: "14-17h", nightSleep: "9-10h", napSleep: "4-6h", naps: "3-5", maxAwakenings: 3, wakeWindow: "60-90 min" };
  if (ageMonths <= 6)
    return { label: "4-6 meses", totalSleep: "12-16h", nightSleep: "10-11h", napSleep: "3-4h", naps: "3", maxAwakenings: 2, wakeWindow: "1.5-2.5h" };
  if (ageMonths <= 9)
    return { label: "7-9 meses", totalSleep: "12-15h", nightSleep: "10-11h", napSleep: "2-3h", naps: "2", maxAwakenings: 1, wakeWindow: "2.5-3.5h" };
  if (ageMonths <= 12)
    return { label: "10-12 meses", totalSleep: "12-14h", nightSleep: "10-12h", napSleep: "2-3h", naps: "2", maxAwakenings: 1, wakeWindow: "3-4h" };
  if (ageMonths <= 18)
    return { label: "13-18 meses", totalSleep: "11-14h", nightSleep: "10-12h", napSleep: "1.5-2.5h", naps: "1-2", maxAwakenings: 0, wakeWindow: "4-5.5h" };
  if (ageMonths <= 24)
    return { label: "19-24 meses", totalSleep: "11-14h", nightSleep: "10-12h", napSleep: "1-2h", naps: "1", maxAwakenings: 0, wakeWindow: "5-6h" };
  return { label: "2-3 años", totalSleep: "10-13h", nightSleep: "10-12h", napSleep: "1-2h", naps: "0-1", maxAwakenings: 0, wakeWindow: "5.5-6h" };
}

export function scoreExplanation(score: number): string {
  if (score >= 8)
    return "Excelente. El sueño está alineado con los rangos recomendados para la edad y los despertares son mínimos.";
  if (score >= 6)
    return "Aceptable. El sueño se acerca a lo recomendado pero hay margen de mejora en duración o despertares.";
  if (score >= 4)
    return "Requiere atención. El sueño está por debajo de lo recomendado o los despertares son frecuentes.";
  return "Crítico. El sueño está significativamente por debajo de lo esperado para la edad. Se recomienda intervención activa.";
}

export function whatsappUrl(phone: string, message: string): string {
  const clean = phone.replace(/[^0-9+]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
