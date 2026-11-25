"""Brand preferences repository for creative requirements with persistent SQLite storage."""

import json
from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.schemas.brand import BrandPreferencesResponse, BrandPreferencesBase
from app.core.db import get_db_connection
from app.core.logging import get_logger

logger = get_logger("repositories.brand_preferences")


def _row_to_preferences(row) -> BrandPreferencesResponse:
    """Converts a SQLite database row to BrandPreferencesResponse model."""
    created_at_dt = datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now(timezone.utc)
    updated_at_dt = datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else datetime.now(timezone.utc)

    if created_at_dt.tzinfo is None:
        created_at_dt = created_at_dt.replace(tzinfo=timezone.utc)
    if updated_at_dt.tzinfo is None:
        updated_at_dt = updated_at_dt.replace(tzinfo=timezone.utc)

    return BrandPreferencesResponse(
        id=UUID(row["id"]),
        brand_id=UUID(row["brand_id"]),
        intended_uses=json.loads(row["intended_uses"]) if row["intended_uses"] else [],
        content_requirements=json.loads(row["content_requirements"]) if row["content_requirements"] else [],
        target_niches=json.loads(row["target_niches"]) if row["target_niches"] else [],
        preferred_formats=json.loads(row["preferred_formats"]) if row["preferred_formats"] else [],
        creative_styles=json.loads(row["creative_styles"]) if row["creative_styles"] else [],
        style_description=row["style_description"],
        intended_usage_channels=json.loads(row["intended_usage_channels"]) if row["intended_usage_channels"] else [],
        project_timeline=row["project_timeline"],
        commercial_rights_required=bool(row["commercial_rights_required"]),
        exclusive_usage_required=bool(row["exclusive_usage_required"]),
        source_files_required=bool(row["source_files_required"]),
        budget_range=row["budget_range"],
        engagement_type=row["engagement_type"],
        adaptive_data=json.loads(row["adaptive_data"]) if row["adaptive_data"] else {},
        created_at=created_at_dt,
        updated_at=updated_at_dt,
    )


class BrandPreferencesRepository(BaseRepository[BrandPreferencesResponse]):
    """Repository handling brand creative preferences database persistence."""

    def __init__(self):
        self._seed_foundational_preferences()

    def _seed_foundational_preferences(self):
        brand_id = UUID("00000000-0000-0000-0000-000000000002")
        pref_id = UUID("20000000-0000-0000-0000-000000000001")
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM brand_preferences WHERE brand_id = ?", (str(brand_id),))
            if not cursor.fetchone():
                now_str = datetime.now(timezone.utc).isoformat()
                cursor.execute(
                    """
                    INSERT INTO brand_preferences (
                        id, brand_id, intended_uses, content_requirements, target_niches,
                        preferred_formats, creative_styles, style_description, intended_usage_channels,
                        project_timeline, commercial_rights_required, exclusive_usage_required,
                        source_files_required, budget_range, engagement_type, adaptive_data,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(pref_id),
                        str(brand_id),
                        json.dumps(["Producing advertising campaigns", "Developing AI-generated videos", "Discovering AI creators"]),
                        json.dumps(["Short-form videos", "Product advertisements", "AI filmmaking", "Product visualizations"]),
                        json.dumps(["Entertainment", "Technology", "Gaming"]),
                        json.dumps(["16:9 landscape", "9:16 vertical"]),
                        json.dumps(["Cinematic", "Photorealistic", "Futuristic"]),
                        "High-end cinematic motion with photorealistic textures, dynamic camera pacing, and atmospheric sound design.",
                        json.dumps(["Paid advertising", "Organic social", "Website"]),
                        "2-4 weeks",
                        1,
                        0,
                        1,
                        "₹50,000–₹1,00,000",
                        "Campaign",
                        json.dumps({
                            "video_duration_range": "30s - 90s",
                            "target_platforms": ["YouTube", "Instagram Reels", "Digital OOH"],
                            "dialogue_required": True,
                        }),
                        now_str,
                        now_str,
                    ),
                )
                conn.commit()

    async def get_by_id(self, id: UUID) -> Optional[BrandPreferencesResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM brand_preferences WHERE id = ?", (str(id),))
            row = cursor.fetchone()
            return _row_to_preferences(row) if row else None

    async def get_by_brand_id(self, brand_id: UUID) -> Optional[BrandPreferencesResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM brand_preferences WHERE brand_id = ?", (str(brand_id),))
            row = cursor.fetchone()
            return _row_to_preferences(row) if row else None

    async def upsert(self, brand_id: UUID, data: BrandPreferencesBase) -> BrandPreferencesResponse:
        existing = await self.get_by_brand_id(brand_id)
        now = datetime.now(timezone.utc)
        if existing:
            pref_id = existing.id
            created_at = existing.created_at
        else:
            pref_id = uuid4()
            created_at = now

        entity = BrandPreferencesResponse(
            id=pref_id,
            brand_id=brand_id,
            **data.model_dump(),
            created_at=created_at,
            updated_at=now,
        )

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO brand_preferences (
                    id, brand_id, intended_uses, content_requirements, target_niches,
                    preferred_formats, creative_styles, style_description, intended_usage_channels,
                    project_timeline, commercial_rights_required, exclusive_usage_required,
                    source_files_required, budget_range, engagement_type, adaptive_data,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(entity.id),
                    str(entity.brand_id),
                    json.dumps(entity.intended_uses),
                    json.dumps(entity.content_requirements),
                    json.dumps(entity.target_niches),
                    json.dumps(entity.preferred_formats),
                    json.dumps(entity.creative_styles),
                    entity.style_description,
                    json.dumps(entity.intended_usage_channels),
                    entity.project_timeline,
                    1 if entity.commercial_rights_required else 0,
                    1 if entity.exclusive_usage_required else 0,
                    1 if entity.source_files_required else 0,
                    entity.budget_range,
                    entity.engagement_type,
                    json.dumps(entity.adaptive_data),
                    entity.created_at.isoformat(),
                    entity.updated_at.isoformat(),
                ),
            )
            conn.commit()
        return entity

    async def delete(self, brand_id: UUID) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM brand_preferences WHERE brand_id = ?", (str(brand_id),))
            conn.commit()
            return cursor.rowcount > 0
