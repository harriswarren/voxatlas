import logging
from fastapi import APIRouter, Request, HTTPException
from app.models.analytics import InsightRequest, InsightResponse
from app.services.llama_service import LlamaService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["insights"])

_llama_service: LlamaService | None = None


def get_llama_service() -> LlamaService:
    global _llama_service
    if _llama_service is None:
        _llama_service = LlamaService()
    return _llama_service


@router.post("/insights/ask", response_model=InsightResponse)
async def ask_voxatlas(request: Request, body: InsightRequest):
    llama = get_llama_service()
    if not llama.is_available:
        raise HTTPException(status_code=503, detail="LLAMA_API_KEY is not configured.")

    # Inject summary stats into context if not provided
    context = body.context
    if not context:
        context = request.app.state.data_service.get_summary_stats()

    try:
        answer = llama.ask(body.question, context)
        return InsightResponse(answer=answer)
    except Exception as e:
        logger.error(f"Llama API error: {e}")
        raise HTTPException(status_code=500, detail=f"Llama API error: {str(e)}")


@router.get("/insights/summary", response_model=InsightResponse)
async def get_summary(request: Request):
    llama = get_llama_service()
    if not llama.is_available:
        raise HTTPException(status_code=503, detail="LLAMA_API_KEY is not configured.")

    stats = request.app.state.data_service.get_summary_stats()
    try:
        summary = llama.generate_summary(stats)
        return InsightResponse(answer=summary)
    except Exception as e:
        logger.error(f"Llama API error: {e}")
        raise HTTPException(status_code=500, detail=f"Llama API error: {str(e)}")
