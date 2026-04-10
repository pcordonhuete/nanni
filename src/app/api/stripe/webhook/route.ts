import { getStripe } from "@/lib/stripe-helpers";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

const PLAN_LIMITS: Record<string, number> = {
  basico: 10,
  premium: 999,
};

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const advisorId = session.metadata?.advisor_id;
        const plan = session.metadata?.plan || "basico";

        if (advisorId) {
          await supabase
            .from("subscriptions")
            .update({
              plan,
              status: "active",
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              max_families: PLAN_LIMITS[plan] || 10,
              current_period_start: new Date().toISOString(),
            })
            .eq("advisor_id", advisorId);

          await supabase.from("notifications").insert({
            user_id: advisorId,
            type: "system",
            title: "Suscripción activada",
            body: `Tu plan ${plan === "premium" ? "Premium" : "Básico"} está activo. ¡Bienvenida!`,
            link: "/familias",
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const advisorId = sub.metadata?.advisor_id;
        const subAny = sub as unknown as Record<string, number | string | boolean>;
        const periodStart = typeof subAny.current_period_start === "number" ? subAny.current_period_start : 0;
        const periodEnd = typeof subAny.current_period_end === "number" ? subAny.current_period_end : 0;

        const updates: Record<string, unknown> = {
          current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        };

        if (sub.status === "active") {
          updates.status = "active";
        } else if (sub.status === "past_due") {
          updates.status = "past_due";
        } else if (sub.status === "canceled" || sub.status === "unpaid") {
          updates.status = "cancelled";
        }

        if (sub.cancel_at_period_end) {
          updates.status = "active";
        }

        const plan = sub.metadata?.plan;
        if (plan && PLAN_LIMITS[plan]) {
          updates.plan = plan;
          updates.max_families = PLAN_LIMITS[plan];
        }

        await supabase
          .from("subscriptions")
          .update(updates)
          .eq("stripe_subscription_id", sub.id);

        if (advisorId && sub.cancel_at_period_end) {
          const endDate = periodEnd ? new Date(periodEnd * 1000).toLocaleDateString("es-ES") : "próximamente";
          await supabase.from("notifications").insert({
            user_id: advisorId,
            type: "system",
            title: "Suscripción cancelada",
            body: `Tu suscripción se cancelará el ${endDate}.`,
            link: "/ajustes",
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const advisorId = sub.metadata?.advisor_id;

        await supabase
          .from("subscriptions")
          .update({
            status: "expired",
            max_families: 0,
          })
          .eq("stripe_subscription_id", sub.id);

        if (advisorId) {
          await supabase.from("notifications").insert({
            user_id: advisorId,
            type: "system",
            title: "Suscripción expirada",
            body: "Tu suscripción ha terminado. Elige un nuevo plan para seguir usando Nanni.",
            link: "/plan",
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: sub } = await supabase
          .from("subscriptions")
          .select("advisor_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (sub) {
          await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_customer_id", customerId);

          await supabase.from("notifications").insert({
            user_id: sub.advisor_id,
            type: "system",
            title: "Pago fallido",
            body: "No hemos podido procesar tu pago. Actualiza tu método de pago para evitar la suspensión.",
            link: "/ajustes",
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (invoice.billing_reason === "subscription_cycle") {
          await supabase
            .from("subscriptions")
            .update({ status: "active" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }
    }
  } catch (err) {
    console.error("[Stripe Webhook] Error processing event:", event.type, err);
  }

  return NextResponse.json({ received: true });
}
