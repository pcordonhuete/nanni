import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nanni — Registros de sueño que las familias sí rellenan",
  description:
    "La herramienta que las asesoras de sueño necesitaban. Registros de sueño, tomas y rutinas desde el móvil. Análisis IA y recomendaciones automáticas.",
  keywords: [
    "asesor sueño bebé",
    "registro sueño infantil",
    "app sueño bebé",
    "sleep consultant tool",
  ],
  manifest: "/manifest.json",
  openGraph: {
    title: "Nanni — Registros de sueño que las familias sí rellenan",
    description:
      "Tus familias registran sueño, tomas y rutinas en segundos. Tú recibes datos organizados con análisis IA.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nanni",
  },
};

export const viewport: Viewport = {
  themeColor: "#7C3AED",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
