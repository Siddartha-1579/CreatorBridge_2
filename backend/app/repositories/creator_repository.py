"""Creator repository implementation."""

from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from app.repositories.base import BaseRepository
from app.schemas.creator import CreatorProfileResponse, CreatorLevel


class CreatorRepository(BaseRepository[CreatorProfileResponse]):
    """Repository handling creator profiles database persistence."""

    def __init__(self):
        # In-memory storage mock registry initialized with seed foundational entries for dev/testing
        self._store: Dict[UUID, CreatorProfileResponse] = {}
        self._seed_foundational_creators()

    def _seed_foundational_creators(self):
        sample_id = UUID("00000000-0000-0000-0000-000000000001")
        self._store[sample_id] = CreatorProfileResponse(
            id=sample_id,
            user_id="dev-creator-001",
            full_name="Alex Rivera",
            handle="alex_ai_art",
            level=CreatorLevel.AI_MASTER,
            primary_specialization="Photorealistic Cinematic Video & Midjourney v6",
            skills=["Cinematics", "Prompt Engineering", "Color Grading", "Post-Processing"],
            ai_tools=["Runway Gen-3", "Midjourney", "ElevenLabs", "ComfyUI"],
            hourly_rate_cents=12000,
            reputation_score=4.95,
            is_verified=True,
            assessment_completed=True,
            bio="Senior AI Cinematographer crafting brand commercials and hyper-realistic visual worlds.",
        )

    async def get_by_id(self, id: UUID) -> Optional[CreatorProfileResponse]:
        return self._store.get(id)

    async def get_by_user_id(self, user_id: str) -> Optional[CreatorProfileResponse]:
        for profile in self._store.values():
            if profile.user_id == user_id:
                return profile
        return None

    async def get_by_handle(self, handle: str) -> Optional[CreatorProfileResponse]:
        for profile in self._store.values():
            if profile.handle.lower() == handle.lower():
                return profile
        return None

    async def list_all(
        self, skip: int = 0, limit: int = 20, filters: Optional[Dict[str, Any]] = None
    ) -> List[CreatorProfileResponse]:
        creators = list(self._store.values())
        return creators[skip : skip + limit]

    async def create(self, entity: CreatorProfileResponse) -> CreatorProfileResponse:
        self._store[entity.id] = entity
        return entity

    async def update(self, id: UUID, update_data: Dict[str, Any]) -> Optional[CreatorProfileResponse]:
        existing = self._store.get(id)
        if not existing:
            return None
        updated_dict = existing.model_dump()
        updated_dict.update(update_data)
        updated_entity = CreatorProfileResponse(**updated_dict)
        self._store[id] = updated_entity
        return updated_entity

    async def delete(self, id: UUID) -> bool:
        if id in self._store:
            del self._store[id]
            return True
        return False
