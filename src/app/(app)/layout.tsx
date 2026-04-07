import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navigation from "@/components/app/Navigation";
import { ToastProvider } from "@/components/ui/Toast";
import { getNotifications, getUnreadNotificationCount, getFamilies, getSubscription } from "@/lib/db";
import type { SubscriptionPlan } from "@/lib/types";
import { trialDaysLeft } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ensure profile + brand + subscription rows exist (trigger may not have fired)
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!existingProfile) {
    const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";
    await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email || "",
      full_name: fullName,
      role: "advisor",
    }, { onConflict: "id" });

    await supabase.from("brands").upsert({
      advisor_id: user.id,
      name: fullName,
    }, { onConflict: "advisor_id" });

    await supabase.from("subscriptions").upsert({
      advisor_id: user.id,
      plan: "trial",
      status: "trialing",
      max_families: 999,
    }, { onConflict: "advisor_id" });
  }

  const userName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";
  const userEmail = user.email || "";
  const userInitials = userName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const [notifications, unreadCount, families, subscription] = await Promise.all([
    getNotifications(user.id),
    getUnreadNotificationCount(user.id),
    getFamilies(user.id),
    getSubscription(user.id),
  ]);

  const plan: SubscriptionPlan = (subscription?.plan as SubscriptionPlan) || "trial";
  const daysLeft = trialDaysLeft(subscription);
  const isTrialing = subscription?.status === "trialing" && daysLeft > 0;
  const isDemo = userEmail === "demo@nanniapp.com";

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation
          userName={userName}
          userEmail={userEmail}
          userInitials={userInitials}
          notifications={notifications}
          unreadCount={unreadCount}
          families={families}
          plan={plan}
          trialDaysLeft={isTrialing ? daysLeft : undefined}
          isDemo={isDemo}
        />
        <main className="lg:ml-64 pt-14 pb-20 lg:pt-0 lg:pb-0 min-h-screen">
          {isDemo && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center text-xs py-2.5 px-4 flex items-center justify-center gap-2">
              <span className="font-bold">✨ Panel de demostración</span>
              <span className="opacity-90">— Datos ficticios con 8 familias y 30 días de registros</span>
              <a href="/registro" className="ml-2 underline font-bold hover:text-amber-100 transition">
                Crear mi cuenta real →
              </a>
            </div>
          )}
          {isTrialing && !isDemo && (
            <div className="bg-gradient-to-r from-nanni-600 to-nanni-600 text-white text-center text-xs py-2 px-4">
              <span className="font-medium">
                Te quedan {daysLeft} día{daysLeft !== 1 ? "s" : ""} de prueba Premium
              </span>
              {" · "}
              <a href="/plan" className="underline font-bold hover:text-nanni-200 transition">
                Elige tu plan
              </a>
            </div>
          )}
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
