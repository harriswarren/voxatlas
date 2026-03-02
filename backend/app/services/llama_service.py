import json
import logging
from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are VoxAtlas AI, an expert analyst for Meta's Omnilingual ASR system.
You have access to performance data covering 1,600+ languages.
Answer questions using the provided data context. Be concise, data-driven, and cite specific numbers.
Format responses in clear paragraphs. When comparing, use concrete metrics."""


def _resolve_provider() -> tuple[str, str, str]:
    """Return (provider, api_key, model) based on config.

    Auto-detects: uses LLM_PROVIDER if set, otherwise picks the first
    provider that has an API key configured.
    """
    provider = settings.LLM_PROVIDER.lower()

    if provider == "openai" and settings.OPENAI_API_KEY:
        return "openai", settings.OPENAI_API_KEY, settings.OPENAI_MODEL
    if provider == "anthropic" and settings.ANTHROPIC_API_KEY:
        return "anthropic", settings.ANTHROPIC_API_KEY, settings.ANTHROPIC_MODEL
    if provider == "llama" and settings.LLAMA_API_KEY:
        return "llama", settings.LLAMA_API_KEY, settings.LLAMA_MODEL

    # Auto-detect fallback: first available key wins
    if settings.OPENAI_API_KEY:
        return "openai", settings.OPENAI_API_KEY, settings.OPENAI_MODEL
    if settings.ANTHROPIC_API_KEY:
        return "anthropic", settings.ANTHROPIC_API_KEY, settings.ANTHROPIC_MODEL
    if settings.LLAMA_API_KEY:
        return "llama", settings.LLAMA_API_KEY, settings.LLAMA_MODEL

    return "none", "", ""


class LlamaService:
    """Multi-provider LLM service (OpenAI, Anthropic Claude, Meta Llama)."""

    def __init__(self):
        self._openai_client = None
        self._anthropic_client = None
        self.provider, self.api_key, self.model = _resolve_provider()
        logger.info(f"LLM provider: {self.provider}, model: {self.model}")

    @property
    def is_available(self) -> bool:
        return bool(self.api_key)

    @property
    def provider_name(self) -> str:
        names = {"openai": "OpenAI", "anthropic": "Anthropic Claude", "llama": "Meta Llama"}
        return names.get(self.provider, "None")

    # --- OpenAI / Llama (both use openai SDK) ---

    def _get_openai_client(self):
        if self._openai_client is None:
            from openai import OpenAI
            if self.provider == "llama":
                self._openai_client = OpenAI(
                    base_url="https://api.llama.com/compat/v1",
                    api_key=self.api_key,
                )
            else:
                self._openai_client = OpenAI(api_key=self.api_key)
        return self._openai_client

    def _chat_openai(self, messages: list[dict], max_tokens: int = 1000, temperature: float = 0.3) -> str:
        client = self._get_openai_client()
        response = client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content or ""

    # --- Anthropic Claude ---

    def _get_anthropic_client(self):
        if self._anthropic_client is None:
            from anthropic import Anthropic
            self._anthropic_client = Anthropic(api_key=self.api_key)
        return self._anthropic_client

    def _chat_anthropic(self, messages: list[dict], max_tokens: int = 1000, temperature: float = 0.3) -> str:
        client = self._get_anthropic_client()
        # Extract system message
        system = ""
        user_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system = msg["content"]
            else:
                user_messages.append(msg)
        response = client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=user_messages,
        )
        return response.content[0].text

    # --- Unified interface ---

    def _chat(self, messages: list[dict], max_tokens: int = 1000, temperature: float = 0.3) -> str:
        if self.provider in ("openai", "llama"):
            return self._chat_openai(messages, max_tokens, temperature)
        elif self.provider == "anthropic":
            return self._chat_anthropic(messages, max_tokens, temperature)
        else:
            raise RuntimeError("No LLM provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or LLAMA_API_KEY in .env")

    def ask(self, question: str, context: dict) -> str:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Data context:\n{json.dumps(context, indent=2)}\n\nQuestion: {question}",
            },
        ]
        return self._chat(messages, max_tokens=1000, temperature=0.3)

    def generate_summary(self, stats: dict) -> str:
        prompt = f"""Generate a concise executive summary (3-4 paragraphs) of this ASR system performance:
{json.dumps(stats, indent=2)}
Focus on: scale of language coverage, accuracy highlights, low-resource language impact, and areas for improvement."""
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]
        return self._chat(messages, max_tokens=800, temperature=0.5)
