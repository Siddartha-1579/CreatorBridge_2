"""Video generation provider interface and concrete Runway adapter."""

from abc import abstractmethod
from typing import Optional
import httpx
from app.core.config import settings
from app.core.logging import get_logger
from app.integrations.ai.base import (
    BaseAIProvider,
    AIProviderMetadata,
    VideoGenerationRequest,
    VideoGenerationResult,
)

logger = get_logger("ai.provider.video")


class VideoProvider(BaseAIProvider):
    """Abstract interface for video generation providers (Runway Gen-3, Luma Dream Machine, Kling, Sora, etc.)."""

    @abstractmethod
    async def generate_video(self, request: VideoGenerationRequest) -> VideoGenerationResult:
        """Generates video content from prompt and optional keyframe image."""
        pass


class RunwayVideoProvider(VideoProvider):
    """Runway Gen-3 Alpha video generation provider adapter with graceful motion preview fallbacks."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        super().__init__(
            AIProviderMetadata(
                name="runway",
                version="1.0.0",
                supported_models=["gen3a_turbo", "gen2"],
                rate_limit_rpm=20,
            )
        )
        self.api_key = api_key or settings.video_api_key or settings.runway_api_key
        self.model = model or settings.video_model

    async def is_available(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 8)

    async def generate_video(self, request: VideoGenerationRequest) -> VideoGenerationResult:
        model = request.model or self.model

        # Live dispatch if credentials exist
        if await self.is_available():
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "X-Runway-Version": "2024-09-13",
                    "Content-Type": "application/json",
                }
                payload = {
                    "promptText": request.prompt,
                    "model": model,
                    "duration": request.duration_seconds,
                    "ratio": request.aspect_ratio,
                }
                if request.source_image_url:
                    payload["promptImage"] = request.source_image_url

                async with httpx.AsyncClient(timeout=float(settings.ai_request_timeout_seconds)) as client:
                    resp = await client.post("https://api.dev.runwayml.com/v1/image_to_video", headers=headers, json=payload)
                    if resp.status_code in [200, 201]:
                        task_data = resp.json()
                        task_id = task_data.get("id")
                        return VideoGenerationResult(
                            video_url=f"https://api.dev.runwayml.com/v1/tasks/{task_id}/output",
                            duration_seconds=request.duration_seconds,
                            model=model,
                            provider="runway",
                            parameters_used={"task_id": task_id, "aspect_ratio": request.aspect_ratio},
                        )
                    else:
                        logger.warning(f"Runway API returned {resp.status_code}: {resp.text}. Using fallback clip.")
            except Exception as e:
                logger.error(f"Runway video generation failed: {e}. Executing fallback video.")

        # High-definition video sample clip fallback
        sample_video_url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        return VideoGenerationResult(
            video_url=sample_video_url,
            duration_seconds=request.duration_seconds or 5,
            model=f"{model}-simulated",
            provider="runway-simulated",
            parameters_used={
                "aspect_ratio": request.aspect_ratio or "16:9",
                "fps": request.fps or 24,
                "prompt_theme": "motion-cinematics-sample",
            },
        )
