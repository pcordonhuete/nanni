import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not set");
    _stripe = new Stripe(key, { apiVersion: "2025-03-31.basil" });
  }
  return _stripe;
}

export const stripe = {
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get webhooks() { return getStripe().webhooks; },
};

export const PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "",
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "",
  },
  clinica: {
    monthly: process.env.STRIPE_CLINICA_MONTHLY_PRICE_ID || "",
    yearly: process.env.STRIPE_CLINICA_YEARLY_PRICE_ID || "",
  },
};

export async function createCheckoutSession(
  advisorId: string,
  email: string,
  plan: "pro" | "clinica",
  billing: "monthly" | "yearly"
) {
  const priceId = PRICE_IDS[plan]?.[billing];
  if (!priceId) throw new Error("Invalid plan or billing period");

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/ajustes?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/ajustes`,
    metadata: { advisor_id: advisorId, plan },
  });

  return session;
}

export async function createPortalSession(customerId: string) {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/ajustes`,
  });
  return session;
}
