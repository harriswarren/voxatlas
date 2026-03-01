#!/usr/bin/env python3
"""
Pre-populate the SQLite cache with data from the CSV.
This avoids needing to run inference for demo purposes.
"""

import asyncio
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

from app.services.cache_service import CacheService


async def main():
    db_path = Path(__file__).parent.parent / "voxatlas.db"
    cache = CacheService(str(db_path))
    await cache.init()
    print(f"Initialized SQLite cache at {db_path}")
    print("Cache is ready. Transcription results will be cached as they are generated.")


if __name__ == "__main__":
    asyncio.run(main())
