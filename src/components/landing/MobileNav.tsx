"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Precios", href: "#precios" },
  { label: "FAQ", href: "#faq" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 -mr-2 text-gray-500 hover:text-gray-900 transition"
        aria-label="Menú"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div className="absolute top-16 inset-x-0 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-lg z-50 animate-slide-down">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {links.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg px-3 py-2.5 transition"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-2 pt-3 border-t border-gray-100">
              <Link
                href="/registro"
                onClick={() => setOpen(false)}
                className="block text-center text-sm font-semibold bg-nanni-600 text-white px-4 py-2.5 rounded-lg hover:bg-nanni-700 transition"
              >
                Probar 14 días gratis
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
