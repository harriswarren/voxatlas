from pydantic import BaseModel, ConfigDict


class TranscribeRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    lang_code: str
    model_card: str = "omniASR_CTC_1B_v2"
    sample_idx: int = 0
    audio_base64: str | None = None


class TranscribeResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    lang_code: str
    model_card: str
    prediction: str
    ground_truth: str
    cer: float
    latency_ms: int


class CompareRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    lang_code: str
    sample_idx: int = 0
    model_cards: list[str] = [
        "omniASR_CTC_300M_v2",
        "omniASR_CTC_1B_v2",
        "omniASR_LLM_1B_v2",
        "omniASR_LLM_7B_v2",
    ]


class CompareResponse(BaseModel):
    lang_code: str
    results: list[TranscribeResponse]
