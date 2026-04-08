import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { babyAgeLabel, parentAppUrl } from "@/lib/utils";
import { Moon, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: family } = await supabase
    .from("families")
    .select("*")
    .eq("invite_token", token)
    .single();

  if (!family) notFound();

  const { data: brand } = await supabase
    .from("brands")
    .select("name, primary_color, logo_url")
    .eq("advisor_id", family.advisor_id)
    .single();

  const { data: advisor } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", family.advisor_id)
    .single();

  const primaryColor = brand?.primary_color || "#188d91";
  const brandName = brand?.name || "Nanni";
  const age = babyAgeLabel(family.baby_birth_date);
  const appUrl = parentAppUrl(token);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div
          className="p-8 text-center text-white"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Moon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold">{brandName}</h1>
          {advisor && (
            <p className="text-white/70 text-sm mt-1">{advisor.full_name}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-gray-500 text-sm mb-2">Te han invitado a registrar el diario de</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{family.baby_name}</h2>
          <p className="text-sm text-gray-400 mb-6">{age}</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3">
            {[
              "Registra sueño, tomas y rutinas en segundos",
              "Funciona sin conexión a internet",
              "Tu asesora recibe los datos automáticamente",
            ].map((text) => (
              <div key={text} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: primaryColor + "20" }}>
                  <svg className="w-3 h-3" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">{text}</span>
              </div>
            ))}
          </div>

          <Link
            href={appUrl}
            className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3.5 rounded-xl transition text-sm"
            style={{ backgroundColor: primaryColor }}
          >
            Empezar a registrar
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-[11px] text-gray-400 mt-4">
            Puedes instalar esta página como app en tu móvil para acceder más rápido.
          </p>
        </div>
      </div>
    </div>
  );
}
