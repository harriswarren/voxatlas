# VoxAtlas — Windsurf Build Prompt

## Drop this entire file into Windsurf as your initial prompt. It contains the full architecture, file structure, and implementation details for the VoxAtlas dashboard.

---

## PROJECT OVERVIEW

Build "VoxAtlas" — a web-based Low-Resource Language Preservation Dashboard that showcases Meta AI's Omnilingual ASR system. The app lets users explore 1,600+ languages, view CER (Character Error Rate) analytics, run live ASR transcription, compare model sizes, and generate reports. It uses Meta's Llama API for AI-powered insights.

Tech Stack:
- Frontend: React 18 + Vite 5 + TypeScript + Tailwind CSS 3 + Recharts + MapLibre GL JS + WaveSurfer.js
- Backend: FastAPI (Python 3.11+) + omnilingual-asr + HuggingFace datasets + SQLite
- AI Layer: Llama API (OpenAI SDK compatible) for natural language insights
- Export: html2canvas + jsPDF for report generation
- Deployment: Docker + docker-compose

## PROJECT STRUCTURE

```
voxatlas/
├── README.md
├── LICENSE                         # Apache 2.0
├── docker-compose.yml
├── .env.example
├── Makefile
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── public/
│   │   ├── voxatlas-logo.svg
│   │   └── favicon.ico
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                 # React Router with sidebar layout
│       ├── api/
│       │   ├── client.ts           # Axios instance, base URL from env
│       │   ├── languages.ts        # getLanguages(), getLanguage(code), getAudio(code)
│       │   ├── transcription.ts    # transcribe(), compareModels()
│       │   └── insights.ts         # askVoxAtlas(), getSummary()
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx     # Nav links with icons (lucide-react)
│       │   │   ├── Header.tsx      # VoxAtlas logo + tagline
│       │   │   └── DashboardLayout.tsx  # Sidebar + main content area
│       │   ├── maps/
│       │   │   └── LanguageMap.tsx  # MapLibre GL world map with language markers
│       │   ├── charts/
│       │   │   ├── CERHistogram.tsx      # Distribution of languages by CER bucket
│       │   │   ├── CERByRegion.tsx       # Grouped bar chart by continent
│       │   │   ├── CERvsHours.tsx        # Scatter plot: CER vs training hours
│       │   │   ├── ModelRadar.tsx        # Radar chart for model comparison
│       │   │   ├── SummaryCards.tsx      # KPI cards (total langs, mean CER, etc)
│       │   │   └── ExportableChart.tsx   # HOC wrapper adding PNG/SVG download
│       │   ├── transcription/
│       │   │   ├── AudioPlayer.tsx       # WaveSurfer.js waveform player
│       │   │   ├── TranscriptionPanel.tsx # Ground truth vs prediction with diff
│       │   │   └── ModelComparison.tsx   # Side-by-side model results table
│       │   ├── insights/
│       │   │   ├── AskVoxAtlas.tsx       # Chat interface for Llama queries
│       │   │   └── InsightCard.tsx       # Auto-generated insight callout
│       │   └── reports/
│       │       ├── LanguageProfileCard.tsx # Single-language PDF card
│       │       └── FullReport.tsx         # Multi-page PDF report
│       ├── pages/
│       │   ├── Explorer.tsx         # Language Explorer (map + table + filters)
│       │   ├── Transcribe.tsx       # Live Transcription demo
│       │   ├── Compare.tsx          # Model Comparison arena
│       │   ├── Analytics.tsx        # CER Analytics Dashboard
│       │   └── Reports.tsx          # Report Generator
│       ├── hooks/
│       │   ├── useLanguages.ts      # Fetch + cache language data
│       │   ├── useTranscription.ts  # Manage transcription state
│       │   └── useExport.ts         # Chart export logic
│       ├── utils/
│       │   ├── cer.ts               # CER calculation (Levenshtein distance)
│       │   ├── formatters.ts        # Number formatting, percentage, etc
│       │   └── constants.ts         # Colors, model names, region mappings
│       └── styles/
│           └── globals.css          # Tailwind imports + custom CSS vars
│
├── backend/
│   ├── pyproject.toml
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py                  # FastAPI app with CORS, lifespan events
│   │   ├── config.py                # Pydantic Settings from .env
│   │   ├── routers/
│   │   │   ├── languages.py         # /api/v1/languages endpoints
│   │   │   ├── transcription.py     # /api/v1/transcribe endpoints
│   │   │   ├── analytics.py         # /api/v1/analytics endpoints
│   │   │   └── insights.py          # /api/v1/insights endpoints
│   │   ├── services/
│   │   │   ├── asr_service.py       # Omnilingual ASR wrapper
│   │   │   ├── data_service.py      # CSV + HF data loading
│   │   │   ├── llama_service.py     # Llama API client (OpenAI SDK)
│   │   │   └── cache_service.py     # SQLite caching
│   │   ├── models/                  # Pydantic schemas
│   │   │   ├── language.py
│   │   │   ├── transcription.py
│   │   │   └── analytics.py
│   │   └── data/
│   │       ├── per_language_results.csv    # From omnilingual-asr repo
│   │       ├── language_metadata.json      # Enriched with regions/families/coords
│   │       └── endangerment_status.json    # UNESCO data
│   └── tests/
│       ├── test_data_service.py
│       └── test_analytics.py
│
└── data/
    └── scripts/
        ├── enrich_languages.py      # Build metadata JSON from CSV + external sources
        └── seed_cache.py            # Pre-populate SQLite
```

## ENVIRONMENT VARIABLES (.env.example)

```
# Meta AI - Llama API
LLAMA_API_KEY=your_llama_api_key_here
LLAMA_MODEL=Llama-4-Maverick-17B-128E-Instruct

# HuggingFace
HF_TOKEN=your_huggingface_token_here

# ASR Config
DEFAULT_ASR_MODEL=omniASR_CTC_1B_v2
ASR_DEVICE=cuda

# App
BACKEND_URL=http://localhost:8000
BACKEND_PORT=8000
FRONTEND_PORT=5173
SQLITE_PATH=./data/voxatlas.db
CORS_ORIGINS=http://localhost:5173
```

## BACKEND IMPLEMENTATION DETAILS

### main.py (FastAPI entry point)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.services.data_service import DataService
from app.services.cache_service import CacheService
from app.routers import languages, transcription, analytics, insights

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load CSV data, init SQLite
    app.state.data_service = DataService()
    app.state.data_service.load_data()
    app.state.cache_service = CacheService(settings.SQLITE_PATH)
    await app.state.cache_service.init()
    yield
    # Shutdown

app = FastAPI(title="VoxAtlas API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS.split(","),
                   allow_methods=["*"], allow_headers=["*"])
app.include_router(languages.router, prefix="/api/v1")
app.include_router(transcription.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(insights.router, prefix="/api/v1")
```

### data_service.py (Core data loading)
```python
import csv, json
from pathlib import Path
from dataclasses import dataclass, field

@dataclass
class LanguageData:
    lang_code: str
    language_name: str = ""
    script: str = ""
    region: str = ""
    continent: str = ""
    family: str = ""
    latitude: float = 0.0
    longitude: float = 0.0
    training_hours: float = 0.0
    cer_7b_llm: float = 0.0
    cer_7b_ctc: float = 0.0
    endangerment: str = "Unknown"

class DataService:
    def __init__(self):
        self.languages: dict[str, LanguageData] = {}
        self.data_dir = Path(__file__).parent.parent / "data"

    def load_data(self):
        # 1. Load per-language results CSV
        csv_path = self.data_dir / "per_language_results.csv"
        with open(csv_path) as f:
            reader = csv.DictReader(f)
            for row in reader:
                code = row.get("lang_code", row.get("language", ""))
                self.languages[code] = LanguageData(
                    lang_code=code,
                    cer_7b_llm=float(row.get("cer", row.get("CER", 0))),
                    training_hours=float(row.get("hours", row.get("train_hours", 0))),
                )

        # 2. Load enriched metadata if available
        meta_path = self.data_dir / "language_metadata.json"
        if meta_path.exists():
            with open(meta_path) as f:
                metadata = json.load(f)
            for code, meta in metadata.items():
                if code in self.languages:
                    lang = self.languages[code]
                    lang.language_name = meta.get("name", "")
                    lang.script = meta.get("script", code.split("_")[-1] if "_" in code else "")
                    lang.region = meta.get("region", "")
                    lang.continent = meta.get("continent", "")
                    lang.family = meta.get("family", "")
                    lang.latitude = meta.get("latitude", 0.0)
                    lang.longitude = meta.get("longitude", 0.0)
                    lang.endangerment = meta.get("endangerment", "Unknown")

    def get_all_languages(self, region=None, script=None, cer_max=None, endangered=None):
        results = list(self.languages.values())
        if region:
            results = [l for l in results if l.continent == region]
        if script:
            results = [l for l in results if l.script == script]
        if cer_max is not None:
            results = [l for l in results if l.cer_7b_llm <= cer_max]
        if endangered:
            results = [l for l in results if l.endangerment == endangered]
        return results

    def get_cer_distribution(self):
        """Return counts of languages in CER buckets for histogram."""
        buckets = {"0-5": 0, "5-10": 0, "10-15": 0, "15-20": 0, "20-30": 0, "30-50": 0, "50+": 0}
        for lang in self.languages.values():
            cer = lang.cer_7b_llm
            if cer <= 5: buckets["0-5"] += 1
            elif cer <= 10: buckets["5-10"] += 1
            elif cer <= 15: buckets["10-15"] += 1
            elif cer <= 20: buckets["15-20"] += 1
            elif cer <= 30: buckets["20-30"] += 1
            elif cer <= 50: buckets["30-50"] += 1
            else: buckets["50+"] += 1
        return buckets

    def get_summary_stats(self):
        cers = [l.cer_7b_llm for l in self.languages.values() if l.cer_7b_llm > 0]
        return {
            "total_languages": len(self.languages),
            "mean_cer": sum(cers) / len(cers) if cers else 0,
            "median_cer": sorted(cers)[len(cers)//2] if cers else 0,
            "pct_under_10": sum(1 for c in cers if c < 10) / len(cers) * 100 if cers else 0,
            "total_training_hours": sum(l.training_hours for l in self.languages.values()),
            "min_cer": min(cers) if cers else 0,
            "max_cer": max(cers) if cers else 0,
        }
```

### asr_service.py (Omnilingual ASR wrapper)
```python
import time
import hashlib
from omnilingual_asr.models.inference.pipeline import ASRInferencePipeline

class ASRService:
    def __init__(self):
        self._pipelines: dict[str, ASRInferencePipeline] = {}

    def _get_pipeline(self, model_card: str) -> ASRInferencePipeline:
        """Lazy-load pipeline for a model (downloads on first use)."""
        if model_card not in self._pipelines:
            self._pipelines[model_card] = ASRInferencePipeline(model_card=model_card)
        return self._pipelines[model_card]

    def transcribe(self, audio_input, lang_code: str, model_card: str = "omniASR_CTC_1B_v2"):
        """
        Transcribe audio and return prediction + metrics.

        audio_input can be:
        - str: file path
        - bytes: raw audio bytes
        - dict: {"waveform": numpy_array, "sample_rate": 16000}
        """
        pipeline = self._get_pipeline(model_card)

        # Wrap in list for pipeline (it expects lists)
        if isinstance(audio_input, str):
            inputs = [audio_input]
        elif isinstance(audio_input, dict):
            inputs = [audio_input]
        else:
            inputs = [audio_input]

        # Determine if LLM model (supports language conditioning)
        lang = [lang_code] if "LLM" in model_card else None

        start = time.perf_counter()
        transcriptions = pipeline.transcribe(inputs, lang=lang, batch_size=1)
        latency_ms = int((time.perf_counter() - start) * 1000)

        return {
            "prediction": transcriptions[0],
            "latency_ms": latency_ms,
            "model_card": model_card,
        }
```

### llama_service.py (Llama API integration)
```python
import json
from openai import OpenAI
from app.config import settings

class LlamaService:
    def __init__(self):
        self.client = OpenAI(
            base_url="https://api.llama.com/compat/v1",
            api_key=settings.LLAMA_API_KEY
        )
        self.model = settings.LLAMA_MODEL

    def ask(self, question: str, context: dict) -> str:
        system_prompt = """You are VoxAtlas AI, an expert analyst for Meta's Omnilingual ASR system.
You have access to performance data covering 1,600+ languages.
Answer questions using the provided data context. Be concise, data-driven, and cite specific numbers.
Format responses in clear paragraphs. When comparing, use concrete metrics."""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Data context:\n{json.dumps(context, indent=2)}\n\nQuestion: {question}"}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        return response.choices[0].message.content

    def generate_summary(self, stats: dict) -> str:
        prompt = f"""Generate a concise executive summary (3-4 paragraphs) of this ASR system performance:
{json.dumps(stats, indent=2)}
Focus on: scale of language coverage, accuracy highlights, low-resource language impact, and areas for improvement."""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.5
        )
        return response.choices[0].message.content
```

### HuggingFace Audio Streaming (in transcription router)
```python
from datasets import load_dataset
import numpy as np
import io, scipy.io.wavfile
from fastapi.responses import StreamingResponse

async def get_audio_sample(lang_code: str, sample_idx: int = 0):
    """Stream audio from HuggingFace corpus."""
    ds = load_dataset(
        "facebook/omnilingual-asr-corpus",
        lang_code,
        split="train",
        streaming=True,
        token=settings.HF_TOKEN
    )
    # Skip to requested sample
    for i, sample in enumerate(ds):
        if i == sample_idx:
            audio = sample["audio"]
            waveform = np.array(audio["array"], dtype=np.float32)
            sample_rate = audio["sampling_rate"]
            ground_truth = sample.get("raw_text", "")

            # Convert to wav bytes for frontend playback
            wav_buffer = io.BytesIO()
            scipy.io.wavfile.write(wav_buffer, sample_rate, (waveform * 32767).astype(np.int16))
            wav_bytes = wav_buffer.getvalue()

            return {
                "wav_bytes": wav_bytes,
                "waveform": waveform,
                "sample_rate": sample_rate,
                "ground_truth": ground_truth,
            }
    return None
```

## FRONTEND IMPLEMENTATION DETAILS

### CER Calculation (utils/cer.ts)
```typescript
export function calculateCER(prediction: string, groundTruth: string): number {
  if (groundTruth.length === 0) return prediction.length === 0 ? 0 : 100;
  const m = prediction.length, n = groundTruth.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = prediction[i - 1] === groundTruth[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return (dp[m][n] / n) * 100;
}
```

### Color Scheme (utils/constants.ts)
```typescript
export const COLORS = {
  metaBlue: "#0668E1",
  metaDark: "#1A1A2E",
  accent: "#16537E",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  bgLight: "#F8FAFC",
  bgCard: "#FFFFFF",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
};

export const CER_COLORS = {
  excellent: "#22C55E",   // CER 0-5
  good: "#84CC16",        // CER 5-10
  moderate: "#F59E0B",    // CER 10-20
  poor: "#F97316",        // CER 20-30
  bad: "#EF4444",         // CER 30+
};

export const MODEL_OPTIONS = [
  { value: "omniASR_CTC_300M_v2", label: "CTC 300M v2", vram: "2 GB", speed: "96x" },
  { value: "omniASR_CTC_1B_v2", label: "CTC 1B v2", vram: "3 GB", speed: "48x" },
  { value: "omniASR_LLM_1B_v2", label: "LLM 1B v2", vram: "6 GB", speed: "~1x" },
  { value: "omniASR_LLM_7B_v2", label: "LLM 7B v2", vram: "17 GB", speed: "~1x" },
];
```

### Map Configuration (components/maps/LanguageMap.tsx)
Use MapLibre GL JS with free tiles. Color-code markers by CER value.
```typescript
// Free tile source (no API key needed)
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty/style.json";

// Color markers by CER
function cerToColor(cer: number): string {
  if (cer <= 5) return "#22C55E";
  if (cer <= 10) return "#84CC16";
  if (cer <= 20) return "#F59E0B";
  if (cer <= 30) return "#F97316";
  return "#EF4444";
}
```

### ExportableChart HOC (components/charts/ExportableChart.tsx)
Wraps any chart component with PNG/SVG download buttons using html2canvas.
```typescript
import html2canvas from "html2canvas";
import { useRef } from "react";

export function ExportableChart({ title, children }: { title: string; children: React.ReactNode }) {
  const chartRef = useRef<HTMLDivElement>(null);

  const exportPNG = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement("a");
    link.download = `voxatlas-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button onClick={exportPNG} className="text-sm text-blue-600 hover:text-blue-800">
          📥 Export PNG
        </button>
      </div>
      <div ref={chartRef}>{children}</div>
    </div>
  );
}
```

### CER Histogram (components/charts/CERHistogram.tsx)
The hero chart — shows the "78% of languages under 10% CER" story.
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from "recharts";

// Highlight bars under 10% CER in green, others in orange/red
// Add a ReferenceLine annotation at the 78% mark
// Add a label: "78% of languages achieve < 10% CER"
```

## DESIGN PRINCIPLES

1. Dashboard-first: The Analytics page is the default landing page
2. Meta brand alignment: Use Meta blue (#0668E1) as primary, clean whites, minimal shadows
3. Data density: Show lots of data at once — this is for researchers, not consumers
4. Export everywhere: Every chart should be exportable as PNG
5. Progressive disclosure: Summary cards → charts → detail tables → individual language profiles
6. Responsive but desktop-optimized: Primary use case is laptop in a meeting room

## SIDEBAR NAVIGATION

Pages in order:
1. 📊 Analytics (default) — CER Dashboard with summary cards and charts
2. 🗺️ Explorer — Language map + filterable table
3. 🎙️ Transcribe — Live transcription demo
4. ⚔️ Compare — Model comparison arena
5. 📄 Reports — Report generator and export
6. 🤖 Ask VoxAtlas — Llama-powered Q&A (could also be a floating chat widget)

## DOCKER COMPOSE

```yaml
version: "3.8"
services:
  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend/app/data:/app/data
      - model-cache:/root/.cache/fairseq2
    environment:
      - LLAMA_API_KEY=${LLAMA_API_KEY}
      - HF_TOKEN=${HF_TOKEN}
      - ASR_DEVICE=${ASR_DEVICE:-cpu}
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

volumes:
  model-cache:
```

## BUILD ORDER (Start here)

Phase 0: Scaffold the project structure above. Get FastAPI hello world on :8000 and React Vite hello world on :5173.

Phase 1: Implement data_service.py — load the CSV, build the /api/v1/languages and /api/v1/analytics endpoints. Test them in the Swagger docs at /docs.

Phase 2: Build the Analytics page — SummaryCards, CERHistogram, CERByRegion, CERvsHours charts. This is the hero page and works without any GPU.

Phase 3: Build the Explorer page — LanguageMap with MapLibre, language table with filters.

Phase 4: Build the Transcribe page — asr_service.py, AudioPlayer, TranscriptionPanel. Requires GPU.

Phase 5: Build the Insights — llama_service.py, AskVoxAtlas chat. Requires Llama API key.

Phase 6: Build Reports — LanguageProfileCard PDF export, FullReport.

Phase 7: Polish — loading states, error handling, Docker, README, deploy.

## IMPORTANT NOTES

- The per_language_results CSV must be downloaded from: https://raw.githubusercontent.com/facebookresearch/omnilingual-asr/main/per_language_results_table_7B_llm_asr.csv
- Language codes follow the format {iso639-3}_{script} e.g., eng_Latn, cmn_Hans, ara_Arab
- The omnilingual-asr package installs via: pip install omnilingual-asr
- Llama API uses OpenAI SDK: pip install openai, base_url="https://api.llama.com/compat/v1"
- MapLibre GL free tiles: https://tiles.openfreemap.org/styles/liberty/style.json (no API key)
- HuggingFace dataset: facebook/omnilingual-asr-corpus (CC-BY-4.0, streaming supported)
- For dev without GPU: set ASR_DEVICE=cpu and use CTC 300M (slow but works) or skip transcription features and just build analytics from CSV
