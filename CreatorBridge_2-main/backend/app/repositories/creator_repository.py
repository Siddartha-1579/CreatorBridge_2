"""Creator repository implementation with persistent SQLite storage."""

import json
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.schemas.creator import CreatorProfileResponse, CreatorLevel
from app.core.db import get_db_connection
from app.core.logging import get_logger

logger = get_logger("repositories.creator")


def _row_to_creator(row) -> CreatorProfileResponse:
    created_at_dt = datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now(timezone.utc)
    updated_at_dt = datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else datetime.now(timezone.utc)

    if created_at_dt.tzinfo is None:
        created_at_dt = created_at_dt.replace(tzinfo=timezone.utc)
    if updated_at_dt.tzinfo is None:
        updated_at_dt = updated_at_dt.replace(tzinfo=timezone.utc)

    lvl_val = row["level"]
    try:
        level = CreatorLevel(lvl_val)
    except ValueError:
        level = CreatorLevel.EXPLORER

    meta = json.loads(row["metadata"]) if row["metadata"] else {}
    if row["avatar_url"]:
        meta["avatar_url"] = row["avatar_url"]

    headline = meta.get("headline")
    location = meta.get("location")
    sec_specs = meta.get("secondary_specializations", [])
    visibility = meta.get("visibility", "PUBLIC")

    return CreatorProfileResponse(
        id=UUID(row["id"]),
        user_id=row["user_id"],
        full_name=row["full_name"],
        handle=row["handle"],
        headline=headline,
        location=location,
        secondary_specializations=sec_specs,
        visibility=visibility,
        level=level,
        level_name=row["level_name"] or "AI Explorer",
        primary_specialization=row["primary_specialization"],
        skills=json.loads(row["skills"]) if row["skills"] else [],
        ai_tools=json.loads(row["ai_tools"]) if row["ai_tools"] else [],
        content_types=json.loads(row["content_types"]) if row["content_types"] else [],
        target_niches=json.loads(row["target_niches"]) if row["target_niches"] else [],
        preferred_formats=json.loads(row["preferred_formats"]) if row["preferred_formats"] else [],
        social_links=json.loads(row["social_links"]) if row["social_links"] else {},
        hourly_rate_cents=row["hourly_rate_cents"],
        reputation_score=float(row["reputation_score"] or 0.0),
        is_verified=bool(row["is_verified"]),
        assessment_completed=bool(row["assessment_completed"]),
        profile_completeness_pct=int(row["profile_completeness_pct"] or 20),
        bio=row["bio"],
        metadata=meta,
        created_at=created_at_dt,
        updated_at=updated_at_dt,
    )


class CreatorRepository(BaseRepository[CreatorProfileResponse]):
    """Repository handling creator profiles database persistence."""

    def __init__(self):
        self._seed_foundational_creators()

    def _seed_foundational_creators(self):
        sample_id = UUID("00000000-0000-0000-0000-000000000001")
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM creator_profiles WHERE id = ?", (str(sample_id),))
            if not cursor.fetchone():
                now_str = datetime.now(timezone.utc).isoformat()
                cursor.execute(
                    """
                    INSERT INTO creator_profiles (
                        id, user_id, full_name, handle, level, level_name,
                        primary_specialization, skills, ai_tools, content_types,
                        target_niches, preferred_formats, social_links,
                        hourly_rate_cents, reputation_score, is_verified,
                        assessment_completed, profile_completeness_pct,
                        bio, avatar_url, metadata, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(sample_id),
                        "dev-creator-001",
                        "Alex Rivera",
                        "alex_ai_art",
                        CreatorLevel.AI_MASTER.value,
                        "AI Master",
                        "Photorealistic Cinematic Video & Midjourney v6",
                        json.dumps(["Cinematics", "Prompt Engineering", "Color Grading", "Post-Processing"]),
                        json.dumps(["Runway Gen-3", "Midjourney", "ElevenLabs", "ComfyUI"]),
                        json.dumps(["Short-form video", "Speculative commercial", "Cinematic trailer"]),
                        json.dumps(["Cyberpunk", "Automotive", "Sci-Fi", "Luxury"]),
                        json.dumps(["9:16", "16:9", "4K"]),
                        json.dumps({"twitter": "https://x.com/alex_ai_art", "instagram": "https://instagram.com/alex_ai_art"}),
                        12000,
                        4.95,
                        1,
                        1,
                        95,
                        "Senior AI Cinematographer crafting brand commercials and hyper-realistic visual worlds.",
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
                        json.dumps({"availability_status": "AVAILABLE", "headline": "Lead AI Director & Cinematographer"}),
                        now_str,
                        now_str,
                    ),
                )
                conn.commit()

    async def get_by_id(self, id: UUID) -> Optional[CreatorProfileResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM creator_profiles WHERE id = ?", (str(id),))
            row = cursor.fetchone()
            return _row_to_creator(row) if row else None

    async def get_by_user_id(self, user_id: str) -> Optional[CreatorProfileResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM creator_profiles WHERE user_id = ?", (str(user_id),))
            row = cursor.fetchone()
            return _row_to_creator(row) if row else None

    async def get_by_handle(self, handle: str) -> Optional[CreatorProfileResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM creator_profiles WHERE LOWER(handle) = LOWER(?)", (handle,))
            row = cursor.fetchone()
            return _row_to_creator(row) if row else None

    async def list_all(
        self, skip: int = 0, limit: int = 20, filters: Optional[Dict[str, Any]] = None
    ) -> List[CreatorProfileResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM creator_profiles ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, skip),
            )
            rows = cursor.fetchall()
            return [_row_to_creator(r) for r in rows]

    async def create(self, entity: CreatorProfileResponse) -> CreatorProfileResponse:
        now_str = entity.created_at.isoformat()
        updated_str = entity.updated_at.isoformat()

        meta = dict(entity.metadata) if entity.metadata else {}
        if entity.headline is not None:
            meta["headline"] = entity.headline
        if entity.location is not None:
            meta["location"] = entity.location
        if entity.secondary_specializations:
            meta["secondary_specializations"] = entity.secondary_specializations
        if entity.visibility:
            meta["visibility"] = entity.visibility

        avatar_url = getattr(entity, "avatar_url", None) or meta.get("avatar_url")

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO creator_profiles (
                    id, user_id, full_name, handle, level, level_name,
                    primary_specialization, skills, ai_tools, content_types,
                    target_niches, preferred_formats, social_links,
                    hourly_rate_cents, reputation_score, is_verified,
                    assessment_completed, profile_completeness_pct,
                    bio, avatar_url, metadata, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(entity.id),
                    entity.user_id,
                    entity.full_name,
                    entity.handle,
                    entity.level.value if hasattr(entity.level, "value") else str(entity.level),
                    entity.level_name or "AI Explorer",
                    entity.primary_specialization,
                    json.dumps(entity.skills),
                    json.dumps(entity.ai_tools),
                    json.dumps(entity.content_types),
                    json.dumps(entity.target_niches),
                    json.dumps(entity.preferred_formats),
                    json.dumps(entity.social_links),
                    entity.hourly_rate_cents,
                    entity.reputation_score,
                    1 if entity.is_verified else 0,
                    1 if entity.assessment_completed else 0,
                    entity.profile_completeness_pct,
                    entity.bio,
                    avatar_url,
                    json.dumps(meta),
                    now_str,
                    updated_str,
                ),
            )
            conn.commit()
        return entity

    async def update(self, id: UUID, update_data: Dict[str, Any]) -> Optional[CreatorProfileResponse]:
        existing = await self.get_by_id(id)
        if not existing:
            return None
        existing_dict = existing.model_dump()
        existing_dict.update(update_data)
        existing_dict["updated_at"] = datetime.now(timezone.utc)
        updated_entity = CreatorProfileResponse(**existing_dict)
        return await self.create(updated_entity)

    async def delete(self, id: UUID) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM creator_profiles WHERE id = ?", (str(id),))
            conn.commit()
            return cursor.rowcount > 0
