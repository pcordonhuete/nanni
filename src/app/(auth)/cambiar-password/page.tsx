"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { KeyRound, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function CambiarPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 2000);
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Contraseña actualizada</h1>
        <p className="text-gray-500 mt-2">Redirigiendo a tu panel...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-nanni-100 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-7 h-7 text-nanni-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Nueva contraseña</h1>
        <p className="text-gray-500 mt-1">Elige tu nueva contraseña</p>
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-nanni-500 focus:border-transparent transition text-gray-900 placeholder:text-gray-400 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirmar contraseña
          </label>
          <input
            id="confirm"
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la contraseña"
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
              Actualizando...
            </>
          ) : (
            "Actualizar contraseña"
          )}
        </button>
      </form>
    </div>
  );
}
