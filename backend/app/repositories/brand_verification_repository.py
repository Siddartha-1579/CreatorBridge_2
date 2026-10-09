"""Brand verification repository for corporate identity and domain verification claims."""

from typing import List, Optional, Dict
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.schemas.brand import (
    BrandVerificationRecordResponse,
    BrandVerificationCategory,
    BrandVerificationStatus,
)


class BrandVerificationRepository(BaseRepository[BrandVerificationRecordResponse]):
    """Repository handling brand organization verification claims."""

    def __init__(self):
        self._store: Dict[UUID, BrandVerificationRecordResponse] = {}
        self._seed_foundational_verifications()

    def _seed_foundational_verifications(self):
        brand_id = UUID("00000000-0000-0000-0000-000000000002")
        now = datetime.now(timezone.utc)

        v1_id = UUID("30000000-0000-0000-0000-000000000001")
        self._store[v1_id] = BrandVerificationRecordResponse(
            id=v1_id,
            brand_id=brand_id,
            verification_type=BrandVerificationCategory.EMAIL_VERIFIED,
            status=BrandVerificationStatus.VERIFIED,
            notes="Corporate corporate email confirmed via domain challenge",
            created_at=now,
        )

        v2_id = UUID("30000000-0000-0000-0000-000000000002")
        self._store[v2_id] = BrandVerificationRecordResponse(
            id=v2_id,
            brand_id=brand_id,
            verification_type=BrandVerificationCategory.DOMAIN_VERIFIED,
            status=BrandVerificationStatus.VERIFIED,
            notes="apexmedia.example.com DNS TXT challenge verified",
            created_at=now,
        )

        v3_id = UUID("30000000-0000-0000-0000-000000000003")
        self._store[v3_id] = BrandVerificationRecordResponse(
            id=v3_id,
            brand_id=brand_id,
            verification_type=BrandVerificationCategory.ORGANIZATION_IDENTITY,
            status=BrandVerificationStatus.VERIFIED,
            notes="Corporate registry & signatory authority verified",
            created_at=now,
        )

    async def get_by_id(self, id: UUID) -> Optional[BrandVerificationRecordResponse]:
        return self._store.get(id)

    async def list_by_brand(self, brand_id: UUID) -> List[BrandVerificationRecordResponse]:
        return [record for record in self._store.values() if record.brand_id == brand_id]

    async def create(self, entity: BrandVerificationRecordResponse) -> BrandVerificationRecordResponse:
        self._store[entity.id] = entity
        return entity

    async def update_status(
        self,
        id: UUID,
        status: BrandVerificationStatus,
        notes: Optional[str] = None,
    ) -> Optional[BrandVerificationRecordResponse]:
        record = self._store.get(id)
        if not record:
            return None
        updated_dict = record.model_dump()
        updated_dict["status"] = status
        if notes:
            updated_dict["notes"] = notes
        updated = BrandVerificationRecordResponse(**updated_dict)
        self._store[id] = updated
        return updated

    async def delete(self, id: UUID) -> bool:
        if id in self._store:
            del self._store[id]
            return True
        return False
