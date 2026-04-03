import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ToastProvider } from "@/components/ui/Toast";

export default async function OnboardingLayout({
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

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        {children}
      </div>
    </ToastProvider>
  );
}
