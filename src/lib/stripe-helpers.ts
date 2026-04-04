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

export const PRICE_IDS: Record<string, { monthly: string }> = {
  basico: {
    monthly: process.env.STRIPE_BASICO_MONTHLY_PRICE_ID || "",
  },
  premium: {
    monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || "",
  },
};

async function getOrCreateCustomer(
  advisorId: string,
  email: string,
  existingCustomerId?: string | null
): Promise<string> {
  const stripe = getStripe();

  if (existingCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(existingCustomerId);
      if (!customer.deleted) return existingCustomerId;
    } catch {
      // Customer no longer exists, create new one
    }
  }

  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { advisor_id: advisorId },
  });

  return customer.id;
}

export async function createCheckoutSession(
  advisorId: string,
  email: string,
  plan: "basico" | "premium",
  existingCustomerId?: string | null
) {
  const priceId = PRICE_IDS[plan]?.monthly;
  if (!priceId) throw new Error(`No price ID configured for plan "${plan}". Set STRIPE_${plan.toUpperCase()}_MONTHLY_PRICE_ID in your environment.`);

  const customerId = await getOrCreateCustomer(advisorId, email, existingCustomerId);
  const promoId = process.env.STRIPE_BIENVENIDA_PROMOTION_CODE_ID?.trim();
  const couponId = process.env.STRIPE_50_OFF_3_MONTHS_COUPON_ID?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const discounts = promoId
    ? [{ promotion_code: promoId }]
    : couponId
      ? [{ coupon: couponId }]
      : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ui_mode: "embedded" not yet in local Stripe types
  const session = await (getStripe().checkout.sessions.create as any)({
    mode: "subscription",
    ui_mode: "embedded",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    ...(discounts ? { discounts } : { allow_promotion_codes: true }),
    return_url: `${appUrl}/plan/checkout/resultado?session_id={CHECKOUT_SESSION_ID}`,
    metadata: { advisor_id: advisorId, plan },
    subscription_data: {
      metadata: { advisor_id: advisorId, plan },
    },
  });

  return session;
}

export async function createPortalSession(customerId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/ajustes`,
  });
  return session;
}

export async function cancelSubscription(subscriptionId: string) {
  return getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function resumeSubscription(subscriptionId: string) {
  return getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}
