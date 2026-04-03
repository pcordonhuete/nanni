"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Moon, Sun, Droplets, Baby, Smile, FileText, Activity,
  Plus, X, Clock, ChevronDown,
} from "lucide-react";
import { createRecordFromParent } from "@/lib/actions";
import { formatTime, babyAgeLabel, cn } from "@/lib/utils";
import type { Family, Brand, ActivityRecord, RecordType } from "@/lib/types";

interface ParentAppProps {
  family: Family;
  brand: Brand | null;
  token: string;
  initialRecords: ActivityRecord[];
}

const recordTypes = [
  { type: "sleep" as const, label: "Sueño", icon: Moon, color: "bg-violet-100 text-violet-600" },
  { type: "feed" as const, label: "Toma", icon: Droplets, color: "bg-sky-100 text-sky-600" },
  { type: "wake" as const, label: "Despertar", icon: Sun, color: "bg-amber-100 text-amber-600" },
  { type: "mood" as const, label: "Humor", icon: Smile, color: "bg-rose-100 text-rose-500" },
  { type: "play" as const, label: "Juego", icon: Activity, color: "bg-emerald-100 text-emerald-600" },
  { type: "note" as const, label: "Nota", icon: FileText, color: "bg-gray-100 text-gray-600" },
];

const typeEmojis: Record<string, string> = {
  sleep: "😴", feed: "🍼", wake: "☀️", mood: "😊",
  play: "🧸", note: "📝", diaper: "💩",
};

export function ParentApp({ family, brand, token, initialRecords }: ParentAppProps) {
  const [records, setRecords] = useState<ActivityRecord[]>(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<RecordType>("sleep");
  const [isPending, startTransition] = useTransition();
  const [parentName, setParentName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`nanni_parent_${token}`) || "";
    }
    return "";
  });
  const [showNamePrompt, setShowNamePrompt] = useState(!parentName);

  const router = useRouter();
  const primaryColor = brand?.primary_color || "#7C3AED";
  const brandName = brand?.name || "Nanni";
  const age = babyAgeLabel(family.baby_birth_date);

  function saveName(name: string) {
    setParentName(name);
    setShowNamePrompt(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(`nanni_parent_${token}`, name);
    }
  }

  async function handleSubmit(formData: FormData) {
    const startedAt = formData.get("started_at") as string;
    const durationStr = formData.get("duration_minutes") as string;
    const durationMinutes = durationStr ? parseInt(durationStr) : null;
    const noteText = formData.get("note_text") as string;

    const details: Record<string, unknown> = {};
    if (selectedType === "sleep") {
      details.location = formData.get("location") || "crib";
    }
    if (selectedType === "feed") {
      details.method = formData.get("method") || "breast_left";
    }
    if (selectedType === "mood") {
      details.level = parseInt(formData.get("mood_level") as string) || 3;
    }
    if (selectedType === "note") {
      details.text = noteText;
    }

    const endedAt = durationMinutes && startedAt
      ? new Date(new Date(startedAt).getTime() + durationMinutes * 60000).toISOString()
      : null;

    startTransition(async () => {
      const result = await createRecordFromParent(
        token,
        selectedType,
        startedAt || new Date().toISOString(),
        endedAt,
        durationMinutes,
        details,
        parentName
      );
      if (!result.error) {
        setShowForm(false);
        router.refresh();
      }
    });
  }

  if (showNamePrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: primaryColor + "20" }}
          >
            <Moon className="w-7 h-7" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{brandName}</h1>
          <p className="text-sm text-gray-500 mb-6">
            Diario de <strong>{family.baby_name}</strong>
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value;
              if (name.trim()) saveName(name.trim());
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block text-left">
                Tu nombre
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="Ej: Ana"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
              />
            </div>
            <button
              type="submit"
              className="w-full text-white font-medium py-3 rounded-xl transition text-sm"
              style={{ backgroundColor: primaryColor }}
            >
              Empezar a registrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <Moon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: primaryColor }}>
                {brandName}
              </p>
              <p className="text-[10px] text-gray-400">
                {family.baby_name} · {age}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400">{parentName}</p>
        </div>
      </header>

      {/* Timeline */}
      <main className="flex-1 px-4 py-4 space-y-2 pb-24">
        <h2 className="text-sm font-bold text-gray-900 mb-3">
          Hoy, {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        </h2>

        {records.length === 0 ? (
          <div className="text-center py-12">
            <Moon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Aún no hay registros hoy.</p>
            <p className="text-xs text-gray-400 mt-1">Toca el + para añadir el primer registro.</p>
          </div>
        ) : (
          records.map((r) => {
            const emoji = typeEmojis[r.type] || "📋";
            const labels: Record<string, string> = {
              sleep: "Sueño", feed: "Toma", wake: "Despertar",
              mood: "Humor", play: "Juego", note: "Nota", diaper: "Pañal",
            };
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm"
              >
                <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-base border border-gray-100 shrink-0">
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{labels[r.type]}</p>
                    <span className="text-[10px] text-gray-400">{formatTime(r.started_at)}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {r.duration_minutes ? `${r.duration_minutes} min` : ""}
                    {(r.details as Record<string, unknown>)?.text ? String((r.details as Record<string, unknown>).text) : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Quick add buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex gap-2">
            {recordTypes.slice(0, 4).map((rt) => (
              <button
                key={rt.type}
                onClick={() => { setSelectedType(rt.type); setShowForm(true); }}
                className={`flex-1 ${rt.color} rounded-xl py-2.5 flex flex-col items-center gap-1`}
              >
                <rt.icon className="w-4 h-4" />
                <span className="text-[9px] font-medium">{rt.label}</span>
              </button>
            ))}
            <button
              onClick={() => setShowForm(true)}
              className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2.5 flex flex-col items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[9px] font-medium">Más</span>
            </button>
          </div>
        </div>
      </div>

      {/* Record form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Nuevo registro</h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={handleSubmit} className="p-4 space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-3 gap-2">
                {recordTypes.map((rt) => (
                  <button
                    key={rt.type}
                    type="button"
                    onClick={() => setSelectedType(rt.type)}
                    className={cn(
                      "rounded-xl p-3 flex flex-col items-center gap-1.5 border-2 transition",
                      selectedType === rt.type
                        ? "border-violet-500 bg-violet-50"
                        : "border-gray-100 hover:border-gray-300"
                    )}
                  >
                    <rt.icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{rt.label}</span>
                  </button>
                ))}
              </div>

              {/* Time */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Hora</label>
                <input
                  name="started_at"
                  type="datetime-local"
                  defaultValue={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Duration (for sleep, feed, play) */}
              {["sleep", "feed", "play"].includes(selectedType) && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Duración (minutos)</label>
                  <input
                    name="duration_minutes"
                    type="number"
                    min="1"
                    placeholder="Ej: 90"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              )}

              {/* Sleep-specific */}
              {selectedType === "sleep" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Lugar</label>
                  <select
                    name="location"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="crib">Cuna</option>
                    <option value="arms">Brazos</option>
                    <option value="stroller">Carrito</option>
                    <option value="cosleep">Colecho</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              )}

              {/* Feed-specific */}
              {selectedType === "feed" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tipo</label>
                  <select
                    name="method"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="breast_left">Pecho izquierdo</option>
                    <option value="breast_right">Pecho derecho</option>
                    <option value="bottle">Biberón</option>
                    <option value="solids">Sólidos</option>
                  </select>
                </div>
              )}

              {/* Mood-specific */}
              {selectedType === "mood" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Estado de ánimo</label>
                  <div className="flex gap-2">
                    {[
                      { v: 1, l: "😢" }, { v: 2, l: "😕" },
                      { v: 3, l: "😐" }, { v: 4, l: "😊" }, { v: 5, l: "😄" },
                    ].map((m) => (
                      <label key={m.v} className="flex-1">
                        <input type="radio" name="mood_level" value={m.v} className="sr-only peer" defaultChecked={m.v === 3} />
                        <div className="text-2xl text-center py-2 rounded-xl border-2 border-gray-100 peer-checked:border-violet-500 peer-checked:bg-violet-50 cursor-pointer transition">
                          {m.l}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Note-specific */}
              {selectedType === "note" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nota</label>
                  <textarea
                    name="note_text"
                    rows={3}
                    placeholder="Escribe una nota..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full text-white font-medium py-3 rounded-xl transition text-sm disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {isPending ? "Guardando..." : "Guardar registro"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
