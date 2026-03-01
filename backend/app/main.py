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


app = FastAPI(
    title="VoxAtlas API",
    description="Low-Resource Language Preservation Dashboard API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(languages.router, prefix="/api/v1")
app.include_router(transcription.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(insights.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}
