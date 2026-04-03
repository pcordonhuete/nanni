import Link from "next/link";
import {
  ArrowLeft,
  Moon,
  TrendingUp,
  Clock,
  Baby,
  Brain,
} from "lucide-react";

const mockTimeline = [
  {
    time: "07:00",
    emoji: "🌅",
    title: "Despertar",
    detail: "Se despertó contento, sin llorar",
    color: "bg-amber-50 border-amber-100",
  },
  {
    time: "07:15",
    emoji: "🍼",
    title: "Toma",
    detail: "Pecho izq. 12min + derecho 8min",
    color: "bg-orange-50 border-orange-100",
  },
  {
    time: "07:45",
    emoji: "💩",
    title: "Pañal",
    detail: "Deposición normal",
    color: "bg-yellow-50 border-yellow-100",
  },
  {
    time: "08:00",
    emoji: "🧸",
    title: "Juego libre",
    detail: "45min · Humor: contento",
    color: "bg-green-50 border-green-100",
  },
  {
    time: "09:30",
    emoji: "😴",
    title: "Siesta mañana",
    detail: "1h 20min · En cuna · Se durmió solo",
    color: "bg-violet-50 border-violet-100",
  },
  {
    time: "10:50",
    emoji: "🍼",
    title: "Toma",
    detail: "Pecho izq. 15min + derecho 10min",
    color: "bg-orange-50 border-orange-100",
  },
  {
    time: "11:05",
    emoji: "🧸",
    title: "Juego libre",
    detail: "45min · Humor: contento",
    color: "bg-green-50 border-green-100",
  },
  {
    time: "12:00",
    emoji: "🍼",
    title: "Toma",
    detail: "Biberón 150ml",
    color: "bg-orange-50 border-orange-100",
  },
  {
    time: "14:00",
    emoji: "🌙",
    title: "Siesta tarde",
    detail: "En curso... · En cuna",
    color: "bg-indigo-50 border-indigo-100",
    active: true,
  },
];

const mockWeekData = [
  { day: "L", hours: 13.0, awakenings: 3 },
  { day: "M", hours: 13.5, awakenings: 2 },
  { day: "X", hours: 12.5, awakenings: 4 },
  { day: "J", hours: 14.0, awakenings: 2 },
  { day: "V", hours: 13.5, awakenings: 1 },
  { day: "S", hours: 14.5, awakenings: 1 },
  { day: "D", hours: 13.0, awakenings: 2 },
];

const babyData: Record<
  string,
  { name: string; age: string; status: string; statusColor: string }
> = {
  mateo: {
    name: "Mateo",
    age: "7 meses",
    status: "Mejorando",
    statusColor: "bg-emerald-100 text-emerald-700",
  },
  lucia: {
    name: "Lucía",
    age: "4 meses",
    status: "En proceso",
    statusColor: "bg-amber-100 text-amber-700",
  },
  pablo: {
    name: "Pablo",
    age: "11 meses",
    status: "Atención",
    statusColor: "bg-red-100 text-red-700",
  },
  sofia: {
    name: "Sofía",
    age: "6 meses",
    status: "Mejorando",
    statusColor: "bg-emerald-100 text-emerald-700",
  },
  emma: {
    name: "Emma",
    age: "3 meses",
    status: "En proceso",
    statusColor: "bg-amber-100 text-amber-700",
  },
};

export default async function FamiliaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const baby = babyData[id] || {
    name: "Bebé",
    age: "",
    status: "Activo",
    statusColor: "bg-gray-100 text-gray-700",
  };

  const maxHours = Math.max(...mockWeekData.map((d) => d.hours));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center text-2xl">
            <Baby className="w-7 h-7 text-violet-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{baby.name}</h1>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${baby.statusColor}`}
              >
                {baby.status}
              </span>
            </div>
            <p className="text-gray-500">{baby.age}</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: Moon,
            label: "Sueño total",
            value: "13.5h",
            sub: "ayer",
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
          {
            icon: Clock,
            label: "Despertares",
            value: "2",
            sub: "noche",
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            icon: TrendingUp,
            label: "Tendencia",
            value: "+40%",
            sub: "vs. sem. pasada",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            icon: Brain,
            label: "IA Score",
            value: "8.5",
            sub: "/10",
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
          >
            <div
              className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mb-2`}
            >
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-400">
              {stat.label}{" "}
              <span className="text-gray-300">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">
              Hoy, 3 abril 🌙
            </h2>
            <span className="text-xs text-gray-400">
              {mockTimeline.length} registros
            </span>
          </div>
          <div className="p-4">
            <div className="relative">
              <div className="absolute left-[23px] top-4 bottom-4 w-px bg-gray-100" />
              <div className="space-y-1">
                {mockTimeline.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className="w-[47px] text-right shrink-0">
                      <span className="text-xs text-gray-400 font-mono">
                        {entry.time}
                      </span>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-white border-2 border-violet-300 mt-1.5 shrink-0 relative z-10" />
                    <div
                      className={`flex-1 flex items-start gap-2.5 ${entry.color} border rounded-xl p-3 ${entry.active ? "ring-2 ring-violet-300" : ""}`}
                    >
                      <span className="text-lg shrink-0">{entry.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {entry.title}
                        </p>
                        <p
                          className={`text-xs ${entry.active ? "text-violet-600 font-medium" : "text-gray-500"}`}
                        >
                          {entry.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly chart + insights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly sleep chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4">
              Sueño semanal
            </h3>
            <div className="flex items-end gap-2 h-32">
              {mockWeekData.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {d.hours}h
                  </span>
                  <div
                    className="w-full bg-violet-200 rounded-t-lg transition-all"
                    style={{
                      height: `${(d.hours / maxHours) * 100}%`,
                      minHeight: "8px",
                    }}
                  />
                  <span className="text-[10px] text-gray-500 font-medium">
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
              <span className="text-xs text-gray-400">Media semanal</span>
              <span className="text-sm font-bold text-violet-600">
                {(
                  mockWeekData.reduce((acc, d) => acc + d.hours, 0) /
                  mockWeekData.length
                ).toFixed(1)}
                h
              </span>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-violet-600" />
              <h3 className="font-bold text-gray-900">
                Recomendación IA
              </h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {baby.name} ha reducido despertares nocturnos un 40% esta semana.
              Los datos sugieren que adelantar la hora de acostarse 15 minutos
              podría consolidar aún más el sueño nocturno.
            </p>
            <div className="mt-4 flex gap-2">
              <button className="text-xs font-medium bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 transition">
                Enviar a la familia
              </button>
              <button className="text-xs font-medium bg-white text-violet-700 px-3 py-1.5 rounded-lg hover:bg-violet-50 transition border border-violet-200">
                Editar
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3">
              Notas de la asesora
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400">31 marzo</p>
                <p className="text-sm text-gray-700">
                  Empezamos con método de acompañamiento gradual. Padres
                  motivados.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400">28 marzo</p>
                <p className="text-sm text-gray-700">
                  Primera consulta. Problemas principales: despertares
                  frecuentes, dificultad para conciliar.
                </p>
              </div>
            </div>
            <button className="w-full mt-3 text-xs font-medium text-violet-600 hover:text-violet-700 py-2 rounded-lg hover:bg-violet-50 transition">
              + Añadir nota
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
