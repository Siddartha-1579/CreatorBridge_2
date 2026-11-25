"""AI Provider Gateway contract test."""

import pytest
import anyio
from app.integrations.ai.gateway import AIProviderGateway
from app.integrations.ai.base import (
    AIProviderMetadata,
    TextGenerationRequest,
    TextGenerationResult,
)
from app.integrations.ai.providers.text import TextProvider
from app.core.errors import IntegrationException


class MockOpenAITextProvider(TextProvider):
    """Test stub implementing the TextProvider contract."""

    def __init__(self):
        super().__init__(
            AIProviderMetadata(
                name="openai",
                version="1.0.0",
                supported_models=["gpt-4o", "gpt-4o-mini"],
            )
        )

    async def is_available(self) -> bool:
        return True

    async def generate_text(self, request: TextGenerationRequest) -> TextGenerationResult:
        return TextGenerationResult(
            content=f"Generated response for: {request.prompt}",
            tokens_used=42,
            model=request.model or "gpt-4o",
            provider="openai",
        )


def test_ai_gateway_registration_and_dispatch():
    async def run():
        gateway = AIProviderGateway()
        provider = MockOpenAITextProvider()
        gateway.register_text_provider(provider, is_default=True)

        result = await gateway.generate_text(
            TextGenerationRequest(prompt="Write a storyboard outline")
        )
        assert result.content.startswith("Generated response for: Write a storyboard outline")
        assert result.provider == "openai"

    anyio.run(run)


def test_ai_gateway_missing_provider_raises():
    async def run():
        gateway = AIProviderGateway()
        with pytest.raises(IntegrationException):
            await gateway.generate_image(
                # No image provider registered
                request=None,  # type: ignore
            )

    anyio.run(run)
