"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Moon, Loader2 } from "lucide-react";

const DEMO_EMAIL = "demo@nanniapp.com";
const DEMO_PASSWORD = "demo123456";

export default function DemoPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    async function autoLogin() {
      const supabase = createClient();

      // Sign out any current session first
      await supabase.auth.signOut();

      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });

      if (error) {
        setError("No se pudo acceder a la demo. Inténtalo de nuevo.");
        return;
      }

      router.push("/familias");
      router.refresh();
    }

    autoLogin();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-nanni-50 to-white flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-nanni-600 flex items-center justify-center mx-auto mb-6">
          <Moon className="w-8 h-8 text-white" />
        </div>

        {error ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-nanni-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-nanni-700 transition"
            >
              Reintentar
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Accediendo al panel de demostración
            </h1>
            <p className="text-gray-500 mb-6">
              Cargando datos de ejemplo...
            </p>
            <Loader2 className="w-6 h-6 animate-spin text-nanni-600 mx-auto" />
          </>
        )}
      </div>
    </div>
  );
}
