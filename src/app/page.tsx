import Link from "next/link";
import {
  Moon,
  ArrowRight,
  ChevronDown,
  Check,
  Smartphone,
  BarChart3,
  Brain,
  Palette,
  Users,
  Shield,
  Zap,
  Target,
  Sun,
  Droplets,
  Smile,
  Sparkles,
  FileText,
  MessageCircleWarning,
  ClipboardList,
  Clock,
  TrendingUp,
  Send,
  Star,
  LayoutDashboard,
  Activity,
  Globe,
  Wifi,
  WifiOff,
} from "lucide-react";

/* ─────────────── Data ─────────────── */

const painPoints = [
  {
    icon: MessageCircleWarning,
    title: "WhatsApp infinito",
    text: "Son las 11 de la noche y sigues buscando en un chat a qué hora durmió el bebé ayer. Fotos de notas, audios, mensajes a deshora.",
  },
  {
    icon: ClipboardList,
    title: "Registros que nadie rellena",
    text: "Envías una tabla en PDF. Vuelve a medias, con datos inconsistentes, o directamente vacía. Y no puedes trabajar sin datos.",
  },
  {
    icon: Clock,
    title: "Horas analizando a mano",
    text: "Recopilar, organizar, cruzar datos, buscar patrones, preparar recomendaciones. El análisis manual te roba las tardes.",
  },
];

const steps = [
  {
    num: "01",
    title: "Invita a la familia",
    text: "Envía un enlace. La familia instala la app con tu marca en 30 segundos. Sin App Store.",
    icon: Send,
  },
  {
    num: "02",
    title: "La familia registra",
    text: "Sueño, tomas, rutinas. En 10 segundos desde el móvil. Tap, tap, listo.",
    icon: Smartphone,
  },
  {
    num: "03",
    title: "Tú analizas y decides",
    text: "Datos limpios en tu panel. La IA detecta patrones y te sugiere ajustes de rutina.",
    icon: Brain,
  },
];

const features = [
  {
    icon: Smartphone,
    title: "App nativa (PWA)",
    text: "Se instala como app en el móvil de los padres. Push notifications, funciona offline. Sin pasar por App Store.",
  },
  {
    icon: BarChart3,
    title: "Dashboard por familia",
    text: "Timeline, gráficas de sueño, despertares y ventanas de vigilia. Todo en un vistazo.",
  },
  {
    icon: Brain,
    title: "Análisis IA",
    text: "Detecta correlaciones entre tomas y despertares, regresiones, ventanas óptimas. Te sugiere qué ajustar.",
  },
  {
    icon: Users,
    title: "Multi-padre sincronizado",
    text: "Ambos padres registran desde su móvil. Sincronización instantánea, sin duplicados.",
  },
  {
    icon: Palette,
    title: "White-label completo",
    text: "Tu logo, colores y dominio. Landing de captación con formulario incluida. Los padres ven tu marca.",
  },
  {
    icon: WifiOff,
    title: "Funciona sin conexión",
    text: "Los padres registran a las 3am sin cobertura. Todo se sincroniza cuando vuelve la conexión.",
  },
];

const plans = [
  {
    name: "Starter",
    desc: "Para empezar con tus primeras familias",
    price: "0",
    period: "para siempre",
    features: [
      "Hasta 3 familias activas",
      "Registros ilimitados",
      "Gráficas básicas de sueño",
      "App para padres con tu nombre",
    ],
    cta: "Empezar gratis",
    popular: false,
  },
  {
    name: "Pro",
    desc: "Para asesoras en crecimiento",
    price: "19",
    period: "/mes",
    features: [
      "Hasta 15 familias activas",
      "Análisis IA + recomendaciones",
      "White-label (logo, colores, dominio)",
      "Gráficas avanzadas + PDF",
      "Landing de captación propia",
    ],
    cta: "Probar 14 días gratis",
    popular: true,
  },
  {
    name: "Clínica",
    desc: "Para equipos y centros de sueño",
    price: "49",
    period: "/mes",
    features: [
      "Familias ilimitadas",
      "Multi-asesora (hasta 5)",
      "Todo lo de Pro incluido",
      "Dominio personalizado",
      "Soporte prioritario",
      "Onboarding dedicado",
    ],
    cta: "Contactar",
    popular: false,
  },
];

const testimonials = [
  {
    quote:
      "Antes perdía 2 horas por familia revisando WhatsApps. Ahora lo tengo todo en un clic y mis familias registran sin que les persiga.",
    name: "María G.",
    role: "Asesora de sueño · Beta tester",
    initials: "MG",
    bg: "bg-rose-100",
    text: "text-rose-700",
  },
  {
    quote:
      "La IA detectó un patrón en los despertares de un bebé que yo no había visto. Ajustamos la ventana de vigilia y en 3 días dormía del tirón.",
    name: "Laura M.",
    role: "Sleep coach certificada · Beta tester",
    initials: "LM",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
  },
  {
    quote:
      "Que la app lleve mi marca es clave. Mis familias sienten que es MI herramienta. Refuerza mi imagen profesional con cada interacción.",
    name: "Carmen R.",
    role: "Consultora pediátrica · Beta tester",
    initials: "CR",
    bg: "bg-violet-100",
    text: "text-violet-700",
  },
];

const faqs = [
  {
    q: "¿Mis familias tienen que pagar algo?",
    a: "No. Tus familias acceden gratis a la app para registrar. Tú eres quien contrata el plan.",
  },
  {
    q: "¿Necesito conocimientos técnicos para configurarlo?",
    a: "Para nada. Creas tu cuenta, subes tu logo, eliges colores y envías el enlace a tus familias. 2 minutos y listo.",
  },
  {
    q: "¿Puedo personalizar la app con mi marca?",
    a: "Sí. En Pro y Clínica puedes poner tu logo, colores y dominio. Los padres ven tu marca, no la nuestra.",
  },
  {
    q: "¿Funciona sin conexión a internet?",
    a: "Sí. La app funciona offline. Los registros se sincronizan cuando vuelve la conexión. Perfecto para las 3am.",
  },
  {
    q: "¿Qué incluye el análisis con IA?",
    a: "Patrones de sueño, correlaciones tomas-despertares, ventanas óptimas, regresiones. Más sugerencias de ajuste basadas en datos.",
  },
  {
    q: "¿Puedo exportar los datos?",
    a: "Sí. Informes en PDF para compartir con las familias o para tus registros profesionales.",
  },
  {
    q: "¿Hay compromiso de permanencia?",
    a: "No. Cancela cuando quieras. Sin permanencia, sin letra pequeña.",
  },
];

/* ─────────────── Page ─────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ──── Header ──── */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Moon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              Nanni
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Funcionalidades", href: "#funcionalidades" },
              { label: "Cómo funciona", href: "#como-funciona" },
              { label: "Precios", href: "#precios" },
              { label: "FAQ", href: "#faq" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition hidden sm:block"
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className="text-[13px] font-semibold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Probar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ──── Hero ──── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-violet-100/60 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 text-violet-700 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-8">
                <Sparkles className="w-3.5 h-3.5" />
                Para asesoras de sueño infantil
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold text-gray-950 leading-[1.08] tracking-tight">
                Tus familias registran.{" "}
                <span className="text-gradient bg-gradient-to-r from-violet-600 to-indigo-500">
                  Tú analizas.
                </span>
              </h1>
              <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-xl">
                Deja de perseguir registros por WhatsApp. Con Nanni, los padres
                documentan sueño y rutinas desde una app con tu marca, y tú
                recibes datos organizados con análisis IA automático.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/registro"
                  className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-violet-700 transition shadow-lg shadow-violet-600/20"
                >
                  Crear mi cuenta gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium px-7 py-3.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition"
                >
                  Ver cómo funciona
                </a>
              </div>
              <div className="mt-12 flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-violet-500" />
                  Gratis para siempre
                </span>
                <span className="w-px h-3.5 bg-gray-200" />
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-violet-500" />
                  Sin tarjeta
                </span>
                <span className="w-px h-3.5 bg-gray-200" />
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-violet-500" />
                  Setup en 2 min
                </span>
              </div>
            </div>

            {/* Hero Product Mock — Desktop */}
            <div className="relative hidden lg:block h-[540px]">
              {/* Dashboard browser mock */}
              <div className="absolute top-0 right-0 w-[460px] shadow-mock rounded-xl overflow-hidden bg-white border border-gray-200/60">
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                  <div className="flex-1 bg-white border border-gray-200/80 rounded-md px-3 py-1 text-[10px] text-gray-400 text-center font-mono">
                    app.nanni.io/dashboard
                  </div>
                </div>
                <div className="flex">
                  <div className="w-12 bg-gray-50/50 border-r border-gray-100 py-4 flex flex-col items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
                      <Moon className="w-3 h-3 text-white" />
                    </div>
                    <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                      <LayoutDashboard className="w-2.5 h-2.5 text-gray-400" />
                    </div>
                    <div className="w-5 h-5 rounded-md bg-violet-50 flex items-center justify-center">
                      <Users className="w-2.5 h-2.5 text-violet-500" />
                    </div>
                    <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                      <BarChart3 className="w-2.5 h-2.5 text-gray-400" />
                    </div>
                    <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                      <Palette className="w-2.5 h-2.5 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[11px] font-bold text-gray-900">
                          Buenos días, María
                        </p>
                        <p className="text-[9px] text-gray-400">
                          3 familias necesitan atención
                        </p>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-[8px] font-bold text-violet-700">
                        MG
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { v: "8", l: "Familias", c: "text-violet-600" },
                        { v: "94%", l: "Al día", c: "text-emerald-600" },
                        { v: "3", l: "Alertas", c: "text-amber-600" },
                        { v: "13.3h", l: "Media", c: "text-blue-600" },
                      ].map((s) => (
                        <div
                          key={s.l}
                          className="bg-gray-50 rounded-lg p-2 text-center"
                        >
                          <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
                          <p className="text-[8px] text-gray-400">{s.l}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {[
                        {
                          n: "Mateo",
                          a: "7m",
                          t: "Hace 23 min",
                          s: "Mejorando",
                          sc: "bg-emerald-50 text-emerald-700",
                        },
                        {
                          n: "Lucía",
                          a: "4m",
                          t: "Hace 2h",
                          s: "En proceso",
                          sc: "bg-amber-50 text-amber-700",
                        },
                        {
                          n: "Pablo",
                          a: "11m",
                          t: "Desde ayer",
                          s: "Atención",
                          sc: "bg-red-50 text-red-600",
                        },
                      ].map((f) => (
                        <div
                          key={f.n}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition"
                        >
                          <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-[7px] font-bold text-violet-700">
                            {f.n[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-semibold text-gray-900">
                              {f.n}{" "}
                              <span className="text-gray-400 font-normal">
                                · {f.a}
                              </span>
                            </p>
                            <p className="text-[8px] text-gray-400">{f.t}</p>
                          </div>
                          <span
                            className={`text-[7px] font-semibold px-1.5 py-0.5 rounded-full ${f.sc}`}
                          >
                            {f.s}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <p className="text-[8px] font-semibold text-gray-400 mb-2">
                        SUEÑO SEMANAL
                      </p>
                      <div className="flex items-end gap-1 h-10">
                        {[65, 75, 60, 85, 70, 80, 72].map((h, i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-sm ${i === 3 ? "bg-violet-500" : "bg-violet-200"}`}
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone mock — Desktop hero */}
              <div className="absolute bottom-4 left-0 w-[200px] shadow-mock rounded-[2rem] bg-gray-950 p-1.5 animate-float-slow z-10">
                <div className="bg-white rounded-[1.7rem] overflow-hidden">
                  <div className="flex items-center justify-between px-5 pt-2 pb-1">
                    <span className="text-[8px] font-semibold text-gray-900">
                      9:41
                    </span>
                    <div className="flex gap-1 items-center">
                      <div className="w-3 h-1.5 rounded-sm bg-gray-900" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center">
                      <Moon className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-[9px] font-bold text-violet-600">
                      Tu Marca
                    </span>
                  </div>
                  <div className="px-3 pb-3 space-y-1.5">
                    {[
                      {
                        icon: Moon,
                        label: "Siesta",
                        time: "09:30",
                        detail: "1h 20min · Cuna",
                        bg: "bg-violet-50",
                        ic: "text-violet-500",
                      },
                      {
                        icon: Droplets,
                        label: "Toma",
                        time: "10:50",
                        detail: "Pecho 25min",
                        bg: "bg-amber-50",
                        ic: "text-amber-500",
                      },
                      {
                        icon: Activity,
                        label: "Juego",
                        time: "11:05",
                        detail: "45min",
                        bg: "bg-emerald-50",
                        ic: "text-emerald-500",
                      },
                      {
                        icon: Moon,
                        label: "Siesta",
                        time: "",
                        detail: "En curso...",
                        bg: "bg-indigo-50",
                        ic: "text-indigo-500",
                        active: true,
                      },
                    ].map((e) => (
                      <div
                        key={e.label + e.time}
                        className={`flex items-center gap-2 ${e.bg} rounded-lg p-2`}
                      >
                        <div className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center shrink-0">
                          <e.icon className={`w-2.5 h-2.5 ${e.ic}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-semibold text-gray-800">
                            {e.label}
                          </p>
                          <p
                            className={`text-[7px] ${e.active ? "text-indigo-500 font-medium" : "text-gray-400"}`}
                          >
                            {e.time && `${e.time} · `}
                            {e.detail}
                          </p>
                        </div>
                        {e.active && (
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse-dot" />
                        )}
                      </div>
                    ))}
                    <div className="flex gap-1.5 pt-1">
                      {[
                        { icon: Moon, c: "bg-violet-100 text-violet-600" },
                        { icon: Droplets, c: "bg-amber-100 text-amber-600" },
                        { icon: Smile, c: "bg-rose-100 text-rose-500" },
                        { icon: FileText, c: "bg-blue-100 text-blue-600" },
                      ].map((a, i) => (
                        <div
                          key={i}
                          className={`flex-1 ${a.c.split(" ")[0]} rounded-lg py-1.5 flex items-center justify-center`}
                        >
                          <a.icon
                            className={`w-3 h-3 ${a.c.split(" ")[1]}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge: AI insight */}
              <div className="absolute top-32 -left-3 bg-white shadow-float rounded-xl p-3 pr-5 z-20 animate-float">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Brain className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-900">
                      Patrón detectado
                    </p>
                    <p className="text-[9px] text-emerald-600 font-medium">
                      -40% despertares
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating badge: Sleep score */}
              <div className="absolute bottom-20 right-[-12px] bg-white shadow-float rounded-xl p-3 pr-5 z-20 animate-float-slow">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-900">
                      Score: 8.5
                    </p>
                    <p className="text-[9px] text-gray-500">
                      Mateo mejorando
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute top-0 right-0 w-80 h-80 bg-violet-200/20 rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-0 left-8 w-48 h-48 bg-indigo-200/15 rounded-full blur-3xl -z-10" />
            </div>

            {/* Hero Product Mock — Mobile: phone mock */}
            <div className="lg:hidden flex justify-center">
              <div className="bg-gray-950 rounded-[2.5rem] p-2 shadow-mock max-w-[280px] w-full">
                <div className="bg-white rounded-[2rem] overflow-hidden">
                  <div className="flex items-center justify-between px-6 pt-3 pb-1">
                    <span className="text-[10px] font-semibold text-gray-900">
                      9:41
                    </span>
                    <div className="w-16 h-5 bg-gray-900 rounded-full mx-auto" />
                    <div className="flex gap-0.5 items-center">
                      <div className="w-4 h-2 rounded-sm border border-gray-900" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-50">
                    <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
                      <Moon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-violet-600">
                      Tu Marca
                    </span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {[
                      {
                        icon: Moon,
                        l: "Siesta mañana",
                        d: "1h 20min · Cuna",
                        bg: "bg-violet-50",
                        ic: "text-violet-500",
                      },
                      {
                        icon: Droplets,
                        l: "Toma",
                        d: "Pecho 25min",
                        bg: "bg-amber-50",
                        ic: "text-amber-500",
                      },
                      {
                        icon: Activity,
                        l: "Juego libre",
                        d: "45min · Parque",
                        bg: "bg-emerald-50",
                        ic: "text-emerald-500",
                      },
                      {
                        icon: Moon,
                        l: "Siesta tarde",
                        d: "En curso...",
                        bg: "bg-indigo-50",
                        ic: "text-indigo-500",
                        active: true,
                      },
                    ].map((e) => (
                      <div
                        key={e.l}
                        className={`flex items-center gap-2.5 ${e.bg} rounded-xl p-2.5`}
                      >
                        <div className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center shrink-0">
                          <e.icon className={`w-3.5 h-3.5 ${e.ic}`} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">
                            {e.l}
                          </p>
                          <p
                            className={`text-[10px] ${e.active ? "text-indigo-500 font-medium" : "text-gray-500"}`}
                          >
                            {e.d}
                          </p>
                        </div>
                        {e.active && (
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse-dot ml-auto shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-4">
                    <div className="flex gap-2">
                      {[
                        {
                          icon: Moon,
                          l: "Sueño",
                          bg: "bg-violet-100",
                          ic: "text-violet-600",
                        },
                        {
                          icon: Droplets,
                          l: "Toma",
                          bg: "bg-sky-100",
                          ic: "text-sky-600",
                        },
                        {
                          icon: Smile,
                          l: "Humor",
                          bg: "bg-rose-100",
                          ic: "text-rose-500",
                        },
                        {
                          icon: FileText,
                          l: "Nota",
                          bg: "bg-gray-100",
                          ic: "text-gray-600",
                        },
                      ].map((a) => (
                        <div
                          key={a.l}
                          className={`flex-1 ${a.bg} rounded-xl py-2 flex flex-col items-center gap-1`}
                        >
                          <a.icon className={`w-4 h-4 ${a.ic}`} />
                          <span className="text-[8px] font-medium text-gray-700">
                            {a.l}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──── Problem ──── */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-semibold text-violet-600 tracking-wide mb-3">
              Si esto te suena, no estás sola
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">
              Tu semana no debería ser así
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Las asesoras de sueño pierden horas en tareas que una buena
              herramienta debería resolver.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {painPoints.map((pain) => (
              <div
                key={pain.title}
                className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-shadow duration-300 border border-gray-100"
              >
                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center mb-5 group-hover:bg-red-100 transition-colors">
                  <pain.icon className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-[15px]">
                  {pain.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {pain.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── How It Works ──── */}
      <section id="como-funciona" className="py-24 md:py-32 bg-gray-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <p className="text-sm font-semibold text-violet-600 tracking-wide mb-3">
              Cómo funciona
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">
              Tres pasos. Sin complicaciones.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            <div className="hidden md:block absolute top-14 left-[20%] right-[20%] h-px bg-gradient-to-r from-violet-200 via-violet-300 to-violet-200" />
            {steps.map((step) => (
              <div key={step.num} className="relative text-center">
                <div className="w-[72px] h-[72px] rounded-2xl bg-white shadow-card border border-gray-100 flex items-center justify-center mx-auto mb-6 relative z-10">
                  <step.icon className="w-7 h-7 text-violet-600" />
                </div>
                <p className="text-xs font-bold text-violet-600 tracking-widest mb-2">
                  PASO {step.num}
                </p>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
          {/* Result + CTA */}
          <div className="text-center mt-16">
            <p className="text-lg text-gray-600 font-medium mb-6">
              Y tus tardes vuelven a ser tuyas.
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 bg-violet-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-violet-700 transition shadow-lg shadow-violet-600/20 text-sm"
            >
              Empezar gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ──── Parent App Showcase ──── */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-violet-600 tracking-wide mb-3">
                La experiencia de tus familias
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight leading-tight">
                Una app con tu marca que los padres sí usan
              </h2>
              <p className="mt-5 text-lg text-gray-500 leading-relaxed">
                Registrar la actividad del bebé les lleva 10 segundos. Sin
                excusas, sin tablas, sin fotos de notas.
              </p>
              <ul className="mt-10 space-y-5">
                {[
                  {
                    title: "Tu marca en cada pantalla",
                    desc: "Logo, colores y nombre. Los padres ven TU herramienta, no la nuestra.",
                  },
                  {
                    title: "Un tap para registrar todo",
                    desc: "Sueño, tomas, humor, notas. Ambos padres, desde su propio móvil.",
                  },
                  {
                    title: "Funciona a las 3am sin cobertura",
                    desc: "Modo offline completo. Se sincroniza cuando vuelve la conexión.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-md bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-violet-600" />
                    </div>
                    <div>
                      <span className="text-gray-900 font-semibold text-[15px]">
                        {item.title}
                      </span>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {/* Phone mock */}
            <div className="flex justify-center">
              <div className="bg-gray-950 rounded-[2.5rem] p-2 shadow-mock max-w-[280px] w-full">
                <div className="bg-white rounded-[2rem] overflow-hidden">
                  <div className="flex items-center justify-between px-6 pt-3 pb-1">
                    <span className="text-[10px] font-semibold text-gray-900">
                      9:41
                    </span>
                    <div className="w-16 h-5 bg-gray-900 rounded-full mx-auto" />
                    <div className="flex gap-0.5 items-center">
                      <div className="w-4 h-2 rounded-sm border border-gray-900" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                        <Moon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-violet-600">
                          Dulces Sueños
                        </p>
                        <p className="text-[8px] text-gray-400">
                          Diario de Mateo
                        </p>
                      </div>
                    </div>
                    <Sun className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {[
                      {
                        icon: Sun,
                        l: "Despertar",
                        t: "07:15",
                        d: "Contento",
                        bg: "bg-amber-50",
                        ic: "text-amber-500",
                      },
                      {
                        icon: Droplets,
                        l: "Toma",
                        t: "07:30",
                        d: "Pecho izq. 15min + der. 10min",
                        bg: "bg-sky-50",
                        ic: "text-sky-500",
                      },
                      {
                        icon: Moon,
                        l: "Siesta mañana",
                        t: "09:30",
                        d: "1h 20min · Cuna · Solo",
                        bg: "bg-violet-50",
                        ic: "text-violet-500",
                      },
                      {
                        icon: Droplets,
                        l: "Toma",
                        t: "10:50",
                        d: "Pecho 12min + biberón 60ml",
                        bg: "bg-sky-50",
                        ic: "text-sky-500",
                      },
                      {
                        icon: Activity,
                        l: "Juego libre",
                        t: "11:05",
                        d: "45min · Parque",
                        bg: "bg-emerald-50",
                        ic: "text-emerald-500",
                      },
                      {
                        icon: Moon,
                        l: "Siesta tarde",
                        t: "14:00",
                        d: "En curso...",
                        bg: "bg-indigo-50",
                        ic: "text-indigo-500",
                        active: true,
                      },
                    ].map((e) => (
                      <div
                        key={e.l + e.t}
                        className={`flex items-center gap-2.5 ${e.bg} rounded-xl p-2.5`}
                      >
                        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                          <e.icon className={`w-3.5 h-3.5 ${e.ic}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-gray-800">
                              {e.l}
                            </span>
                            <span className="text-[9px] text-gray-400">
                              {e.t}
                            </span>
                          </div>
                          <p
                            className={`text-[9px] ${e.active ? "text-indigo-500 font-medium" : "text-gray-500"}`}
                          >
                            {e.d}
                          </p>
                        </div>
                        {e.active && (
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse-dot shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-4">
                    <div className="flex gap-2">
                      {[
                        {
                          icon: Moon,
                          l: "Sueño",
                          bg: "bg-violet-100",
                          ic: "text-violet-600",
                        },
                        {
                          icon: Droplets,
                          l: "Toma",
                          bg: "bg-sky-100",
                          ic: "text-sky-600",
                        },
                        {
                          icon: Smile,
                          l: "Humor",
                          bg: "bg-rose-100",
                          ic: "text-rose-500",
                        },
                        {
                          icon: FileText,
                          l: "Nota",
                          bg: "bg-gray-100",
                          ic: "text-gray-600",
                        },
                      ].map((a) => (
                        <div
                          key={a.l}
                          className={`flex-1 ${a.bg} rounded-xl py-2 flex flex-col items-center gap-1`}
                        >
                          <a.icon className={`w-4 h-4 ${a.ic}`} />
                          <span className="text-[8px] font-medium text-gray-700">
                            {a.l}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──── Dashboard Showcase ──── */}
      <section className="py-24 md:py-32 bg-gray-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-violet-600 tracking-wide mb-3">
              Tu panel de control
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">
              De 8 familias en 8 chats a{" "}
              <span className="text-gradient bg-gradient-to-r from-violet-600 to-indigo-500">
                una sola pantalla
              </span>
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Datos en tiempo real, alertas automáticas e insights de IA.
              Sin perseguir a nadie.
            </p>
          </div>
          {/* Large dashboard mock */}
          <div className="max-w-5xl mx-auto">
            <div className="shadow-mock rounded-xl overflow-hidden bg-white border border-gray-200/60">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="flex-1 max-w-md mx-auto bg-white border border-gray-200/80 rounded-lg px-4 py-1.5 text-xs text-gray-400 text-center font-mono">
                  app.nanni.io/dashboard
                </div>
              </div>
              <div className="flex">
                <div className="hidden md:flex w-48 bg-gray-50/50 border-r border-gray-100 flex-col py-5 px-3 shrink-0">
                  <div className="flex items-center gap-2 px-2 mb-6">
                    <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                      <Moon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Nanni</p>
                      <p className="text-[9px] text-gray-400">Pro</p>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    {[
                      {
                        icon: LayoutDashboard,
                        l: "Dashboard",
                        active: true,
                      },
                      { icon: Users, l: "Familias", active: false },
                      { icon: BarChart3, l: "Analíticas", active: false },
                      { icon: Palette, l: "Mi marca", active: false },
                    ].map((nav) => (
                      <div
                        key={nav.l}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs ${
                          nav.active
                            ? "bg-violet-50 text-violet-700 font-semibold"
                            : "text-gray-400"
                        }`}
                      >
                        <nav.icon className="w-3.5 h-3.5" />
                        {nav.l}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 p-5 md:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Buenos días, María
                      </p>
                      <p className="text-xs text-gray-400">
                        Tienes 2 alertas y 3 tareas hoy
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-700">
                      MG
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                      {
                        v: "8",
                        l: "Familias activas",
                        t: "+2",
                        tc: "text-emerald-600",
                        ic: Users,
                        icbg: "bg-violet-50",
                        icc: "text-violet-600",
                      },
                      {
                        v: "94%",
                        l: "Registros al día",
                        t: "+3%",
                        tc: "text-emerald-600",
                        ic: Target,
                        icbg: "bg-emerald-50",
                        icc: "text-emerald-600",
                      },
                      {
                        v: "2",
                        l: "Necesitan atención",
                        t: "-1",
                        tc: "text-emerald-600",
                        ic: Clock,
                        icbg: "bg-amber-50",
                        icc: "text-amber-600",
                      },
                      {
                        v: "13.3h",
                        l: "Media sueño/día",
                        t: "+0.3h",
                        tc: "text-emerald-600",
                        ic: Moon,
                        icbg: "bg-blue-50",
                        icc: "text-blue-600",
                      },
                    ].map((s) => (
                      <div
                        key={s.l}
                        className="bg-gray-50 rounded-xl p-3.5"
                      >
                        <div
                          className={`w-7 h-7 ${s.icbg} rounded-lg flex items-center justify-center mb-2`}
                        >
                          <s.ic className={`w-3.5 h-3.5 ${s.icc}`} />
                        </div>
                        <p className="text-xl font-bold text-gray-900">
                          {s.v}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {s.l}
                        </p>
                        <p
                          className={`text-[10px] font-medium mt-1 flex items-center gap-0.5 ${s.tc}`}
                        >
                          <TrendingUp className="w-2.5 h-2.5" />
                          {s.t}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="grid md:grid-cols-5 gap-5">
                    <div className="md:col-span-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                        Familias
                      </p>
                      <div className="space-y-2">
                        {[
                          {
                            n: "Mateo",
                            a: "7 meses",
                            t: "hace 23 min",
                            s: "Mejorando",
                            sc: "bg-emerald-50 text-emerald-700",
                            h: "13.5h",
                          },
                          {
                            n: "Lucía",
                            a: "4 meses",
                            t: "hace 2h",
                            s: "En proceso",
                            sc: "bg-amber-50 text-amber-700",
                            h: "12h",
                          },
                          {
                            n: "Pablo",
                            a: "11 meses",
                            t: "desde ayer",
                            s: "Atención",
                            sc: "bg-red-50 text-red-600",
                            h: "11h",
                          },
                          {
                            n: "Sofía",
                            a: "6 meses",
                            t: "hace 1h",
                            s: "Mejorando",
                            sc: "bg-emerald-50 text-emerald-700",
                            h: "14h",
                          },
                        ].map((f) => (
                          <div
                            key={f.n}
                            className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 bg-white"
                          >
                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-700 shrink-0">
                              {f.n[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-900">
                                {f.n}{" "}
                                <span className="text-gray-400 font-normal">
                                  · {f.a}
                                </span>
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {f.t} · {f.h} sueño
                              </p>
                            </div>
                            <span
                              className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${f.sc}`}
                            >
                              {f.s}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                        IA Insights
                      </p>
                      <div className="space-y-2">
                        {[
                          {
                            l: "Mejora detectada",
                            t: "Mateo: -40% despertares. Adelantar acostarse 15 min.",
                            bg: "bg-emerald-50",
                            bc: "border-emerald-100",
                            tc: "text-emerald-700",
                          },
                          {
                            l: "Alerta",
                            t: "Lucía: ventanas vigilia >2h (alto para 4 meses).",
                            bg: "bg-amber-50",
                            bc: "border-amber-100",
                            tc: "text-amber-700",
                          },
                        ].map((i) => (
                          <div
                            key={i.l}
                            className={`p-3 rounded-xl border ${i.bg} ${i.bc}`}
                          >
                            <p
                              className={`text-[9px] font-bold ${i.tc} mb-1`}
                            >
                              {i.l}
                            </p>
                            <p className="text-[10px] text-gray-600 leading-relaxed">
                              {i.t}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* CTA after dashboard */}
          <div className="text-center mt-12">
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition text-sm"
            >
              Quiero mi panel
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ──── Features Grid ──── */}
      <section id="funcionalidades" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-semibold text-violet-600 tracking-wide mb-3">
              Funcionalidades
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">
              Todo lo que necesitas, nada que no
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-white rounded-2xl p-6 md:p-8 shadow-card hover:shadow-lg transition-all duration-300 border border-gray-100"
              >
                <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center mb-5 group-hover:bg-violet-100 transition-colors">
                  <feature.icon className="w-5 h-5 text-violet-600" />
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
          {/* CTA after features */}
          <div className="text-center mt-12">
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 text-violet-600 font-semibold hover:text-violet-700 transition text-sm"
            >
              Ver todas las funcionalidades en acción
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ──── Stats ──── */}
      <section className="py-24 md:py-32 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Diseñado para que{" "}
              <span className="text-gradient bg-gradient-to-r from-violet-400 to-indigo-400">
                ahorres horas
              </span>
            </h2>
            <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
              Familias que registran solas, datos que se analizan solos, y tú
              con tiempo para lo que importa: ayudar a dormir mejor.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                v: "3x",
                l: "más adherencia al plan de sueño",
                sub: "vs. registros manuales en PDF",
                icon: TrendingUp,
              },
              {
                v: "5h",
                l: "ahorradas por semana",
                sub: "en recopilación y análisis de datos",
                icon: Clock,
              },
              {
                v: "94%",
                l: "de familias registran a diario",
                sub: "cuando la app es fácil, la usan",
                icon: Target,
              },
            ].map((stat) => (
              <div key={stat.l} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-violet-400" />
                </div>
                <div className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">
                  {stat.v}
                </div>
                <div className="mt-2 text-gray-300 font-medium">
                  {stat.l}
                </div>
                <div className="mt-1 text-sm text-gray-500">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Testimonials ──── */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-violet-600 tracking-wide mb-3">
              Beta testers
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">
              Lo que dicen las primeras usuarias
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-card border border-gray-100 flex flex-col"
              >
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <blockquote className="text-gray-700 leading-relaxed flex-1 text-[15px]">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-50">
                  <div
                    className={`w-10 h-10 rounded-full ${t.bg} flex items-center justify-center text-xs font-bold ${t.text}`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Trust Signals ──── */}
      <section className="py-6 bg-gray-50/80 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {[
              { icon: Shield, text: "Cifrado end-to-end" },
              { icon: Zap, text: "Setup en 2 minutos" },
              { icon: Target, text: "RGPD compliant" },
              { icon: Wifi, text: "Funciona offline" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-2 text-sm text-gray-500"
              >
                <item.icon className="w-4 h-4 text-gray-400" />
                <span className="text-[13px]">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Pricing ──── */}
      <section id="precios" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-violet-600 tracking-wide mb-3">
              Precios
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">
              Planes para asesoras, no para corporaciones
            </h2>
            <p className="mt-4 text-gray-500 text-lg">
              Tus familias nunca pagan. Tú eliges el plan que encaje.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl ${
                  plan.popular
                    ? "bg-gray-950 text-white shadow-2xl shadow-gray-950/20 ring-1 ring-gray-800 md:-mt-4 md:mb-[-16px]"
                    : "bg-white border border-gray-200 shadow-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-violet-600 text-white text-[11px] font-bold px-4 py-1 rounded-full">
                      Más popular
                    </span>
                  </div>
                )}
                <div className="p-6 md:p-8">
                  <h3
                    className={`text-lg font-bold ${plan.popular ? "text-white" : "text-gray-900"}`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm mt-1 ${plan.popular ? "text-gray-400" : "text-gray-400"}`}
                  >
                    {plan.desc}
                  </p>
                  <div className="mt-6 mb-1">
                    <span
                      className={`text-5xl font-extrabold tracking-tight ${plan.popular ? "text-white" : "text-gray-900"}`}
                    >
                      {plan.price}€
                    </span>
                    <span
                      className={`text-sm ${plan.popular ? "text-gray-500" : "text-gray-400"}`}
                    >
                      {" "}{plan.period}
                    </span>
                  </div>
                  {plan.price === "0" && (
                    <p className="text-xs text-emerald-600 font-medium mb-5">
                      Sin tarjeta. Sin límite de tiempo.
                    </p>
                  )}
                  {plan.price !== "0" && <div className="mb-6" />}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check
                          className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? "text-violet-400" : "text-violet-600"}`}
                        />
                        <span
                          className={`text-sm ${plan.popular ? "text-gray-300" : "text-gray-600"}`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/registro"
                    className={`block text-center font-semibold py-3 rounded-xl transition text-sm ${
                      plan.popular
                        ? "bg-white text-gray-900 hover:bg-gray-100"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── FAQ ──── */}
      <section id="faq" className="py-24 md:py-32 bg-gray-50/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-violet-600 tracking-wide mb-3">
              FAQ
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">
              Preguntas frecuentes
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer p-5 list-none select-none">
                  <span className="font-medium text-gray-900 text-[15px] pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-5 pb-5 -mt-1">
                  <p className="text-gray-500 leading-relaxed text-[15px]">
                    {faq.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Final CTA ──── */}
      <section className="py-24 md:py-32 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-[0.03]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-8">
            <Moon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Dedica tu tiempo a lo que importa: ayudar a familias a dormir mejor
          </h2>
          <p className="mt-5 text-gray-400 text-lg">
            Plan Starter gratis para siempre. Sin tarjeta, sin compromiso.
          </p>
          <div className="mt-10">
            <Link
              href="/registro"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-semibold py-3.5 px-8 rounded-xl hover:bg-gray-100 transition text-sm"
            >
              Crear mi cuenta gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="mt-5 text-sm text-gray-500">
            Setup en 2 minutos. Cancela cuando quieras.
          </p>
        </div>
      </section>

      {/* ──── Footer ──── */}
      <footer className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <Moon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-gray-900">Nanni</span>
            </div>
            <div className="flex items-center gap-6">
              {["Privacidad", "Términos", "Contacto"].map((l) => (
                <a
                  key={l}
                  href="#"
                  className="text-sm text-gray-400 hover:text-gray-600 transition"
                >
                  {l}
                </a>
              ))}
            </div>
            <p className="text-sm text-gray-400">
              &copy; 2026 Nanni. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
