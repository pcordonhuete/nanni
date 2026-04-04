"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { ArrowLeft, Shield, Lock } from "lucide-react";
import Link from "next/link";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get("plan") as "basico" | "premium" | null;

  const fetchClientSecret = useCallback(async () => {
    if (!plan || !["basico", "premium"].includes(plan)) {
      throw new Error("Plan no válido");
    }

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.clientSecret;
  }, [plan]);

  if (!plan || !["basico", "premium"].includes(plan)) {
    router.replace("/plan");
    return null;
  }

  const planLabel = plan === "premium" ? "Premium" : "Básico";

  return (
    <div className="max-w-3xl mx-auto py-6 md:py-10">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/plan"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a planes
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
          Activar plan {planLabel}
        </h1>
        <p className="text-gray-500 mt-1">
          Completa el pago de forma segura. No saldrás de Nanni.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ fetchClientSecret }}
        >
          <EmbeddedCheckout className="min-h-[400px]" />
        </EmbeddedCheckoutProvider>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          Pago cifrado por Stripe
        </span>
        <span className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          Cancela cuando quieras
        </span>
      </div>
    </div>
  );
}
