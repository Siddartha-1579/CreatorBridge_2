"""Portfolio repository implementation with persistent SQLite storage."""

import json
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.schemas.portfolio import (
    PortfolioProjectResponse,
    AssetType,
    CommercialUseStatus,
    AIGenerationType,
    ProjectVisibility,
    WorkflowStage,
)
from app.core.db import get_db_connection
from app.core.logging import get_logger

logger = get_logger("repositories.portfolio")


def _row_to_portfolio_item(row) -> PortfolioProjectResponse:
    created_at_dt = datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now(timezone.utc)
    updated_at_dt = datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else datetime.now(timezone.utc)

    if created_at_dt.tzinfo is None:
        created_at_dt = created_at_dt.replace(tzinfo=timezone.utc)
    if updated_at_dt.tzinfo is None:
        updated_at_dt = updated_at_dt.replace(tzinfo=timezone.utc)

    raw_stages = json.loads(row["workflow_stages"]) if row["workflow_stages"] else []
    workflow_stages = [
        WorkflowStage(**s) if isinstance(s, dict) else s
        for s in raw_stages
    ]

    media_type_val = row["media_type"]
    try:
        media_type = AssetType(media_type_val) if media_type_val else AssetType.VIDEO
    except ValueError:
        media_type = AssetType.VIDEO

    comm_val = row["commercial_use_status"]
    try:
        commercial_use_status = CommercialUseStatus(comm_val) if comm_val else CommercialUseStatus.COMMERCIAL_READY
    except ValueError:
        commercial_use_status = CommercialUseStatus.COMMERCIAL_READY

    gen_val = row["ai_generation_type"]
    try:
        ai_generation_type = AIGenerationType(gen_val) if gen_val else AIGenerationType.AI_GENERATED
    except ValueError:
        ai_generation_type = AIGenerationType.AI_GENERATED

    vis_val = row["visibility"]
    try:
        visibility = ProjectVisibility(vis_val) if vis_val else ProjectVisibility.PUBLIC
    except ValueError:
        visibility = ProjectVisibility.PUBLIC

    return PortfolioProjectResponse(
        id=UUID(row["id"]),
        creator_id=UUID(row["creator_id"]),
        title=row["title"],
        description=row["description"],
        category=row["category"] or "AI Video",
        content_type=row["content_type"] or "Short-form Video",
        media_type=media_type,
        thumbnail_url=row["thumbnail_url"],
        media_url=row["media_url"] or "",
        tools=json.loads(row["tools"]) if row["tools"] else [],
        models=json.loads(row["models"]) if row["models"] else [],
        skills=json.loads(row["skills"]) if row["skills"] else [],
        workflow_summary=row["workflow_summary"],
        workflow_stages=workflow_stages,
        aspect_ratio=row["aspect_ratio"] or "16:9",
        resolution=row["resolution"] or "1080p",
        duration_seconds=row["duration_seconds"],
        commercial_use_status=commercial_use_status,
        ai_generation_type=ai_generation_type,
        visibility=visibility,
        is_featured=bool(row["is_featured"]),
        verification_status=row["verification_status"] or "UNVERIFIED",
        public_url=row["public_url"],
        created_at=created_at_dt,
        updated_at=updated_at_dt,
    )


class PortfolioRepository(BaseRepository[PortfolioProjectResponse]):
    """Repository handling portfolio projects database persistence."""

    def __init__(self):
        self._seed_foundational_portfolio()

    def _seed_foundational_portfolio(self):
        sample_id = UUID("00000000-0000-0000-0000-000000000003")
        creator_id = UUID("00000000-0000-0000-0000-000000000001")
        now_str = datetime.now(timezone.utc).isoformat()

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM portfolio_items WHERE id = ?", (str(sample_id),))
            if not cursor.fetchone():
                stages_1 = [
                    {"stage_name": "Concept & Art Direction", "description": "Ideated visual boards in Midjourney v6", "tools_used": ["Midjourney"]},
                    {"stage_name": "Motion Synthesis", "description": "Camera control and frame continuity via Runway", "tools_used": ["Runway Gen-3"]},
                    {"stage_name": "Audio & Sound Design", "description": "Voiceover and ambient SFX generation", "tools_used": ["ElevenLabs"]},
                ]
                cursor.execute(
                    """
                    INSERT INTO portfolio_items (
                        id, creator_id, title, description, category, content_type,
                        media_type, thumbnail_url, media_url, tools, models, skills,
                        workflow_summary, workflow_stages, aspect_ratio, resolution,
                        duration_seconds, commercial_use_status, ai_generation_type,
                        visibility, is_featured, verification_status, public_url,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(sample_id),
                        str(creator_id),
                        "Cyberpunk Neo-Tokyo Commercial",
                        "Complete 30s speculative trailer created using Runway Gen-3 and ElevenLabs score.",
                        "AI Video",
                        "Cinematic Commercial",
                        AssetType.VIDEO.value,
                        "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80",
                        "/demo-assets/marcus-project-kinetic-trail.mp4",
                        json.dumps(["Runway Gen-3", "Midjourney", "ElevenLabs", "ComfyUI"]),
                        json.dumps(["Gen-3 Alpha", "Midjourney v6.1"]),
                        json.dumps(["Cinematics", "Prompt Engineering", "Color Grading"]),
                        "Concept generation in Midjourney, motion synthesis in Runway Gen-3, audio composition in ElevenLabs.",
                        json.dumps(stages_1),
                        "16:9",
                        "4K",
                        30,
                        CommercialUseStatus.COMMERCIAL_READY.value,
                        AIGenerationType.AI_GENERATED.value,
                        ProjectVisibility.PUBLIC.value,
                        1,
                        "VERIFIED",
                        "/demo-assets/marcus-project-kinetic-trail.mp4",
                        now_str,
                        now_str,
                    ),
                )

            sample_id_2 = UUID("00000000-0000-0000-0000-000000000004")
            cursor.execute("SELECT id FROM portfolio_items WHERE id = ?", (str(sample_id_2),))
            if not cursor.fetchone():
                stages_2 = [
                    {"stage_name": "Initial Generation", "description": "Generated high-res base compositions in Midjourney", "tools_used": ["Midjourney"]},
                    {"stage_name": "Detail Enhancement", "description": "Upscaling and texture hallucination in Magnific AI", "tools_used": ["Magnific AI"]},
                ]
                cursor.execute(
                    """
                    INSERT INTO portfolio_items (
                        id, creator_id, title, description, category, content_type,
                        media_type, thumbnail_url, media_url, tools, models, skills,
                        workflow_summary, workflow_stages, aspect_ratio, resolution,
                        duration_seconds, commercial_use_status, ai_generation_type,
                        visibility, is_featured, verification_status, public_url,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(sample_id_2),
                        str(creator_id),
                        "Futuristic Architectural Heritage",
                        "Ultra-detailed high dynamic range renders of futuristic brutalist architecture.",
                        "AI Image",
                        "Concept Art & Keyframes",
                        AssetType.IMAGE.value,
                        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
                        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80",
                        json.dumps(["Midjourney", "Magnific AI"]),
                        json.dumps(["Midjourney v6.1", "Magnific Relight"]),
                        json.dumps(["Photorealism", "Architectural Rendering", "Upscaling"]),
                        "High-res diffusion iterations upscaled 4x with structure preservation.",
                        json.dumps(stages_2),
                        "16:9",
                        "8K",
                        None,
                        CommercialUseStatus.COMMERCIAL_READY.value,
                        AIGenerationType.AI_GENERATED.value,
                        ProjectVisibility.PUBLIC.value,
                        0,
                        "VERIFIED",
                        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80",
                        now_str,
                        now_str,
                    ),
                )
                conn.commit()

    async def get_by_id(self, id: UUID) -> Optional[PortfolioProjectResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM portfolio_items WHERE id = ?", (str(id),))
            row = cursor.fetchone()
            return _row_to_portfolio_item(row) if row else None

    async def list_by_creator(self, creator_id: Any) -> List[PortfolioProjectResponse]:
        c_str = str(creator_id)
        from app.repositories import creator_repository
        profile = await creator_repository.get_by_user_id(c_str)
        alt_id = str(profile.id) if profile else c_str
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM portfolio_items WHERE creator_id = ? OR creator_id = ? ORDER BY created_at DESC",
                (c_str, alt_id),
            )
            rows = cursor.fetchall()
            return [_row_to_portfolio_item(r) for r in rows]

    async def list_public_by_creator(self, creator_id: Any) -> List[PortfolioProjectResponse]:
        c_str = str(creator_id)
        from app.repositories import creator_repository
        profile = await creator_repository.get_by_user_id(c_str)
        alt_id = str(profile.id) if profile else c_str
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM portfolio_items WHERE (creator_id = ? OR creator_id = ?) AND visibility = 'PUBLIC' ORDER BY created_at DESC",
                (c_str, alt_id),
            )
            rows = cursor.fetchall()
            return [_row_to_portfolio_item(r) for r in rows]

    async def list_all(
        self, skip: int = 0, limit: int = 20, filters: Optional[Dict[str, Any]] = None
    ) -> List[PortfolioProjectResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM portfolio_items ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, skip),
            )
            rows = cursor.fetchall()
            return [_row_to_portfolio_item(r) for r in rows]

    async def create(self, entity: PortfolioProjectResponse) -> PortfolioProjectResponse:
        now_str = entity.created_at.isoformat()
        updated_str = entity.updated_at.isoformat()
        stages_serialized = [
            s.model_dump() if hasattr(s, "model_dump") else s
            for s in entity.workflow_stages
        ]

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO portfolio_items (
                    id, creator_id, title, description, category, content_type,
                    media_type, thumbnail_url, media_url, tools, models, skills,
                    workflow_summary, workflow_stages, aspect_ratio, resolution,
                    duration_seconds, commercial_use_status, ai_generation_type,
                    visibility, is_featured, verification_status, public_url,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(entity.id),
                    str(entity.creator_id),
                    entity.title,
                    entity.description,
                    entity.category,
                    entity.content_type,
                    entity.media_type.value if hasattr(entity.media_type, "value") else str(entity.media_type),
                    entity.thumbnail_url,
                    entity.media_url,
                    json.dumps(entity.tools),
                    json.dumps(entity.models),
                    json.dumps(entity.skills),
                    entity.workflow_summary,
                    json.dumps(stages_serialized),
                    entity.aspect_ratio,
                    entity.resolution,
                    entity.duration_seconds,
                    entity.commercial_use_status.value if hasattr(entity.commercial_use_status, "value") else str(entity.commercial_use_status),
                    entity.ai_generation_type.value if hasattr(entity.ai_generation_type, "value") else str(entity.ai_generation_type),
                    entity.visibility.value if hasattr(entity.visibility, "value") else str(entity.visibility),
                    1 if entity.is_featured else 0,
                    entity.verification_status,
                    entity.public_url,
                    now_str,
                    updated_str,
                ),
            )
            conn.commit()
        return entity

    async def update(self, id: UUID, update_data: Dict[str, Any]) -> Optional[PortfolioProjectResponse]:
        existing = await self.get_by_id(id)
        if not existing:
            return None
        existing_dict = existing.model_dump()
        existing_dict.update(update_data)
        existing_dict["updated_at"] = datetime.now(timezone.utc)
        updated_entity = PortfolioProjectResponse(**existing_dict)
        return await self.create(updated_entity)

    async def delete(self, id: UUID) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM portfolio_items WHERE id = ?", (str(id),))
            conn.commit()
            return cursor.rowcount > 0
