import { useState, useEffect } from "react";
import { Mic } from "lucide-react";
import Header from "../components/layout/Header";
import AudioPlayer from "../components/transcription/AudioPlayer";
import TranscriptionPanel from "../components/transcription/TranscriptionPanel";
import { useTranscription } from "../hooks/useTranscription";
import { getAudioUrl } from "../api/transcription";
import { getLanguages } from "../api/languages";
import type { Language } from "../api/languages";
import { MODEL_OPTIONS } from "../utils/constants";

export default function Transcribe() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLang, setSelectedLang] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[1].value);
  const [sampleIdx, setSampleIdx] = useState(0);
  const { result, loading, error, runTranscription } = useTranscription();

  useEffect(() => {
    getLanguages({ page_size: 500 }).then((res) => {
      setLanguages(res.languages);
      if (res.languages.length > 0 && !selectedLang) {
        setSelectedLang(res.languages[0].lang_code);
      }
    }).catch(() => {});
  }, []);

  const handleTranscribe = () => {
    if (selectedLang) {
      runTranscription(selectedLang, selectedModel, sampleIdx);
    }
  };

  return (
    <div>
      <Header title="Live Transcription Demo" subtitle="Transcribe audio from the Omnilingual ASR Corpus in real-time" />
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

            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} ({m.vram})
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
              onClick={handleTranscribe}
              disabled={!selectedLang || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0668E1] text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Mic size={16} />
              {loading ? "Transcribing..." : "Transcribe"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <strong>Note:</strong> {error}. Live transcription requires a GPU and the omnilingual-asr package.
            The analytics and explorer features work without a GPU.
          </div>
        )}

        {/* Audio Player */}
        {selectedLang && (
          <AudioPlayer url={getAudioUrl(selectedLang, sampleIdx)} />
        )}

        {/* Transcription Results */}
        <TranscriptionPanel result={result} loading={loading} />
      </div>
    </div>
  );
}
