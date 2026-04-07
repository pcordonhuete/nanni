"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const COOKIE_KEY = "nanni-cookies";

type Consent = "accepted" | "rejected" | null;

function getStoredConsent(): Consent {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(COOKIE_KEY);
  if (v === "accepted" || v === "rejected") return v;
  return null;
}

export function CookieBanner() {
  const [consent, setConsent] = useState<Consent>("accepted");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setConsent(getStoredConsent());
    setMounted(true);
  }, []);

  if (!mounted || consent !== null) return null;

  function accept() {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setConsent("accepted");
  }

  function reject() {
    localStorage.setItem(COOKIE_KEY, "rejected");
    setConsent("rejected");
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999] p-4 sm:p-6 pointer-events-none">
      <div className="pointer-events-auto max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-xl p-5 sm:p-6 animate-slide-up">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-nanni-50 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5 text-nanni-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Usamos cookies
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Utilizamos cookies esenciales para que la plataforma funcione y cookies
              analíticas (opcionales) para mejorar tu experiencia.{" "}
              <Link
                href="/cookies"
                className="text-nanni-600 font-medium hover:underline"
              >
                Más información
              </Link>
            </p>
            <div className="flex flex-wrap gap-2.5 mt-4">
              <button
                onClick={accept}
                className="text-sm font-semibold bg-nanni-600 text-white px-5 py-2 rounded-lg hover:bg-nanni-700 transition"
              >
                Aceptar todo
              </button>
              <button
                onClick={reject}
                className="text-sm font-semibold bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                Solo esenciales
              </button>
            </div>
          </div>
          <button
            onClick={reject}
            className="text-gray-300 hover:text-gray-500 transition shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
