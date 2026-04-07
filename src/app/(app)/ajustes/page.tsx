"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateNotificationPreferences, changePassword, deleteAccount, exportFamiliesCSV } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import {
  User, CreditCard, Bell, Download, Shield, LogOut,
  ChevronRight, Crown, ArrowUpRight, AlertTriangle, Key, Trash2,
  FileQuestion, Plus, X, Copy, Check,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { Profile, Subscription, NotificationPreferences, IntakeTemplate } from "@/lib/types";
import { PLAN_LIMITS } from "@/lib/types";

const NOTIF_CONFIG = [
  { key: "new_record" as const, label: "Nuevo registro de una familia", description: "Cuando una familia registra una actividad" },
  { key: "family_inactive" as const, label: "Familia sin registrar (24h)", description: "Alerta si una familia no registra en 24 horas" },
  { key: "insight" as const, label: "Insights IA disponibles", description: "Cuando la IA detecta un patrón nuevo" },
  { key: "weekly_summary" as const, label: "Resumen semanal", description: "Informe resumido cada lunes" },
];

const planNames: Record<string, string> = { trial: "Prueba gratuita", basico: "Básico", premium: "Premium" };
const planPrices: Record<string, string> = { trial: "0€ (14 días)", basico: "49€/mes", premium: "79€/mes" };

export default function AjustesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [familyCount, setFamilyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [intakeTemplates, setIntakeTemplates] = useState<IntakeTemplate[]>([]);
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [intakeTitle, setIntakeTitle] = useState("");
  const [intakeDescription, setIntakeDescription] = useState("");
  const [intakeQuestions, setIntakeQuestions] = useState<{ id: string; text: string; type: string; options?: string[] }[]>([]);
  const { toast } = useToast();

  const [authEmail, setAuthEmail] = useState<string>("");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setAuthEmail(user.email || "");

    const [{ data: prof }, { data: sub }, { count }, { data: prefs }, { data: intakes }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("subscriptions").select("*").eq("advisor_id", user.id).single(),
      supabase.from("families").select("*", { count: "exact", head: true }).eq("advisor_id", user.id).eq("status", "active"),
      supabase.from("notification_preferences").select("*").eq("advisor_id", user.id).single(),
      supabase.from("intake_templates").select("*").eq("advisor_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (prof) {
      setProfile(prof);
      setEditName(prof.full_name || "");
      setEditPhone(prof.phone || "");
    }
    if (sub) setSubscription(sub);
    setFamilyCount(count || 0);
    if (prefs) setNotifPrefs(prefs);
    if (intakes) setIntakeTemplates(intakes as IntakeTemplate[]);
    setLoading(false);
  }

  async function handleProfileSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast("No autenticado", "error"); setSaving(false); return; }

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: editName, phone: editPhone || null })
        .eq("id", user.id);

      if (error) {
        toast(error.message, "error");
      } else {
        toast("Perfil actualizado");
        setProfile((prev) => prev ? { ...prev, full_name: editName, phone: editPhone || null } : prev);
      }
    } catch {
      toast("Error al guardar", "error");
    }
    setSaving(false);
  }

  function handleNotifToggle(key: keyof Pick<NotificationPreferences, "new_record" | "family_inactive" | "insight" | "weekly_summary">) {
    const current = notifPrefs?.[key] ?? true;
    const updated = { ...notifPrefs, [key]: !current } as NotificationPreferences;
    setNotifPrefs(updated);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("new_record", String(updated.new_record ?? true));
      formData.set("family_inactive", String(updated.family_inactive ?? true));
      formData.set("insight", String(updated.insight ?? true));
      formData.set("weekly_summary", String(updated.weekly_summary ?? true));
      const result = await updateNotificationPreferences(formData);
      if (result.error) {
        toast(result.error, "error");
        setNotifPrefs({ ...notifPrefs, [key]: current } as NotificationPreferences);
      }
    });
  }

  async function handlePasswordChange() {
    if (newPassword.length < 6) { toast("La contraseña debe tener al menos 6 caracteres", "error"); return; }
    if (newPassword !== confirmPassword) { toast("Las contraseñas no coinciden", "error"); return; }
    startTransition(async () => {
      const result = await changePassword(newPassword);
      if (result.error) toast(result.error, "error");
      else {
        toast("Contraseña actualizada");
        setShowPasswordModal(false);
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  }

  async function handleDeleteAccount() {
    startTransition(async () => {
      const result = await deleteAccount();
      if (result.error) toast(result.error, "error");
      else window.location.href = "/";
    });
  }

  async function handleExportCSV() {
    startTransition(async () => {
      const result = await exportFamiliesCSV();
      if (result.error) { toast(result.error, "error"); return; }
      if (result.csv) {
        const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nanni-familias-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast("Datos exportados correctamente");
      }
    });
  }

  async function handleManageSubscription() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const { url, error } = await res.json();
        if (error) { toast(error, "error"); return; }
        if (url) window.location.href = url;
      } catch {
        toast("Error al conectar con el sistema de pagos", "error");
      }
    });
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan || "trial";
  const limits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Ajustes</h1>
        <p className="text-gray-400 mt-1 text-sm">Gestiona tu cuenta y preferencias</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-nanni-600" />
          <h2 className="font-bold text-gray-900">Perfil</h2>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-nanni-100 flex items-center justify-center text-xl font-bold text-nanni-700">
            {profile?.full_name?.split(" ").map((w) => w[0]).join("").slice(0, 2) || "??"}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nombre completo</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500 focus:border-transparent" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
            <input type="email" value={authEmail || profile?.email || ""} disabled className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Teléfono</label>
            <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+34 612 345 678" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500 focus:border-transparent" />
          </div>
        </div>
        <button type="button" onClick={handleProfileSave} disabled={saving} className="mt-4 bg-nanni-600 text-white font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-nanni-700 transition disabled:opacity-50">
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard className="w-5 h-5 text-nanni-600" />
          <h2 className="font-bold text-gray-900">Plan y facturación</h2>
        </div>
        <div className="bg-gradient-to-r from-nanni-600 to-nanni-600 rounded-2xl p-5 text-white mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              <span className="font-bold text-lg">Plan {planNames[currentPlan]}</span>
            </div>
            <span className="text-nanni-200 text-sm">{planPrices[currentPlan]}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-nanni-200 text-xs">Familias</span>
              <p className="font-semibold">{familyCount} / {limits?.max_families === 999 ? "∞" : limits?.max_families}</p>
            </div>
            <div>
              <span className="text-nanni-200 text-xs">IA</span>
              <p className="font-semibold">{limits?.ai ? "Activada" : "No incluida"}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {(currentPlan === "trial" || currentPlan === "basico") && (
            <a href="/plan" className="inline-flex items-center gap-2 text-sm font-medium text-nanni-600 hover:text-nanni-800 transition bg-nanni-50 px-4 py-2 rounded-xl hover:bg-nanni-100">
              {currentPlan === "trial" ? "Elige tu plan" : "Upgrade a Premium"}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
          {subscription?.stripe_customer_id && (
            <button
              onClick={handleManageSubscription}
              disabled={isPending}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition bg-gray-100 px-4 py-2 rounded-xl hover:bg-gray-200 disabled:opacity-50"
            >
              {isPending ? "Cargando..." : "Gestionar suscripción"}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-5 h-5 text-nanni-600" />
          <h2 className="font-bold text-gray-900">Notificaciones</h2>
        </div>
        <div className="space-y-4">
          {NOTIF_CONFIG.map((n) => {
            const enabled = notifPrefs?.[n.key] ?? true;
            return (
              <div key={n.key} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{n.label}</p>
                  <p className="text-xs text-gray-400">{n.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotifToggle(n.key)}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${enabled ? "bg-nanni-600" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-nanni-600" />
            <h2 className="font-bold text-gray-900">Cuestionario de inicio</h2>
          </div>
          <button onClick={() => setShowIntakeForm(true)} className="text-xs font-medium text-nanni-600 hover:text-nanni-700 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Crear</button>
        </div>
        <p className="text-xs text-gray-400 mb-4">Crea un cuestionario que los padres rellenarán al unirse. La URL de acceso es: /intake/[token-de-la-familia]</p>
        {intakeTemplates.length === 0 ? (
          <p className="text-sm text-gray-400">No tienes cuestionarios. Crea uno para conocer mejor a las familias desde el primer día.</p>
        ) : (
          <div className="space-y-2">
            {intakeTemplates.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.title}</p>
                  <p className="text-xs text-gray-400">{(t.questions || []).length} preguntas · {t.is_active ? "Activo" : "Inactivo"}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {t.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showIntakeForm && (
        <Modal onClose={() => setShowIntakeForm(false)}>
          <div className="p-6 max-w-md mx-auto space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Nuevo cuestionario de inicio</h3>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Título</label>
              <input value={intakeTitle} onChange={(e) => setIntakeTitle(e.target.value)} placeholder="Ej: Cuestionario inicial de sueño" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Descripción</label>
              <input value={intakeDescription} onChange={(e) => setIntakeDescription(e.target.value)} placeholder="Breve descripción para los padres" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Preguntas</label>
                <button type="button" onClick={() => setIntakeQuestions((prev) => [...prev, { id: crypto.randomUUID(), text: "", type: "text" }])} className="text-xs text-nanni-600 font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Añadir</button>
              </div>
              {intakeQuestions.length === 0 && <p className="text-xs text-gray-400">Añade preguntas para el cuestionario.</p>}
              <div className="space-y-2">
                {intakeQuestions.map((q, i) => (
                  <div key={q.id} className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl">
                    <span className="text-xs text-gray-400 mt-2.5">{i + 1}.</span>
                    <div className="flex-1 space-y-2">
                      <input value={q.text} onChange={(e) => setIntakeQuestions((prev) => prev.map((p) => p.id === q.id ? { ...p, text: e.target.value } : p))} placeholder="Texto de la pregunta" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                      <select value={q.type} onChange={(e) => setIntakeQuestions((prev) => prev.map((p) => p.id === q.id ? { ...p, type: e.target.value } : p))} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs">
                        <option value="text">Texto libre</option>
                        <option value="number">Número</option>
                        <option value="boolean">Sí / No</option>
                        <option value="select">Selección</option>
                      </select>
                      {q.type === "select" && (
                        <input value={(q.options || []).join(", ")} onChange={(e) => setIntakeQuestions((prev) => prev.map((p) => p.id === q.id ? { ...p, options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) } : p))} placeholder="Opciones separadas por coma" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
                      )}
                    </div>
                    <button onClick={() => setIntakeQuestions((prev) => prev.filter((p) => p.id !== q.id))} className="text-gray-400 hover:text-red-500 mt-2"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                if (!intakeTitle || intakeQuestions.length === 0) { toast("Añade título y al menos una pregunta", "error"); return; }
                startTransition(async () => {
                  const formData = new FormData();
                  formData.set("title", intakeTitle);
                  formData.set("description", intakeDescription);
                  formData.set("questions", JSON.stringify(intakeQuestions.map((q) => ({ id: q.id, text: q.text, type: q.type, options: q.options, required: true }))));
                  const { createIntakeTemplate } = await import("@/lib/actions");
                  const result = await createIntakeTemplate(formData);
                  if (result.error) toast(result.error, "error");
                  else {
                    toast("Cuestionario creado");
                    setShowIntakeForm(false);
                    setIntakeTitle("");
                    setIntakeDescription("");
                    setIntakeQuestions([]);
                    const supabase = createClient();
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      const { data: intakes } = await supabase.from("intake_templates").select("*").eq("advisor_id", user.id).order("created_at", { ascending: false });
                      if (intakes) setIntakeTemplates(intakes as IntakeTemplate[]);
                    }
                  }
                });
              }}
              disabled={isPending}
              className="w-full bg-nanni-600 text-white font-medium py-2.5 rounded-xl hover:bg-nanni-700 transition text-sm disabled:opacity-50"
            >
              {isPending ? "Creando..." : "Crear cuestionario"}
            </button>
          </div>
        </Modal>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Download className="w-5 h-5 text-nanni-600" />
          <h2 className="font-bold text-gray-900">Datos y seguridad</h2>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleExportCSV}
            disabled={isPending}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">Exportar todos los datos (CSV)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
          >
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">Cambiar contraseña</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="space-y-3 pb-8">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full text-center text-xs text-gray-400 hover:text-red-500 transition py-2"
        >
          Eliminar mi cuenta
        </button>
      </div>

      {showPasswordModal && (
        <Modal onClose={() => setShowPasswordModal(false)}>
          <div className="p-6 max-w-sm mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-nanni-600" />
              <h3 className="font-bold text-gray-900">Cambiar contraseña</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nueva contraseña</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} placeholder="Mínimo 6 caracteres" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Confirmar contraseña</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite la contraseña" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500" />
              </div>
              <button onClick={handlePasswordChange} disabled={isPending} className="w-full bg-nanni-600 text-white font-medium py-2.5 rounded-xl hover:bg-nanni-700 transition text-sm disabled:opacity-50">
                {isPending ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <div className="p-6 max-w-sm mx-auto text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Eliminar cuenta</h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción es irreversible. Se borrarán todos tus datos, familias, planes e insights.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={handleDeleteAccount} disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-50">
                {isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
