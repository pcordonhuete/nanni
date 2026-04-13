"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateBrand, uploadLogo } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import {
  Moon, Palette, Upload, ExternalLink, Eye,
  CheckCircle, Calendar, Globe, Loader2,
  Droplets, Sun,
} from "lucide-react";
import type { Brand } from "@/lib/types";

const colorPresets = [
  { name: "Limpet Shell", primary: "#188d91" },
  { name: "Azul", primary: "#2563EB" },
  { name: "Rosa", primary: "#DB2777" },
  { name: "Violeta", primary: "#7C3AED" },
  { name: "Naranja", primary: "#EA580C" },
  { name: "Gris", primary: "#4B5563" },
];

export default function MarcaPage() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("brands")
        .select("*")
        .eq("advisor_id", user.id)
        .single();
      if (data) setBrand(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateBrand(formData);
      if (result.error) {
        toast(result.error, "error");
      } else {
        toast("Marca actualizada correctamente");
      }
    });
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mi marca</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Personaliza la experiencia de tus familias con tu imagen profesional
        </p>
      </div>

      <form action={handleSubmit}>
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Settings column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Logo */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
              <h2 className="font-bold text-gray-900 mb-1">Logo</h2>
              <p className="text-xs text-gray-400 mb-4">
                Se mostrará en la app de tus familias y en tu landing
              </p>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-nanni-100 border-2 border-dashed border-nanni-300 flex items-center justify-center overflow-hidden">
                  {brand?.logo_url ? (
                    <img src={brand.logo_url} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <Moon className="w-8 h-8 text-nanni-400" />
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingLogo(true);
                      const fd = new FormData();
                      fd.set("logo", file);
                      const result = await uploadLogo(fd);
                      setUploadingLogo(false);
                      if (result.error) {
                        toast(result.error, "error");
                      } else if (result.url) {
                        setBrand((prev) => prev ? { ...prev, logo_url: result.url! } : prev);
                        toast("Logo actualizado");
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingLogo}
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-nanni-600 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-nanni-700 transition mb-2 disabled:opacity-50"
                  >
                    {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingLogo ? "Subiendo..." : "Subir logo"}
                  </button>
                  <p className="text-[11px] text-gray-400">PNG, JPG o SVG. Máx 2MB</p>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
              <h2 className="font-bold text-gray-900 mb-1">Colores</h2>
              <p className="text-xs text-gray-400 mb-4">Elige el color principal de tu marca</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {colorPresets.map((c) => (
                  <label key={c.name} className="cursor-pointer">
                    <input type="radio" name="primary_color" value={c.primary} className="sr-only peer" defaultChecked={brand?.primary_color === c.primary} />
                    <div className="rounded-xl p-3 text-center transition border-2 border-gray-100 peer-checked:border-nanni-500 peer-checked:bg-nanni-50">
                      <div className="w-8 h-8 rounded-full mx-auto mb-1.5" style={{ backgroundColor: c.primary }} />
                      <span className="text-[10px] font-medium text-gray-600">{c.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Name & domain */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
              <h2 className="font-bold text-gray-900 mb-1">Nombre y dominio</h2>
              <p className="text-xs text-gray-400 mb-4">Configura cómo aparece tu marca</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nombre de tu marca</label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={brand?.name || ""}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Subdominio</label>
                  <div className="flex">
                    <input
                      name="subdomain"
                      type="text"
                      defaultValue={brand?.subdomain || ""}
                      placeholder="tu-marca"
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-l-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500 focus:border-transparent"
                    />
                    <span className="px-4 py-2.5 bg-gray-100 border border-l-0 border-gray-200 rounded-r-xl text-sm text-gray-400">.nanni.app</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Landing page */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
              <h2 className="font-bold text-gray-900 mb-1">Landing de captación</h2>
              <p className="text-xs text-gray-400 mb-4">Tu página pública donde las familias te encuentran</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Titular principal</label>
                  <input
                    name="headline"
                    type="text"
                    defaultValue={brand?.headline || ""}
                    placeholder="Ayudo a tu bebé a dormir mejor"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Descripción</label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={brand?.description || ""}
                    placeholder="Describe tu servicio..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Enlace de Calendly / agenda</label>
                  <input
                    name="calendly_url"
                    type="url"
                    defaultValue={brand?.calendly_url || ""}
                    placeholder="https://calendly.com/tu-usuario"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nanni-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="mt-4 w-full bg-nanni-600 text-white font-medium py-2.5 rounded-xl hover:bg-nanni-700 transition text-sm disabled:opacity-50"
              >
                {isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>

          {/* Preview column */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-8 space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-nanni-600" />
                Vista previa
              </h3>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: brand?.primary_color || "#188d91" }}>
                    <Moon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: brand?.primary_color || "#188d91" }}>
                      {brand?.name || "Tu Marca"}
                    </p>
                    <p className="text-[9px] text-gray-400">Asesora de sueño</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-400 text-center mb-2">Así ven la app tus familias</p>
                  <div className="space-y-2">
                    {[
                      { icon: Moon, label: "Siesta", bg: "bg-nanni-50", iconColor: "text-nanni-600" },
                      { icon: Droplets, label: "Alimentación", bg: "bg-amber-50", iconColor: "text-amber-500" },
                      { icon: Sun, label: "En curso...", bg: "bg-sky-50", iconColor: "text-sky-500" },
                    ].map((e) => (
                      <div key={e.label} className={`${e.bg} rounded-xl p-2.5 flex items-center gap-2`}>
                        <e.icon className={`w-4 h-4 ${e.iconColor}`} />
                        <span className="text-xs text-gray-700">{e.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {brand?.subdomain && (
                <p className="text-[10px] text-gray-400 text-center">
                  {brand.subdomain}.nanni.app
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
