"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createFamily } from "@/lib/actions";
import { Copy, Check, Share2, QrCode, Send } from "lucide-react";

interface InviteFamilyProps {
  open: boolean;
  onClose: () => void;
}

export function InviteFamily({ open, onClose }: InviteFamilyProps) {
  const [step, setStep] = useState<"form" | "share">("form");
  const [inviteToken, setInviteToken] = useState("");
  const [babyName, setBabyName] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleClose() {
    setStep("form");
    setInviteToken("");
    setBabyName("");
    setCopied(false);
    onClose();
  }

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createFamily(formData);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      if (result.data) {
        setBabyName(result.data.baby_name);
        setInviteToken(result.data.invite_token);
        setStep("share");
        toast("Familia creada correctamente");
      }
    });
  }

  const inviteUrl = inviteToken
    ? `${window.location.origin}/invite/${inviteToken}`
    : "";

  const parentUrl = inviteToken
    ? `${window.location.origin}/p/${inviteToken}`
    : "";

  async function copyLink() {
    await navigator.clipboard.writeText(parentUrl);
    setCopied(true);
    toast("Enlace copiado");
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const text = `¡Hola! Te invito a usar la app para registrar el sueño y rutinas de ${babyName}. Abre este enlace en tu móvil:\n\n${parentUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <Modal open={open} onClose={handleClose} title={step === "form" ? "Añadir familia" : "Invitar a los padres"}>
      {step === "form" ? (
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Nombre del bebé
            </label>
            <input
              name="baby_name"
              type="text"
              required
              placeholder="Ej: Mateo"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Fecha de nacimiento
            </label>
            <input
              name="baby_birth_date"
              type="date"
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-violet-600 text-white font-medium py-2.5 rounded-xl hover:bg-violet-700 transition text-sm disabled:opacity-50"
          >
            {isPending ? "Creando..." : "Crear familia"}
          </button>
        </form>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-gray-500">
            Comparte este enlace con los padres de <strong>{babyName}</strong> para que puedan registrar sueño y rutinas desde su móvil.
          </p>

          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
            <input
              readOnly
              value={parentUrl}
              className="flex-1 bg-transparent text-xs text-gray-600 font-mono outline-none truncate"
            />
            <button
              onClick={copyLink}
              className="shrink-0 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={shareWhatsApp}
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-emerald-700 transition"
            >
              <Send className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              onClick={copyLink}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition"
            >
              <Share2 className="w-4 h-4" />
              Copiar enlace
            </button>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Los padres podrán registrar actividad directamente desde este enlace. No necesitan crear una cuenta.
            </p>
          </div>

          <button
            onClick={handleClose}
            className="w-full bg-gray-900 text-white font-medium py-2.5 rounded-xl hover:bg-gray-800 transition text-sm"
          >
            Hecho
          </button>
        </div>
      )}
    </Modal>
  );
}
