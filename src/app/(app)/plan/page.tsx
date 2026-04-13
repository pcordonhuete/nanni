"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import {
  Crown, Check, X, Sparkles, Shield, Clock, Star,
  Users, Brain, FileText, Palette, Zap, ArrowRight,
  TrendingUp, Heart, Lock,
} from "lucide-react";
import type { Subscription } from "@/lib/types";
import { PLAN_PRICES, trialDaysLeft } from "@/lib/types";

const testimonials = [
  {
    name: "María García",
    role: "Asesora de sueño infantil",
    text: "Nanni transformó mi consulta. Paso la mitad de tiempo en admin y mis familias están más comprometidas que nunca.",
    avatar: "MG",
  },
  {
    name: "Laura Sánchez",
    role: "Consultora certificada COCS",
    text: "La IA me ahorra 2h al día analizando patrones. Mis clientes notan la diferencia desde la primera semana.",
    avatar: "LS",
  },
];

const features = {
  basico: [
    { text: "Hasta 10 familias activas", included: true },
    { text: "App para padres (PWA)", included: true },
    { text: "Planes de sueño personalizados", included: true },
    { text: "Informes PDF", included: true },
    { text: "Soporte por email", included: true },
    { text: "Insights IA automáticos", included: false },
    { text: "Tu marca propia (white-label)", included: false },
    { text: "Equipo / multi-usuario", included: false },
  ],
  premium: [
    { text: "Familias ilimitadas", included: true },
    { text: "App para padres (PWA)", included: true },
    { text: "Planes de sueño personalizados", included: true },
    { text: "Informes PDF avanzados", included: true },
    { text: "Soporte prioritario", included: true },
    { text: "Insights IA automáticos", included: true },
    { text: "Tu marca propia (white-label)", included: true },
    { text: "Hasta 5 miembros de equipo", included: true },
  ],
};

function CountdownTimer({ trialEnds }: { trialEnds: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function calc() {
      const end = new Date(trialEnds).getTime();
      const now = Date.now();
      const diff = Math.max(0, end - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [trialEnds]);

  const expired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (expired) return null;

  return (
    <div className="flex items-center gap-3 text-sm">
      <Clock className="w-4 h-4 text-amber-500" />
      <span className="text-gray-600">Tu prueba termina en</span>
      <div className="flex gap-1.5">
        {[
          { val: timeLeft.days, label: "d" },
          { val: timeLeft.hours, label: "h" },
          { val: timeLeft.minutes, label: "m" },
          { val: timeLeft.seconds, label: "s" },
        ].map(({ val, label }) => (
          <span
            key={label}
            className="bg-gray-900 text-white font-mono text-xs font-bold px-2 py-1 rounded-md min-w-[32px] text-center"
          >
            {String(val).padStart(2, "0")}
            <span className="text-gray-400 ml-0.5">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function PlanPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("advisor_id", user.id)
        .single();
      if (data) setSubscription(data);
      setLoading(false);
    }
    load();
  }, []);

  function handleCheckout(plan: "basico" | "premium") {
    setCheckoutLoading(plan);
    router.push(`/plan/checkout?plan=${plan}`);
  }

  const daysLeft = trialDaysLeft(subscription);
  const trialActive = subscription?.status === "trialing" && daysLeft > 0;
  const isActive = subscription?.status === "active";
  const trialExpired = subscription !== null && !trialActive && !isActive;
  const noSubscription = subscription === null;
  const currentPlan = subscription?.plan;

  async function handlePortal() {
    setCheckoutLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const { url, error } = await res.json();
      if (error) { toast(error, "error"); setCheckoutLoading(null); return; }
      if (url) window.location.href = url;
    } catch {
      toast("Error al conectar con el sistema de pagos", "error");
      setCheckoutLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-nanni-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 md:py-8">
      {/* Trial banner */}
      {trialActive && subscription && (
        <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CountdownTimer trialEnds={subscription.trial_ends_at} />
          <p className="text-xs text-amber-700">
            Elige un plan antes de que termine para no perder tus datos
          </p>
        </div>
      )}

      {/* Active plan banner */}
      {isActive && subscription && (
        <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-800">Plan {currentPlan === "premium" ? "Premium" : "Básico"} activo</h3>
              <p className="text-emerald-600 text-sm">Tu suscripción está activa y al día</p>
            </div>
          </div>
          <button
            onClick={handlePortal}
            disabled={checkoutLoading !== null}
            className="bg-emerald-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            {checkoutLoading === "portal" ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Gestionar suscripción <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      )}

      {/* Expired state */}
      {trialExpired && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
          <Lock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h3 className="font-bold text-gray-800 text-lg">Tu periodo de prueba ha terminado</h3>
          <p className="text-gray-600 text-sm mt-1">
            Elige un plan para seguir ayudando a tus familias con Nanni
          </p>
        </div>
      )}

      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 bg-nanni-100 text-nanni-700 text-xs font-bold px-4 py-2 rounded-full mb-4 mx-auto max-w-xl">
          <span className="inline-flex items-center gap-2 justify-center">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            50% de descuento los 3 primeros meses
          </span>
          <span className="text-nanni-600/90 font-semibold text-[11px] sm:text-xs text-center sm:border-l sm:border-nanni-200 sm:pl-3">
            Código <span className="font-mono tracking-wide">BIENVENIDA</span> aplicado automáticamente al pagar
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
          Más tiempo asesorando, menos recopilando
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Tus familias registran desde el móvil, tú recibes datos limpios con análisis automático
        </p>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-5 mb-12">
        {/* Basico */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 relative">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Básico</h3>
            <p className="text-gray-400 text-sm">Para asesoras que empiezan</p>
          </div>
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-gray-900">
                {PLAN_PRICES.basico.discounted}€
              </span>
              <span className="text-gray-400 text-sm">/mes</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-400 line-through">
                {PLAN_PRICES.basico.monthly}€/mes
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                -50% 3 meses
              </span>
            </div>
          </div>
          <button
            onClick={() => isActive && currentPlan === "basico" ? handlePortal() : handleCheckout("basico")}
            disabled={checkoutLoading !== null}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 mb-6 ${
              isActive && currentPlan === "basico"
                ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            {checkoutLoading === "basico" ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isActive && currentPlan === "basico" ? (
              <><Check className="w-4 h-4" /> Plan actual</>
            ) : isActive ? (
              <>Cambiar a Básico</>
            ) : (
              <>Empezar con Básico <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
          <ul className="space-y-3">
            {features.basico.map((f) => (
              <li key={f.text} className="flex items-start gap-2.5 text-sm">
                {f.included ? (
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                )}
                <span className={f.included ? "text-gray-700" : "text-gray-400"}>
                  {f.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Premium */}
        <div className="bg-white rounded-2xl border-2 border-nanni-600 p-6 md:p-8 relative ring-4 ring-nanni-100">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="bg-nanni-600 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" /> Más popular
            </span>
          </div>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Premium</h3>
            <p className="text-gray-400 text-sm">Para asesoras que quieren crecer</p>
          </div>
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-nanni-700">
                {PLAN_PRICES.premium.discounted}€
              </span>
              <span className="text-gray-400 text-sm">/mes</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-400 line-through">
                {PLAN_PRICES.premium.monthly}€/mes
              </span>
              <span className="text-xs font-bold text-nanni-600 bg-nanni-50 px-2 py-0.5 rounded-full">
                -50% 3 meses
              </span>
            </div>
          </div>
          <button
            onClick={() => isActive && currentPlan === "premium" ? handlePortal() : handleCheckout("premium")}
            disabled={checkoutLoading !== null}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 mb-6 ${
              isActive && currentPlan === "premium"
                ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300 shadow-none"
                : "bg-nanni-600 text-white hover:bg-nanni-700 shadow-lg shadow-nanni-200"
            }`}
          >
            {checkoutLoading === "premium" ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isActive && currentPlan === "premium" ? (
              <><Check className="w-4 h-4" /> Plan actual</>
            ) : isActive ? (
              <>Upgrade a Premium <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>Empezar con Premium <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
          <ul className="space-y-3">
            {features.premium.map((f) => (
              <li key={f.text} className="flex items-start gap-2.5 text-sm">
                <Check className="w-4 h-4 text-nanni-600 mt-0.5 shrink-0" />
                <span className="text-gray-700 font-medium">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Value props */}
      <div className="grid sm:grid-cols-3 gap-5 mb-12">
        {[
          { icon: TrendingUp, title: "Familias más comprometidas", desc: "Registrar desde el móvil es tan fácil que las familias lo hacen sin que les persigas" },
          { icon: Brain, title: "IA que trabaja por ti", desc: "Análisis automático de patrones, alertas proactivas y recomendaciones basadas en datos" },
          { icon: Heart, title: "Tu imagen profesional", desc: "App con tu marca, informes profesionales y seguimiento en tiempo real" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-gray-50 rounded-2xl p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-nanni-100 flex items-center justify-center mx-auto mb-3">
              <Icon className="w-5 h-5 text-nanni-600" />
            </div>
            <h4 className="font-bold text-gray-900 text-sm mb-1">{title}</h4>
            <p className="text-xs text-gray-500">{desc}</p>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="mb-12">
        <h3 className="text-center text-lg font-bold text-gray-900 mb-6">
          Lo que dicen las asesoras
        </h3>
        <div className="grid sm:grid-cols-2 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-600 mb-4 italic">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-nanni-100 flex items-center justify-center text-xs font-bold text-nanni-700">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guarantee */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center mb-8">
        <Shield className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
        <h4 className="font-bold text-emerald-800 mb-1">Satisfacción garantizada</h4>
        <p className="text-sm text-emerald-700">
          Si no estás convencida en los primeros 30 días, te devolvemos el dinero. Sin preguntas.
        </p>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mb-8">
        <h3 className="text-center text-lg font-bold text-gray-900 mb-6">Preguntas frecuentes</h3>
        <div className="space-y-4">
          {[
            {
              q: "¿Pierdo mis datos si no elijo plan?",
              a: "No. Tus datos se conservan durante 30 días tras expirar la prueba. Al suscribirte, todo vuelve a estar disponible.",
            },
            {
              q: "¿Puedo cambiar de plan después?",
              a: "Sí, puedes upgrade o downgrade en cualquier momento desde Ajustes. El cambio se prorratea automáticamente.",
            },
            {
              q: "¿Cómo funciona el descuento del 50%?",
              a: "Al ir a pagar aplicamos automáticamente la promoción BIENVENIDA (50% los 3 primeros meses). No hace falta escribir el código. Después se aplica el precio normal y puedes cancelar cuando quieras.",
            },
            {
              q: "¿Necesito tarjeta para la prueba gratuita?",
              a: "No. La prueba de 14 días es sin compromiso y sin tarjeta de crédito.",
            },
          ].map(({ q, a }) => (
            <details key={q} className="bg-white rounded-xl border border-gray-100 p-4 group">
              <summary className="font-medium text-sm text-gray-900 cursor-pointer list-none flex items-center justify-between">
                {q}
                <Zap className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="text-sm text-gray-500 mt-2">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
