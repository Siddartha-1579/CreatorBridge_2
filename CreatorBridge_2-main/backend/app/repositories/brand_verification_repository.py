"""Brand verification repository for corporate identity with persistent SQLite storage."""

from typing import List, Optional, Dict
from uuid import UUID
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.schemas.brand import (
    BrandVerificationRecordResponse,
    BrandVerificationCategory,
    BrandVerificationStatus,
)
from app.core.db import get_db_connection
from app.core.logging import get_logger

logger = get_logger("repositories.brand_verification")


def _row_to_verification(row) -> BrandVerificationRecordResponse:
    """Converts a SQLite database row to BrandVerificationRecordResponse model."""
    created_at_dt = datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now(timezone.utc)
    if created_at_dt.tzinfo is None:
        created_at_dt = created_at_dt.replace(tzinfo=timezone.utc)

    verif_type_val = row["verification_type"]
    try:
        verif_type = BrandVerificationCategory(verif_type_val)
    except ValueError:
        verif_type = BrandVerificationCategory.EMAIL_VERIFIED

    status_val = row["status"]
    try:
        status = BrandVerificationStatus(status_val)
    except ValueError:
        status = BrandVerificationStatus.NOT_STARTED

    return BrandVerificationRecordResponse(
        id=UUID(row["id"]),
        brand_id=UUID(row["brand_id"]),
        verification_type=verif_type,
        status=status,
        target_identifier=row["target_identifier"],
        evidence_reference=row["evidence_reference"],
        notes=row["notes"],
        created_at=created_at_dt,
    )


class BrandVerificationRepository(BaseRepository[BrandVerificationRecordResponse]):
    """Repository handling brand organization verification claims."""

    def __init__(self):
        self._seed_foundational_verifications()

    def _seed_foundational_verifications(self):
        brand_id = UUID("00000000-0000-0000-0000-000000000002")
        now_str = datetime.now(timezone.utc).isoformat()

        seeds = [
            (
                UUID("30000000-0000-0000-0000-000000000001"),
                BrandVerificationCategory.EMAIL_VERIFIED.value,
                BrandVerificationStatus.VERIFIED.value,
                "Corporate email confirmed via domain challenge",
            ),
            (
                UUID("30000000-0000-0000-0000-000000000002"),
                BrandVerificationCategory.DOMAIN_VERIFIED.value,
                BrandVerificationStatus.VERIFIED.value,
                "apexmedia.example.com DNS TXT challenge verified",
            ),
            (
                UUID("30000000-0000-0000-0000-000000000003"),
                BrandVerificationCategory.ORGANIZATION_IDENTITY.value,
                BrandVerificationStatus.VERIFIED.value,
                "Corporate registry & signatory authority verified",
            ),
        ]

        with get_db_connection() as conn:
            cursor = conn.cursor()
            for vid, vtype, status, notes in seeds:
                cursor.execute("SELECT id FROM brand_verification_records WHERE id = ?", (str(vid),))
                if not cursor.fetchone():
                    cursor.execute(
                        """
                        INSERT INTO brand_verification_records (
                            id, brand_id, verification_type, target_identifier, status,
                            evidence_reference, notes, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (str(vid), str(brand_id), vtype, None, status, None, notes, now_str, now_str),
                    )
            conn.commit()

    async def get_by_id(self, id: UUID) -> Optional[BrandVerificationRecordResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM brand_verification_records WHERE id = ?", (str(id),))
            row = cursor.fetchone()
            return _row_to_verification(row) if row else None

    async def list_by_brand(self, brand_id: UUID) -> List[BrandVerificationRecordResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM brand_verification_records WHERE brand_id = ? ORDER BY created_at DESC",
                (str(brand_id),),
            )
            rows = cursor.fetchall()
            return [_row_to_verification(r) for r in rows]

    async def create(self, entity: BrandVerificationRecordResponse) -> BrandVerificationRecordResponse:
        now_str = entity.created_at.isoformat()
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO brand_verification_records (
                    id, brand_id, verification_type, target_identifier, status,
                    evidence_reference, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(entity.id),
                    str(entity.brand_id),
                    entity.verification_type.value if hasattr(entity.verification_type, "value") else str(entity.verification_type),
                    getattr(entity, "target_identifier", None),
                    entity.status.value if hasattr(entity.status, "value") else str(entity.status),
                    getattr(entity, "evidence_reference", None),
                    entity.notes,
                    now_str,
                    now_str,
                ),
            )
            conn.commit()
        return entity

    async def update_status(
        self,
        id: UUID,
        status: BrandVerificationStatus,
        notes: Optional[str] = None,
    ) -> Optional[BrandVerificationRecordResponse]:
        record = await self.get_by_id(id)
        if not record:
            return None
        updated_dict = record.model_dump()
        updated_dict["status"] = status
        if notes:
            updated_dict["notes"] = notes
        updated = BrandVerificationRecordResponse(**updated_dict)
        return await self.create(updated)

    async def delete(self, id: UUID) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM brand_verification_records WHERE id = ?", (str(id),))
            conn.commit()
            return cursor.rowcount > 0
