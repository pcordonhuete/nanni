import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe-helpers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { plan, billing } = await request.json();

  if (!["pro", "clinica"].includes(plan) || !["monthly", "yearly"].includes(billing)) {
    return NextResponse.json({ error: "Plan no válido" }, { status: 400 });
  }

  try {
    const session = await createCheckoutSession(
      user.id,
      user.email!,
      plan,
      billing
    );
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
