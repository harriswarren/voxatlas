import logging
from fastapi import APIRouter, Request, HTTPException
from app.models.analytics import InsightRequest, InsightResponse
from app.services.llama_service import LlamaService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["insights"])

_llm_service: LlamaService | None = None

NO_KEY_MSG = (
    "No LLM API key configured. Set one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, or LLAMA_API_KEY in your .env file. "
    "Also set LLM_PROVIDER to 'openai', 'anthropic', or 'llama'."
)


def get_llm_service() -> LlamaService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LlamaService()
    return _llm_service


@router.get("/insights/provider")
async def get_provider_info():
    llm = get_llm_service()
    return {
        "available": llm.is_available,
        "provider": llm.provider,
        "provider_name": llm.provider_name,
        "model": llm.model,
    }


@router.post("/insights/ask", response_model=InsightResponse)
async def ask_voxatlas(request: Request, body: InsightRequest):
    llm = get_llm_service()
    if not llm.is_available:
        raise HTTPException(status_code=503, detail=NO_KEY_MSG)

    # Inject summary stats into context if not provided
    context = body.context
    if not context:
        context = request.app.state.data_service.get_summary_stats()
        # Also inject top/bottom and region data for richer answers
        context["top_bottom"] = request.app.state.data_service.get_top_bottom_languages(5)
        context["cer_by_region"] = request.app.state.data_service.get_cer_by_region()

    try:
        answer = llm.ask(body.question, context)
        return InsightResponse(answer=answer)
    except Exception as e:
        logger.error(f"LLM API error ({llm.provider_name}): {e}")
        raise HTTPException(status_code=500, detail=f"{llm.provider_name} API error: {str(e)}")


@router.get("/insights/summary", response_model=InsightResponse)
async def get_summary(request: Request):
    llm = get_llm_service()
    if not llm.is_available:
        raise HTTPException(status_code=503, detail=NO_KEY_MSG)

    stats = request.app.state.data_service.get_summary_stats()
    try:
        summary = llm.generate_summary(stats)
        return InsightResponse(answer=summary)
    except Exception as e:
        logger.error(f"LLM API error ({llm.provider_name}): {e}")
        raise HTTPException(status_code=500, detail=f"{llm.provider_name} API error: {str(e)}")
