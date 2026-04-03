import { getStripe } from "@/lib/stripe-helpers";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

const PLAN_LIMITS: Record<string, number> = {
  basico: 10,
  premium: 999,
};

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();

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
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({
          status: sub.status === "active" ? "active" : "past_due",
          current_period_start: new Date((sub as unknown as Record<string, number>).current_period_start * 1000).toISOString(),
          current_period_end: new Date((sub as unknown as Record<string, number>).current_period_end * 1000).toISOString(),
        })
        .eq("stripe_subscription_id", sub.id);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({
          status: "expired",
          max_families: 0,
        })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
