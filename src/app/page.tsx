import Link from "next/link";
import { MobileNav } from "@/components/landing/MobileNav";
import { AnimateOnScroll } from "@/components/landing/AnimateOnScroll";
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
    title: "App en el móvil, sin App Store",
    text: "Se instala como app en el móvil de los padres. Notificaciones, funciona sin conexión. Sin descargas.",
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
    title: "Para mamá y papá",
    text: "Ambos padres registran desde su móvil. Sincronización instantánea, sin duplicados.",
  },
  {
    icon: Palette,
    title: "Tu marca, tu imagen",
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
    name: "Básico",
    desc: "Todo lo que necesitas para empezar",
    discountedPrice: "25",
    regularPrice: "49",
    afterMonthly: "49",
    features: [
      "Hasta 10 familias",
      "Registros ilimitados",
      "Gráficas de sueño",
      "Informes PDF",
      "App para padres",
      "Soporte por email",
    ],
    cta: "Empezar 14 días gratis",
    popular: false,
  },
  {
    name: "Premium",
    desc: "Para asesoras que quieren crecer",
    discountedPrice: "40",
    regularPrice: "79",
    afterMonthly: "79",
    features: [
      "Todo del Básico, más:",
      "Familias ilimitadas",
      "Análisis IA + recomendaciones",
      "Tu marca propia (logo, colores, dominio)",
      "Gráficas avanzadas + PDF",
      "Hasta 5 miembros del equipo",
      "Soporte prioritario",
    ],
    cta: "Empezar 14 días gratis",
    popular: true,
  },
];

const testimonials = [
  {
    quote:
      "Antes perdía 2 horas por familia revisando WhatsApps. Ahora lo tengo todo en un clic y mis familias registran sin que les persiga.",
    name: "María G.",
    role: "Asesora de sueño infantil",
    initials: "MG",
    bg: "bg-nanni-100",
    text: "text-nanni-700",
  },
  {
    quote:
      "La IA detectó un patrón en los despertares de un bebé que yo no había visto. Ajustamos la ventana de vigilia y en 3 días dormía del tirón.",
    name: "Laura M.",
    role: "Sleep coach certificada",
    initials: "LM",
    bg: "bg-nanni-100",
    text: "text-nanni-700",
  },
  {
    quote:
      "Que la app lleve mi marca es clave. Mis familias sienten que es MI herramienta. Refuerza mi imagen profesional con cada interacción.",
    name: "Carmen R.",
    role: "Consultora pediátrica de sueño",
    initials: "CR",
    bg: "bg-nanni-100",
    text: "text-nanni-700",
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
    a: "Sí. En el plan Premium puedes poner tu logo, colores y dominio. Los padres ven tu marca, no la nuestra.",
  },
  {
    q: "¿Funciona sin conexión a internet?",
    a: "Sí. La app funciona sin conexión. Los registros se sincronizan cuando vuelve la conexión. Perfecto para las 3am.",
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
  {
    q: "¿Cuál es la política de reembolsos?",
    a: "Si no estás satisfecha en los primeros 30 días, te devolvemos el dinero sin preguntas. Después, puedes cancelar cuando quieras y mantienes el acceso hasta el final del periodo facturado. Escríbenos a hola@nanniapp.com y lo resolvemos.",
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
            <div className="w-8 h-8 rounded-lg bg-nanni-600 flex items-center justify-center">
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
              className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition"
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className="text-[13px] font-semibold bg-nanni-600 text-white px-4 py-2 rounded-lg hover:bg-nanni-700 transition hidden sm:inline-flex"
            >
              Probar 14 días gratis
            </Link>
            <MobileNav />
          </div>
        </div>
      </header>

      {/* ──── Hero ──── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-nanni-100/60 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-nanni-50 border border-nanni-100 text-nanni-700 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-8">
                <Sparkles className="w-3.5 h-3.5" />
                Para asesoras de sueño infantil
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold text-gray-950 leading-[1.08] tracking-tight">
                Tus familias registran.{" "}
                <span className="text-gradient bg-gradient-to-r from-nanni-700 to-nanni-400">
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
                  className="inline-flex items-center justify-center gap-2 bg-nanni-600 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-nanni-700 transition shadow-lg shadow-nanni-600/20"
                >
                  Probar 14 días gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="mt-12 flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-nanni-500" />
                  14 días gratis
                </span>
                <span className="w-px h-3.5 bg-gray-200" />
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-nanni-500" />
                  Sin tarjeta
                </span>
                <span className="w-px h-3.5 bg-gray-200" />
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-nanni-500" />
                  Lista en 2 min
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
                    app.nanniapp.com/familias
                  </div>
                </div>
                <div className="flex">
                  <div className="w-12 bg-gray-50/50 border-r border-gray-100 py-4 flex flex-col items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-nanni-600 flex items-center justify-center">
                      <Moon className="w-3 h-3 text-white" />
                    </div>
                    <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                      <LayoutDashboard className="w-2.5 h-2.5 text-gray-400" />
                    </div>
                    <div className="w-5 h-5 rounded-md bg-nanni-50 flex items-center justify-center">
                      <Users className="w-2.5 h-2.5 text-nanni-500" />
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
                      <div className="w-6 h-6 rounded-full bg-nanni-100 flex items-center justify-center text-[8px] font-bold text-nanni-700">
                        MG
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { v: "8", l: "Familias", c: "text-nanni-600" },
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
                          sc: "bg-amber-50 text-amber-600",
                        },
                      ].map((f) => (
                        <div
                          key={f.n}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition"
                        >
                          <div className="w-5 h-5 rounded-full bg-nanni-100 flex items-center justify-center text-[7px] font-bold text-nanni-700">
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
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[8px] font-semibold text-gray-400">
                          SUEÑO SEMANAL
                        </p>
                        <p className="text-[7px] text-emerald-600 font-semibold flex items-center gap-0.5">
                          <TrendingUp className="w-2 h-2" /> +0.5h
                        </p>
                      </div>
                      <div className="flex gap-1 h-12">
                        {[
                          { h: 65, nap: 20 },
                          { h: 75, nap: 23 },
                          { h: 60, nap: 20 },
                          { h: 85, nap: 27 },
                          { h: 70, nap: 22 },
                          { h: 80, nap: 25 },
                          { h: 78, nap: 24 },
                        ].map((bar, i) => (
                          <div key={i} className="flex-1 flex flex-col justify-end">
                            <div className="w-full flex flex-col gap-px" style={{ height: `${bar.h}%` }}>
                              <div className={`w-full flex-1 rounded-t-sm ${i === 3 ? "bg-nanni-500" : "bg-nanni-300"}`} />
                              <div className="w-full bg-nanni-100 rounded-b-sm" style={{ flexBasis: `${(bar.nap / bar.h) * 100}%`, flexShrink: 0 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-[7px] text-gray-400"><span className="w-1.5 h-1.5 rounded-sm bg-nanni-300" />Noche</span>
                        <span className="flex items-center gap-1 text-[7px] text-gray-400"><span className="w-1.5 h-1.5 rounded-sm bg-nanni-100" />Siestas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone mock — Desktop hero */}
              <div className="absolute bottom-4 left-0 w-[200px] shadow-mock rounded-[2rem] bg-gray-950 p-1.5 animate-float-slow z-10">
                <div className="bg-white rounded-[1.7rem] overflow-hidden">
                  <div className="flex items-center justify-between px-5 pt-2 pb-1">
                    <span className="text-[8px] font-semibold text-gray-900">9:41</span>
                    <div className="flex gap-1 items-center">
                      <div className="w-3 h-1.5 rounded-sm bg-gray-900" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-nanni-600 flex items-center justify-center">
                        <Moon className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-[9px] font-bold text-nanni-600">Dulces Sueños</span>
                    </div>
                    <span className="text-[7px] text-gray-400">Hoy</span>
                  </div>
                  <div className="px-3 pb-2 space-y-1">
                    {[
                      { icon: Sun, label: "Despertar", time: "07:15", detail: "Contento", bg: "bg-amber-50", ic: "text-amber-500" },
                      { icon: Droplets, label: "Alimentación", time: "07:30", detail: "Pecho 20min", bg: "bg-sky-50", ic: "text-sky-500" },
                      { icon: Moon, label: "Siesta", time: "09:30", detail: "1h 20min · Cuna", bg: "bg-nanni-50", ic: "text-nanni-500" },
                      { icon: Activity, label: "Juego", time: "11:05", detail: "45min · Parque", bg: "bg-emerald-50", ic: "text-emerald-500" },
                      { icon: Moon, label: "Siesta", time: "", detail: "En curso...", bg: "bg-nanni-50", ic: "text-nanni-500", active: true },
                    ].map((e) => (
                      <div key={e.label + e.time} className={`flex items-center gap-1.5 ${e.bg} rounded-lg p-1.5`}>
                        <div className="w-4 h-4 rounded-full bg-white/80 flex items-center justify-center shrink-0">
                          <e.icon className={`w-2 h-2 ${e.ic}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[7px] font-semibold text-gray-800">{e.label}</p>
                          <p className={`text-[6px] ${e.active ? "text-nanni-500 font-medium" : "text-gray-400"}`}>
                            {e.time && `${e.time} · `}{e.detail}
                          </p>
                        </div>
                        {e.active && <div className="w-1 h-1 rounded-full bg-nanni-500 animate-pulse-dot" />}
                      </div>
                    ))}
                  </div>
                  {/* Mini sleep chart */}
                  <div className="px-3 pb-1.5">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[7px] font-semibold text-gray-500">Sueño semanal</p>
                        <p className="text-[6px] text-emerald-600 font-semibold">+0.5h</p>
                      </div>
                      <div className="flex gap-0.5 h-6">
                        {[55, 68, 50, 78, 62, 72, 70].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col justify-end">
                            <div className={`w-full rounded-t-sm ${i === 3 ? "bg-nanni-500" : "bg-nanni-200"}`} style={{ height: `${h}%` }} />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-0.5">
                        {["L","M","X","J","V","S","D"].map((d) => (
                          <span key={d} className="text-[5px] text-gray-300 flex-1 text-center">{d}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="px-3 pb-3">
                    <div className="flex gap-1.5">
                      {[
                        { icon: Moon, c: "bg-nanni-100 text-nanni-600" },
                        { icon: Droplets, c: "bg-sky-100 text-sky-600" },
                        { icon: Smile, c: "bg-rose-100 text-rose-500" },
                        { icon: FileText, c: "bg-gray-100 text-gray-500" },
                      ].map((a, i) => (
                        <div key={i} className={`flex-1 ${a.c.split(" ")[0]} rounded-lg py-1.5 flex items-center justify-center`}>
                          <a.icon className={`w-2.5 h-2.5 ${a.c.split(" ")[1]}`} />
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
                  <div className="w-8 h-8 rounded-lg bg-nanni-50 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-nanni-600" />
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

              <div className="absolute top-0 right-0 w-80 h-80 bg-nanni-200/20 rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-0 left-8 w-48 h-48 bg-nanni-200/15 rounded-full blur-3xl -z-10" />
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
                    <div className="w-6 h-6 rounded-md bg-nanni-600 flex items-center justify-center">
                      <Moon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-nanni-600">
                      Tu Marca
                    </span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {[
                      {
                        icon: Moon,
                        l: "Siesta mañana",
                        d: "1h 20min · Cuna",
                        bg: "bg-nanni-50",
                        ic: "text-nanni-500",
                      },
                      {
                        icon: Droplets,
                        l: "Alimentación",
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
                        bg: "bg-nanni-50",
                        ic: "text-nanni-500",
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
                            className={`text-[10px] ${e.active ? "text-nanni-500 font-medium" : "text-gray-500"}`}
                          >
                            {e.d}
                          </p>
                        </div>
                        {e.active && (
                          <div className="w-1.5 h-1.5 rounded-full bg-nanni-500 animate-pulse-dot ml-auto shrink-0" />
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
                          bg: "bg-nanni-100",
                          ic: "text-nanni-600",
                        },
                        {
                          icon: Droplets,
                          l: "Alimentación",
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
      <section className="py-24 md:py-32 bg-gray-50/40 border-t border-gray-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="max-w-2xl mb-16">
              <p className="text-sm font-semibold text-nanni-600 tracking-wide mb-3">
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
          </AnimateOnScroll>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {painPoints.map((pain, painIdx) => (
              <AnimateOnScroll key={pain.title} delay={painIdx * 100}>
                <div className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-lg transition-shadow duration-300 border border-gray-100 h-full">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-colors bg-gray-100 group-hover:bg-gray-200">
                    <pain.icon className="w-5 h-5 text-gray-500" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-[15px]">
                    {pain.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {pain.text}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
          <AnimateOnScroll delay={400}>
            <p className="text-center text-lg text-gray-500 mt-14 font-medium">
              Nanni resuelve todo esto en 3 pasos.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ──── How It Works ──── */}
      <section id="como-funciona" className="py-24 md:py-32 bg-gray-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center mb-20">
              <p className="text-sm font-semibold text-nanni-600 tracking-wide mb-3">
                Cómo funciona
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">
                Tres pasos. Sin complicaciones.
              </h2>
            </div>
          </AnimateOnScroll>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            <div className="hidden md:block absolute top-14 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-nanni-200 via-nanni-300 to-nanni-200" />
            {steps.map((step, stepIdx) => (
              <AnimateOnScroll key={step.num} delay={stepIdx * 150}>
                <div className="relative text-center">
                  <div className="w-[72px] h-[72px] rounded-2xl bg-white shadow-card border border-gray-100 flex items-center justify-center mx-auto mb-6 relative z-10">
                    <step.icon className="w-7 h-7 text-nanni-600" />
                  </div>
                  <p className="text-xs font-bold text-nanni-600 tracking-widest mb-2">
                    PASO {step.num}
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                    {step.text}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
          {/* Result + CTA */}
          <div className="text-center mt-16">
            <p className="text-lg text-gray-600 font-medium mb-6">
              Y tus tardes vuelven a ser tuyas.
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 bg-nanni-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-nanni-700 transition shadow-lg shadow-nanni-600/20 text-sm"
            >
              Probar 14 días gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ──── Parent App Showcase ──── */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimateOnScroll>
              <div>
                <p className="text-sm font-semibold text-nanni-600 tracking-wide mb-3">
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
                    <div className="w-5 h-5 rounded-md bg-nanni-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-nanni-600" />
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
            </AnimateOnScroll>
            {/* Phone mock — Weekly Progress View */}
            <AnimateOnScroll delay={200}>
              <div className="flex justify-center">
                <div className="bg-gray-950 rounded-[2.5rem] p-2 shadow-mock max-w-[280px] w-full">
                  <div className="bg-white rounded-[2rem] overflow-hidden">
                    <div className="flex items-center justify-between px-6 pt-3 pb-1">
                      <span className="text-[10px] font-semibold text-gray-900">9:41</span>
                      <div className="w-16 h-5 bg-gray-900 rounded-full mx-auto" />
                      <div className="flex gap-0.5 items-center">
                        <div className="w-4 h-2 rounded-sm border border-gray-900" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-nanni-600 flex items-center justify-center">
                          <Moon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-nanni-600">Dulces Sueños</p>
                          <p className="text-[8px] text-gray-400">Resumen semanal</p>
                        </div>
                      </div>
                      <BarChart3 className="w-4 h-4 text-nanni-400" />
                    </div>
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-gray-700">Sueño de Mateo</p>
                        <span className="text-[8px] text-nanni-600 font-semibold bg-nanni-50 px-2 py-0.5 rounded-full">Esta semana</span>
                      </div>
                      <div className="flex gap-1.5 h-20 mb-1">
                        {[
                          { h: 65, l: "L" },
                          { h: 75, l: "M" },
                          { h: 60, l: "X" },
                          { h: 85, l: "J" },
                          { h: 70, l: "V" },
                          { h: 80, l: "S" },
                          { h: 78, l: "D" },
                        ].map((bar, bIdx) => (
                          <div key={bar.l} className="flex-1 flex flex-col justify-end items-center">
                            <div className={`w-full rounded-t-sm ${bIdx === 3 ? "bg-nanni-500" : "bg-nanni-200"}`} style={{ height: `${bar.h}%` }} />
                            <span className="text-[7px] text-gray-400 shrink-0 mt-0.5">{bar.l}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-3 mb-2">
                        <p className="text-[9px] text-gray-400">Media: 13.2h/día</p>
                        <p className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5">
                          <TrendingUp className="w-2.5 h-2.5" /> +0.5h
                        </p>
                      </div>
                      <div className="space-y-1.5 mt-3">
                        {[
                          { label: "Siestas/día", value: "2.3", trend: "+0.1", good: true },
                          { label: "Despertares nocturnos", value: "1.2", trend: "-0.5", good: true },
                          { label: "Tiempo dormido (noche)", value: "10.8h", trend: "+0.3h", good: true },
                        ].map((metric) => (
                          <div key={metric.label} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                            <span className="text-[9px] text-gray-600">{metric.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-gray-900">{metric.value}</span>
                              <span className="text-[8px] text-emerald-600 font-medium">{metric.trend}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <div className="bg-emerald-50 rounded-xl p-2.5">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-[9px] font-bold text-emerald-700">IA: Mejora detectada</p>
                            <p className="text-[8px] text-emerald-600">Adelantar acostarse 15min está funcionando</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ──── Dashboard Showcase ──── */}
      <section className="py-24 md:py-32 bg-gray-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-nanni-600 tracking-wide mb-3">
                Tu panel de control
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">
                De 8 familias en 8 chats a{" "}
                <span className="text-gradient bg-gradient-to-r from-nanni-700 to-nanni-400">
                  una sola pantalla
                </span>
              </h2>
              <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                Datos en tiempo real, alertas automáticas e insights de IA.
                Sin perseguir a nadie.
              </p>
            </div>
          </AnimateOnScroll>
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
                  app.nanniapp.com/familias
                </div>
              </div>
              <div className="flex">
                <div className="hidden md:flex w-48 bg-gray-50/50 border-r border-gray-100 flex-col py-5 px-3 shrink-0">
                  <div className="flex items-center gap-2 px-2 mb-6">
                    <div className="w-7 h-7 rounded-lg bg-nanni-600 flex items-center justify-center">
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
                        active: false,
                      },
                      { icon: Users, l: "Familias", active: false },
                      { icon: BarChart3, l: "Analíticas", active: true },
                      { icon: Palette, l: "Mi marca", active: false },
                    ].map((nav) => (
                      <div
                        key={nav.l}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs ${
                          nav.active
                            ? "bg-nanni-50 text-nanni-700 font-semibold"
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
                        Analíticas · Mateo (7 meses)
                      </p>
                      <p className="text-xs text-gray-400">
                        Últimos 7 días
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">Mejorando</span>
                      <div className="w-8 h-8 rounded-full bg-nanni-100 flex items-center justify-center text-[10px] font-bold text-nanni-700">
                        M
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { v: "13.5h", l: "Sueño total", t: "+0.5h", ic: Moon, icbg: "bg-nanni-50", icc: "text-nanni-600" },
                      { v: "1.2", l: "Despertares noche", t: "-40%", ic: TrendingUp, icbg: "bg-emerald-50", icc: "text-emerald-600" },
                      { v: "2.3", l: "Siestas/día", t: "Estable", ic: Sun, icbg: "bg-amber-50", icc: "text-amber-600" },
                    ].map((s) => (
                      <div key={s.l} className="bg-gray-50 rounded-xl p-3">
                        <div className={`w-6 h-6 ${s.icbg} rounded-lg flex items-center justify-center mb-1.5`}>
                          <s.ic className={`w-3 h-3 ${s.icc}`} />
                        </div>
                        <p className="text-lg font-bold text-gray-900">{s.v}</p>
                        <p className="text-[9px] text-gray-400">{s.l}</p>
                        <p className="text-[9px] font-medium text-emerald-600 mt-0.5">{s.t}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid md:grid-cols-5 gap-5">
                    <div className="md:col-span-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                        Sueño Semanal
                      </p>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex gap-2 h-28">
                          {[
                            { d: "L", n: 68, s: 22 },
                            { d: "M", n: 72, s: 20 },
                            { d: "X", n: 65, s: 25 },
                            { d: "J", n: 80, s: 15 },
                            { d: "V", n: 75, s: 18 },
                            { d: "S", n: 78, s: 16 },
                            { d: "D", n: 82, s: 14 },
                          ].map((bar) => (
                            <div key={bar.d} className="flex-1 flex flex-col justify-end items-center">
                              <div className="w-full flex flex-col gap-px" style={{ height: `${bar.n}%` }}>
                                <div className="flex-1 bg-nanni-400 rounded-t-sm" />
                                <div style={{ flexBasis: `${bar.s}%`, flexShrink: 0 }} className="bg-nanni-200 rounded-b-sm" />
                              </div>
                              <span className="text-[8px] text-gray-400 mt-1 shrink-0">{bar.d}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-100">
                          <span className="flex items-center gap-1 text-[8px] text-gray-500"><span className="w-2 h-2 rounded-sm bg-nanni-400" /> Noche</span>
                          <span className="flex items-center gap-1 text-[8px] text-gray-500"><span className="w-2 h-2 rounded-sm bg-nanni-200" /> Siestas</span>
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                        IA Insights
                      </p>
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl border bg-emerald-50 border-emerald-100">
                          <p className="text-[9px] font-bold text-emerald-700 mb-1">Mejora detectada</p>
                          <p className="text-[10px] text-gray-600 leading-relaxed">-40% despertares nocturnos. Adelantar acostarse 15 min está funcionando.</p>
                        </div>
                        <div className="p-3 rounded-xl border bg-amber-50 border-amber-100">
                          <p className="text-[9px] font-bold text-amber-700 mb-1">Sugerencia</p>
                          <p className="text-[10px] text-gray-600 leading-relaxed">Ventana vigilia tarde &gt;2h. Probar siesta a las 13:30.</p>
                        </div>
                        <div className="p-3 rounded-xl border bg-nanni-50 border-nanni-100">
                          <p className="text-[9px] font-bold text-nanni-700 mb-1">Próximo hito</p>
                          <p className="text-[10px] text-gray-600 leading-relaxed">A 7 meses, puede consolidar a 2 siestas.</p>
                        </div>
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
          <AnimateOnScroll>
            <div className="max-w-2xl mb-16">
              <p className="text-sm font-semibold text-nanni-600 tracking-wide mb-3">
                Funcionalidades
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">
                Todo lo que necesitas, nada que no
              </h2>
            </div>
          </AnimateOnScroll>
          {/* Hero features — larger cards for the top 2 */}
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            {features.slice(0, 2).map((feature, featureIdx) => (
              <AnimateOnScroll key={feature.title} delay={featureIdx * 100}>
                <div className="group bg-gradient-to-br from-nanni-50/80 to-white rounded-2xl p-8 md:p-10 shadow-card hover:shadow-lg transition-all duration-300 border border-nanni-100 h-full">
                  <div className="w-14 h-14 rounded-2xl bg-nanni-100 flex items-center justify-center mb-6 group-hover:bg-nanni-200 transition-colors">
                    <feature.icon className="w-7 h-7 text-nanni-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[15px] text-gray-500 leading-relaxed">
                    {feature.text}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.slice(2).map((feature, featureIdx) => (
              <AnimateOnScroll key={feature.title} delay={200 + featureIdx * 80}>
                <div className="group bg-white rounded-2xl p-6 md:p-8 shadow-card hover:shadow-lg transition-all duration-300 border border-gray-100 h-full">
                  <div className="w-11 h-11 rounded-xl bg-nanni-50 flex items-center justify-center mb-5 group-hover:bg-nanni-100 transition-colors">
                    <feature.icon className="w-5 h-5 text-nanni-600" />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {feature.text}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
          {/* CTA after features */}
          <div className="text-center mt-12">
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 text-nanni-600 font-semibold hover:text-nanni-700 transition text-sm"
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
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Diseñado para que{" "}
                <span className="text-gradient bg-gradient-to-r from-nanni-300 to-nanni-500">
                  ahorres horas
                </span>
              </h2>
              <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
                Familias que registran solas, datos que se analizan solos, y tú
                con tiempo para lo que importa: ayudar a dormir mejor.
              </p>
            </div>
          </AnimateOnScroll>
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
                  <stat.icon className="w-6 h-6 text-nanni-400" />
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
          <p className="text-center text-xs text-gray-600 mt-10">
            Datos basados en nuestras primeras 50 familias durante la fase beta.
          </p>
        </div>
      </section>

      {/* ──── Testimonials ──── */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-nanni-600 tracking-wide mb-3">
                Primeras usuarias
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">
                Lo que dicen las primeras usuarias
              </h2>
            </div>
          </AnimateOnScroll>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, tIdx) => (
              <AnimateOnScroll key={t.name} delay={tIdx * 100}>
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-card border border-gray-100 flex flex-col h-full">
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
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Trust Signals ──── */}
      <section className="py-6 bg-gray-50/80 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {[
              { icon: Shield, text: "Datos cifrados y protegidos" },
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
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-nanni-600 tracking-wide mb-3">
                Precios
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">
                Planes para asesoras, no para corporaciones
              </h2>
              <p className="mt-4 text-gray-500 text-lg">
                Tus familias nunca pagan. Tú eliges el plan que encaje.
              </p>
            </div>
          </AnimateOnScroll>
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-nanni-200 bg-nanni-50 px-4 py-2.5 text-sm font-medium text-nanni-800">
              <Sparkles className="w-4 h-4 shrink-0 text-nanni-600" />
              Prueba 14 días gratis — acceso Premium completo sin tarjeta
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto items-start">
            {plans.map((plan) => (
              <AnimateOnScroll key={plan.name} delay={plan.popular ? 100 : 0}>
                <div
                  className={`relative rounded-2xl ${
                    plan.popular
                      ? "bg-white ring-2 ring-nanni-500 shadow-xl shadow-nanni-500/10 md:-mt-4 md:mb-[-16px]"
                      : "bg-white border border-gray-200 shadow-card"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-nanni-600 text-white text-[11px] font-bold px-4 py-1 rounded-full">
                        Más popular
                      </span>
                    </div>
                  )}
                  <div className="p-6 md:p-8">
                    <h3 className="text-lg font-bold text-gray-900">
                      {plan.name}
                    </h3>
                    <p className="text-sm mt-1 text-gray-400">
                      {plan.desc}
                    </p>
                    <div className="mt-6 mb-6">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-2">
                        <span className="text-5xl font-extrabold tracking-tight text-gray-900">
                          {plan.discountedPrice}€
                        </span>
                        <span className="text-xl font-semibold line-through text-gray-400">
                          {plan.regularPrice}€
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          -50% 3 meses
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        después {plan.afterMonthly}€/mes
                      </p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 mt-0.5 shrink-0 text-nanni-600" />
                          <span className="text-sm text-gray-600">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/registro"
                      className={`block text-center font-semibold py-3 rounded-xl transition text-sm ${
                        plan.popular
                          ? "bg-nanni-600 text-white hover:bg-nanni-700"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ──── FAQ ──── */}
      <section id="faq" className="py-24 md:py-32 bg-gray-50/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-nanni-600 tracking-wide mb-3">
              FAQ
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-950 tracking-tight">
              Preguntas frecuentes
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, faqIdx) => (
              <details
                key={faq.q}
                open={faqIdx === 0}
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-nanni-600/10 rounded-full blur-3xl" />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-8">
            <Moon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Dedica tu tiempo a lo que importa: ayudar a familias a dormir mejor
          </h2>
          <p className="mt-5 text-gray-400 text-lg">
            14 días de Premium gratis. Sin tarjeta, sin compromiso.
          </p>
          <div className="mt-10">
            <Link
              href="/registro"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-semibold py-3.5 px-8 rounded-xl hover:bg-gray-100 transition text-sm"
            >
              Crea tu cuenta en 2 minutos
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
              <div className="w-7 h-7 rounded-lg bg-nanni-600 flex items-center justify-center">
                <Moon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-gray-900">Nanni</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {[
                { label: "Privacidad", href: "/privacidad" },
                { label: "Términos", href: "/terminos" },
                { label: "Cookies", href: "/cookies" },
                { label: "Aviso legal", href: "/aviso-legal" },
                { label: "Contacto", href: "mailto:hola@nanniapp.com" },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-sm text-gray-400 hover:text-gray-600 transition"
                >
                  {l.label}
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
