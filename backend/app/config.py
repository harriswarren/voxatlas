from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    LLAMA_API_KEY: str = ""
    LLAMA_MODEL: str = "Llama-4-Maverick-17B-128E-Instruct"

    HF_TOKEN: str = ""

    DEFAULT_ASR_MODEL: str = "omniASR_CTC_1B_v2"
    ASR_DEVICE: str = "cpu"

    BACKEND_URL: str = "http://localhost:8000"
    BACKEND_PORT: int = 8000
    FRONTEND_PORT: int = 5173
    SQLITE_PATH: str = "./data/voxatlas.db"
    CORS_ORIGINS: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
