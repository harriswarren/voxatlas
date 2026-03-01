import hashlib
import logging
from fastapi import APIRouter, Request, HTTPException
from app.models.transcription import TranscribeRequest, TranscribeResponse, CompareRequest, CompareResponse
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["transcription"])


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(request: Request, body: TranscribeRequest):
    try:
        from app.services.asr_service import ASRService
    except Exception:
        raise HTTPException(status_code=503, detail="ASR service is not available (no GPU or omnilingual-asr not installed)")

    # For now, return a placeholder until GPU is available
    raise HTTPException(
        status_code=503,
        detail="Live transcription requires a GPU and the omnilingual-asr package. "
        "Set up a GPU environment and install with: pip install omnilingual-asr",
    )


@router.post("/transcribe/compare", response_model=CompareResponse)
async def compare_models(request: Request, body: CompareRequest):
    raise HTTPException(
        status_code=503,
        detail="Model comparison requires a GPU and the omnilingual-asr package.",
    )


@router.get("/transcribe/audio/{lang_code}")
async def get_audio_sample(request: Request, lang_code: str, sample_idx: int = 0):
    """Stream audio sample from HuggingFace corpus."""
    if not settings.HF_TOKEN:
        raise HTTPException(status_code=503, detail="HF_TOKEN is not configured.")

    try:
        from datasets import load_dataset
        import numpy as np
        import io
        import scipy.io.wavfile
        from fastapi.responses import StreamingResponse

        ds = load_dataset(
            "facebook/omnilingual-asr-corpus",
            lang_code,
            split="train",
            streaming=True,
            token=settings.HF_TOKEN,
        )
        for i, sample in enumerate(ds):
            if i == sample_idx:
                audio = sample["audio"]
                waveform = np.array(audio["array"], dtype=np.float32)
                sample_rate = audio["sampling_rate"]
                ground_truth = sample.get("raw_text", "")

                wav_buffer = io.BytesIO()
                scipy.io.wavfile.write(wav_buffer, sample_rate, (waveform * 32767).astype(np.int16))
                wav_buffer.seek(0)

                return StreamingResponse(
                    wav_buffer,
                    media_type="audio/wav",
                    headers={"X-Ground-Truth": ground_truth},
                )
        raise HTTPException(status_code=404, detail=f"Sample {sample_idx} not found for {lang_code}")
    except ImportError:
        raise HTTPException(status_code=503, detail="datasets library not installed")
    except Exception as e:
        logger.error(f"Error fetching audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))
