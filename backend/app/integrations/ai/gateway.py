"""AI Provider Gateway - Unified abstraction layer for multi-provider AI operations."""

from typing import Dict, Optional, List
from app.core.errors import IntegrationException
from app.core.logging import get_logger
from app.integrations.ai.base import (
    TextGenerationRequest,
    TextGenerationResult,
    ImageGenerationRequest,
    ImageGenerationResult,
    VideoGenerationRequest,
    VideoGenerationResult,
    VoiceGenerationRequest,
    VoiceGenerationResult,
    AnalysisRequest,
    AnalysisResult,
    EmbeddingRequest,
    EmbeddingResult,
)
from app.integrations.ai.providers import (
    TextProvider,
    ImageProvider,
    VideoProvider,
    VoiceProvider,
    AnalysisProvider,
    EmbeddingProvider,
)

logger = get_logger("ai.gateway")


class AIProviderGateway:
    """
    Central AI Provider Gateway.
    Decouples application features from specific vendor SDKs.
    Supports multi-provider dispatch, fallback strategies, and standardized contracts.
    """

    def __init__(self):
        self._text_providers: Dict[str, TextProvider] = {}
        self._image_providers: Dict[str, ImageProvider] = {}
        self._video_providers: Dict[str, VideoProvider] = {}
        self._voice_providers: Dict[str, VoiceProvider] = {}
        self._analysis_providers: Dict[str, AnalysisProvider] = {}
        self._embedding_providers: Dict[str, EmbeddingProvider] = {}

        self._default_text_provider: Optional[str] = None
        self._default_image_provider: Optional[str] = None
        self._default_video_provider: Optional[str] = None
        self._default_voice_provider: Optional[str] = None
        self._default_analysis_provider: Optional[str] = None
        self._default_embedding_provider: Optional[str] = None

    # --- Registration methods ---

    def register_text_provider(self, provider: TextProvider, is_default: bool = False) -> None:
        name = provider.name.lower()
        self._text_providers[name] = provider
        if is_default or not self._default_text_provider:
            self._default_text_provider = name
        logger.info(f"Registered text provider: {provider.name} (default={is_default})")

    def register_image_provider(self, provider: ImageProvider, is_default: bool = False) -> None:
        name = provider.name.lower()
        self._image_providers[name] = provider
        if is_default or not self._default_image_provider:
            self._default_image_provider = name
        logger.info(f"Registered image provider: {provider.name} (default={is_default})")

    def register_video_provider(self, provider: VideoProvider, is_default: bool = False) -> None:
        name = provider.name.lower()
        self._video_providers[name] = provider
        if is_default or not self._default_video_provider:
            self._default_video_provider = name
        logger.info(f"Registered video provider: {provider.name} (default={is_default})")

    def register_voice_provider(self, provider: VoiceProvider, is_default: bool = False) -> None:
        name = provider.name.lower()
        self._voice_providers[name] = provider
        if is_default or not self._default_voice_provider:
            self._default_voice_provider = name
        logger.info(f"Registered voice provider: {provider.name} (default={is_default})")

    def register_analysis_provider(self, provider: AnalysisProvider, is_default: bool = False) -> None:
        name = provider.name.lower()
        self._analysis_providers[name] = provider
        if is_default or not self._default_analysis_provider:
            self._default_analysis_provider = name
        logger.info(f"Registered analysis provider: {provider.name} (default={is_default})")

    def register_embedding_provider(self, provider: EmbeddingProvider, is_default: bool = False) -> None:
        name = provider.name.lower()
        self._embedding_providers[name] = provider
        if is_default or not self._default_embedding_provider:
            self._default_embedding_provider = name
        logger.info(f"Registered embedding provider: {provider.name} (default={is_default})")

    # --- Discovery & Introspection ---

    def list_available_providers(self) -> Dict[str, List[str]]:
        """Returns the registered providers for each modality."""
        return {
            "text": list(self._text_providers.keys()),
            "image": list(self._image_providers.keys()),
            "video": list(self._video_providers.keys()),
            "voice": list(self._voice_providers.keys()),
            "analysis": list(self._analysis_providers.keys()),
            "embedding": list(self._embedding_providers.keys()),
        }

    # --- Dispatch Methods ---

    async def generate_text(
        self, request: TextGenerationRequest, preferred_provider: Optional[str] = None
    ) -> TextGenerationResult:
        provider_name = (preferred_provider or self._default_text_provider or "").lower()
        provider = self._text_providers.get(provider_name)

        if not provider:
            raise IntegrationException(
                provider=provider_name or "text",
                message=f"No active Text AI provider configured. Available: {list(self._text_providers.keys())}",
            )

        logger.info(f"Dispatching text generation to {provider.name}")
        return await provider.generate_text(request)

    async def generate_image(
        self, request: ImageGenerationRequest, preferred_provider: Optional[str] = None
    ) -> ImageGenerationResult:
        provider_name = (preferred_provider or self._default_image_provider or "").lower()
        provider = self._image_providers.get(provider_name)

        if not provider:
            raise IntegrationException(
                provider=provider_name or "image",
                message=f"No active Image AI provider configured. Available: {list(self._image_providers.keys())}",
            )

        logger.info(f"Dispatching image generation to {provider.name}")
        return await provider.generate_image(request)

    async def generate_video(
        self, request: VideoGenerationRequest, preferred_provider: Optional[str] = None
    ) -> VideoGenerationResult:
        provider_name = (preferred_provider or self._default_video_provider or "").lower()
        provider = self._video_providers.get(provider_name)

        if not provider:
            raise IntegrationException(
                provider=provider_name or "video",
                message=f"No active Video AI provider configured. Available: {list(self._video_providers.keys())}",
            )

        logger.info(f"Dispatching video generation to {provider.name}")
        return await provider.generate_video(request)

    async def generate_voice(
        self, request: VoiceGenerationRequest, preferred_provider: Optional[str] = None
    ) -> VoiceGenerationResult:
        provider_name = (preferred_provider or self._default_voice_provider or "").lower()
        provider = self._voice_providers.get(provider_name)

        if not provider:
            raise IntegrationException(
                provider=provider_name or "voice",
                message=f"No active Voice AI provider configured. Available: {list(self._voice_providers.keys())}",
            )

        logger.info(f"Dispatching voice generation to {provider.name}")
        return await provider.generate_voice(request)

    async def analyze(
        self, request: AnalysisRequest, preferred_provider: Optional[str] = None
    ) -> AnalysisResult:
        provider_name = (preferred_provider or self._default_analysis_provider or "").lower()
        provider = self._analysis_providers.get(provider_name)

        if not provider:
            raise IntegrationException(
                provider=provider_name or "analysis",
                message=f"No active Analysis AI provider configured. Available: {list(self._analysis_providers.keys())}",
            )

        logger.info(f"Dispatching analysis to {provider.name}")
        return await provider.analyze(request)

    async def embed(
        self, request: EmbeddingRequest, preferred_provider: Optional[str] = None
    ) -> EmbeddingResult:
        provider_name = (preferred_provider or self._default_embedding_provider or "").lower()
        provider = self._embedding_providers.get(provider_name)

        if not provider:
            raise IntegrationException(
                provider=provider_name or "embedding",
                message=f"No active Embedding AI provider configured. Available: {list(self._embedding_providers.keys())}",
            )

        logger.info(f"Dispatching embedding request to {provider.name}")
        return await provider.embed(request)

    def register_default_providers(self) -> None:
        """Initializes and registers standard concrete multi-modal adapters."""
        from app.integrations.ai.providers import (
            OpenAITextProvider,
            OpenAIImageProvider,
            RunwayVideoProvider,
            ElevenLabsVoiceProvider,
            OpenAIEmbeddingProvider,
        )
        self.register_text_provider(OpenAITextProvider(), is_default=True)
        self.register_image_provider(OpenAIImageProvider(), is_default=True)
        self.register_video_provider(RunwayVideoProvider(), is_default=True)
        self.register_voice_provider(ElevenLabsVoiceProvider(), is_default=True)
        self.register_embedding_provider(OpenAIEmbeddingProvider(), is_default=True)


# Global AI Provider Gateway Singleton
ai_gateway = AIProviderGateway()
ai_gateway.register_default_providers()


def get_ai_gateway() -> AIProviderGateway:
    """Dependency injection helper for the AI Gateway."""
    return ai_gateway
