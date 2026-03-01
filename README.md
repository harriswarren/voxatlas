# VoxAtlas

**Mapping Every Voice on Earth** — Low-Resource Language Preservation Dashboard

VoxAtlas is a web-based dashboard that showcases Meta AI's Omnilingual ASR system by letting users explore, transcribe, and analyze speech data across 1,600+ languages, with a special focus on low-resource and endangered languages.

## Features

- **CER Analytics Dashboard** — Interactive charts showing model performance across all languages
- **Language Explorer** — World map and filterable table of 1,600+ supported languages
- **Live Transcription** — Real-time ASR inference with waveform visualization
- **Model Comparison** — Side-by-side comparison of CTC and LLM model sizes
- **Report Generator** — Export publication-ready PDFs and chart images
- **Ask VoxAtlas** — Llama-powered natural language queries over the data

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, TypeScript, Tailwind CSS 4, Recharts, MapLibre GL JS, WaveSurfer.js |
| Backend | FastAPI, Python 3.11+, Pydantic, SQLite |
| AI/ML | Meta Omnilingual ASR (fairseq2), Llama API (Maverick) |
| Export | html2canvas, jsPDF |
| Deploy | Docker, docker-compose |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- (Optional) GPU with 3GB+ VRAM for live transcription
- (Optional) Llama API key for AI insights

### 1. Clone and configure

```bash
git clone https://github.com/harriswarren/voxatlas.git
cd voxatlas
cp .env.example .env
# Edit .env with your API keys
```

### 2. Download data

```bash
make download-data
```

### 3. Install dependencies

```bash
# Backend
cd backend
pip install -e ".[dev]"

# Frontend
cd ../frontend
npm install
```

### 4. (Optional) Enrich language metadata

```bash
python data/scripts/enrich_languages.py
```

### 5. Run development servers

```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

The dashboard will be available at **http://localhost:5173** and the API docs at **http://localhost:8000/docs**.

### Docker

```bash
docker-compose up --build
```

## Project Structure

```
voxatlas/
├── frontend/          # React + Vite + TypeScript
│   └── src/
│       ├── api/       # Axios API clients
│       ├── components/# Charts, maps, layout, transcription, insights, reports
│       ├── hooks/     # Custom React hooks
│       ├── pages/     # Analytics, Explorer, Transcribe, Compare, Reports, Ask
│       └── utils/     # CER calculation, formatters, constants
├── backend/           # FastAPI + Python
│   └── app/
│       ├── routers/   # REST API endpoints
│       ├── services/  # ASR, data, cache, Llama services
│       ├── models/    # Pydantic schemas
│       └── data/      # CSV + JSON data files
└── data/
    └── scripts/       # Data enrichment and seeding scripts
```

## API Endpoints

All endpoints are prefixed with `/api/v1`. Swagger docs available at `/docs`.

| Endpoint | Description |
|----------|-------------|
| `GET /languages` | List languages with filters and pagination |
| `GET /languages/{code}` | Language detail |
| `GET /analytics/summary` | Summary statistics |
| `GET /analytics/cer-distribution` | CER histogram data |
| `GET /analytics/cer-by-region` | CER grouped by continent |
| `GET /analytics/cer-vs-hours` | Scatter plot data |
| `GET /analytics/top-bottom` | Best/worst performing languages |
| `POST /transcribe` | Run ASR transcription (requires GPU) |
| `POST /transcribe/compare` | Compare multiple models (requires GPU) |
| `POST /insights/ask` | Ask VoxAtlas (requires Llama API key) |
| `GET /insights/summary` | AI-generated executive summary |

## Development Phases

- **Phase 0-1** (Analytics Only): Works from CSV data, no GPU needed
- **Phase 2-3** (Explorer + Charts): Map visualization, full dashboard
- **Phase 4** (Transcription): Requires GPU + omnilingual-asr package
- **Phase 5** (Insights): Requires Llama API key
- **Phase 6** (Reports): PDF export functionality

## License

Apache 2.0 — See [LICENSE](LICENSE)

## Author

Harris Warren | TPM II, Meta AI Research
