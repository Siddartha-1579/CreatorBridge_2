"""Portfolio repository implementation."""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.schemas.portfolio import (
    PortfolioProjectResponse,
    AssetType,
    CommercialUseStatus,
    AIGenerationType,
    ProjectVisibility,
    WorkflowStage,
)


class PortfolioRepository(BaseRepository[PortfolioProjectResponse]):
    """Repository handling portfolio projects database persistence."""

    def __init__(self):
        self._store: Dict[UUID, PortfolioProjectResponse] = {}
        self._seed_foundational_portfolio()

    def _seed_foundational_portfolio(self):
        sample_id = UUID("00000000-0000-0000-0000-000000000003")
        creator_id = UUID("00000000-0000-0000-0000-000000000001")
        now = datetime.now(timezone.utc)

        self._store[sample_id] = PortfolioProjectResponse(
            id=sample_id,
            creator_id=creator_id,
            title="Cyberpunk Neo-Tokyo Commercial",
            description="Complete 30s speculative trailer created using Runway Gen-3 and ElevenLabs score.",
            category="AI Video",
            content_type="Cinematic Commercial",
            media_type=AssetType.VIDEO,
            thumbnail_url="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80",
            media_url="https://mock.supabase.co/storage/v1/object/public/portfolios/cyberpunk_tokyo.mp4",
            tools=["Runway Gen-3", "Midjourney", "ElevenLabs", "ComfyUI"],
            models=["Gen-3 Alpha", "Midjourney v6.1"],
            skills=["Cinematics", "Prompt Engineering", "Color Grading"],
            workflow_summary="Concept generation in Midjourney, motion synthesis in Runway Gen-3, audio composition in ElevenLabs.",
            workflow_stages=[
                WorkflowStage(stage_name="Concept & Art Direction", description="Ideated visual boards in Midjourney v6", tools_used=["Midjourney"]),
                WorkflowStage(stage_name="Motion Synthesis", description="Camera control and frame continuity via Runway", tools_used=["Runway Gen-3"]),
                WorkflowStage(stage_name="Audio & Sound Design", description="Voiceover and ambient SFX generation", tools_used=["ElevenLabs"]),
            ],
            aspect_ratio="16:9",
            resolution="4K",
            duration_seconds=30,
            commercial_use_status=CommercialUseStatus.COMMERCIAL_READY,
            ai_generation_type=AIGenerationType.AI_GENERATED,
            visibility=ProjectVisibility.PUBLIC,
            is_featured=True,
            verification_status="VERIFIED",
            public_url="https://mock.supabase.co/storage/v1/object/public/portfolios/cyberpunk_tokyo.mp4",
            created_at=now,
            updated_at=now,
        )

        sample_id_2 = UUID("00000000-0000-0000-0000-000000000004")
        self._store[sample_id_2] = PortfolioProjectResponse(
            id=sample_id_2,
            creator_id=creator_id,
            title="Futuristic Architectural Heritage",
            description="Ultra-detailed high dynamic range renders of futuristic brutalist architecture.",
            category="AI Image",
            content_type="Concept Art & Keyframes",
            media_type=AssetType.IMAGE,
            thumbnail_url="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
            media_url="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80",
            tools=["Midjourney", "Magnific AI"],
            models=["Midjourney v6.1", "Magnific Relight"],
            skills=["Photorealism", "Architectural Rendering", "Upscaling"],
            workflow_summary="High-res diffusion iterations upscaled 4x with structure preservation.",
            workflow_stages=[
                WorkflowStage(stage_name="Initial Generation", description="Generated high-res base compositions in Midjourney", tools_used=["Midjourney"]),
                WorkflowStage(stage_name="Detail Enhancement", description="Upscaling and texture hallucination in Magnific AI", tools_used=["Magnific AI"]),
            ],
            aspect_ratio="16:9",
            resolution="8K",
            duration_seconds=None,
            commercial_use_status=CommercialUseStatus.COMMERCIAL_READY,
            ai_generation_type=AIGenerationType.AI_GENERATED,
            visibility=ProjectVisibility.PUBLIC,
            is_featured=False,
            verification_status="VERIFIED",
            public_url="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80",
            created_at=now,
            updated_at=now,
        )

    async def get_by_id(self, id: UUID) -> Optional[PortfolioProjectResponse]:
        return self._store.get(id)

    async def list_by_creator(self, creator_id: Any) -> List[PortfolioProjectResponse]:
        c_str = str(creator_id)
        return [item for item in self._store.values() if str(item.creator_id) == c_str]

    async def list_public_by_creator(self, creator_id: Any) -> List[PortfolioProjectResponse]:
        c_str = str(creator_id)
        return [
            item for item in self._store.values()
            if str(item.creator_id) == c_str and item.visibility == ProjectVisibility.PUBLIC
        ]

    async def list_all(
        self, skip: int = 0, limit: int = 20, filters: Optional[Dict[str, Any]] = None
    ) -> List[PortfolioProjectResponse]:
        items = list(self._store.values())
        return items[skip : skip + limit]

    async def create(self, entity: PortfolioProjectResponse) -> PortfolioProjectResponse:
        self._store[entity.id] = entity
        return entity

    async def update(self, id: UUID, update_data: Dict[str, Any]) -> Optional[PortfolioProjectResponse]:
        existing = self._store.get(id)
        if not existing:
            return None
        updated_dict = existing.model_dump()
        updated_dict.update(update_data)
        updated_dict["updated_at"] = datetime.now(timezone.utc)
        updated_entity = PortfolioProjectResponse(**updated_dict)
        self._store[id] = updated_entity
        return updated_entity

    async def delete(self, id: UUID) -> bool:
        if id in self._store:
            del self._store[id]
            return True
        return False
