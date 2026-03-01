import aiosqlite
from pathlib import Path


class CacheService:
    def __init__(self, db_path: str):
        self.db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    async def init(self):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS transcription_cache (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    lang_code TEXT NOT NULL,
                    model_card TEXT NOT NULL,
                    audio_hash TEXT NOT NULL,
                    ground_truth TEXT,
                    prediction TEXT NOT NULL,
                    cer REAL NOT NULL,
                    latency_ms INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(lang_code, model_card, audio_hash)
                )
            """)
            await db.commit()

    async def get_cached(self, lang_code: str, model_card: str, audio_hash: str) -> dict | None:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                """SELECT prediction, ground_truth, cer, latency_ms
                   FROM transcription_cache
                   WHERE lang_code = ? AND model_card = ? AND audio_hash = ?""",
                (lang_code, model_card, audio_hash),
            )
            row = await cursor.fetchone()
            if row:
                return {
                    "prediction": row["prediction"],
                    "ground_truth": row["ground_truth"],
                    "cer": row["cer"],
                    "latency_ms": row["latency_ms"],
                }
            return None

    async def set_cached(
        self,
        lang_code: str,
        model_card: str,
        audio_hash: str,
        ground_truth: str,
        prediction: str,
        cer: float,
        latency_ms: int,
    ):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """INSERT OR REPLACE INTO transcription_cache
                   (lang_code, model_card, audio_hash, ground_truth, prediction, cer, latency_ms)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (lang_code, model_card, audio_hash, ground_truth, prediction, cer, latency_ms),
            )
            await db.commit()
