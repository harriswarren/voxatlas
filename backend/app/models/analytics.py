from pydantic import BaseModel


class SummaryStats(BaseModel):
    total_languages: int
    mean_cer: float
    median_cer: float
    pct_under_10: float
    total_training_hours: float
    min_cer: float
    max_cer: float


class CERDistribution(BaseModel):
    buckets: dict[str, int]


class CERByRegion(BaseModel):
    regions: dict[str, dict[str, float]]


class InsightRequest(BaseModel):
    question: str
    context: dict = {}


class InsightResponse(BaseModel):
    answer: str
