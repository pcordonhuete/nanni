"use client";

import { useRouter, useSearchParams } from "next/navigation";

const periods = [
  { label: "Esta semana", param: "semana" },
  { label: "Este mes", param: "mes" },
  { label: "Último trimestre", param: "trimestre" },
] as const;

export function AnalyticsPeriodSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("period") || "semana";

  return (
    <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden self-start">
      {periods.map((p) => (
        <button
          key={p.param}
          type="button"
          onClick={() => {
            const q = new URLSearchParams(searchParams.toString());
            q.set("period", p.param);
            router.push(`/analiticas?${q.toString()}`);
          }}
          className={`text-xs font-medium px-3.5 py-2 transition ${
            current === p.param ? "bg-nanni-600 text-white" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
