from pydantic import BaseModel


class LanguageBase(BaseModel):
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


class LanguageListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    languages: list[LanguageBase]


class LanguageDetailResponse(LanguageBase):
    cer_by_model: dict[str, float] = {}
