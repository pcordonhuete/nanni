"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { RecordType, Relationship, RecordDetails } from "@/lib/types";

// ─── Families ───

export async function createFamily(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const babyName = formData.get("baby_name") as string;
  const birthDate = formData.get("baby_birth_date") as string;

  if (!babyName || !birthDate) return { error: "Nombre y fecha son obligatorios" };

  const { data, error } = await supabase
    .from("families")
    .insert({ advisor_id: user.id, baby_name: babyName, baby_birth_date: birthDate })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/familias");
  revalidatePath("/dashboard");
  return { data };
}

export async function updateFamily(familyId: string, formData: FormData) {
  const supabase = await createClient();
  const updates: Record<string, string> = {};

  const babyName = formData.get("baby_name") as string;
  const status = formData.get("status") as string;
  if (babyName) updates.baby_name = babyName;
  if (status) updates.status = status;

  const { error } = await supabase
    .from("families")
    .update(updates)
    .eq("id", familyId);

  if (error) return { error: error.message };

  revalidatePath(`/familia/${familyId}`);
  revalidatePath("/familias");
  return { success: true };
}

export async function deleteFamily(familyId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("families").delete().eq("id", familyId);

  if (error) return { error: error.message };

  revalidatePath("/familias");
  revalidatePath("/dashboard");
  return { success: true };
}

// ─── Family Members ───

export async function addFamilyMember(
  familyId: string,
  name: string,
  relationship: Relationship,
  profileId: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("family_members")
    .insert({ family_id: familyId, profile_id: profileId, name, relationship });

  if (error) return { error: error.message };

  revalidatePath(`/familia/${familyId}`);
  return { success: true };
}

// ─── Activity Records ───

export async function createRecord(
  familyId: string,
  type: RecordType,
  startedAt: string,
  endedAt: string | null,
  durationMinutes: number | null,
  details: RecordDetails
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("activity_records")
    .insert({
      family_id: familyId,
      recorded_by: user?.id || null,
      type,
      started_at: startedAt,
      ended_at: endedAt,
      duration_minutes: durationMinutes,
      details,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Create notification for the advisor
  if (user) {
    const { data: family } = await supabase
      .from("families")
      .select("advisor_id, baby_name")
      .eq("id", familyId)
      .single();

    if (family && family.advisor_id !== user.id) {
      const typeLabels: Record<string, string> = {
        sleep: "sueño", feed: "toma", diaper: "pañal",
        play: "juego", mood: "humor", note: "nota", wake: "despertar",
      };
      await supabase.from("notifications").insert({
        user_id: family.advisor_id,
        type: "new_record",
        title: `Nuevo registro de ${family.baby_name}`,
        body: `Se registró ${typeLabels[type] || type}`,
        link: `/familia/${familyId}`,
      });
    }
  }

  revalidatePath(`/familia/${familyId}`);
  revalidatePath("/dashboard");
  return { data };
}

export async function createRecordFromParent(
  familyToken: string,
  type: RecordType,
  startedAt: string,
  endedAt: string | null,
  durationMinutes: number | null,
  details: RecordDetails,
  parentName: string
) {
  const supabase = await createClient();

  const { data: family } = await supabase
    .from("families")
    .select("id, advisor_id, baby_name")
    .eq("invite_token", familyToken)
    .single();

  if (!family) return { error: "Familia no encontrada" };

  const { error } = await supabase
    .from("activity_records")
    .insert({
      family_id: family.id,
      recorded_by: null,
      type,
      started_at: startedAt,
      ended_at: endedAt,
      duration_minutes: durationMinutes,
      details: { ...details, recorded_by_name: parentName },
    });

  if (error) return { error: error.message };

  const typeLabels: Record<string, string> = {
    sleep: "sueño", feed: "toma", diaper: "pañal",
    play: "juego", mood: "humor", note: "nota", wake: "despertar",
  };

  try {
    await supabase.from("notifications").insert({
      user_id: family.advisor_id,
      type: "new_record",
      title: `${parentName} registró ${typeLabels[type]} de ${family.baby_name}`,
      body: `Nuevo registro de ${typeLabels[type]}`,
      link: `/familia/${family.id}`,
    });
  } catch {
    // Notification insert may fail for anon users — non-blocking
  }

  return { success: true };
}

// ─── Sleep Plans ───

export async function createPlan(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const familyId = formData.get("family_id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  const { data, error } = await supabase
    .from("sleep_plans")
    .insert({
      family_id: familyId,
      advisor_id: user.id,
      title,
      description: description || null,
      status: "draft",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/familia/${familyId}`);
  return { data };
}

export async function updatePlanStatus(planId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sleep_plans")
    .update({ status })
    .eq("id", planId);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}

export async function addPlanGoal(planId: string, formData: FormData) {
  const supabase = await createClient();
  const description = formData.get("description") as string;
  const targetValue = formData.get("target_value") as string;
  const metric = formData.get("metric") as string;

  const { error } = await supabase.from("sleep_plan_goals").insert({
    plan_id: planId,
    description,
    target_value: targetValue ? parseFloat(targetValue) : null,
    metric: metric || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function toggleGoal(goalId: string, achieved: boolean) {
  const supabase = await createClient();
  await supabase
    .from("sleep_plan_goals")
    .update({ achieved })
    .eq("id", goalId);
  revalidatePath("/");
}

export async function addPlanStep(planId: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const durationDays = parseInt(formData.get("duration_days") as string) || 7;

  const { data: existingSteps } = await supabase
    .from("sleep_plan_steps")
    .select("step_order")
    .eq("plan_id", planId)
    .order("step_order", { ascending: false })
    .limit(1);

  const nextOrder = existingSteps && existingSteps.length > 0
    ? existingSteps[0].step_order + 1
    : 1;

  const { error } = await supabase.from("sleep_plan_steps").insert({
    plan_id: planId,
    step_order: nextOrder,
    title,
    description: description || null,
    duration_days: durationDays,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function toggleStep(stepId: string, completed: boolean) {
  const supabase = await createClient();
  await supabase
    .from("sleep_plan_steps")
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq("id", stepId);
  revalidatePath("/");
}

// ─── Notes ───

export async function createNote(familyId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase.from("advisor_notes").insert({
    family_id: familyId,
    advisor_id: user.id,
    content,
  });

  if (error) return { error: error.message };

  revalidatePath(`/familia/${familyId}`);
  return { success: true };
}

// ─── Brand ───

export async function updateBrand(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const updates: Record<string, string | null> = {};
  const fields = [
    "name", "subdomain", "primary_color",
    "headline", "description", "calendly_url",
  ];
  for (const field of fields) {
    const value = formData.get(field) as string | null;
    if (value !== null) updates[field] = value || null;
  }

  const { error } = await supabase
    .from("brands")
    .update(updates)
    .eq("advisor_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/marca");
  return { success: true };
}

// ─── Profile ───

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const updates: Record<string, string> = {};
  const fullName = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;
  if (fullName) updates.full_name = fullName;
  if (phone !== undefined) updates.phone = phone;

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/ajustes");
  return { success: true };
}

// ─── Notifications ───

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  revalidatePath("/");
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
  revalidatePath("/");
}

// ─── Insights ───

export async function markInsightRead(insightId: string) {
  const supabase = await createClient();
  await supabase
    .from("insights")
    .update({ is_read: true })
    .eq("id", insightId);
  revalidatePath("/");
}

// ─── Invite flow ───

export async function acceptInvite(
  token: string,
  name: string,
  relationship: Relationship
) {
  const supabase = await createClient();

  const { data: family } = await supabase
    .from("families")
    .select("id")
    .eq("invite_token", token)
    .single();

  if (!family) return { error: "Invitación no válida" };

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("family_members").upsert({
      family_id: family.id,
      profile_id: user.id,
      name,
      relationship,
    }, { onConflict: "family_id,profile_id" });
  }

  return { success: true, familyId: family.id };
}
