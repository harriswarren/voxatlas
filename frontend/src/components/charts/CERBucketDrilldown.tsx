import { useEffect, useState } from "react";
import { X } from "lucide-react";
import client from "../../api/client";
import { formatCER } from "../../utils/formatters";
import { cerToColor } from "../../utils/constants";

interface BucketLang {
  lang_code: string;
  language_name: string;
  cer: number;
  training_hours: number;
  continent: string;
  script: string;
  endangerment: string;
}

interface CERBucketDrilldownProps {
  bucket: string | null;
  onClose: () => void;
}

export default function CERBucketDrilldown({ bucket, onClose }: CERBucketDrilldownProps) {
  const [languages, setLanguages] = useState<BucketLang[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bucket) return;
    setLoading(true);
    client
      .get<BucketLang[]>(`/analytics/cer-bucket/${encodeURIComponent(bucket)}`)
      .then(({ data }) => setLanguages(data))
      .catch(() => setLanguages([]))
      .finally(() => setLoading(false));
  }, [bucket]);

  if (!bucket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              CER Bucket: {bucket}%
            </h2>
            <p className="text-sm text-gray-500">
              {loading ? "Loading..." : `${languages.length} languages in this range`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-2">
          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading languages...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">Language</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Code</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Script</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Continent</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Hours</th>
                  <th className="text-right py-2 text-gray-500 font-medium">CER</th>
                </tr>
              </thead>
              <tbody>
                {languages.map((lang) => (
                  <tr key={lang.lang_code} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-800">
                      {lang.language_name || "\u2014"}
                    </td>
                    <td className="py-2 text-gray-500 font-mono text-xs">{lang.lang_code}</td>
                    <td className="py-2 text-gray-500">{lang.script}</td>
                    <td className="py-2 text-gray-500">{lang.continent || "\u2014"}</td>
                    <td className="py-2 text-right text-gray-500">
                      {lang.training_hours > 0 ? lang.training_hours.toFixed(1) : "\u2014"}
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
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
          Click outside or press X to close
        </div>
      </div>
    </div>
  );
}
