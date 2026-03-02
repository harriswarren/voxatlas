import { useState, useEffect } from "react";
import { Swords } from "lucide-react";
import Header from "../components/layout/Header";
import ModelComparison from "../components/transcription/ModelComparison";
import ModelRadar from "../components/charts/ModelRadar";
import { useTranscription } from "../hooks/useTranscription";
import { getLanguages } from "../api/languages";
import type { Language } from "../api/languages";
import { MODEL_OPTIONS } from "../utils/constants";

export default function Compare() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLang, setSelectedLang] = useState("");
  const [sampleIdx, setSampleIdx] = useState(0);
  const { compareResult, loading, error, runComparison } = useTranscription();

  useEffect(() => {
    getLanguages({ page_size: 500 }).then((res) => {
      setLanguages(res.languages);
      if (res.languages.length > 0 && !selectedLang) {
        setSelectedLang(res.languages[0].lang_code);
      }
    }).catch(() => {});
  }, []);

  const handleCompare = () => {
    if (selectedLang) {
      runComparison(selectedLang, sampleIdx, MODEL_OPTIONS.map((m) => m.value));
    }
  };

  return (
    <div>
      <Header title="Model Comparison Arena" subtitle="Compare CTC and LLM model Character Error Rate (CER) performance side by side" />
      <div className="p-6 space-y-6">
        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Language</label>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                {languages.map((l) => (
                  <option key={l.lang_code} value={l.lang_code}>
                    {l.language_name || l.lang_code} ({l.lang_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-24">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Sample #</label>
              <input
                type="number"
                min={0}
                value={sampleIdx}
                onChange={(e) => setSampleIdx(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>

            <button
              onClick={handleCompare}
              disabled={!selectedLang || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0668E1] text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Swords size={16} />
              {loading ? "Comparing..." : "Compare All Models"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {MODEL_OPTIONS.map((m) => (
              <span key={m.value} className="px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                {m.label} &middot; {m.vram} &middot; {m.speed}
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <strong>Note:</strong> {error}. Model comparison requires a GPU and the omnilingual-asr package.
          </div>
        )}

        {/* Results */}
        <ModelComparison results={compareResult?.results || []} loading={loading} />

        {/* Radar chart */}
        {compareResult && compareResult.results.length > 0 && (
          <ModelRadar results={compareResult.results} />
        )}
      </div>
    </div>
  );
}
