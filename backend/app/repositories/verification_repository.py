"""Verification repository for creator trust signals and claims."""

from typing import List, Optional, Dict
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.schemas.creator import (
    VerificationRecordResponse,
    VerificationType,
    VerificationStatus,
)


class VerificationRepository(BaseRepository[VerificationRecordResponse]):
    """Repository handling creator verification claims persistence."""

    def __init__(self):
        self._store: Dict[UUID, VerificationRecordResponse] = {}
        self._seed_foundational_verifications()

    def _seed_foundational_verifications(self):
        creator_id = UUID("00000000-0000-0000-0000-000000000001")
        now = datetime.now(timezone.utc)

        # Seed verified records for Alex Rivera
        v1_id = UUID("10000000-0000-0000-0000-000000000001")
        self._store[v1_id] = VerificationRecordResponse(
            id=v1_id,
            creator_id=creator_id,
            verification_type=VerificationType.EMAIL_VERIFIED,
            status=VerificationStatus.VERIFIED,
            notes="Corporate email verified via OTP",
            created_at=now,
        )

        v2_id = UUID("10000000-0000-0000-0000-000000000002")
        self._store[v2_id] = VerificationRecordResponse(
            id=v2_id,
            creator_id=creator_id,
            verification_type=VerificationType.TOOL_VERIFIED,
            target_id="Runway Gen-3",
            status=VerificationStatus.VERIFIED,
            notes="API subscription tier and generation audit verified",
            created_at=now,
        )

        v3_id = UUID("10000000-0000-0000-0000-000000000003")
        self._store[v3_id] = VerificationRecordResponse(
            id=v3_id,
            creator_id=creator_id,
            verification_type=VerificationType.PORTFOLIO_VERIFIED,
            target_id="00000000-0000-0000-0000-000000000003",
            status=VerificationStatus.VERIFIED,
            notes="Original asset ownership and commercial rights cleared",
            created_at=now,
        )

        v4_id = UUID("10000000-0000-0000-0000-000000000004")
        self._store[v4_id] = VerificationRecordResponse(
            id=v4_id,
            creator_id=creator_id,
            verification_type=VerificationType.WORKFLOW_VERIFIED,
            target_id="00000000-0000-0000-0000-000000000003",
            status=VerificationStatus.VERIFIED,
            notes="Complete 3-stage generation pipeline inspected and verified",
            created_at=now,
        )

    async def get_by_id(self, id: UUID) -> Optional[VerificationRecordResponse]:
        return self._store.get(id)

    async def list_by_creator(self, creator_id: UUID) -> List[VerificationRecordResponse]:
        return [record for record in self._store.values() if record.creator_id == creator_id]

    async def get_by_creator_and_type(
        self,
        creator_id: UUID,
        vtype: VerificationType,
        target_id: Optional[str] = None,
    ) -> Optional[VerificationRecordResponse]:
        for record in self._store.values():
            if record.creator_id == creator_id and record.verification_type == vtype:
                if target_id is None or record.target_id == target_id:
                    return record
        return None

    async def create(self, entity: VerificationRecordResponse) -> VerificationRecordResponse:
        self._store[entity.id] = entity
        return entity

    async def update_status(
        self,
        id: UUID,
        status: VerificationStatus,
        notes: Optional[str] = None,
    ) -> Optional[VerificationRecordResponse]:
        record = self._store.get(id)
        if not record:
            return None
        updated_dict = record.model_dump()
        updated_dict["status"] = status
        if notes:
            updated_dict["notes"] = notes
        updated = VerificationRecordResponse(**updated_dict)
        self._store[id] = updated
        return updated

    async def delete(self, id: UUID) -> bool:
        if id in self._store:
            del self._store[id]
            return True
        return False
