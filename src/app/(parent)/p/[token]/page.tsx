import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { babyAgeLabel, formatTime, formatDateLong } from "@/lib/utils";
import { ParentApp } from "./parent-app";
import type { ActivityRecord } from "@/lib/types";

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayRecords } = await supabase
    .from("activity_records")
    .select("*")
    .eq("family_id", family.id)
    .gte("started_at", today.toISOString())
    .order("started_at", { ascending: true });

  return (
    <ParentApp
      family={family}
      brand={brand}
      token={token}
      initialRecords={todayRecords || []}
    />
  );
}
