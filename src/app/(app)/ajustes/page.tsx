"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import {
  User, CreditCard, Bell, Users, Download, Shield, LogOut,
  ChevronRight, Crown, ArrowUpRight,
} from "lucide-react";
import type { Profile, Subscription } from "@/lib/types";
import { PLAN_LIMITS } from "@/lib/types";

const notifications = [
  { key: "new_record", label: "Nuevo registro de una familia", description: "Cuando una familia registra una actividad", enabled: true },
  { key: "family_inactive", label: "Familia sin registrar (24h)", description: "Alerta si una familia no registra en 24 horas", enabled: true },
  { key: "insight", label: "Insights IA disponibles", description: "Cuando la IA detecta un patrón nuevo", enabled: true },
  { key: "weekly", label: "Resumen semanal", description: "Informe resumido cada lunes", enabled: true },
];

const planNames: Record<string, string> = { starter: "Starter", pro: "Pro", clinica: "Clínica" };
const planPrices: Record<string, string> = { starter: "0€", pro: "29€/mes", clinica: "79€/mes" };

export default function AjustesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [familyCount, setFamilyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: prof }, { data: sub }, { count }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("subscriptions").select("*").eq("advisor_id", user.id).single(),
        supabase.from("families").select("*", { count: "exact", head: true }).eq("advisor_id", user.id).eq("status", "active"),
      ]);

      if (prof) setProfile(prof);
      if (sub) setSubscription(sub);
      setFamilyCount(count || 0);
      setLoading(false);
    }
    load();
  }, []);

  async function handleProfileSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.error) toast(result.error, "error");
      else toast("Perfil actualizado");
    });
  }

  async function handleUpgrade(plan: "pro" | "clinica") {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billing: "monthly" }),
      });
      const { url, error } = await res.json();
      if (error) { toast(error, "error"); return; }
      if (url) window.location.href = url;
    } catch {
      toast("Error al conectar con el sistema de pagos", "error");
    }
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

  const currentPlan = subscription?.plan || "starter";
  const limits = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Ajustes</h1>
        <p className="text-gray-400 mt-1 text-sm">Gestiona tu cuenta y preferencias</p>
      </div>

      {/* Profile */}
      <form action={handleProfileSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-violet-600" />
          <h2 className="font-bold text-gray-900">Perfil</h2>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-xl font-bold text-violet-700">
            {profile?.full_name?.split(" ").map((w) => w[0]).join("").slice(0, 2) || "??"}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nombre completo</label>
            <input
              name="full_name"
              type="text"
              defaultValue={profile?.full_name || ""}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
            <input
              type="email"
              value={profile?.email || ""}
              disabled
              className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Teléfono</label>
            <input
              name="phone"
              type="tel"
              defaultValue={profile?.phone || ""}
              placeholder="+34 612 345 678"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="mt-4 bg-violet-600 text-white font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-violet-700 transition disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>

      {/* Plan */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard className="w-5 h-5 text-violet-600" />
          <h2 className="font-bold text-gray-900">Plan y facturación</h2>
        </div>
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 text-white mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              <span className="font-bold text-lg">Plan {planNames[currentPlan]}</span>
            </div>
            <span className="text-violet-200 text-sm">{planPrices[currentPlan]}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-violet-200 text-xs">Familias</span>
              <p className="font-semibold">{familyCount} / {limits?.max_families === 999 ? "∞" : limits?.max_families}</p>
            </div>
            <div>
              <span className="text-violet-200 text-xs">IA</span>
              <p className="font-semibold">{limits?.ai ? "Activada" : "No incluida"}</p>
            </div>
          </div>
        </div>

        {currentPlan === "starter" && (
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleUpgrade("pro")}
              className="p-4 border border-violet-200 rounded-xl hover:bg-violet-50 transition text-left"
            >
              <p className="font-bold text-gray-900">Plan Pro — 29€/mes</p>
              <p className="text-xs text-gray-500 mt-1">Hasta 20 familias, IA, white-label, PDF</p>
              <span className="text-xs text-violet-600 font-medium mt-2 flex items-center gap-1">
                Upgrade <ArrowUpRight className="w-3 h-3" />
              </span>
            </button>
            <button
              onClick={() => handleUpgrade("clinica")}
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-left"
            >
              <p className="font-bold text-gray-900">Plan Clínica — 79€/mes</p>
              <p className="text-xs text-gray-500 mt-1">Familias ilimitadas, equipo, dominio propio</p>
              <span className="text-xs text-gray-600 font-medium mt-2 flex items-center gap-1">
                Upgrade <ArrowUpRight className="w-3 h-3" />
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-5 h-5 text-violet-600" />
          <h2 className="font-bold text-gray-900">Notificaciones</h2>
        </div>
        <div className="space-y-4">
          {notifications.map((n) => (
            <div key={n.key} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{n.label}</p>
                <p className="text-xs text-gray-400">{n.description}</p>
              </div>
              <button className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${n.enabled ? "bg-violet-600" : "bg-gray-200"}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${n.enabled ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Data export */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Download className="w-5 h-5 text-violet-600" />
          <h2 className="font-bold text-gray-900">Datos</h2>
        </div>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">Exportar todos los datos (CSV)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">Cambiar contraseña</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Sign out */}
      <div className="space-y-3 pb-8">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
        <button className="w-full text-center text-xs text-gray-400 hover:text-red-500 transition py-2">
          Eliminar mi cuenta
        </button>
      </div>
    </div>
  );
}
