import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Users,
  CheckCircle,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  Brain,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const mockFamilies = [
  {
    id: "mateo",
    initial: "M",
    name: "Mateo",
    age: "7 meses",
    lastRecord: "hace 23 min",
    status: "Mejorando",
    statusColor: "bg-emerald-100 text-emerald-700",
    statusIcon: TrendingUp,
    sleepHours: "13.5h",
    awakenings: "2",
    trend: "up",
  },
  {
    id: "lucia",
    initial: "L",
    name: "Lucía",
    age: "4 meses",
    lastRecord: "hace 2h",
    status: "En proceso",
    statusColor: "bg-amber-100 text-amber-700",
    statusIcon: Clock,
    sleepHours: "12h",
    awakenings: "4",
    trend: "neutral",
  },
  {
    id: "pablo",
    initial: "P",
    name: "Pablo",
    age: "11 meses",
    lastRecord: "desde ayer",
    status: "Atención",
    statusColor: "bg-red-100 text-red-700",
    statusIcon: AlertTriangle,
    sleepHours: "11h",
    awakenings: "5",
    trend: "down",
  },
  {
    id: "sofia",
    initial: "S",
    name: "Sofía",
    age: "6 meses",
    lastRecord: "hace 1h",
    status: "Mejorando",
    statusColor: "bg-emerald-100 text-emerald-700",
    statusIcon: TrendingUp,
    sleepHours: "14h",
    awakenings: "1",
    trend: "up",
  },
  {
    id: "emma",
    initial: "E",
    name: "Emma",
    age: "3 meses",
    lastRecord: "hace 45 min",
    status: "En proceso",
    statusColor: "bg-amber-100 text-amber-700",
    statusIcon: Clock,
    sleepHours: "15h",
    awakenings: "3",
    trend: "neutral",
  },
];

const mockInsights = [
  {
    type: "recommendation" as const,
    color: "bg-emerald-50 border-emerald-100",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Recomendación",
    text: "Mateo ha reducido despertares nocturnos un 40% esta semana. Sugerir adelantar la hora de acostarse 15 min.",
  },
  {
    type: "alert" as const,
    color: "bg-amber-50 border-amber-100",
    badge: "bg-amber-100 text-amber-700",
    label: "Alerta",
    text: "Lucía: las ventanas de vigilia superan lo recomendado para 4 meses (>2h). Revisar rutina de día.",
  },
  {
    type: "content" as const,
    color: "bg-blue-50 border-blue-100",
    badge: "bg-blue-100 text-blue-700",
    label: "Contenido listo",
    text: 'Post generado: "¿Tu bebé se despierta a las 5am? 3 claves para que aguante más"',
  },
  {
    type: "recommendation" as const,
    color: "bg-violet-50 border-violet-100",
    badge: "bg-violet-100 text-violet-700",
    label: "Patrón detectado",
    text: "Emma duerme 25 min más cuando la última toma es al menos 30 min antes de acostarse.",
  },
];

const mockPosts = [
  {
    title: "¿Tu bebé se despierta a las 5am? 3 claves para que aguante más",
    type: "Carrusel Instagram",
    status: "Listo",
  },
  {
    title: "Regresión de los 4 meses: qué es y cómo sobrevivir",
    type: "Post + Reel",
    status: "Listo",
  },
  {
    title: "Rutina de noche en 5 pasos (caso real anonimizado)",
    type: "Carrusel Instagram",
    status: "Borrador",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Asesora";

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Hola, {userName.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Aquí tienes el resumen de hoy.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Users,
            value: "8",
            label: "Familias activas",
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
          {
            icon: CheckCircle,
            value: "94%",
            label: "Registros al día",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            icon: AlertTriangle,
            value: "3",
            label: "Necesitan atención",
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            icon: FileText,
            value: "12",
            label: "Posts generados",
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div
              className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}
            >
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Families */}
        <div
          id="familias"
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Familias</h2>
            <span className="text-xs text-gray-400">
              {mockFamilies.length} activas
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {mockFamilies.map((family) => (
              <Link
                key={family.id}
                href={`/familia/${family.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition group"
              >
                <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700 shrink-0">
                  {family.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {family.name}
                    </p>
                    <span className="text-xs text-gray-400">{family.age}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Último registro: {family.lastRecord}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Sueño</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {family.sleepHours}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Despertares</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {family.awakenings}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${family.statusColor}`}
                >
                  {family.status}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 transition shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div
          id="analytics"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="p-5 border-b border-gray-50 flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-600" />
            <h2 className="font-bold text-gray-900">IA Insights</h2>
          </div>
          <div className="p-4 space-y-3">
            {mockInsights.map((insight, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-xl border ${insight.color}`}
              >
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${insight.badge}`}
                >
                  {insight.label}
                </span>
                <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                  {insight.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content for socials */}
      <div
        id="contenido"
        className="bg-white rounded-2xl border border-gray-100 shadow-sm"
      >
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            <h2 className="font-bold text-gray-900">
              Contenido para tus redes
            </h2>
          </div>
          <span className="text-xs text-gray-400">Generado por IA</span>
        </div>
        <div className="divide-y divide-gray-50">
          {mockPosts.map((post, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {post.title}
                </p>
                <p className="text-xs text-gray-400">{post.type}</p>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                  post.status === "Listo"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {post.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
