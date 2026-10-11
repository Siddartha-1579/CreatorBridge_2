"""AI Generation domain service coordinating generation jobs and the AI Provider Gateway."""

from typing import List, Optional
from uuid import UUID, uuid4
from app.services.base import BaseService
from app.core.config import settings
from app.core.errors import NotFoundException, ValidationException
from app.repositories import generation_repository, GenerationJobRepository, portfolio_repository, PortfolioRepository
from app.integrations.ai.gateway import ai_gateway, AIProviderGateway
from app.integrations.ai.base import (
    TextGenerationRequest,
    ImageGenerationRequest,
    VideoGenerationRequest,
    VoiceGenerationRequest,
)
from app.schemas.portfolio import AssetType, PortfolioItemCreate
from app.schemas.generation import (
    GenerationJobCreate,
    GenerationJobResponse,
    GenerationJobStatus,
)


class GenerationService(BaseService):
    """
    Coordinates AI generation workflows between the user, repository, and AI Provider Gateway.
    Decouples UI and business logic from underlying AI vendor SDKs.
    """

    def __init__(
        self,
        repo: Optional[GenerationJobRepository] = None,
        gateway: Optional[AIProviderGateway] = None,
        portfolio_repo: Optional[PortfolioRepository] = None,
    ):
        super().__init__("generation")
        self.repo = repo or generation_repository
        self.gateway = gateway or ai_gateway
        self.portfolio_repo = portfolio_repo or portfolio_repository

    async def get_job_by_id(self, job_id: UUID) -> GenerationJobResponse:
        job = await self.repo.get_by_id(job_id)
        if not job:
            raise NotFoundException("Generation Job", job_id)
        return job

    async def list_jobs_for_user(self, user_id: str) -> List[GenerationJobResponse]:
        return await self.repo.list_by_user(user_id)

    async def submit_job(self, user_id: str, data: GenerationJobCreate) -> GenerationJobResponse:
        """
        Creates, enqueues, and executes an AI generation job through the AI Provider Gateway.
        Enforces character ceilings, timeout policies, and multi-modal error handling.
        """
        # Enforce input length ceiling
        if len(data.prompt) > settings.ai_max_input_chars:
            raise ValidationException(
                f"Prompt length ({len(data.prompt)} chars) exceeds maximum allowed ({settings.ai_max_input_chars} chars)"
            )

        job_id = uuid4()
        provider_name = data.preferred_provider or "default"

        job = GenerationJobResponse(
            id=job_id,
            user_id=user_id,
            project_id=data.project_id,
            provider_name=provider_name,
            modality=data.modality,
            status=GenerationJobStatus.PROCESSING,
            parameters=data.parameters,
        )
        saved_job = await self.repo.create(job)
        self.logger.info(f"Queued generation job {job_id} for user {user_id} (modality={data.modality})")

        try:
            result_asset_path: Optional[str] = None
            result_metadata = dict(data.parameters)
            actual_provider = provider_name

            if data.modality == AssetType.IMAGE:
                ar = data.parameters.get("aspect_ratio", "1:1")
                dims = {"1:1": (1024, 1024), "16:9": (1792, 1024), "9:16": (1024, 1792)}.get(ar, (1024, 1024))
                res = await self.gateway.generate_image(
                    ImageGenerationRequest(
                        prompt=data.prompt,
                        aspect_ratio=ar,
                        width=dims[0],
                        height=dims[1],
                        extra_params=data.parameters,
                    ),
                    preferred_provider=data.preferred_provider,
                )
                result_asset_path = res.image_urls[0] if res.image_urls else None
                result_metadata.update(res.parameters_used)
                actual_provider = res.provider

            elif data.modality == AssetType.VIDEO:
                dur = int(data.parameters.get("duration", 5))
                ar = data.parameters.get("aspect_ratio", "16:9")
                res = await self.gateway.generate_video(
                    VideoGenerationRequest(
                        prompt=data.prompt,
                        duration_seconds=dur,
                        aspect_ratio=ar,
                        extra_params=data.parameters,
                    ),
                    preferred_provider=data.preferred_provider,
                )
                result_asset_path = res.video_url
                result_metadata.update(res.parameters_used)
                actual_provider = res.provider

            elif data.modality == AssetType.AUDIO:
                voice_id = data.parameters.get("voice_id", "21m00Tcm4TlvDq8ikWAM")
                res = await self.gateway.generate_voice(
                    VoiceGenerationRequest(
                        text=data.prompt,
                        voice_id=voice_id,
                        extra_params=data.parameters,
                    ),
                    preferred_provider=data.preferred_provider,
                )
                result_asset_path = res.audio_url
                result_metadata.update({"duration_seconds": res.duration_seconds, "voice_id": res.voice_id})
                actual_provider = res.provider

            elif data.modality == AssetType.TEXT:
                res = await self.gateway.generate_text(
                    TextGenerationRequest(
                        prompt=data.prompt,
                        extra_params=data.parameters,
                    ),
                    preferred_provider=data.preferred_provider,
                )
                result_asset_path = res.content
                result_metadata.update({"tokens_used": res.tokens_used, "model": res.model})
                actual_provider = res.provider

            updated_job = await self.repo.update(
                job_id,
                {
                    "status": GenerationJobStatus.COMPLETED,
                    "provider_name": actual_provider,
                    "result_asset_path": result_asset_path,
                    "result_metadata": result_metadata,
                },
            )
            return updated_job or saved_job

        except Exception as e:
            self.logger.error(f"Job execution failed for {job_id}: {e}")
            failed_job = await self.repo.update(
                job_id,
                {
                    "status": GenerationJobStatus.FAILED,
                    "error_message": str(e),
                },
            )
            return failed_job or saved_job

    async def save_asset_to_portfolio(self, user_id: str, job_id: UUID, title: str) -> dict:
        """Saves a completed AI generation asset directly into creator's portfolio."""
        from datetime import datetime, timezone
        from app.schemas.portfolio import PortfolioProjectResponse
        from app.services import creator_service

        job = await self.get_job_by_id(job_id)
        if job.status != GenerationJobStatus.COMPLETED or not job.result_asset_path:
            raise ValidationException("Cannot save incomplete or failed generation job to portfolio")

        creator = await creator_service.get_profile_by_user_id(user_id)
        creator_id = creator.id
        now = datetime.now(timezone.utc)
        item_id = uuid4()

        proj = PortfolioProjectResponse(
            id=item_id,
            creator_id=creator_id,
            title=title or f"AI Studio {job.modality.value.title()} Asset",
            description=f"Generated via HacXLerate AI Studio ({job.provider_name}). Parameters: {job.parameters}",
            category=f"AI {job.modality.value.title()}",
            content_type="Studio Creation",
            media_type=job.modality,
            thumbnail_url=job.result_asset_path if job.modality == AssetType.IMAGE else "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
            media_url=job.result_asset_path,
            public_url=job.result_asset_path,
            tools=[job.provider_name.replace("-simulated", "")],
            models=[str(job.parameters.get("model", "default"))],
            skills=["Generative AI", "Asset Synthesis"],
            aspect_ratio=str(job.parameters.get("aspect_ratio", "16:9")),
            resolution="1080p",
            created_at=now,
            updated_at=now,
        )
        saved_item = await self.portfolio_repo.create(proj)
        self.logger.info(f"Saved generated job asset {job_id} to portfolio item {saved_item.id}")
        return {"success": True, "portfolio_item_id": str(saved_item.id), "title": saved_item.title}

