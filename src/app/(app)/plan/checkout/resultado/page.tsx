import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe-helpers";
import { CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) redirect("/plan");

  let status: string;
  try {
    const session = await getStripe().checkout.sessions.retrieve(session_id);
    status = session.status ?? "unknown";
  } catch {
    status = "error";
  }

  if (status === "complete") {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          ¡Suscripción activada!
        </h1>
        <p className="text-gray-500 mb-8">
          Tu plan ya está activo. Bienvenida a Nanni.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-nanni-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-nanni-700 transition text-sm"
        >
          Ir al dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-8 h-8 text-amber-600" />
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
        Pago no completado
      </h1>
      <p className="text-gray-500 mb-8">
        Algo salió mal o el pago fue cancelado. No se ha realizado ningún cargo.
      </p>
      <Link
        href="/plan"
        className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition text-sm"
      >
        Volver a intentar
      </Link>
    </div>
  );
}
