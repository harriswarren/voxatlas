from fastapi import APIRouter, Request, Query, HTTPException
from app.models.language import LanguageBase, LanguageListResponse, LanguageDetailResponse

router = APIRouter(tags=["languages"])


@router.get("/languages", response_model=LanguageListResponse)
async def list_languages(
    request: Request,
    region: str | None = None,
    script: str | None = None,
    cer_max: float | None = None,
    endangered: str | None = None,
    search: str | None = None,
    sort_by: str = "lang_code",
    sort_desc: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
):
    data_service = request.app.state.data_service
    languages, total = data_service.get_all_languages(
        region=region,
        script=script,
        cer_max=cer_max,
        endangered=endangered,
        search=search,
        sort_by=sort_by,
        sort_desc=sort_desc,
        page=page,
        page_size=page_size,
    )
    return LanguageListResponse(
        total=total,
        page=page,
        page_size=page_size,
        languages=[LanguageBase(**lang.__dict__) for lang in languages],
    )


@router.get("/languages/map-points")
async def get_map_points(request: Request):
    return request.app.state.data_service.get_map_points()


@router.get("/languages/scripts", response_model=list[str])
async def list_scripts(request: Request):
    return request.app.state.data_service.get_unique_scripts()


@router.get("/languages/continents", response_model=list[str])
async def list_continents(request: Request):
    return request.app.state.data_service.get_unique_continents()


@router.get("/languages/{lang_code}", response_model=LanguageDetailResponse)
async def get_language(request: Request, lang_code: str):
    data_service = request.app.state.data_service
    lang = data_service.get_language(lang_code)
    if not lang:
        raise HTTPException(status_code=404, detail=f"Language '{lang_code}' not found")
    return LanguageDetailResponse(**lang.__dict__)
