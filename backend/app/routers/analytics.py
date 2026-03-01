from fastapi import APIRouter, Request
from app.models.analytics import SummaryStats, CERDistribution, CERByRegion

router = APIRouter(tags=["analytics"])


@router.get("/analytics/summary", response_model=SummaryStats)
async def get_summary_stats(request: Request):
    return request.app.state.data_service.get_summary_stats()


@router.get("/analytics/cer-distribution", response_model=CERDistribution)
async def get_cer_distribution(request: Request):
    buckets = request.app.state.data_service.get_cer_distribution()
    return CERDistribution(buckets=buckets)


@router.get("/analytics/cer-by-region", response_model=CERByRegion)
async def get_cer_by_region(request: Request):
    regions = request.app.state.data_service.get_cer_by_region()
    return CERByRegion(regions=regions)


@router.get("/analytics/cer-vs-hours")
async def get_cer_vs_hours(request: Request):
    return request.app.state.data_service.get_cer_vs_hours()


@router.get("/analytics/top-bottom")
async def get_top_bottom(request: Request, n: int = 20):
    return request.app.state.data_service.get_top_bottom_languages(n)
