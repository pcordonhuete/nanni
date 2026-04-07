import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/dashboard",
  "/familias",
  "/familia",
  "/analiticas",
  "/marca",
  "/ajustes",
  "/onboarding",
  "/plan",
];

const PAYWALL_EXEMPT = ["/plan", "/ajustes", "/onboarding", "/api/stripe"];

const AUTH_PATHS = ["/login", "/registro"];
const RECOVERY_PATHS = ["/cambiar-password"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));
  const isAuth = AUTH_PATHS.includes(path);
  const isPaywallExempt = PAYWALL_EXEMPT.some((p) => path.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const isRecovery = RECOVERY_PATHS.some((p) => path.startsWith(p));
  if (isRecovery) return supabaseResponse;

  if (user && isAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (user && isProtected && !isPaywallExempt) {
    try {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("advisor_id", user.id)
        .single();

      if (sub) {
        const isActive = sub.status === "active";
        const isTrialing = sub.status === "trialing";
        const trialExpired = isTrialing && sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date();

        if (!isActive && (!isTrialing || trialExpired)) {
          const url = request.nextUrl.clone();
          url.pathname = "/plan";
          return NextResponse.redirect(url);
        }
      }
    } catch {
      // If query fails, allow through rather than blocking
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/familias/:path*",
    "/familia/:path*",
    "/analiticas/:path*",
    "/marca/:path*",
    "/ajustes/:path*",
    "/onboarding/:path*",
    "/plan/:path*",
    "/login",
    "/registro",
    "/cambiar-password",
  ],
};
