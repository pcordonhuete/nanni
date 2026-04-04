import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe-helpers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { plan } = await request.json();

  if (!["basico", "premium"].includes(plan)) {
    return NextResponse.json({ error: "Plan no válido" }, { status: 400 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, status")
    .eq("advisor_id", user.id)
    .single();

  if (sub?.status === "active") {
    return NextResponse.json(
      { error: "Ya tienes una suscripción activa. Gestiona tu plan desde Ajustes." },
      { status: 400 }
    );
  }

  try {
    const session = await createCheckoutSession(
      user.id,
      user.email!,
      plan,
      sub?.stripe_customer_id,
    );
    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[Stripe Checkout]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
