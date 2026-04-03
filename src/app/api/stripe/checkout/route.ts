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

  try {
    const session = await createCheckoutSession(
      user.id,
      user.email!,
      plan,
    );
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
