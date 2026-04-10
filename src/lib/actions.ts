"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { RecordType, Relationship, RecordDetails } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getSupabaseAdmin(): Promise<SupabaseClient | null> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  const { createClient: createAdmin } = await import("@supabase/supabase-js");
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

async function verifyParentRecordAccess(
  admin: SupabaseClient,
  familyToken: string,
  recordId: string
): Promise<{ error: string } | { familyId: string }> {
  const { data: family } = await admin
    .from("families")
    .select("id")
    .eq("invite_token", familyToken)
    .single();

  if (!family) return { error: "Familia no encontrada" };

  const { data: row } = await admin
    .from("activity_records")
    .select("id")
    .eq("id", recordId)
    .eq("family_id", family.id)
    .maybeSingle();

  if (!row) return { error: "Registro no encontrado" };

  return { familyId: family.id };
}

const PARENT_RECORD_MUTATION_HINT =
  "Para editar o eliminar desde el portal de padres, ejecuta el SQL del archivo supabase/migration_parent_record_rpc.sql en Supabase (SQL Editor), o configura SUPABASE_SERVICE_ROLE_KEY en Vercel.";

function parentRpcFunctionMissing(error: { message?: string; code?: string } | null | undefined): boolean {
  const m = String(error?.message ?? "");
  return (
    m.includes("Could not find the function") ||
    (m.includes("function") && m.includes("does not exist")) ||
    error?.code === "PGRST202" ||
    error?.code === "42883"
  );
}

function mapParentRpcError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid_invite_token")) return "Familia no encontrada";
  if (m.includes("record_not_found")) return "Registro no encontrado";
  if (m.includes("invalid_type")) return "Tipo de registro no válido";
  return message;
}

// ─── Families ───

export async function createFamily(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const babyName = formData.get("baby_name") as string;
  const babyLastName = (formData.get("baby_last_name") as string) || "";
  const birthDate = formData.get("baby_birth_date") as string;
  const city = (formData.get("city") as string) || "";

  if (!babyName || !birthDate) return { error: "Nombre y fecha son obligatorios" };

  const { data, error } = await supabase
    .from("families")
    .insert({
      advisor_id: user.id,
      baby_name: babyName,
      baby_last_name: babyLastName.trim() || null,
      baby_birth_date: birthDate,
      city: city.trim() || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/familias");
  revalidatePath("/familias");
  return { data };
}

export async function updateFamily(familyId: string, formData: FormData) {
  const supabase = await createClient();
  const updates: Record<string, string | null> = {};

  const babyName = formData.get("baby_name") as string;
  const babyLastName = formData.get("baby_last_name") as string;
  const city = formData.get("city") as string;
  const status = formData.get("status") as string;
  if (babyName) updates.baby_name = babyName;
  if (babyLastName !== null) updates.baby_last_name = babyLastName || null;
  if (city !== null) updates.city = city || null;
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
  revalidatePath("/familias");
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

  // Map UI types to valid DB types (DB constraint only allows legacy names)
  const dbType = type === "feeding" ? "feed" : type === "wakeup" ? "wake" : type;

  const { data, error } = await supabase
    .from("activity_records")
    .insert({
      family_id: familyId,
      recorded_by: user?.id || null,
      type: dbType,
      started_at: startedAt,
      ended_at: endedAt,
      duration_minutes: durationMinutes,
      details: { ...(details as Record<string, unknown>), _ui_type: type },
    })
    .select()
    .single();

  if (error) return { error: error.message };

  if (user) {
    const { data: family } = await supabase
      .from("families")
      .select("advisor_id, baby_name")
      .eq("id", familyId)
      .single();

    if (family && family.advisor_id !== user.id) {
      const typeLabels: Record<string, string> = {
        sleep: "sueño", feeding: "cena", wakeup: "despertar", note: "nota",
        feed: "toma", diaper: "pañal", play: "juego", mood: "humor", wake: "despertar",
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
  revalidatePath("/familias");
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

  // Map UI types to valid DB types (DB constraint only allows legacy names)
  const dbType = type === "feeding" ? "feed" : type === "wakeup" ? "wake" : type;

  const { error } = await supabase
    .from("activity_records")
    .insert({
      family_id: family.id,
      recorded_by: null,
      type: dbType,
      started_at: startedAt,
      ended_at: endedAt,
      duration_minutes: durationMinutes,
      details: { ...details, recorded_by_name: parentName, _ui_type: type },
    });

  if (error) return { error: error.message };

  const typeLabels: Record<string, string> = {
    sleep: "sueño", feeding: "cena", wakeup: "despertar", note: "nota",
    feed: "toma", diaper: "pañal", play: "juego", mood: "humor", wake: "despertar",
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

  revalidatePath(`/familia/${family.id}`);
  revalidatePath("/familias");
  revalidatePath(`/p/${familyToken}`);
  return { success: true };
}

/**
 * Elimina un registro validando el token de la familia.
 * Preferencia: RPC en Supabase (migration_parent_record_rpc.sql). Alternativa: SUPABASE_SERVICE_ROLE_KEY.
 */
export async function deleteRecordFromParent(familyToken: string, recordId: string) {
  const supabase = await createClient();
  const { data: familyId, error } = await supabase.rpc("delete_activity_record_from_parent", {
    p_invite_token: familyToken,
    p_record_id: recordId,
  });

  if (!error && familyId) {
    revalidatePath(`/familia/${familyId}`);
    revalidatePath("/familias");
    revalidatePath(`/p/${familyToken}`);
    return { success: true };
  }

  if (error && !parentRpcFunctionMissing(error)) {
    return { error: mapParentRpcError(error.message) };
  }

  const admin = await getSupabaseAdmin();
  if (admin) {
    const access = await verifyParentRecordAccess(admin, familyToken, recordId);
    if ("error" in access) return { error: access.error };
    const { error: delErr } = await admin.from("activity_records").delete().eq("id", recordId);
    if (delErr) return { error: delErr.message };
    revalidatePath(`/familia/${access.familyId}`);
    revalidatePath("/familias");
    revalidatePath(`/p/${familyToken}`);
    return { success: true };
  }

  return { error: PARENT_RECORD_MUTATION_HINT };
}

/**
 * Actualiza un registro validando el token de la familia.
 * Preferencia: RPC en Supabase (migration_parent_record_rpc.sql). Alternativa: SUPABASE_SERVICE_ROLE_KEY.
 */
export async function updateRecordFromParent(
  familyToken: string,
  recordId: string,
  type: RecordType,
  startedAt: string,
  endedAt: string | null,
  durationMinutes: number | null,
  details: RecordDetails,
  parentName: string
) {
  const dbType = type === "feeding" ? "feed" : type === "wakeup" ? "wake" : type;

  const mergedDetails = {
    ...(details as Record<string, unknown>),
    recorded_by_name: parentName,
    _ui_type: type,
  };

  const supabase = await createClient();
  const { data: familyId, error } = await supabase.rpc("update_activity_record_from_parent", {
    p_invite_token: familyToken,
    p_record_id: recordId,
    p_type: dbType,
    p_started_at: startedAt,
    p_ended_at: endedAt,
    p_duration_minutes: durationMinutes,
    p_details: mergedDetails,
    p_parent_name: parentName,
  });

  if (!error && familyId) {
    revalidatePath(`/familia/${familyId}`);
    revalidatePath("/familias");
    revalidatePath(`/p/${familyToken}`);
    return { success: true };
  }

  if (error && !parentRpcFunctionMissing(error)) {
    return { error: mapParentRpcError(error.message) };
  }

  const admin = await getSupabaseAdmin();
  if (admin) {
    const access = await verifyParentRecordAccess(admin, familyToken, recordId);
    if ("error" in access) return { error: access.error };

    const { error: upErr } = await admin
      .from("activity_records")
      .update({
        type: dbType,
        started_at: startedAt,
        ended_at: endedAt,
        duration_minutes: durationMinutes,
        details: mergedDetails,
      })
      .eq("id", recordId);

    if (upErr) return { error: upErr.message };

    try {
      const { data: fam } = await admin
        .from("families")
        .select("advisor_id, baby_name")
        .eq("id", access.familyId)
        .single();
      if (fam) {
        const typeLabels: Record<string, string> = {
          sleep: "sueño", feeding: "cena", wakeup: "despertar", note: "nota",
          feed: "toma", diaper: "pañal", play: "juego", mood: "humor", wake: "despertar",
        };
        await admin.from("notifications").insert({
          user_id: fam.advisor_id,
          type: "new_record",
          title: `${parentName} actualizó ${typeLabels[type] || "registro"} de ${fam.baby_name}`,
          body: `Registro modificado`,
          link: `/familia/${access.familyId}`,
        });
      }
    } catch {
      // non-blocking
    }

    revalidatePath(`/familia/${access.familyId}`);
    revalidatePath("/familias");
    revalidatePath(`/p/${familyToken}`);
    return { success: true };
  }

  return { error: PARENT_RECORD_MUTATION_HINT };
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

// ─── Notification Preferences ───

export async function updateNotificationPreferences(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const prefs = {
    advisor_id: user.id,
    new_record: formData.get("new_record") === "true",
    family_inactive: formData.get("family_inactive") === "true",
    insight: formData.get("insight") === "true",
    weekly_summary: formData.get("weekly_summary") === "true",
  };

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(prefs, { onConflict: "advisor_id" });

  if (error) return { error: error.message };

  revalidatePath("/ajustes");
  return { success: true };
}

// ─── Sleep Plan Templates ───

export async function createPlanFromTemplate(
  familyId: string,
  templateId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: template } = await supabase
    .from("sleep_plan_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (!template) return { error: "Plantilla no encontrada" };

  const { data: plan, error: planError } = await supabase
    .from("sleep_plans")
    .insert({
      family_id: familyId,
      advisor_id: user.id,
      title: template.title,
      description: template.description,
      status: "draft",
    })
    .select()
    .single();

  if (planError || !plan) return { error: planError?.message || "Error creando plan" };

  const goals = (template.goals as { description: string; target_value?: number; metric?: string }[]) || [];
  for (const goal of goals) {
    await supabase.from("sleep_plan_goals").insert({
      plan_id: plan.id,
      description: goal.description,
      target_value: goal.target_value ?? null,
      metric: goal.metric ?? null,
    });
  }

  const steps = (template.steps as { title: string; description?: string; duration_days: number }[]) || [];
  for (let i = 0; i < steps.length; i++) {
    await supabase.from("sleep_plan_steps").insert({
      plan_id: plan.id,
      step_order: i + 1,
      title: steps[i].title,
      description: steps[i].description ?? null,
      duration_days: steps[i].duration_days,
    });
  }

  revalidatePath(`/familia/${familyId}`);
  return { success: true, planId: plan.id };
}

export async function createSleepPlanTemplate(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const method = formData.get("method") as string;

  if (!title) return { error: "Título obligatorio" };

  const { error } = await supabase.from("sleep_plan_templates").insert({
    advisor_id: user.id,
    is_system: false,
    title,
    description: description || null,
    method: method || null,
    goals: [],
    steps: [],
  });

  if (error) return { error: error.message };

  revalidatePath("/familias");
  return { success: true };
}

// ─── Bulk Family Actions ───

export async function bulkUpdateFamilyStatus(
  familyIds: string[],
  status: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("families")
    .update({ status })
    .in("id", familyIds);

  if (error) return { error: error.message };

  revalidatePath("/familias");
  revalidatePath("/familias");
  return { success: true };
}

// ─── Intake Questionnaires ───

export async function createIntakeTemplate(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const questionsRaw = formData.get("questions") as string;

  let questions = [];
  try {
    questions = JSON.parse(questionsRaw);
  } catch {
    return { error: "Formato de preguntas inválido" };
  }

  const { error } = await supabase.from("intake_templates").insert({
    advisor_id: user.id,
    title,
    description: description || null,
    questions,
  });

  if (error) return { error: error.message };

  revalidatePath("/ajustes");
  return { success: true };
}

export async function submitIntakeResponse(
  familyToken: string,
  templateId: string,
  answers: Record<string, string | number | boolean>
) {
  const supabase = await createClient();

  const { data: family } = await supabase
    .from("families")
    .select("id")
    .eq("invite_token", familyToken)
    .single();

  if (!family) return { error: "Familia no encontrada" };

  const { error } = await supabase.from("intake_responses").insert({
    family_id: family.id,
    template_id: templateId,
    answers,
  });

  if (error) return { error: error.message };
  return { success: true };
}

// ─── Password Change ───

export async function changePassword(newPassword: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { success: true };
}

// ─── Delete Account ───

export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  await supabase.from("profiles").delete().eq("id", user.id);

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    const { createClient: createAdmin } = await import("@supabase/supabase-js");
    const adminClient = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
    await adminClient.auth.admin.deleteUser(user.id);
  }

  await supabase.auth.signOut();
  return { success: true };
}

// ─── Family contact info ───

export async function updateFamilyContact(
  familyId: string,
  parentPhone: string | null,
  parentEmail: string | null
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("families")
    .update({ parent_phone: parentPhone, parent_email: parentEmail })
    .eq("id", familyId);

  if (error) return { error: error.message };
  revalidatePath(`/familia/${familyId}`);
  return { success: true };
}

// ─── Logo Upload ───

export async function uploadLogo(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const file = formData.get("logo") as File;
  if (!file || file.size === 0) return { error: "No se seleccionó archivo" };
  if (file.size > 2 * 1024 * 1024) return { error: "El archivo excede 2MB" };

  const ext = file.name.split(".").pop() || "png";
  const path = `logos/${user.id}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("brands")
    .upload(path, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage.from("brands").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("brands")
    .update({ logo_url: urlData.publicUrl })
    .eq("advisor_id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/marca");
  return { success: true, url: urlData.publicUrl };
}

// ─── CSV Export ───

export async function exportFamiliesCSV() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: families } = await supabase
    .from("families")
    .select("*")
    .eq("advisor_id", user.id)
    .order("created_at", { ascending: false });

  if (!families || families.length === 0) return { error: "No hay datos para exportar" };

  const headers = ["Nombre", "Apellidos", "Ciudad", "Fecha nacimiento", "Estado", "Teléfono", "Email", "Creado"];
  const rows = families.map((f) => [
    f.baby_name,
    f.baby_last_name || "",
    f.city || "",
    f.baby_birth_date,
    f.status,
    f.parent_phone || "",
    f.parent_email || "",
    f.created_at,
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((v: string) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return { success: true, csv };
}
