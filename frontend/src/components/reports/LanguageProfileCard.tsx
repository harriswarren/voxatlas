import { useRef } from "react";
import { Download } from "lucide-react";
import { useExport } from "../../hooks/useExport";
import { formatCER, formatHours } from "../../utils/formatters";
import { cerToColor } from "../../utils/constants";
import type { LanguageDetail } from "../../api/languages";

interface LanguageProfileCardProps {
  language: LanguageDetail;
}

export default function LanguageProfileCard({ language }: LanguageProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { exportPDF } = useExport();

  const handleExport = () => {
    if (cardRef.current) {
      exportPDF(cardRef.current, `voxatlas-${language.lang_code}-profile`);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0668E1] text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Download size={14} />
          Export PDF
        </button>
      </div>

      <div ref={cardRef} className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {language.language_name || language.lang_code}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {language.lang_code} &middot; {language.script} &middot; {language.family || "Unknown family"}
            </p>
          </div>
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: language.endangerment === "Safe" ? "#dcfce7" : "#fef3c7",
              color: language.endangerment === "Safe" ? "#166534" : "#92400e",
            }}
          >
            {language.endangerment}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">CER (7B LLM)</p>
            <p className="text-2xl font-bold" style={{ color: cerToColor(language.cer_7b_llm) }}>
              {formatCER(language.cer_7b_llm)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Training Hours</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatHours(language.training_hours)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Region</p>
            <p className="text-lg font-bold text-gray-800">
              {language.continent || "Unknown"}
            </p>
          </div>
        </div>

        {Object.keys(language.cer_by_model).length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">CER Across Models</h3>
            <div className="space-y-2">
              {Object.entries(language.cer_by_model).map(([model, cer]) => (
                <div key={model} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-40 text-right">{model}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(cer, 100)}%`,
                        backgroundColor: cerToColor(cer),
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium w-14 text-right">{formatCER(cer)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4 text-[10px] text-gray-400 flex justify-between">
          <span>VoxAtlas &middot; Meta AI Omnilingual ASR</span>
          <span>Generated {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
