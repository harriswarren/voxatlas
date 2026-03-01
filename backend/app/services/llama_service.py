import json
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class LlamaService:
    def __init__(self):
        self._client = None
        self.model = settings.LLAMA_MODEL

    @property
    def client(self):
        if self._client is None:
            if not settings.LLAMA_API_KEY:
                raise RuntimeError("LLAMA_API_KEY is not set. Configure it in your .env file.")
            from openai import OpenAI

            self._client = OpenAI(
                base_url="https://api.llama.com/compat/v1",
                api_key=settings.LLAMA_API_KEY,
            )
        return self._client

    @property
    def is_available(self) -> bool:
        return bool(settings.LLAMA_API_KEY)

    def ask(self, question: str, context: dict) -> str:
        system_prompt = """You are VoxAtlas AI, an expert analyst for Meta's Omnilingual ASR system.
You have access to performance data covering 1,600+ languages.
Answer questions using the provided data context. Be concise, data-driven, and cite specific numbers.
Format responses in clear paragraphs. When comparing, use concrete metrics."""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": f"Data context:\n{json.dumps(context, indent=2)}\n\nQuestion: {question}",
                },
            ],
            max_tokens=1000,
            temperature=0.3,
        )
        return response.choices[0].message.content

    def generate_summary(self, stats: dict) -> str:
        prompt = f"""Generate a concise executive summary (3-4 paragraphs) of this ASR system performance:
{json.dumps(stats, indent=2)}
Focus on: scale of language coverage, accuracy highlights, low-resource language impact, and areas for improvement."""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.5,
        )
        return response.choices[0].message.content
