"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { joinFamilyByToken } from "@/lib/actions";
import { Loader2, Eye, EyeOff } from "lucide-react";
import type { Relationship } from "@/lib/types";

const RELATIONSHIPS: { value: Relationship; label: string }[] = [
  { value: "mother", label: "Madre" },
  { value: "father", label: "Padre" },
  { value: "caregiver", label: "Cuidador/a" },
];

interface InviteAuthProps {
  token: string;
  babyName: string;
  primaryColor: string;
}

export function InviteAuth({ token, babyName, primaryColor }: InviteAuthProps) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [relationship, setRelationship] = useState<Relationship>("mother");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, role: "parent" } },
    });

    if (authError) { setError(authError.message); setLoading(false); return; }

    if (!data.session) {
      setSuccess("Revisa tu email para confirmar tu cuenta. Después vuelve a este enlace e inicia sesión.");
      setLoading(false);
      return;
    }

    const result = await joinFamilyByToken(token, name, relationship);
    if (result.error) { setError(result.error); setLoading(false); return; }

    router.push("/p");
    router.refresh();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message === "Invalid login credentials"
        ? "Email o contraseña incorrectos"
        : authError.message);
      setLoading(false);
      return;
    }

    const result = await joinFamilyByToken(token, name || email.split("@")[0], relationship);
    if (result.error && result.error !== "Invitación no válida") {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/p");
    router.refresh();
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
        <p className="text-sm text-emerald-800 font-medium">{success}</p>
        <button onClick={() => { setSuccess(""); setMode("login"); }}
          className="text-xs font-medium mt-3 underline" style={{ color: primaryColor }}>
          Ya he confirmado, iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab toggle */}
      <div className="flex rounded-xl bg-gray-100 p-1">
        {(["register", "login"] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setError(""); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              mode === m ? "bg-white shadow-sm text-gray-900" : "text-gray-400"
            }`}>
            {m === "register" ? "Crear cuenta" : "Ya tengo cuenta"}
          </button>
        ))}
      </div>

      <form onSubmit={mode === "register" ? handleRegister : handleLogin} className="space-y-3">
        {mode === "register" && (
          <>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tu nombre</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Ana"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": primaryColor } as React.CSSProperties} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Relación con {babyName}</label>
              <div className="flex gap-2">
                {RELATIONSHIPS.map((r) => (
                  <button key={r.value} type="button" onClick={() => setRelationship(r.value)}
                    className={`flex-1 py-2 text-xs font-medium rounded-xl border-2 transition ${
                      relationship === r.value
                        ? "bg-white shadow-sm text-gray-900"
                        : "border-transparent bg-gray-50 text-gray-400"
                    }`}
                    style={relationship === r.value ? { borderColor: primaryColor, color: primaryColor } : undefined}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ "--tw-ring-color": primaryColor } as React.CSSProperties} />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Contraseña</label>
          <div className="relative">
            <input type={showPw ? "text" : "password"} required value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Tu contraseña"}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent pr-10"
              style={{ "--tw-ring-color": primaryColor } as React.CSSProperties} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
        )}

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl transition text-sm disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {mode === "register" ? "Crear cuenta y empezar" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
