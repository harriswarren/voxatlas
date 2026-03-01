import time
import logging

logger = logging.getLogger(__name__)


class ASRService:
    def __init__(self):
        self._pipelines: dict = {}
        self._available = False
        try:
            from omnilingual_asr.models.inference.pipeline import ASRInferencePipeline

            self._pipeline_cls = ASRInferencePipeline
            self._available = True
        except ImportError:
            logger.warning("omnilingual-asr not installed. ASR transcription will be unavailable.")
            self._pipeline_cls = None

    @property
    def is_available(self) -> bool:
        return self._available

    def _get_pipeline(self, model_card: str):
        if not self._available:
            raise RuntimeError("omnilingual-asr is not installed. Install with: pip install omnilingual-asr")
        if model_card not in self._pipelines:
            logger.info(f"Loading ASR pipeline: {model_card}")
            self._pipelines[model_card] = self._pipeline_cls(model_card=model_card)
        return self._pipelines[model_card]

    def transcribe(self, audio_input, lang_code: str, model_card: str = "omniASR_CTC_1B_v2") -> dict:
        pipeline = self._get_pipeline(model_card)

        if isinstance(audio_input, (str, dict, bytes)):
            inputs = [audio_input]
        else:
            inputs = [audio_input]

        lang = [lang_code] if "LLM" in model_card.upper() else None

        start = time.perf_counter()
        transcriptions = pipeline.transcribe(inputs, lang=lang, batch_size=1)
        latency_ms = int((time.perf_counter() - start) * 1000)

        return {
            "prediction": transcriptions[0],
            "latency_ms": latency_ms,
            "model_card": model_card,
        }
