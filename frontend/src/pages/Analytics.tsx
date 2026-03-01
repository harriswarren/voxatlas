import { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import SummaryCards from "../components/charts/SummaryCards";
import CERHistogram from "../components/charts/CERHistogram";
import CERByRegion from "../components/charts/CERByRegion";
import CERvsHours from "../components/charts/CERvsHours";
import client from "../api/client";
import { formatCER } from "../utils/formatters";
import { cerToColor } from "../utils/constants";

interface LangRow {
  lang_code: string;
  language_name: string;
  cer: number;
}

export default function Analytics() {
  const [topBottom, setTopBottom] = useState<{ best: LangRow[]; worst: LangRow[] } | null>(null);

  useEffect(() => {
    client.get("/analytics/top-bottom?n=10").then(({ data }) => setTopBottom(data)).catch(() => {});
  }, []);

  return (
    <div>
      <Header title="CER Analytics Dashboard" subtitle="Global performance metrics for Omnilingual ASR" />
      <div className="p-6 space-y-6">
        <SummaryCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CERHistogram />
          <CERByRegion />
        </div>

        <CERvsHours />

        {topBottom && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Best-Performing Languages</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">#</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Language</th>
                    <th className="text-right py-2 text-gray-500 font-medium">CER</th>
                  </tr>
                </thead>
                <tbody>
                  {topBottom.best.map((lang, i) => (
                    <tr key={lang.lang_code} className="border-b border-gray-50">
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2">
                        <span className="font-medium text-gray-800">{lang.language_name || lang.lang_code}</span>
                        <span className="text-gray-400 ml-2 text-xs">{lang.lang_code}</span>
                      </td>
                      <td className="py-2 text-right">
                        <span className="font-medium" style={{ color: cerToColor(lang.cer) }}>
                          {formatCER(lang.cer)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Worst-Performing Languages</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">#</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Language</th>
                    <th className="text-right py-2 text-gray-500 font-medium">CER</th>
                  </tr>
                </thead>
                <tbody>
                  {topBottom.worst.map((lang, i) => (
                    <tr key={lang.lang_code} className="border-b border-gray-50">
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2">
                        <span className="font-medium text-gray-800">{lang.language_name || lang.lang_code}</span>
                        <span className="text-gray-400 ml-2 text-xs">{lang.lang_code}</span>
                      </td>
                      <td className="py-2 text-right">
                        <span className="font-medium" style={{ color: cerToColor(lang.cer) }}>
                          {formatCER(lang.cer)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
