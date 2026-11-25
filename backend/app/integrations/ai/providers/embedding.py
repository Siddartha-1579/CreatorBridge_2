"""Dense vector embedding provider interface and concrete OpenAI adapter."""

from abc import abstractmethod
from typing import Optional, List
import math
import hashlib
import httpx
from app.core.config import settings
from app.core.logging import get_logger
from app.integrations.ai.base import (
    BaseAIProvider,
    AIProviderMetadata,
    EmbeddingRequest,
    EmbeddingResult,
)

logger = get_logger("ai.provider.embedding")


class EmbeddingProvider(BaseAIProvider):
    """Abstract interface for dense vector embeddings."""

    @abstractmethod
    async def embed(self, request: EmbeddingRequest) -> EmbeddingResult:
        """Generates dense vector embeddings for input texts."""
        pass


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """OpenAI text-embedding-3-small provider adapter with deterministic pseudo-vector fallback."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        super().__init__(
            AIProviderMetadata(
                name="openai",
                version="1.0.0",
                supported_models=["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"],
                rate_limit_rpm=1000,
            )
        )
        self.api_key = api_key or settings.embedding_api_key or settings.openai_api_key
        self.model = model or settings.embedding_model

    async def is_available(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 8)

    async def embed(self, request: EmbeddingRequest) -> EmbeddingResult:
        model = request.model or self.model
        dimension = 1536

        # Live dispatch if credentials exist
        if await self.is_available():
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": model,
                    "input": request.texts,
                }
                async with httpx.AsyncClient(timeout=float(settings.ai_request_timeout_seconds)) as client:
                    resp = await client.post("https://api.openai.com/v1/embeddings", headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        embeddings = [item["embedding"] for item in data.get("data", [])]
                        return EmbeddingResult(
                            embeddings=embeddings,
                            dimension=len(embeddings[0]) if embeddings else dimension,
                            model=model,
                            provider="openai",
                        )
                    else:
                        logger.warning(f"OpenAI Embedding API returned {resp.status_code}: {resp.text}. Using semantic hashing.")
            except Exception as e:
                logger.error(f"OpenAI embedding generation failed: {e}. Executing fallback embeddings.")

        # Deterministic normalized pseudo-vector synthesis (dimension=1536)
        embeddings = [self._generate_pseudo_vector(text, dimension) for text in request.texts]
        return EmbeddingResult(
            embeddings=embeddings,
            dimension=dimension,
            model=f"{model}-simulated",
            provider="openai-simulated",
        )

    def _generate_pseudo_vector(self, text: str, dimension: int) -> List[float]:
        """Produces a deterministic L2-normalized vector from text tokens and n-grams."""
        vector = [0.0] * dimension
        words = text.lower().split()
        for idx, word in enumerate(words):
            h = int(hashlib.md5(f"{word}_{idx % 8}".encode()).hexdigest(), 16)
            bucket = h % dimension
            vector[bucket] += 1.0 + (len(word) * 0.1)

        # L2 Normalize
        magnitude = math.sqrt(sum(val * val for val in vector)) or 1.0
        return [round(val / magnitude, 6) for val in vector]
