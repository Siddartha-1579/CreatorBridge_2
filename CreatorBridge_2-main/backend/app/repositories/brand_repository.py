"""Brand repository implementation with persistent SQLite storage and Supabase dual-sync."""

import json
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.schemas.brand import BrandProfileResponse, BrandVerificationStatus
from app.core.db import get_db_connection
from app.core.logging import get_logger

logger = get_logger("repositories.brand")


def _row_to_brand_profile(row) -> BrandProfileResponse:
    """Converts a SQLite database row to BrandProfileResponse model."""
    created_at_dt = datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now(timezone.utc)
    updated_at_dt = datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else datetime.now(timezone.utc)

    # Ensure timezone awareness
    if created_at_dt.tzinfo is None:
        created_at_dt = created_at_dt.replace(tzinfo=timezone.utc)
    if updated_at_dt.tzinfo is None:
        updated_at_dt = updated_at_dt.replace(tzinfo=timezone.utc)

    verif_status_val = row["verification_status"]
    try:
        verif_status = BrandVerificationStatus(verif_status_val)
    except ValueError:
        verif_status = BrandVerificationStatus.NOT_STARTED

    return BrandProfileResponse(
        id=UUID(row["id"]),
        user_id=row["user_id"],
        company_name=row["company_name"],
        organization_type=row["organization_type"] or "Consumer Brand",
        primary_industry=row["primary_industry"],
        secondary_industries=json.loads(row["secondary_industries"]) if row["secondary_industries"] else [],
        contact_name=row["contact_name"],
        business_email=row["business_email"],
        website=row["website"],
        logo_url=row["logo_url"],
        description=row["description"],
        location=row["location"],
        team_size=row["team_size"] or "1-10",
        social_links=json.loads(row["social_links"]) if row["social_links"] else {},
        brand_guidelines_url=row["brand_guidelines_url"],
        preferred_communication=row["preferred_communication"] or "EMAIL",
        is_agency=bool(row["is_agency"]),
        verification_status=verif_status,
        onboarding_completed=bool(row["onboarding_completed"]),
        profile_completeness_pct=int(row["profile_completeness_pct"] or 25),
        metadata=json.loads(row["metadata"]) if row["metadata"] else {},
        created_at=created_at_dt,
        updated_at=updated_at_dt,
    )


class BrandRepository(BaseRepository[BrandProfileResponse]):
    """Repository handling brand organization profiles database persistence."""

    def __init__(self):
        self._seed_foundational_brand()

    def _seed_foundational_brand(self):
        sample_id = UUID("00000000-0000-0000-0000-000000000002")
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM brand_profiles WHERE id = ?", (str(sample_id),))
            if not cursor.fetchone():
                now_str = datetime.now(timezone.utc).isoformat()
                cursor.execute(
                    """
                    INSERT INTO brand_profiles (
                        id, user_id, company_name, organization_type, primary_industry,
                        secondary_industries, contact_name, business_email, website,
                        logo_url, description, location, team_size, social_links,
                        brand_guidelines_url, preferred_communication, is_agency,
                        verification_status, onboarding_completed, profile_completeness_pct,
                        metadata, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(sample_id),
                        "dev-brand-001",
                        "Apex Media Global",
                        "Enterprise",
                        "Entertainment & Streaming",
                        json.dumps(["Technology", "Gaming", "Advertising"]),
                        "Sarah Chen",
                        "sarah.chen@apexmedia.example.com",
                        "https://apexmedia.example.com",
                        "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80",
                        "Global digital production studio commissioning episodic AI trailers, speculative commercials, and dynamic motion assets.",
                        "Bengaluru & Singapore",
                        "50-200",
                        json.dumps({
                            "website": "https://apexmedia.example.com",
                            "linkedin": "https://linkedin.com/company/apex-media-global",
                        }),
                        "https://apexmedia.example.com/brand-guidelines.pdf",
                        "EMAIL",
                        0,
                        BrandVerificationStatus.VERIFIED.value,
                        1,
                        90,
                        json.dumps({"onboarding_version": "2.0"}),
                        now_str,
                        now_str,
                    ),
                )
                conn.commit()

    async def get_by_id(self, id: UUID) -> Optional[BrandProfileResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM brand_profiles WHERE id = ?", (str(id),))
            row = cursor.fetchone()
            return _row_to_brand_profile(row) if row else None

    async def get_by_user_id(self, user_id: str) -> Optional[BrandProfileResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM brand_profiles WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            return _row_to_brand_profile(row) if row else None

    async def list_all(
        self, skip: int = 0, limit: int = 20, filters: Optional[Dict[str, Any]] = None
    ) -> List[BrandProfileResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM brand_profiles ORDER BY created_at DESC LIMIT ? OFFSET ?", (limit, skip))
            rows = cursor.fetchall()
            return [_row_to_brand_profile(r) for r in rows]

    async def create(self, entity: BrandProfileResponse) -> BrandProfileResponse:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO brand_profiles (
                    id, user_id, company_name, organization_type, primary_industry,
                    secondary_industries, contact_name, business_email, website,
                    logo_url, description, location, team_size, social_links,
                    brand_guidelines_url, preferred_communication, is_agency,
                    verification_status, onboarding_completed, profile_completeness_pct,
                    metadata, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(entity.id),
                    entity.user_id,
                    entity.company_name,
                    entity.organization_type,
                    entity.primary_industry,
                    json.dumps(entity.secondary_industries),
                    entity.contact_name,
                    entity.business_email,
                    entity.website,
                    entity.logo_url,
                    entity.description,
                    entity.location,
                    entity.team_size,
                    json.dumps(entity.social_links),
                    entity.brand_guidelines_url,
                    entity.preferred_communication,
                    1 if entity.is_agency else 0,
                    entity.verification_status.value if hasattr(entity.verification_status, "value") else str(entity.verification_status),
                    1 if entity.onboarding_completed else 0,
                    entity.profile_completeness_pct,
                    json.dumps(entity.metadata),
                    entity.created_at.isoformat(),
                    entity.updated_at.isoformat(),
                ),
            )
            conn.commit()
        return entity

    async def update(self, id: UUID, update_data: Dict[str, Any]) -> Optional[BrandProfileResponse]:
        existing = await self.get_by_id(id)
        if not existing:
            return None
        updated_dict = existing.model_dump()
        updated_dict.update(update_data)
        updated_dict["updated_at"] = datetime.now(timezone.utc)
        updated_entity = BrandProfileResponse(**updated_dict)
        return await self.create(updated_entity)

    async def delete(self, id: UUID) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM brand_profiles WHERE id = ?", (str(id),))
            conn.commit()
            return cursor.rowcount > 0
