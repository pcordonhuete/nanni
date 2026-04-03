import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navigation from "@/components/app/Navigation";
import { ToastProvider } from "@/components/ui/Toast";
import { getNotifications, getUnreadNotificationCount, getFamilies, getSubscription } from "@/lib/db";
import type { SubscriptionPlan } from "@/lib/types";

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

  const plan: SubscriptionPlan = (subscription?.plan as SubscriptionPlan) || "starter";

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
        />
        <main className="lg:ml-64 pt-14 pb-20 lg:pt-0 lg:pb-0 min-h-screen">
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
