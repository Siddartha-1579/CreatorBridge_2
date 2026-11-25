"""Video generation provider interface and concrete Runway/Demo adapter."""

import time
from abc import abstractmethod
from typing import Optional
import anyio
import httpx
from app.core.config import settings
from app.core.errors import (
    IntegrationException,
    ProviderNotConfiguredException,
    ValidationException,
)
from app.core.logging import get_logger
from app.integrations.ai.base import (
    BaseAIProvider,
    AIProviderMetadata,
    VideoGenerationRequest,
    VideoGenerationResult,
)
from app.integrations.storage.base import StorageProvider

logger = get_logger("ai.provider.video")


class VideoProvider(BaseAIProvider):
    """Abstract interface for video generation providers (Runway Gen-3, Demo Mode, etc.)."""

    @abstractmethod
    async def generate_video(self, request: VideoGenerationRequest) -> VideoGenerationResult:
        """Generates video content from prompt and optional keyframe image."""
        pass


class RunwayVideoProvider(VideoProvider):
    """
    Video generation provider adapter with dual-mode support:
    1. DEMO MODE (default, zero cost):
       Serves verified, locally hosted high-definition demo MP4 reels with explicit
       'DEMO SAMPLE' labeling and notices, requiring ₹0 and zero external API dependencies.
    2. LIVE MODE (optional):
       Submits real synthesis requests to Runway Gen-3 Alpha API, polls status asynchronously,
       downloads resulting MP4 bytes, and archives to persistent object storage.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        storage: Optional[StorageProvider] = None,
        mode: Optional[str] = None,
        poll_interval_seconds: float = 2.0,
        max_poll_seconds: float = 60.0,
    ):
        super().__init__(
            AIProviderMetadata(
                name="runway",
                version="1.0.0",
                supported_models=["gen3a_turbo", "gen2", "demo-curated-reel"],
                rate_limit_rpm=20,
            )
        )
        self.api_key = (
            api_key
            or settings.runway_api_key
            or settings.video_ai_api_key
            or settings.video_api_key
        )
        self.model = (
            model
            or settings.video_ai_model
            or settings.video_model
            or "gen3a_turbo"
        )
        self.base_url = (
            base_url
            or settings.video_ai_base_url
            or "https://api.dev.runwayml.com/v1"
        ).rstrip("/")
        self.storage = storage
        self.mode = (mode or getattr(settings, "video_generation_mode", "demo") or "demo").lower()
        self.poll_interval_seconds = poll_interval_seconds
        self.max_poll_seconds = max_poll_seconds

    async def is_available(self) -> bool:
        """
        Verifies availability based on active mode:
        - Demo Mode is always available at zero cost without credentials.
        - Live Mode requires a valid Runway API key.
        """
        if self.mode == "demo":
            return True
        return bool(self.api_key and len(self.api_key.strip()) > 8)

    async def generate_video(self, request: VideoGenerationRequest) -> VideoGenerationResult:
        """
        Generates or selects video output based on active mode.
        """
        # Validate inputs
        if not request.prompt or not request.prompt.strip():
            raise ValidationException("Video generation prompt cannot be empty.")

        duration = request.duration_seconds if request.duration_seconds in (5, 10) else 5
        ratio = request.aspect_ratio if request.aspect_ratio in ("16:9", "9:16", "1:1") else "16:9"

        # -------------------------------------------------------------
        # 1. DEMO MODE (₹0 Zero Cost, Hackathon Ready)
        # -------------------------------------------------------------
        if self.mode == "demo":
            logger.info("Executing video generation in zero-cost DEMO MODE with verified local MP4 asset")
            prompt_lower = request.prompt.lower()
            
            # Select appropriate local demo MP4 based on prompt theme
            cyber_keywords = ["cyber", "neon", "tokyo", "future", "flux", "tech", "couture", "fashion", "matrix", "electric"]
            if any(k in prompt_lower for k in cyber_keywords):
                demo_video_path = "/demo-assets/marcus-project-temporal-flux.mp4"
                demo_theme = "Temporal Flux Cyber Reel"
            else:
                demo_video_path = "/demo-assets/marcus-project-kinetic-trail.mp4"
                demo_theme = "Kinetic Trail Action Reel"

            return VideoGenerationResult(
                video_url=demo_video_path,
                duration_seconds=duration,
                model="demo-curated-reel",
                provider="demo",
                parameters_used={
                    "is_demo": True,
                    "sample_label": "DEMO SAMPLE",
                    "pre_generated": True,
                    "theme": demo_theme,
                    "aspect_ratio": ratio,
                    "duration": duration,
                    "prompt_entered": request.prompt,
                    "notice": (
                        "Pre-generated showcase video reel for zero-cost hackathon demonstration. "
                        "Not synthesized live from entered prompt."
                    ),
                },
            )

        # -------------------------------------------------------------
        # 2. LIVE MODE (Requires Server-Side Runway Credentials)
        # -------------------------------------------------------------
        if not await self.is_available():
            raise ProviderNotConfiguredException(
                provider="runway",
                message=(
                    "Live video generation is currently unconfigured. To enable live Runway Gen-3 synthesis, "
                    "configure RUNWAY_API_KEY in server environment variables or switch to VIDEO_GENERATION_MODE=demo."
                ),
            )

        model = request.model or self.model
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-Runway-Version": "2024-09-13",
            "Content-Type": "application/json",
        }

        # Select endpoint: text_to_video vs image_to_video
        if request.source_image_url:
            endpoint = f"{self.base_url}/image_to_video"
            payload = {
                "promptImage": request.source_image_url,
                "promptText": request.prompt,
                "model": model,
                "duration": duration,
                "ratio": ratio,
            }
        else:
            endpoint = f"{self.base_url}/text_to_video"
            payload = {
                "promptText": request.prompt,
                "model": model,
                "duration": duration,
                "ratio": ratio,
            }

        async with httpx.AsyncClient(timeout=float(settings.ai_request_timeout_seconds)) as client:
            try:
                resp = await client.post(endpoint, headers=headers, json=payload)
            except httpx.RequestError as exc:
                raise IntegrationException("runway", f"Network error submitting job to Runway: {exc}") from exc

            if resp.status_code == 401:
                raise IntegrationException(
                    "runway",
                    "Runway API authentication failed. Verify that your RUNWAY_API_KEY is valid and active.",
                )
            elif resp.status_code == 429:
                raise IntegrationException(
                    "runway",
                    "Runway API rate limit exceeded or account credits exhausted.",
                )
            elif resp.status_code not in (200, 201):
                raise IntegrationException(
                    "runway",
                    f"Runway API returned error HTTP {resp.status_code}: {resp.text}",
                )

            task_data = resp.json()
            task_id = task_data.get("id")
            if not task_id:
                raise IntegrationException("runway", f"Runway API did not return a valid task ID: {resp.text}")

            logger.info(f"Submitted Runway video task {task_id}. Polling for completion...")

            # Poll task status until SUCCEEDED or FAILED
            start_time = time.monotonic()
            output_video_url: Optional[str] = None

            while (time.monotonic() - start_time) < self.max_poll_seconds:
                try:
                    poll_resp = await client.get(f"{self.base_url}/tasks/{task_id}", headers=headers)
                except httpx.RequestError as exc:
                    logger.warning(f"Error polling Runway task {task_id}: {exc}")
                    await anyio.sleep(self.poll_interval_seconds)
                    continue

                if poll_resp.status_code != 200:
                    logger.warning(f"Poll check returned HTTP {poll_resp.status_code}: {poll_resp.text}")
                    await anyio.sleep(self.poll_interval_seconds)
                    continue

                poll_data = poll_resp.json()
                task_status = str(poll_data.get("status", "")).upper()

                if task_status in ("PENDING", "THROTTLED", "RUNNING"):
                    await anyio.sleep(self.poll_interval_seconds)
                    continue
                elif task_status == "SUCCEEDED":
                    outputs = poll_data.get("output", [])
                    if not outputs:
                        raise IntegrationException(
                            "runway",
                            f"Runway task {task_id} completed successfully but returned no output media URLs.",
                        )
                    output_video_url = outputs[0]
                    break
                elif task_status == "FAILED":
                    failure_msg = (
                        poll_data.get("failure")
                        or poll_data.get("failureCode")
                        or "Task processing failed."
                    )
                    raise IntegrationException("runway", f"Runway video generation task failed: {failure_msg}")
                elif task_status == "CANCELLED":
                    raise IntegrationException("runway", "Runway video generation task was cancelled.")
                else:
                    logger.warning(f"Unknown Runway task status: {task_status}")
                    await anyio.sleep(self.poll_interval_seconds)

            if not output_video_url:
                raise IntegrationException(
                    "runway",
                    f"Video generation timed out after {int(self.max_poll_seconds)} seconds waiting for Runway task {task_id}.",
                )

            # Download completed video media bytes
            logger.info(f"Runway task {task_id} succeeded. Downloading generated video...")
            try:
                dl_resp = await client.get(output_video_url, timeout=60.0)
                dl_resp.raise_for_status()
                video_bytes = dl_resp.content
            except Exception as dl_err:
                raise IntegrationException(
                    "runway",
                    f"Failed to retrieve generated video file from provider: {dl_err}",
                ) from dl_err

            # Upload to persistent storage
            from app.integrations.storage import storage_provider
            storage = self.storage or storage_provider
            final_video_url = output_video_url
            storage_path = None

            if storage and storage.is_configured():
                bucket = settings.storage_generations_bucket
                clean_path = f"videos/{task_id}.mp4"
                try:
                    storage_path = await storage.upload_file(
                        bucket=bucket,
                        path=clean_path,
                        content=video_bytes,
                        content_type="video/mp4",
                    )
                    final_video_url = await storage.get_public_url(bucket=bucket, path=clean_path)
                    logger.info(f"Stored generated video to persistent storage: {final_video_url}")
                except Exception as stor_err:
                    logger.error(f"Failed to store video in persistent storage: {stor_err}")
                    raise IntegrationException(
                        "storage",
                        f"Video was generated but could not be stored in persistent storage: {stor_err}",
                    ) from stor_err
            else:
                logger.info("Persistent storage is not configured; returning provider media URL.")

            return VideoGenerationResult(
                video_url=final_video_url,
                duration_seconds=duration,
                model=model,
                provider="runway",
                parameters_used={
                    "is_demo": False,
                    "task_id": task_id,
                    "aspect_ratio": ratio,
                    "duration": duration,
                    "storage_path": storage_path,
                },
            )
