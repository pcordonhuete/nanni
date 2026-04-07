"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";
import { KeyRound, Loader2, CheckCircle } from "lucide-react";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/cambiar-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Email enviado
        </h1>
        <p className="text-gray-500 mt-2 max-w-sm mx-auto">
          Si existe una cuenta con{" "}
          <span className="font-medium text-gray-700">{email}</span>, recibirás
          un enlace para restablecer tu contraseña.
        </p>
        <Link
          href="/login"
          className="inline-block mt-8 text-nanni-600 font-medium hover:text-nanni-700"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-nanni-100 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-7 h-7 text-nanni-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Recupera tu contraseña
        </h1>
        <p className="text-gray-500 mt-1">
          Te enviaremos un enlace para restablecerla
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-5"
      >
        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-nanni-500 focus:border-transparent transition text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-nanni-600 text-white font-semibold py-3 rounded-xl hover:bg-nanni-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar enlace"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        <Link
          href="/login"
          className="text-nanni-600 font-medium hover:text-nanni-700"
        >
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
