import { createClient } from "@/lib/supabase/server";
import { createPortalSession } from "@/lib/stripe-helpers";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("advisor_id", user.id)
    .single();

  if (!sub?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No tienes una suscripción activa con Stripe" },
      { status: 400 }
    );
  }

  try {
    const session = await createPortalSession(sub.stripe_customer_id);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[Stripe Portal]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
