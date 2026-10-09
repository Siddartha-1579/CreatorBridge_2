"""Brand repository implementation."""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.schemas.brand import BrandProfileResponse, BrandVerificationStatus


class BrandRepository(BaseRepository[BrandProfileResponse]):
    """Repository handling brand organization profiles database persistence."""

    def __init__(self):
        self._store: Dict[UUID, BrandProfileResponse] = {}
        self._seed_foundational_brand()

    def _seed_foundational_brand(self):
        sample_id = UUID("00000000-0000-0000-0000-000000000002")
        now = datetime.now(timezone.utc)
        self._store[sample_id] = BrandProfileResponse(
            id=sample_id,
            user_id="dev-brand-001",
            company_name="Apex Media Global",
            organization_type="Enterprise",
            primary_industry="Entertainment & Streaming",
            secondary_industries=["Technology", "Gaming", "Advertising"],
            contact_name="Sarah Chen",
            business_email="sarah.chen@apexmedia.example.com",
            website="https://apexmedia.example.com",
            logo_url="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80",
            description="Global digital production studio commissioning episodic AI trailers, speculative commercials, and dynamic motion assets.",
            location="Bengaluru & Singapore",
            team_size="50-200",
            social_links={
                "website": "https://apexmedia.example.com",
                "linkedin": "https://linkedin.com/company/apex-media-global",
            },
            brand_guidelines_url="https://apexmedia.example.com/brand-guidelines.pdf",
            preferred_communication="EMAIL",
            is_agency=False,
            verification_status=BrandVerificationStatus.VERIFIED,
            onboarding_completed=True,
            profile_completeness_pct=90,
            metadata={"onboarding_version": "2.0"},
            created_at=now,
            updated_at=now,
        )

    async def get_by_id(self, id: UUID) -> Optional[BrandProfileResponse]:
        return self._store.get(id)

    async def get_by_user_id(self, user_id: str) -> Optional[BrandProfileResponse]:
        for profile in self._store.values():
            if profile.user_id == user_id:
                return profile
        return None

    async def list_all(
        self, skip: int = 0, limit: int = 20, filters: Optional[Dict[str, Any]] = None
    ) -> List[BrandProfileResponse]:
        brands = list(self._store.values())
        return brands[skip : skip + limit]

    async def create(self, entity: BrandProfileResponse) -> BrandProfileResponse:
        self._store[entity.id] = entity
        return entity

    async def update(self, id: UUID, update_data: Dict[str, Any]) -> Optional[BrandProfileResponse]:
        existing = self._store.get(id)
        if not existing:
            return None
        updated_dict = existing.model_dump()
        updated_dict.update(update_data)
        updated_dict["updated_at"] = datetime.now(timezone.utc)
        updated_entity = BrandProfileResponse(**updated_dict)
        self._store[id] = updated_entity
        return updated_entity

    async def delete(self, id: UUID) -> bool:
        if id in self._store:
            del self._store[id]
            return True
        return False
