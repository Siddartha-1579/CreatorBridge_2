"""Brand preferences repository for creative requirements and campaign criteria."""

from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.schemas.brand import BrandPreferencesResponse, BrandPreferencesBase


class BrandPreferencesRepository(BaseRepository[BrandPreferencesResponse]):
    """Repository handling brand creative preferences database persistence."""

    def __init__(self):
        self._store: Dict[UUID, BrandPreferencesResponse] = {}  # brand_id -> BrandPreferencesResponse
        self._seed_foundational_preferences()

    def _seed_foundational_preferences(self):
        brand_id = UUID("00000000-0000-0000-0000-000000000002")
        pref_id = UUID("20000000-0000-0000-0000-000000000001")
        now = datetime.now(timezone.utc)

        self._store[brand_id] = BrandPreferencesResponse(
            id=pref_id,
            brand_id=brand_id,
            intended_uses=[
                "Producing advertising campaigns",
                "Developing AI-generated videos",
                "Discovering AI creators",
            ],
            content_requirements=[
                "Short-form videos",
                "Product advertisements",
                "AI filmmaking",
                "Product visualizations",
            ],
            target_niches=["Entertainment", "Technology", "Gaming"],
            preferred_formats=["16:9 landscape", "9:16 vertical"],
            creative_styles=["Cinematic", "Photorealistic", "Futuristic"],
            style_description="High-end cinematic motion with photorealistic textures, dynamic camera pacing, and atmospheric sound design.",
            intended_usage_channels=["Paid advertising", "Organic social", "Website"],
            project_timeline="2-4 weeks",
            commercial_rights_required=True,
            exclusive_usage_required=False,
            source_files_required=True,
            budget_range="₹50,000–₹1,00,000",
            engagement_type="Campaign",
            adaptive_data={
                "video_duration_range": "30s - 90s",
                "target_platforms": ["YouTube", "Instagram Reels", "Digital OOH"],
                "dialogue_required": True,
            },
            created_at=now,
            updated_at=now,
        )

    async def get_by_id(self, id: UUID) -> Optional[BrandPreferencesResponse]:
        for pref in self._store.values():
            if pref.id == id:
                return pref
        return None

    async def get_by_brand_id(self, brand_id: UUID) -> Optional[BrandPreferencesResponse]:
        return self._store.get(brand_id)

    async def upsert(self, brand_id: UUID, data: BrandPreferencesBase) -> BrandPreferencesResponse:
        now = datetime.now(timezone.utc)
        existing = self._store.get(brand_id)
        if existing:
            updated_dict = existing.model_dump()
            updated_dict.update(data.model_dump())
            updated_dict["updated_at"] = now
            entity = BrandPreferencesResponse(**updated_dict)
        else:
            entity = BrandPreferencesResponse(
                id=uuid4(),
                brand_id=brand_id,
                **data.model_dump(),
                created_at=now,
                updated_at=now,
            )
        self._store[brand_id] = entity
        return entity

    async def delete(self, brand_id: UUID) -> bool:
        if brand_id in self._store:
            del self._store[brand_id]
            return True
        return False
