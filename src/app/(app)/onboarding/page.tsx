"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Moon, ArrowRight, User, Palette, Users, Check, Sparkles } from "lucide-react";
import { updateProfile, updateBrand, createFamily } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";

const steps = [
  { id: 1, label: "Tu perfil", icon: User },
  { id: 2, label: "Tu marca", icon: Palette },
  { id: 3, label: "Primera familia", icon: Users },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  async function handleProfileSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.error) toast(result.error, "error");
      else setStep(2);
    });
  }

  async function handleBrandSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateBrand(formData);
      if (result.error) toast(result.error, "error");
      else setStep(3);
    });
  }

  async function handleFamilySubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createFamily(formData);
      if (result.error) toast(result.error, "error");
      else {
        toast("¡Todo listo! Bienvenida a Nanni");
        router.push("/dashboard");
      }
    });
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
              step > s.id ? "bg-emerald-500 text-white" :
              step === s.id ? "bg-violet-600 text-white" :
              "bg-gray-200 text-gray-500"
            }`}>
              {step > s.id ? <Check className="w-4 h-4" /> : s.id}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step === s.id ? "text-gray-900" : "text-gray-400"}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="w-12 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        {step === 1 && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                <User className="w-7 h-7 text-violet-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Cuéntanos sobre ti</h1>
              <p className="text-sm text-gray-400 mt-1">Para personalizar tu experiencia</p>
            </div>
            <form action={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nombre completo</label>
                <input
                  name="full_name"
                  type="text"
                  required
                  placeholder="Ej: María García López"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Teléfono</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="+34 612 345 678"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <button type="submit" disabled={isPending} className="w-full bg-violet-600 text-white font-medium py-2.5 rounded-xl hover:bg-violet-700 transition text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                Siguiente <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                <Palette className="w-7 h-7 text-violet-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Tu marca</h1>
              <p className="text-sm text-gray-400 mt-1">Las familias verán tu marca, no la nuestra</p>
            </div>
            <form action={handleBrandSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nombre de tu marca</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Ej: Dulces Sueños by María"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Color principal</label>
                <div className="flex gap-2">
                  {["#7C3AED", "#2563EB", "#DB2777", "#059669", "#EA580C"].map((c) => (
                    <label key={c} className="cursor-pointer">
                      <input type="radio" name="primary_color" value={c} className="sr-only peer" defaultChecked={c === "#7C3AED"} />
                      <div className="w-10 h-10 rounded-full border-2 border-gray-100 peer-checked:border-violet-500 peer-checked:ring-2 peer-checked:ring-violet-200 transition" style={{ backgroundColor: c }} />
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-200 transition text-sm">
                  Atrás
                </button>
                <button type="submit" disabled={isPending} className="flex-1 bg-violet-600 text-white font-medium py-2.5 rounded-xl hover:bg-violet-700 transition text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  Siguiente <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-violet-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Añade tu primera familia</h1>
              <p className="text-sm text-gray-400 mt-1">Podrás compartir el enlace con los padres después</p>
            </div>
            <form action={handleFamilySubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nombre del bebé</label>
                <input
                  name="baby_name"
                  type="text"
                  required
                  placeholder="Ej: Mateo"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Fecha de nacimiento</label>
                <input
                  name="baby_birth_date"
                  type="date"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-200 transition text-sm">
                  Atrás
                </button>
                <button type="submit" disabled={isPending} className="flex-1 bg-violet-600 text-white font-medium py-2.5 rounded-xl hover:bg-violet-700 transition text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  <Sparkles className="w-4 h-4" /> Empezar
                </button>
              </div>
            </form>
            <button onClick={() => router.push("/dashboard")} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-4 py-2 transition">
              Saltar por ahora
            </button>
          </>
        )}
      </div>
    </div>
  );
}
