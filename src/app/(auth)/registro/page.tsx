"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Moon, Loader2, Eye, EyeOff } from "lucide-react";

export default function RegistroPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push("/onboarding");
        router.refresh();
      } else if (data.user && !data.session) {
        setError("Revisa tu email para confirmar tu cuenta antes de iniciar sesión.");
        setLoading(false);
      } else {
        setError("No se pudo crear la sesión. Inténtalo de nuevo.");
        setLoading(false);
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-nanni-100 flex items-center justify-center mx-auto mb-4">
          <Moon className="w-7 h-7 text-nanni-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Crea tu cuenta</h1>
        <p className="text-gray-500 mt-1">
          14 días gratis de Premium, sin tarjeta. Empieza a recibir registros hoy.
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
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Nombre completo
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ana García López"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-nanni-500 focus:border-transparent transition text-gray-900 placeholder:text-gray-400"
          />
        </div>

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

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Contraseña
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
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-nanni-600 text-white font-semibold py-3 rounded-xl hover:bg-nanni-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            "Crear cuenta gratis"
          )}
        </button>

        <p className="text-xs text-center text-gray-400">
          Al registrarte aceptas nuestros{" "}
          <a href="/terminos" target="_blank" className="text-nanni-600 hover:underline">
            términos
          </a>{" "}
          y{" "}
          <a href="/privacidad" target="_blank" className="text-nanni-600 hover:underline">
            política de privacidad
          </a>
        </p>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="text-nanni-600 font-medium hover:text-nanni-700"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
