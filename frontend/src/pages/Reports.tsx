import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import LanguageProfileCard from "../components/reports/LanguageProfileCard";
import FullReport from "../components/reports/FullReport";
import SummaryCards from "../components/charts/SummaryCards";
import CERHistogram from "../components/charts/CERHistogram";
import CERByRegion from "../components/charts/CERByRegion";
import { getLanguages, getLanguage } from "../api/languages";
import type { Language, LanguageDetail } from "../api/languages";

export default function Reports() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [langDetail, setLangDetail] = useState<LanguageDetail | null>(null);
  const [tab, setTab] = useState<"profile" | "full">("profile");

  useEffect(() => {
    getLanguages({ page_size: 500 }).then((res) => {
      setLanguages(res.languages);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCode) {
      getLanguage(selectedCode).then(setLangDetail).catch(() => setLangDetail(null));
    }
  }, [selectedCode]);

  return (
    <div>
      <Header title="Report Generator" subtitle="Export publication-ready profiles and reports" />
      <div className="p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab("profile")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              tab === "profile" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Language Profile Card
          </button>
          <button
            onClick={() => setTab("full")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              tab === "full" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Full Report
          </button>
        </div>

        {tab === "profile" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Select Language
              </label>
              <select
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">Choose a language...</option>
                {languages.map((l) => (
                  <option key={l.lang_code} value={l.lang_code}>
                    {l.language_name || l.lang_code} ({l.lang_code})
                  </option>
                ))}
              </select>
            </div>

            {langDetail ? (
              <LanguageProfileCard language={langDetail} />
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 p-10 shadow-sm text-center text-gray-400">
                Select a language to generate a profile card
              </div>
            )}
          </div>
        )}

        {tab === "full" && (
          <FullReport>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">VoxAtlas Performance Report</h1>
              <p className="text-gray-500 mt-2">Meta AI Omnilingual ASR System</p>
              <p className="text-sm text-gray-400 mt-1">Generated {new Date().toLocaleDateString()}</p>
            </div>
            <SummaryCards />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <CERHistogram />
              <CERByRegion />
            </div>
          </FullReport>
        )}
      </div>
    </div>
  );
}
