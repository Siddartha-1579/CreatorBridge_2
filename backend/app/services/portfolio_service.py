"""Portfolio domain service."""

from typing import Any, List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.services.base import BaseService
from app.core.errors import NotFoundException, ForbiddenException, ValidationException
from app.repositories import portfolio_repository, PortfolioRepository
from app.integrations.storage import storage_provider, StorageProvider
from app.schemas.portfolio import (
    PortfolioProjectCreate,
    PortfolioProjectUpdate,
    PortfolioProjectResponse,
    PortfolioUploadResponse,
    ProjectVisibility,
    AssetType,
    CommercialUseStatus,
    AIGenerationType,
)


class PortfolioService(BaseService):
    """Business logic for Creator Portfolios and Asset storage."""

    def __init__(self, repo: Optional[PortfolioRepository] = None, storage: Optional[StorageProvider] = None):
        super().__init__("portfolio")
        self.repo = repo or portfolio_repository
        self.storage = storage or storage_provider

    async def get_project_by_id(self, project_id: UUID) -> PortfolioProjectResponse:
        item = await self.repo.get_by_id(project_id)
        if not item:
            raise NotFoundException("Portfolio Project", project_id)
        return item

    # Backward compatibility alias
    async def get_item_by_id(self, item_id: UUID) -> PortfolioProjectResponse:
        return await self.get_project_by_id(item_id)

    async def list_by_creator(self, creator_id: Any) -> List[PortfolioProjectResponse]:
        return await self.repo.list_by_creator(creator_id)

    async def list_public_by_creator(self, creator_id: Any) -> List[PortfolioProjectResponse]:
        return await self.repo.list_public_by_creator(creator_id)

    async def add_project(
        self,
        creator_id: UUID,
        data: PortfolioProjectCreate,
    ) -> PortfolioProjectResponse:
        now = datetime.now(timezone.utc)
        item = PortfolioProjectResponse(
            id=uuid4(),
            creator_id=creator_id,
            title=data.title,
            description=data.description,
            category=data.category,
            content_type=data.content_type,
            media_type=data.media_type,
            thumbnail_url=data.thumbnail_url or data.media_url,
            media_url=data.media_url,
            tools=data.tools,
            models=data.models,
            skills=data.skills,
            workflow_summary=data.workflow_summary,
            workflow_stages=data.workflow_stages,
            aspect_ratio=data.aspect_ratio,
            resolution=data.resolution,
            duration_seconds=data.duration_seconds,
            commercial_use_status=data.commercial_use_status,
            ai_generation_type=data.ai_generation_type,
            visibility=data.visibility,
            is_featured=data.is_featured,
            external_url=data.external_url,
            verification_status="UNVERIFIED",
            public_url=data.media_url,
            created_at=now,
            updated_at=now,
        )
        return await self.repo.create(item)

    # Backward compatibility alias
    async def add_item(self, data: Any) -> PortfolioProjectResponse:
        if isinstance(data, PortfolioProjectCreate):
            # fallback UUID if creator_id not in data
            return await self.add_project(UUID("00000000-0000-0000-0000-000000000001"), data)
        # Handle dict or legacy object
        creator_id = UUID(str(getattr(data, "creator_id", "00000000-0000-0000-0000-000000000001")))
        now = datetime.now(timezone.utc)
        media_url = getattr(data, "storage_path", "")
        item = PortfolioProjectResponse(
            id=uuid4(),
            creator_id=creator_id,
            title=getattr(data, "title", "Untitled Asset"),
            description=getattr(data, "description", None),
            category="AI Media",
            content_type="Creative Showcase",
            media_type=getattr(data, "asset_type", AssetType.IMAGE),
            thumbnail_url=getattr(data, "thumbnail_path", None) or media_url,
            media_url=media_url,
            tools=getattr(data, "ai_tools_used", []),
            models=[],
            skills=[],
            workflow_summary=None,
            workflow_stages=[],
            aspect_ratio="16:9",
            resolution="1080p",
            commercial_use_status=CommercialUseStatus.COMMERCIAL_READY,
            ai_generation_type=AIGenerationType.AI_GENERATED,
            visibility=ProjectVisibility.PUBLIC,
            is_featured=getattr(data, "is_featured", False),
            verification_status="UNVERIFIED",
            public_url=media_url,
            created_at=now,
            updated_at=now,
        )
        return await self.repo.create(item)

    async def update_project(
        self,
        project_id: UUID,
        creator_id: UUID,
        data: PortfolioProjectUpdate,
    ) -> PortfolioProjectResponse:
        existing = await self.get_project_by_id(project_id)
        if existing.creator_id != creator_id:
            raise ForbiddenException("You cannot edit portfolio items owned by another creator")

        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        updated = await self.repo.update(project_id, update_dict)
        if not updated:
            raise NotFoundException("Portfolio Project", project_id)
        return updated

    async def delete_project(self, project_id: UUID, creator_id: UUID) -> bool:
        existing = await self.get_project_by_id(project_id)
        if existing.creator_id != creator_id:
            raise ForbiddenException("You cannot delete portfolio items owned by another creator")
        return await self.repo.delete(project_id)

    async def toggle_visibility(
        self,
        project_id: UUID,
        creator_id: UUID,
        visibility: ProjectVisibility,
    ) -> PortfolioProjectResponse:
        existing = await self.get_project_by_id(project_id)
        if existing.creator_id != creator_id:
            raise ForbiddenException("You cannot update portfolio items owned by another creator")
        updated = await self.repo.update(project_id, {"visibility": visibility})
        if not updated:
            raise NotFoundException("Portfolio Project", project_id)
        return updated

    def validate_and_process_upload(
        self,
        filename: str,
        file_size_bytes: int,
        content_type: str,
        creator_id: UUID,
    ) -> PortfolioUploadResponse:
        """Validates file format and size limits, returning mock or real cloud path."""
        allowed_types = {
            "image/jpeg": ("jpg", "IMAGE", 15 * 1024 * 1024),
            "image/png": ("png", "IMAGE", 15 * 1024 * 1024),
            "image/webp": ("webp", "IMAGE", 15 * 1024 * 1024),
            "video/mp4": ("mp4", "VIDEO", 100 * 1024 * 1024),
            "video/webm": ("webm", "VIDEO", 100 * 1024 * 1024),
            "video/quicktime": ("mov", "VIDEO", 100 * 1024 * 1024),
            "audio/mpeg": ("mp3", "AUDIO", 30 * 1024 * 1024),
            "audio/wav": ("wav", "AUDIO", 30 * 1024 * 1024),
        }

        rule = allowed_types.get(content_type.lower())
        if not rule:
            # Check by file extension
            ext = filename.split(".")[-1].lower() if "." in filename else ""
            ext_map = {
                "jpg": ("image/jpeg", "IMAGE", 15 * 1024 * 1024),
                "jpeg": ("image/jpeg", "IMAGE", 15 * 1024 * 1024),
                "png": ("image/png", "IMAGE", 15 * 1024 * 1024),
                "webp": ("image/webp", "IMAGE", 15 * 1024 * 1024),
                "mp4": ("video/mp4", "VIDEO", 100 * 1024 * 1024),
                "mov": ("video/quicktime", "VIDEO", 100 * 1024 * 1024),
                "mp3": ("audio/mpeg", "AUDIO", 30 * 1024 * 1024),
                "wav": ("audio/wav", "AUDIO", 30 * 1024 * 1024),
            }
            if ext in ext_map:
                ct, media_type, max_size = ext_map[ext]
            else:
                raise ValidationException(f"Unsupported media file type: {content_type} ({filename})")
        else:
            _, media_type, max_size = rule

        if file_size_bytes > max_size:
            max_mb = max_size // (1024 * 1024)
            raise ValidationException(f"File size exceeds maximum allowed threshold of {max_mb} MB")

        clean_filename = f"{uuid4()}_{filename.replace(' ', '_')}"
        storage_path = f"creators/{creator_id}/portfolio/{clean_filename}"
        public_url = f"https://mock.supabase.co/storage/v1/object/public/portfolios/{storage_path}"

        return PortfolioUploadResponse(
            storage_path=storage_path,
            public_url=public_url,
            media_type=media_type,
            file_size_bytes=file_size_bytes,
        )


portfolio_service = PortfolioService()
