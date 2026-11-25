"""Brand survey session repository for save-and-resume adaptive questionnaire."""

from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.schemas.brand import BrandSurveySessionResponse


class BrandSurveyRepository(BaseRepository[BrandSurveySessionResponse]):
    """Repository handling brand onboarding survey sessions and state persistence."""

    def __init__(self):
        self._store: Dict[UUID, BrandSurveySessionResponse] = {}  # brand_id -> BrandSurveySessionResponse

    async def get_by_brand_id(self, brand_id: UUID) -> Optional[BrandSurveySessionResponse]:
        return self._store.get(brand_id)

    async def save_session(
        self,
        brand_id: UUID,
        current_step: int,
        responses: Dict[str, Any],
        is_completed: bool = False,
    ) -> BrandSurveySessionResponse:
        now = datetime.now(timezone.utc)
        existing = self._store.get(brand_id)
        if existing:
            # Merge responses
            merged = dict(existing.responses)
            merged.update(responses)
            session = BrandSurveySessionResponse(
                id=existing.id,
                brand_id=brand_id,
                current_step=current_step,
                responses=merged,
                is_completed=is_completed,
                updated_at=now,
            )
        else:
            session = BrandSurveySessionResponse(
                id=uuid4(),
                brand_id=brand_id,
                current_step=current_step,
                responses=responses,
                is_completed=is_completed,
                updated_at=now,
            )
        self._store[brand_id] = session
        return session

    async def delete(self, brand_id: UUID) -> bool:
        if brand_id in self._store:
            del self._store[brand_id]
            return True
        return False
