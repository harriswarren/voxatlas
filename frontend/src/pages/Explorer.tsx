import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "../components/layout/Header";
import LanguageMap from "../components/maps/LanguageMap";
import { useLanguages, useFilterOptions } from "../hooks/useLanguages";
import { formatCER, formatHours } from "../utils/formatters";
import { cerToColor, ENDANGERMENT_LEVELS, endangermentStyle } from "../utils/constants";
import type { Language, MapPoint } from "../api/languages";
import { CERBadge } from "../components/ui/CERTooltip";

export default function Explorer() {
  const { data, filters, setFilters, loading } = useLanguages({ page_size: 25 });
  const { scripts, continents } = useFilterOptions();
  const [searchInput, setSearchInput] = useState("");
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);

  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput || undefined, page: 1 });
  };

  return (
    <div>
      <Header title="Language Explorer" subtitle="Interactive map and searchable table of 1,600+ supported languages" />
      <div className="p-6 space-y-6">
        {/* Map */}
        <LanguageMap
          onSelect={(pt: MapPoint) => {
            setSelectedLang({
              lang_code: pt.lang_code,
              language_name: pt.language_name,
              script: "",
              region: "",
              continent: pt.continent,
              family: pt.family || "",
              countries: pt.countries || [],
              latitude: pt.latitude,
              longitude: pt.longitude,
              training_hours: pt.training_hours,
              cer_7b_llm: pt.cer,
              cer_7b_ctc: 0,
              endangerment: pt.endangerment,
            });
          }}
        />

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search languages..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filters.region || ""}
              onChange={(e) => setFilters({ ...filters, region: e.target.value || undefined, page: 1 })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">All Continents</option>
              {continents.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filters.script || ""}
              onChange={(e) => setFilters({ ...filters, script: e.target.value || undefined, page: 1 })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">All Scripts</option>
              {scripts.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={filters.endangered || ""}
              onChange={(e) => setFilters({ ...filters, endangered: e.target.value || undefined, page: 1 })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">All Status</option>
              {ENDANGERMENT_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

            <select
              value={filters.cer_max !== undefined ? String(filters.cer_max) : ""}
              onChange={(e) => setFilters({ ...filters, cer_max: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">Any CER</option>
              <option value="5">CER &le; 5%</option>
              <option value="10">CER &le; 10%</option>
              <option value="20">CER &le; 20%</option>
              <option value="50">CER &le; 50%</option>
            </select>
          </div>
        </div>

        {/* Selected language detail */}
        {selectedLang && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedLang.language_name || selectedLang.lang_code}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedLang.lang_code}
                  {selectedLang.countries?.length > 0 && ` · ${selectedLang.countries.join(", ")}`}
                  {selectedLang.continent && ` · ${selectedLang.continent}`}
                  {selectedLang.family && ` · ${selectedLang.family}`}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold" style={{ color: cerToColor(selectedLang.cer_7b_llm) }}>
                  {formatCER(selectedLang.cer_7b_llm)}
                </span>
                <p className="text-xs text-gray-500">Character Error Rate (7B LLM)</p>
              </div>
            </div>
          </div>
        )}

        {/* Language table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading languages...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {[
                        { key: "language_name", label: "Language" },
                        { key: "lang_code", label: "Code" },
                        { key: "script", label: "Script" },
                        { key: "continent", label: "Country" },
                        { key: "continent", label: "Continent", sortKey: "continent" },
                        { key: "training_hours", label: "Training Hours" },
                        { key: "cer_7b_llm", label: "__CER_BADGE__" },
                        { key: "endangerment", label: "Status" },
                      ].map((col, idx) => (
                        <th
                          key={`${col.key}-${idx}`}
                          onClick={() => {
                            const sortKey = (col as { sortKey?: string }).sortKey || col.key;
                            setFilters({
                              ...filters,
                              sort_by: sortKey,
                              sort_desc: filters.sort_by === sortKey ? !filters.sort_desc : false,
                            });
                          }}
                          className="text-left py-3 px-4 text-gray-600 font-medium cursor-pointer hover:text-gray-900 select-none whitespace-nowrap"
                        >
                          {col.label === "__CER_BADGE__" ? <CERBadge label="CER (7B)" /> : col.label}
                          {filters.sort_by === ((col as { sortKey?: string }).sortKey || col.key) && (
                            <span className="ml-1">{filters.sort_desc ? "\u25BC" : "\u25B2"}</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data?.languages.map((lang) => (
                      <tr
                        key={lang.lang_code}
                        onClick={() => setSelectedLang(lang)}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {lang.language_name || "\u2014"}
                        </td>
                        <td className="py-3 px-4 text-gray-500 font-mono text-xs">{lang.lang_code}</td>
                        <td className="py-3 px-4 text-gray-500">{lang.script || "\u2014"}</td>
                        <td className="py-3 px-4 text-gray-500">
                          {lang.countries?.length > 0 ? lang.countries.join(", ") : lang.region || "\u2014"}
                        </td>
                        <td className="py-3 px-4 text-gray-500">{lang.continent || "\u2014"}</td>
                        <td className="py-3 px-4 text-gray-500">{formatHours(lang.training_hours)}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium" style={{ color: cerToColor(lang.cer_7b_llm) }}>
                            {formatCER(lang.cer_7b_llm)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {(() => {
                            const style = endangermentStyle(lang.endangerment);
                            return (
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ backgroundColor: style.bg, color: style.color }}
                              >
                                {lang.endangerment}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    Showing {((data.page - 1) * data.page_size) + 1}-{Math.min(data.page * data.page_size, data.total)} of {data.total}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={data.page <= 1}
                      onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                      className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-gray-600">Page {data.page}</span>
                    <button
                      disabled={data.page * data.page_size >= data.total}
                      onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                      className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
