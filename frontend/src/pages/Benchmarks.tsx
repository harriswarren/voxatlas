import { useEffect, useState } from "react";
import { ExternalLink, CheckCircle2, XCircle, Database } from "lucide-react";
import Header from "../components/layout/Header";
import client from "../api/client";
import { cerToColor } from "../utils/constants";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface BenchmarkInfo {
  name: string;
  full_name: string;
  source: string;
  hf_dataset: string;
  description: string;
  total_languages: number;
  overlap_count: number;
  overlap_languages: string[];
  only_in_benchmark: string[];
  omni_unique_count: number;
  avg_cer_overlap: number;
}

interface BenchmarkData {
  benchmarks: Record<string, BenchmarkInfo>;
  language_coverage: Record<string, string[]>;
}

const BENCH_COLORS: Record<string, string> = {
  fleurs: "#0668E1",
  common_voice: "#F59E0B",
  afrispeech: "#22C55E",
};

export default function Benchmarks() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [expandedBench, setExpandedBench] = useState<string | null>(null);

  useEffect(() => {
    client
      .get<BenchmarkData>("/analytics/benchmarks")
      .then(({ data: resp }) => setData(resp))
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div>
        <Header
          title="Evaluation Benchmarks"
          subtitle="Cross-reference omniASR with major multilingual ASR benchmarks"
        />
        <div className="p-6 text-gray-400">Loading benchmarks...</div>
      </div>
    );
  }

  const benchmarks = Object.entries(data.benchmarks);

  // Coverage summary for pie chart
  const totalLangs = Object.keys(data.language_coverage).length;
  const coveredByAny = Object.values(data.language_coverage).filter(
    (b) => b.length > 0
  ).length;
  const coveredByNone = totalLangs - coveredByAny;

  const coveragePie = [
    { name: "In 1+ benchmarks", value: coveredByAny, fill: "#0668E1" },
    { name: "omniASR only", value: coveredByNone, fill: "#E2E8F0" },
  ];

  // Overlap bar data
  const overlapBars = benchmarks.map(([key, b]) => ({
    name: b.name,
    overlap: b.overlap_count,
    unique: b.total_languages - b.overlap_count,
    color: BENCH_COLORS[key] || "#94A3B8",
    avg_cer: b.avg_cer_overlap,
  }));

  return (
    <div>
      <Header
        title="Evaluation Benchmarks"
        subtitle="Cross-reference omniASR coverage with FLEURS, Common Voice, and AfriSpeech"
      />
      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              omniASR Languages
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {totalLangs.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              In 1+ Benchmark
            </p>
            <p className="text-3xl font-bold text-[#0668E1] mt-1">
              {coveredByAny}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {((coveredByAny / totalLangs) * 100).toFixed(1)}% of total
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              omniASR-Only
            </p>
            <p className="text-3xl font-bold text-gray-600 mt-1">
              {coveredByNone.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Not in any standard benchmark
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Benchmarks Tracked
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {benchmarks.length}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              FLEURS, Common Voice, AfriSpeech
            </p>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overlap bar chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Benchmark Overlap with omniASR
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              How many benchmark languages are also in omniASR?
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={overlapBars}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const item = payload[0]?.payload;
                    if (!item) return null;
                    return (
                      <div className="bg-white p-2 rounded-lg border shadow-sm text-sm">
                        <p className="font-medium">{item.name}</p>
                        <p>
                          {item.overlap} overlapping languages
                        </p>
                        <p>Avg CER: {item.avg_cer}%</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="overlap" radius={[4, 4, 0, 0]}>
                  {overlapBars.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Coverage pie */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Benchmark Coverage
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              omniASR covers {coveredByNone.toLocaleString()} languages not in
              any standard benchmark
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={coveragePie}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({
                    name,
                    percent,
                  }: {
                    name?: string;
                    percent?: number;
                  }) =>
                    `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {coveragePie.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={30}
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Benchmark detail cards */}
        {benchmarks.map(([key, bench]) => (
          <div
            key={key}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-10 rounded-full"
                  style={{
                    backgroundColor: BENCH_COLORS[key] || "#94A3B8",
                  }}
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {bench.name}
                  </h3>
                  <p className="text-sm text-gray-500">{bench.description}</p>
                </div>
              </div>
              <a
                href={`https://huggingface.co/datasets/${bench.hf_dataset}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <Database size={14} />
                {bench.hf_dataset}
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-500">Source</p>
                <p className="text-sm font-medium">{bench.source}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Languages</p>
                <p className="text-sm font-medium">{bench.total_languages}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Overlap with omniASR</p>
                <p className="text-sm font-semibold text-green-600">
                  {bench.overlap_count}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Only in Benchmark</p>
                <p className="text-sm font-medium text-amber-600">
                  {bench.only_in_benchmark.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg CER (overlap)</p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: cerToColor(bench.avg_cer_overlap) }}
                >
                  {bench.avg_cer_overlap}%
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                setExpandedBench(expandedBench === key ? null : key)
              }
              className="mt-3 text-xs text-blue-600 hover:underline cursor-pointer"
            >
              {expandedBench === key
                ? "Hide language list"
                : `Show ${bench.overlap_count} overlapping languages`}
            </button>

            {expandedBench === key && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <div className="flex gap-6">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-green-700 mb-2 flex items-center gap-1">
                      <CheckCircle2 size={12} /> In both omniASR &{" "}
                      {bench.name} ({bench.overlap_count})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {bench.overlap_languages.map((code) => (
                        <span
                          key={code}
                          className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                  {bench.only_in_benchmark.length > 0 && (
                    <div className="flex-1">
                      <p className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
                        <XCircle size={12} /> Only in {bench.name} (
                        {bench.only_in_benchmark.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {bench.only_in_benchmark.map((code) => (
                          <span
                            key={code}
                            className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 text-sm text-blue-800">
          <strong>Why benchmarks matter:</strong> omniASR covers 1,600+
          languages, but only ~{coveredByAny} are in standard evaluation
          benchmarks. The remaining {coveredByNone.toLocaleString()} languages
          have no external ground truth for comparison — making VoxAtlas's own
          evaluation data uniquely valuable for low-resource language research.
        </div>
      </div>
    </div>
  );
}
