import { useEffect, useState } from "react";
import { Languages, BarChart3, TrendingDown, Clock } from "lucide-react";
import client from "../../api/client";
import { formatCER, formatNumber, formatHours } from "../../utils/formatters";
import CERTooltip from "../ui/CERTooltip";

interface Stats {
  total_languages: number;
  mean_cer: number;
  median_cer: number;
  pct_under_10: number;
  total_training_hours: number;
  min_cer: number;
  max_cer: number;
}

export default function SummaryCards() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    client.get<Stats>("/analytics/summary").then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
            <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Languages",
      value: formatNumber(stats.total_languages),
      icon: Languages,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Mean CER (Character Error Rate)",
      value: formatCER(stats.mean_cer),
      icon: BarChart3,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Under 10% CER",
      sublabel: "(Character Error Rate)",
      value: `${stats.pct_under_10.toFixed(1)}%`,
      icon: TrendingDown,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Training Hours",
      value: formatHours(stats.total_training_hours),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon size={18} className={color} />
            </div>
            <span className="text-sm text-gray-500 inline-flex items-center gap-1">{label}{(label.includes("CER")) && <CERTooltip size={12} />}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      ))}
    </div>
  );
}
