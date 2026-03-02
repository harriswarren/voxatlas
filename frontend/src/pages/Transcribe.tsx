import { useState, useEffect } from "react";
import { Mic, AlertTriangle, Play } from "lucide-react";
import Header from "../components/layout/Header";
import TranscriptionPanel from "../components/transcription/TranscriptionPanel";
import { useTranscription } from "../hooks/useTranscription";
import { getLanguages } from "../api/languages";
import type { Language } from "../api/languages";
import type { TranscribeResult } from "../api/transcription";
import { MODEL_OPTIONS } from "../utils/constants";

const DEMO_RESULTS: Record<string, TranscribeResult> = {
  eng_Latn: {
    lang_code: "eng_Latn",
    model_card: "omniASR_CTC_1B_v2",
    prediction: "the quick brown fox jumps over the lazy dog",
    ground_truth: "the quick brown fox jumps over the lazy dog",
    cer: 0.0,
    latency_ms: 142,
  },
  fra_Latn: {
    lang_code: "fra_Latn",
    model_card: "omniASR_CTC_1B_v2",
    prediction: "bonjour comment allez vous aujourd'hui",
    ground_truth: "bonjour comment allez-vous aujourd'hui",
    cer: 2.6,
    latency_ms: 158,
  },
  swa_Latn: {
    lang_code: "swa_Latn",
    model_card: "omniASR_CTC_1B_v2",
    prediction: "habari yako leo hii ni siku nzuri",
    ground_truth: "habari yako leo hii ni siku nzuri",
    cer: 0.0,
    latency_ms: 135,
  },
  yor_Latn: {
    lang_code: "yor_Latn",
    model_card: "omniASR_CTC_1B_v2",
    prediction: "bawo ni o se n se loni",
    ground_truth: "bawo ni o ṣe ń ṣe loni",
    cer: 8.7,
    latency_ms: 167,
  },
};

export default function Transcribe() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLang, setSelectedLang] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[1].value);
  const [sampleIdx, setSampleIdx] = useState(0);
  const { result, loading, error, runTranscription } = useTranscription();
  const [demoResult, setDemoResult] = useState<TranscribeResult | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    getLanguages({ page_size: 500 }).then((res) => {
      setLanguages(res.languages);
      if (res.languages.length > 0 && !selectedLang) {
        setSelectedLang(res.languages[0].lang_code);
      }
    }).catch(() => {});
  }, []);

  const handleTranscribe = async () => {
    if (!selectedLang) return;

    // Try live transcription first
    const liveResult = await runTranscription(selectedLang, selectedModel, sampleIdx);
    if (liveResult) return;

    // If live fails, show a demo result
    setDemoLoading(true);
    setTimeout(() => {
      const demo = DEMO_RESULTS[selectedLang];
      if (demo) {
        setDemoResult({ ...demo, model_card: selectedModel });
      } else {
        // Generate a plausible demo result for any language
        const lang = languages.find((l) => l.lang_code === selectedLang);
        setDemoResult({
          lang_code: selectedLang,
          model_card: selectedModel,
          prediction: `[Demo] Sample transcription for ${lang?.language_name || selectedLang}`,
          ground_truth: `[Demo] Ground truth for ${lang?.language_name || selectedLang}`,
          cer: lang?.cer_7b_llm ?? 10.0,
          latency_ms: 120 + Math.floor(Math.random() * 100),
        });
      }
      setDemoLoading(false);
    }, 800);
  };

  const displayResult = result || demoResult;
  const isLoading = loading || demoLoading;

  return (
    <div>
      <Header title="Live Transcription Demo" subtitle="Transcribe audio from the Omnilingual ASR Corpus in real-time" />
      <div className="p-6 space-y-6">
        {/* GPU requirement banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-900 mb-1">GPU Required for Live Transcription</h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                Live ASR inference requires a <strong>GPU with 3GB+ VRAM</strong> and the <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">omnilingual-asr</code> package.
                Audio streaming also requires a <strong>HuggingFace token</strong> with access to the Omnilingual ASR Corpus.
              </p>
              <p className="text-sm text-amber-700 mt-2">
                Without a GPU, clicking <strong>Transcribe</strong> will show a <strong>demo result</strong> using cached CER data from the CSV.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <code className="bg-amber-100 px-2 py-1 rounded text-amber-800">pip install omnilingual-asr</code>
                <code className="bg-amber-100 px-2 py-1 rounded text-amber-800">HF_TOKEN=hf_xxx in .env</code>
                <code className="bg-amber-100 px-2 py-1 rounded text-amber-800">ASR_DEVICE=cuda in .env</code>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Language</label>
              <select
                value={selectedLang}
                onChange={(e) => { setSelectedLang(e.target.value); setDemoResult(null); }}
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
              disabled={!selectedLang || isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0668E1] text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isLoading ? (
                <><Mic size={16} /> Transcribing...</>
              ) : (
                <><Play size={16} /> Transcribe</>
              )}
            </button>
          </div>
        </div>

        {error && !demoResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            GPU not available — showing demo result with cached CER data instead.
          </div>
        )}

        {demoResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 rounded-full text-xs font-semibold text-blue-800">DEMO MODE</span>
            Showing simulated result using CER data from CSV. Connect a GPU for live inference.
          </div>
        )}

        {/* Transcription Results */}
        <TranscriptionPanel result={displayResult} loading={isLoading} />
      </div>
    </div>
  );
}
