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
        />
        <main className="lg:ml-64 pt-14 pb-20 lg:pt-0 lg:pb-0 min-h-screen">
          {isTrialing && (
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-center text-xs py-2 px-4">
              <span className="font-medium">
                Te quedan {daysLeft} día{daysLeft !== 1 ? "s" : ""} de prueba Premium
              </span>
              {" · "}
              <a href="/plan" className="underline font-bold hover:text-violet-200 transition">
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
