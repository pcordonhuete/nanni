import Link from "next/link";
import {
  Moon,
  Smartphone,
  BarChart3,
  Brain,
  Palette,
  Users,
  Camera,
  Check,
  ArrowRight,
  Sparkles,
  FileText,
} from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Para empezar con pocas familias",
    price: "0",
    features: [
      "Hasta 3 familias",
      "Registros ilimitados",
      "Gráficas básicas",
      "App para padres",
    ],
    cta: "Empezar gratis",
    href: "/registro",
    popular: false,
  },
  {
    name: "Pro",
    description: "Para asesoras en crecimiento",
    price: "19",
    features: [
      "Hasta 15 familias",
      "Análisis IA + recomendaciones",
      "Generador de contenido para RRSS",
      "White-label (tu marca)",
      "Gráficas avanzadas + exportar PDF",
    ],
    cta: "Probar 14 días gratis",
    href: "/registro",
    popular: true,
  },
  {
    name: "Clínica",
    description: "Para equipos y centros",
    price: "49",
    features: [
      "Familias ilimitadas",
      "Multi-asesora (hasta 5)",
      "Todo de Pro incluido",
      "Dominio personalizado",
      "Soporte prioritario",
    ],
    cta: "Contactar",
    href: "/registro",
    popular: false,
  },
];

const features = [
  {
    icon: Smartphone,
    title: "App nativa (PWA)",
    description:
      "Se instala como una app en el móvil de los padres. Funciona offline, notificaciones push incluidas. Sin necesidad de App Store.",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    icon: BarChart3,
    title: "Gráficas de evolución",
    description:
      "Visualiza la evolución del sueño por semana. Horas totales, despertares, latencia... todo en gráficas claras para ti y para los padres.",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    icon: Sparkles,
    title: "Análisis IA integrado",
    description:
      "Detecta patrones que el ojo no ve: correlaciones entre tomas y despertares, ventanas de sueño óptimas, regresiones... y te sugiere qué ajustar.",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    icon: Camera,
    title: "Contenido para redes",
    description:
      "Genera carruseles, tips y casos de éxito anonimizados para Instagram y TikTok. Con datos reales de tus familias. Tu marketing, en automático.",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
  },
  {
    icon: Users,
    title: "Multi-padre sincronizado",
    description:
      "Mamá y papá registran desde su móvil. Todo se sincroniza al instante. Sin duplicados, sin coordinarse.",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
  },
  {
    icon: Palette,
    title: "White-label total",
    description:
      "Tu logo, tus colores, tu dominio. Los padres ven tu marca, no la nuestra. Refuerza tu imagen profesional con cada interacción.",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
  },
];

const dashboardFamilies = [
  {
    initial: "M",
    name: "Mateo · 7 meses",
    lastRecord: "hace 23 min",
    status: "Mejorando",
    statusColor: "bg-emerald-100 text-emerald-700",
  },
  {
    initial: "L",
    name: "Lucía · 4 meses",
    lastRecord: "hace 2h",
    status: "En proceso",
    statusColor: "bg-amber-100 text-amber-700",
  },
  {
    initial: "P",
    name: "Pablo · 11 meses",
    lastRecord: "desde ayer",
    status: "Atención",
    statusColor: "bg-red-100 text-red-700",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ───────── Header ───────── */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Moon className="w-6 h-6 text-violet-600" />
            <span className="text-xl font-bold text-gray-900">Nanni</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#asesoras"
              className="text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Para asesoras
            </a>
            <a
              href="#padres"
              className="text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Para padres
            </a>
            <a
              href="#funcionalidades"
              className="text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Funcionalidades
            </a>
            <a
              href="#precios"
              className="text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Precios
            </a>
          </nav>
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 transition font-medium"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-gradient-to-br from-violet-50 via-white to-indigo-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                <Moon className="w-4 h-4" />
                <span>
                  La herramienta que las asesoras de sueño necesitaban
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                Registros de sueño{" "}
                <span className="text-violet-600">
                  que las familias sí rellenan
                </span>
              </h1>
              <p className="mt-6 text-lg text-gray-500 max-w-xl leading-relaxed">
                Tus familias registran sueño, tomas y rutinas en segundos desde
                el móvil. Tú recibes los datos organizados, con análisis IA y
                recomendaciones listas para usar.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/registro"
                  className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold px-7 py-3 rounded-full hover:bg-violet-700 transition shadow-lg shadow-violet-200"
                >
                  Quiero probarlo
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center border border-gray-200 text-gray-700 font-medium px-7 py-3 rounded-full hover:bg-gray-50 transition"
                >
                  Ver cómo funciona
                </a>
              </div>
              <div className="mt-10 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["MA", "LC", "SG", "PR"].map((initials) => (
                    <div
                      key={initials}
                      className="w-8 h-8 rounded-full bg-violet-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-violet-700"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-gray-400">
                  +120 asesoras ya en lista de espera
                </span>
              </div>
            </div>

            {/* Floating UI cards */}
            <div className="relative hidden lg:block h-[520px]">
              {/* Main timeline card */}
              <div className="absolute top-6 right-4 w-[320px] bg-white rounded-3xl shadow-xl border border-gray-100 p-5 transform rotate-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 text-sm">
                    Mateo 🌙
                  </h3>
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                </div>
                <p className="text-[11px] text-gray-400 mb-4">Hoy, 3 abril</p>

                <div className="space-y-2">
                  {[
                    {
                      emoji: "😴",
                      title: "Siesta mañana",
                      time: "09:30",
                      detail: "1h 20min · En cuna · Se durmió solo",
                      bg: "bg-violet-50",
                    },
                    {
                      emoji: "🍼",
                      title: "Toma",
                      time: "10:50",
                      detail: "Pecho izq. 15min + derecho 10min",
                      bg: "bg-amber-50",
                    },
                    {
                      emoji: "🧸",
                      title: "Juego libre",
                      time: "11:05",
                      detail: "45min · Humor: contento",
                      bg: "bg-green-50",
                    },
                    {
                      emoji: "🌙",
                      title: "Siesta tarde",
                      time: "",
                      detail: "En curso... · En cuna",
                      bg: "bg-indigo-50",
                      active: true,
                    },
                  ].map((entry) => (
                    <div
                      key={entry.title}
                      className={`flex items-start gap-2 ${entry.bg} rounded-xl p-2.5`}
                    >
                      <span className="text-base mt-0.5 shrink-0">
                        {entry.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-semibold text-gray-800">
                            {entry.title}
                          </span>
                          {entry.time && (
                            <span className="text-[10px] text-gray-400">
                              {entry.time}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[10px] ${entry.active ? "text-violet-600 font-medium" : "text-gray-500"}`}
                        >
                          {entry.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action pills */}
                <div className="mt-4 flex gap-2">
                  {[
                    {
                      emoji: "😴",
                      label: "Sueño",
                      color: "bg-violet-100 text-violet-700",
                    },
                    {
                      emoji: "🍼",
                      label: "Toma",
                      color: "bg-amber-100 text-amber-700",
                    },
                    {
                      emoji: "💩",
                      label: "Pañal",
                      color: "bg-orange-100 text-orange-700",
                    },
                    {
                      emoji: "📝",
                      label: "Nota",
                      color: "bg-blue-100 text-blue-700",
                    },
                  ].map((action) => (
                    <span
                      key={action.label}
                      className={`${action.color} text-[10px] font-medium px-2.5 py-1.5 rounded-full flex items-center gap-1`}
                    >
                      <span className="text-xs">{action.emoji}</span>
                      {action.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* IA detecta - floating chip */}
              <div className="absolute top-28 -left-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-3 pr-5 transform -rotate-3 z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      IA detecta
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Ventana de sueño corta
                    </p>
                  </div>
                </div>
              </div>

              {/* Post listo - floating chip */}
              <div className="absolute bottom-10 right-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-3 pr-5 transform rotate-2 z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      Post listo
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Carrusel de tips
                    </p>
                  </div>
                </div>
              </div>

              {/* Decorative gradient blobs */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-violet-200/30 rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-0 left-8 w-48 h-48 bg-indigo-200/20 rounded-full blur-3xl -z-10" />
            </div>

            {/* Mobile: simplified card version */}
            <div className="lg:hidden">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 max-w-sm mx-auto">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 text-sm">
                    Mateo 🌙
                  </h3>
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                </div>
                <p className="text-[11px] text-gray-400 mb-4">Hoy, 3 abril</p>
                <div className="space-y-2">
                  {[
                    {
                      emoji: "😴",
                      title: "Siesta mañana",
                      time: "09:30",
                      detail: "1h 20min · En cuna",
                      bg: "bg-violet-50",
                    },
                    {
                      emoji: "🍼",
                      title: "Toma",
                      time: "10:50",
                      detail: "Pecho 15min + 10min",
                      bg: "bg-amber-50",
                    },
                    {
                      emoji: "🌙",
                      title: "Siesta tarde",
                      time: "",
                      detail: "En curso...",
                      bg: "bg-indigo-50",
                    },
                  ].map((entry) => (
                    <div
                      key={entry.title}
                      className={`flex items-start gap-2 ${entry.bg} rounded-xl p-2.5`}
                    >
                      <span className="text-base shrink-0">{entry.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-semibold text-gray-800">
                            {entry.title}
                          </span>
                          {entry.time && (
                            <span className="text-[10px] text-gray-400">
                              {entry.time}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500">
                          {entry.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  {[
                    {
                      emoji: "😴",
                      label: "Sueño",
                      color: "bg-violet-100 text-violet-700",
                    },
                    {
                      emoji: "🍼",
                      label: "Toma",
                      color: "bg-amber-100 text-amber-700",
                    },
                    {
                      emoji: "💩",
                      label: "Pañal",
                      color: "bg-orange-100 text-orange-700",
                    },
                    {
                      emoji: "📝",
                      label: "Nota",
                      color: "bg-blue-100 text-blue-700",
                    },
                  ].map((action) => (
                    <span
                      key={action.label}
                      className={`${action.color} text-[10px] font-medium px-2.5 py-1.5 rounded-full flex items-center gap-1`}
                    >
                      <span className="text-xs">{action.emoji}</span>
                      {action.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Para Asesoras ───────── */}
      <section id="asesoras" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-violet-600 tracking-wide uppercase mb-3">
                Para asesoras de sueño
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                Deja de perseguir registros por WhatsApp
              </h2>
              <p className="mt-5 text-lg text-gray-500 leading-relaxed">
                Tus familias registran todo desde una app bonita y sencilla. Tú
                recibes los datos limpios, con gráficas de evolución y
                recomendaciones IA que te ahorran horas de análisis.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Dashboard por familia con timeline, gráficas de sueño y alertas",
                  "Análisis IA que detecta patrones y sugiere ajustes de rutina",
                  "Generador de contenido para tus redes con datos reales anonimizados",
                  "Tu marca — la app lleva tu logo, tus colores, tu nombre",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-100/40 to-indigo-100/40 rounded-3xl -rotate-2" />
              <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center">
                    <Moon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-violet-600">Nanni Pro</p>
                    <p className="text-sm text-gray-400">
                      Panel de María Asesora
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { value: "8", label: "Familias activas" },
                    { value: "94%", label: "Registros al día" },
                    { value: "3", label: "Necesitan atención" },
                    { value: "12", label: "Posts generados" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-gray-50 rounded-xl p-3"
                    >
                      <div className="text-xl font-bold text-gray-900">
                        {stat.value}
                      </div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2.5">
                  {dashboardFamilies.map((family) => (
                    <div
                      key={family.initial}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-semibold text-violet-700">
                        {family.initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {family.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Último registro: {family.lastRecord}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${family.statusColor}`}
                      >
                        {family.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Para Padres ───────── */}
      <section id="padres" className="py-20 md:py-28 bg-gray-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 max-w-sm mx-auto">
                <p className="text-center text-xs text-gray-400 mb-1">
                  Registrar actividad
                </p>
                <h3 className="text-center font-semibold text-gray-900 mb-6">
                  ¿Qué ha hecho tu bebé? 👶
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      emoji: "😴",
                      label: "Sueño",
                      color: "bg-violet-50 border-violet-200",
                    },
                    {
                      emoji: "🍼",
                      label: "Toma",
                      color: "bg-amber-50 border-amber-200",
                    },
                    {
                      emoji: "💩",
                      label: "Pañal",
                      color: "bg-orange-50 border-orange-200",
                    },
                    {
                      emoji: "🧸",
                      label: "Juego",
                      color: "bg-green-50 border-green-200",
                    },
                    {
                      emoji: "😊",
                      label: "Humor",
                      color: "bg-pink-50 border-pink-200",
                    },
                    {
                      emoji: "📝",
                      label: "Nota",
                      color: "bg-blue-50 border-blue-200",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`${item.color} border rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:scale-105 transition`}
                    >
                      <span className="text-3xl">{item.emoji}</span>
                      <span className="text-sm font-medium text-gray-700">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-sm font-semibold text-violet-600 tracking-wide uppercase mb-3">
                Para los padres
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                Registrar el día de tu bebé en 10 segundos
              </h2>
              <p className="mt-5 text-lg text-gray-500 leading-relaxed">
                Nada de rellenar tablas ni mandar fotos de notas. Tap, tap, y
                listo. Tu asesora lo ve al instante.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Un tap para registrar sueño, tomas, pañales, humor y notas",
                  "Timeline visual del día — ves el progreso de un vistazo",
                  "Ambos padres pueden registrar desde su propio móvil",
                  "Funciona offline — registra a las 3am sin cobertura",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Dashboard Preview ───────── */}
      <section id="demo" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Todos tus casos, bajo control
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Así se ve tu dashboard. Datos limpios, sin perseguir a nadie.
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-5 md:p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-gray-900 text-lg">
                      Nanni Pro
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      María Asesora
                    </span>
                    <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">
                      MA
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                  {[
                    { value: "8", label: "Familias activas" },
                    { value: "94%", label: "Registros al día" },
                    { value: "3", label: "Necesitan atención" },
                    { value: "12", label: "Posts generados" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-gray-50 rounded-xl p-4"
                    >
                      <div className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                      Familias
                    </h4>
                    <div className="space-y-3">
                      {dashboardFamilies.map((family) => (
                        <div
                          key={family.initial}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-100"
                        >
                          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700">
                            {family.initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {family.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              Último registro: {family.lastRecord}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${family.statusColor}`}
                          >
                            {family.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                      IA Insights
                    </h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-xs font-bold text-emerald-700">
                            Recomendación
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Mateo ha reducido despertares nocturnos un 40% esta
                          semana. Sugerir adelantar la hora de acostarse 15 min.
                        </p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="text-xs font-bold text-amber-700">
                            Alerta
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Lucía: las ventanas de vigilia superan lo recomendado
                          para 4 meses (&gt;2h).
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="text-xs font-bold text-blue-700">
                            Contenido listo
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Post generado: &quot;¿Tu bebé se despierta a las 5am?
                          3 claves para que aguante más&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Features Grid ───────── */}
      <section
        id="funcionalidades"
        className="py-20 md:py-28 bg-gray-50/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Una herramienta que trabaja para ti, no al revés
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-5`}
                >
                  <feature.icon
                    className={`w-6 h-6 ${feature.iconColor}`}
                  />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Stats ───────── */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-gray-900 via-violet-950 to-indigo-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
            Las asesoras que más crecen son las que tienen las mejores
            herramientas
          </h2>
          <p className="mt-4 text-lg text-violet-200/80 max-w-2xl mx-auto">
            Tus familias felices = más reseñas = más clientes. Y con contenido
            automático para redes, tu visibilidad se multiplica.
          </p>
          <div className="mt-16 grid sm:grid-cols-3 gap-8 md:gap-12">
            {[
              { value: "3x", label: "más adherencia al plan" },
              { value: "5h", label: "ahorradas por semana" },
              { value: "∞", label: "contenido para redes" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-5xl md:text-6xl font-extrabold text-violet-300">
                  {stat.value}
                </div>
                <div className="mt-2 text-violet-200/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Pricing ───────── */}
      <section id="precios" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Precios para asesoras, no para multinacionales
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Tus familias nunca pagan. Tú eliges el plan que encaje.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 md:p-8 ${
                  plan.popular
                    ? "bg-violet-600 text-white shadow-2xl shadow-violet-200 md:scale-105 border-2 border-violet-500 ring-4 ring-violet-100"
                    : "bg-white border border-gray-200 shadow-sm"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-gray-900 text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                    Popular
                  </div>
                )}
                <h3
                  className={`text-xl font-bold ${plan.popular ? "text-white" : "text-gray-900"}`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm mt-1 ${plan.popular ? "text-violet-200" : "text-gray-400"}`}
                >
                  {plan.description}
                </p>
                <div className="mt-6 mb-6">
                  <span
                    className={`text-5xl font-extrabold ${plan.popular ? "text-white" : "text-gray-900"}`}
                  >
                    {plan.price}€
                  </span>
                  <span
                    className={`${plan.popular ? "text-violet-200" : "text-gray-400"}`}
                  >
                    {" "}
                    /mes
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? "text-violet-200" : "text-violet-600"}`}
                      />
                      <span
                        className={`text-sm ${plan.popular ? "text-violet-100" : "text-gray-600"}`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center font-semibold py-3 rounded-full transition ${
                    plan.popular
                      ? "bg-white text-violet-700 hover:bg-violet-50"
                      : "bg-violet-600 text-white hover:bg-violet-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section
        id="waitlist"
        className="py-20 md:py-28 bg-gradient-to-br from-violet-50 to-indigo-50"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Moon className="w-12 h-12 text-violet-600 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Ayuda a más familias a dormir mejor
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
            Únete a la lista de espera y sé de las primeras asesoras en usar
            Nanni. Acceso gratuito durante la beta.
          </p>
          <div className="mt-8">
            <Link
              href="/registro"
              className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold py-3.5 px-10 rounded-full hover:bg-violet-700 transition shadow-lg shadow-violet-200"
            >
              Quiero acceso
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Sin spam. Solo para asesoras de sueño infantil.
          </p>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="py-8 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-violet-600" />
              <span className="font-bold text-gray-900">Nanni</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-gray-900 transition">
                Privacidad
              </a>
              <a href="#" className="hover:text-gray-900 transition">
                Términos
              </a>
              <a href="#" className="hover:text-gray-900 transition">
                Contacto
              </a>
            </div>
            <p className="text-sm text-gray-400">
              © 2026 Nanni. Dulces sueños.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
