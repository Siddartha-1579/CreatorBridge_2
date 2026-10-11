"""Campaign brief repository implementation with persistent SQLite storage."""

import json
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from app.repositories.base import BaseRepository
from app.schemas.brief import (
    CampaignBriefResponse,
    BriefStatus,
    DeliverableItem,
    CreativeDirection,
    CreatorCapabilityRequirements,
    CommercialTerms,
    BriefAIMetadata,
    CampaignApplicationResponse,
    ApplicationStatus,
)
from app.core.db import get_db_connection
from app.core.logging import get_logger

logger = get_logger("repositories.brief")


def _row_to_brief(row) -> CampaignBriefResponse:
    """Converts a SQLite database row to CampaignBriefResponse model."""
    created_at_dt = datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now(timezone.utc)
    updated_at_dt = datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else datetime.now(timezone.utc)
    start_date_dt = datetime.fromisoformat(row["start_date"]) if row["start_date"] else None
    deadline_dt = datetime.fromisoformat(row["deadline"]) if row["deadline"] else None

    if created_at_dt.tzinfo is None:
        created_at_dt = created_at_dt.replace(tzinfo=timezone.utc)
    if updated_at_dt.tzinfo is None:
        updated_at_dt = updated_at_dt.replace(tzinfo=timezone.utc)
    if start_date_dt and start_date_dt.tzinfo is None:
        start_date_dt = start_date_dt.replace(tzinfo=timezone.utc)
    if deadline_dt and deadline_dt.tzinfo is None:
        deadline_dt = deadline_dt.replace(tzinfo=timezone.utc)

    status_val = row["status"]
    try:
        status = BriefStatus(status_val)
    except ValueError:
        status = BriefStatus.DRAFT

    # Deliverables
    raw_deliverables = json.loads(row["deliverables"]) if row["deliverables"] else []
    deliverables = [
        DeliverableItem(**d) if isinstance(d, dict) else d for d in raw_deliverables
    ]

    # Creative Direction
    raw_cd = json.loads(row["creative_direction"]) if row["creative_direction"] else {}
    creative_direction = CreativeDirection(**raw_cd) if raw_cd else CreativeDirection()

    # Creator Capabilities
    raw_cc = json.loads(row["creator_capabilities"]) if row["creator_capabilities"] else {}
    creator_capabilities = CreatorCapabilityRequirements(**raw_cc) if raw_cc else CreatorCapabilityRequirements()

    # Commercial Terms
    raw_ct = json.loads(row["commercial_terms"]) if row["commercial_terms"] else {}
    commercial_terms = CommercialTerms(**raw_ct) if raw_ct else CommercialTerms()

    # AI Metadata
    raw_ai = json.loads(row["ai_metadata"]) if row["ai_metadata"] else {}
    ai_metadata = BriefAIMetadata(**raw_ai) if raw_ai else BriefAIMetadata()

    cover_image_url = row["cover_image_url"] if "cover_image_url" in row.keys() else None
    if not cover_image_url and creative_direction and creative_direction.visual_references:
        cover_image_url = creative_direction.visual_references[0]

    return CampaignBriefResponse(
        id=UUID(row["id"]),
        brand_id=row["brand_id"],
        title=row["title"] or "Untitled Creative Brief",
        brand_or_product_name=row["brand_or_product_name"],
        product_or_service=row["product_or_service"],
        product_description=row["product_description"],
        campaign_idea=row["campaign_idea"],
        executive_summary=row["executive_summary"],
        description=row["description"] or "",
        objectives=json.loads(row["objectives"]) if row["objectives"] else [],
        primary_objective=row["primary_objective"],
        target_audience=row["target_audience"],
        target_market=row["target_market"],
        preferred_language=row["preferred_language"] or "English",
        campaign_category=row["campaign_category"],
        primary_message=row["primary_message"],
        desired_cta=row["desired_cta"],
        platforms=json.loads(row["platforms"]) if row["platforms"] else [],
        deliverables=deliverables,
        creative_direction=creative_direction,
        creator_capabilities=creator_capabilities,
        commercial_terms=commercial_terms,
        sections=json.loads(row["sections"]) if row["sections"] else {},
        budget_cents=row["budget_cents"],
        start_date=start_date_dt,
        deadline=deadline_dt,
        required_tools=json.loads(row["required_tools"]) if row["required_tools"] else [],
        ai_metadata=ai_metadata,
        cover_image_url=cover_image_url,
        is_public=bool(row["is_public"]),
        status=status,
        created_at=created_at_dt,
        updated_at=updated_at_dt,
    )


def _row_to_application(row) -> CampaignApplicationResponse:
    """Converts a SQLite database row to CampaignApplicationResponse model."""
    created_at_dt = datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now(timezone.utc)
    updated_at_dt = datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else datetime.now(timezone.utc)
    if created_at_dt.tzinfo is None:
        created_at_dt = created_at_dt.replace(tzinfo=timezone.utc)
    if updated_at_dt.tzinfo is None:
        updated_at_dt = updated_at_dt.replace(tzinfo=timezone.utc)

    status_str = row["status"]
    try:
        status = ApplicationStatus(status_str)
    except Exception:
        status = ApplicationStatus.PENDING

    skills = json.loads(row["relevant_skills"]) if row["relevant_skills"] else []
    tools = json.loads(row["relevant_tools"]) if row["relevant_tools"] else []
    portfolios = json.loads(row["portfolio_item_ids"]) if row["portfolio_item_ids"] else []

    creator_name = row["creator_name"] if "creator_name" in row.keys() else None
    creator_handle = row["creator_handle"] if "creator_handle" in row.keys() else None
    creator_avatar_url = row["creator_avatar_url"] if "creator_avatar_url" in row.keys() else None
    creator_specialization = row["creator_specialization"] if "creator_specialization" in row.keys() else None
    brief_title = row["brief_title"] if "brief_title" in row.keys() else None

    return CampaignApplicationResponse(
        id=UUID(row["id"]),
        brief_id=row["brief_id"],
        creator_id=row["creator_id"],
        brand_id=row["brand_id"],
        proposed_rate_cents=row["proposed_rate_cents"],
        pitch=row["pitch"],
        relevant_skills=skills,
        relevant_tools=tools,
        portfolio_item_ids=portfolios,
        estimated_days=row["estimated_days"],
        status=status,
        creator_name=creator_name,
        creator_handle=creator_handle,
        creator_avatar_url=creator_avatar_url,
        creator_specialization=creator_specialization,
        brief_title=brief_title,
        created_at=created_at_dt,
        updated_at=updated_at_dt,
    )


class BriefRepository(BaseRepository[CampaignBriefResponse]):
    """Repository handling campaign briefs persistence with durable SQLite storage."""

    def __init__(self):
        self._seed_foundational_brief()

    def _seed_foundational_brief(self):
        sample_id = UUID("00000000-0000-0000-0000-000000000004")
        brand_id = "00000000-0000-0000-0000-000000000002"
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM campaign_briefs WHERE id = ?", (str(sample_id),))
            if not cursor.fetchone():
                now_str = datetime.now(timezone.utc).isoformat()
                deliverables = [
                    {
                        "id": "deliv_001",
                        "content_type": "video",
                        "quantity": 3,
                        "placement_or_platform": "TikTok & Reels",
                        "aspect_ratio": "9:16",
                        "resolution": "4K",
                        "duration_seconds": 15,
                        "production_notes": "High energy pacing with product hero lock in last 3 seconds.",
                    },
                    {
                        "id": "deliv_002",
                        "content_type": "image",
                        "quantity": 5,
                        "placement_or_platform": "E-Commerce Catalog",
                        "aspect_ratio": "1:1",
                        "resolution": "8K",
                        "production_notes": "Clean studio lighting with volumetric backlighting.",
                    },
                ]
                cd = {
                    "styles": ["Photorealistic", "Cinematic", "Futuristic"],
                    "custom_style_notes": "High-contrast volumetric rim lighting, neon cyan and magenta reflections.",
                    "color_palette": "Electric Cyan (#00F0FF), Neon Violet (#9D00FF), Matte Obsidian (#111115)",
                    "mood_atmosphere": "Energetic, premium, forward-thinking, sleek",
                    "visual_references": ["Blade Runner 2049 aesthetic", "Apple Keynote lighting"],
                    "things_to_include": ["Distinct condensation beads on the can", "Crisp liquid splash dynamics"],
                    "things_to_avoid": ["Cartoonish renders", "Blurry motion artifacts", "Inconsistent product logo"],
                    "experimentation_level": "BALANCED",
                }
                cc = {
                    "required_capabilities": ["AI Video Generation", "Advanced Prompting", "Character / Object Consistency"],
                    "preferred_capabilities": ["Motion Design & VFX", "Audio & Sound Design"],
                    "flexible_capabilities": ["3D Pre-visualization"],
                    "preferred_tools": ["Runway Gen-3", "Midjourney v6", "ElevenLabs", "ComfyUI"],
                }
                ct = {
                    "budget_tier": "GROWTH",
                    "budget_cents": 250000,
                    "currency": "USD",
                    "payment_model": "MILESTONE",
                    "intended_usage": ["PAID_ADS", "ORGANIC_SOCIAL", "ECOMMERCE"],
                    "commercial_rights_required": True,
                    "source_files_required": True,
                    "revisions_count": 2,
                    "exclusivity_required": False,
                    "territory": "Global",
                    "usage_duration": "Perpetual",
                    "attribution_required": False,
                    "ongoing_work_considered": True,
                }
                ai = {
                    "ai_generated": True,
                    "open_questions": ["Will 3D CAD models of the can geometry be provided, or should the creator model it?"],
                    "constraints": ["Product typography must match brand vector guide precisely."],
                    "success_criteria": "At least 3 viable video cuts ready for paid Meta/TikTok advertising with certified commercial rights.",
                    "provider_used": "ai_gateway",
                    "generated_at": now_str,
                }

                cursor.execute(
                    """
                    INSERT INTO campaign_briefs (
                        id, brand_id, title, brand_or_product_name, product_or_service,
                        product_description, campaign_idea, executive_summary, description,
                        objectives, primary_objective, target_audience, target_market,
                        preferred_language, campaign_category, primary_message, desired_cta,
                        platforms, deliverables, creative_direction, creator_capabilities,
                        commercial_terms, sections, budget_cents, start_date, deadline,
                        required_tools, ai_metadata, is_public, status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(sample_id),
                        brand_id,
                        "Futuristic Beverage Launch Campaign",
                        "CyberElixir Zero Sugar Energy",
                        "CyberElixir Zero Sugar Energy",
                        "Next-gen zero calorie functional energy beverage with clean nootropics.",
                        "A high-energy sci-fi beverage commercial campaign emphasizing clean hydration with a futuristic neon aesthetic.",
                        "Production of multi-format promotional video and still assets for the Q3 release of 'CyberElixir Zero'. Deliverables include three 15s 9:16 vertical cuts for TikTok/Meta and five 1:1 e-commerce master stills.",
                        "Seeking an AI video creator to produce three 15-second hyper-realistic product videos featuring neon cyberpunk visuals and dynamic camera moves.",
                        json.dumps(["PRODUCT_LAUNCH", "BRAND_AWARENESS", "DRIVE_SALES"]),
                        "PRODUCT_LAUNCH",
                        "Gen-Z gamers, tech enthusiasts, and fitness creatives aged 18-32",
                        "Global",
                        "English",
                        "AI Filmmaking & Social",
                        "Pure neural energy with zero compromise.",
                        "Order early access at cyberelixir.io",
                        json.dumps(["TikTok", "Instagram Reels", "YouTube Shorts", "Web / E-Commerce"]),
                        json.dumps(deliverables),
                        json.dumps(cd),
                        json.dumps(cc),
                        json.dumps(ct),
                        json.dumps({}),
                        250000,
                        None,
                        None,
                        json.dumps(["Runway Gen-3", "Midjourney", "ElevenLabs"]),
                        json.dumps(ai),
                        1,
                        BriefStatus.PUBLISHED.value,
                        now_str,
                        now_str,
                    ),
                )
                conn.commit()

    async def get_by_id(self, id: UUID) -> Optional[CampaignBriefResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM campaign_briefs WHERE id = ?", (str(id),))
            row = cursor.fetchone()
            return _row_to_brief(row) if row else None

    async def list_by_brand(self, brand_id: Any) -> List[CampaignBriefResponse]:
        brand_id_str = str(brand_id)
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM campaign_briefs WHERE brand_id = ? ORDER BY created_at DESC",
                (brand_id_str,),
            )
            rows = cursor.fetchall()
            return [_row_to_brief(r) for r in rows]

    async def list_published(
        self,
        skip: int = 0,
        limit: int = 20,
        content_type: Optional[str] = None,
        category: Optional[str] = None,
        min_budget_cents: Optional[int] = None,
        max_budget_cents: Optional[int] = None,
        tool: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[CampaignBriefResponse]:
        query = "SELECT * FROM campaign_briefs WHERE status = ? AND is_public = 1"
        params: List[Any] = [BriefStatus.PUBLISHED.value]

        if category and category.strip():
            query += " AND campaign_category LIKE ?"
            params.append(f"%{category.strip()}%")

        if content_type and content_type.strip():
            query += " AND (deliverables LIKE ? OR platforms LIKE ?)"
            params.append(f"%{content_type.strip()}%")
            params.append(f"%{content_type.strip()}%")

        if min_budget_cents is not None:
            query += " AND (budget_cents >= ? OR budget_cents IS NULL)"
            params.append(min_budget_cents)

        if max_budget_cents is not None:
            query += " AND budget_cents <= ?"
            params.append(max_budget_cents)

        if tool and tool.strip():
            query += " AND (required_tools LIKE ? OR creator_capabilities LIKE ?)"
            params.append(f"%{tool.strip()}%")
            params.append(f"%{tool.strip()}%")

        if search and search.strip():
            s = f"%{search.strip()}%"
            query += " AND (title LIKE ? OR description LIKE ? OR brand_or_product_name LIKE ? OR campaign_idea LIKE ?)"
            params.extend([s, s, s, s])

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, skip])

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            return [_row_to_brief(r) for r in rows]

    async def list_all(
        self, skip: int = 0, limit: int = 20, filters: Optional[Dict[str, Any]] = None
    ) -> List[CampaignBriefResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM campaign_briefs ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, skip),
            )
            rows = cursor.fetchall()
            return [_row_to_brief(r) for r in rows]

    async def create(self, entity: CampaignBriefResponse) -> CampaignBriefResponse:
        now_str = entity.created_at.isoformat()
        updated_str = entity.updated_at.isoformat()

        # Serialize nested objects
        deliverables_json = json.dumps([d.model_dump() if hasattr(d, "model_dump") else d for d in entity.deliverables])
        cd_json = json.dumps(entity.creative_direction.model_dump() if hasattr(entity.creative_direction, "model_dump") else entity.creative_direction)
        cc_json = json.dumps(entity.creator_capabilities.model_dump() if hasattr(entity.creator_capabilities, "model_dump") else entity.creator_capabilities)
        ct_json = json.dumps(entity.commercial_terms.model_dump() if hasattr(entity.commercial_terms, "model_dump") else entity.commercial_terms)
        ai_json = json.dumps(entity.ai_metadata.model_dump() if hasattr(entity.ai_metadata, "model_dump") else entity.ai_metadata)

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO campaign_briefs (
                    id, brand_id, title, brand_or_product_name, product_or_service,
                    product_description, campaign_idea, executive_summary, description,
                    objectives, primary_objective, target_audience, target_market,
                    preferred_language, campaign_category, primary_message, desired_cta,
                    platforms, deliverables, creative_direction, creator_capabilities,
                    commercial_terms, sections, budget_cents, start_date, deadline,
                    required_tools, ai_metadata, cover_image_url, is_public, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(entity.id),
                    str(entity.brand_id),
                    entity.title,
                    entity.brand_or_product_name,
                    entity.product_or_service,
                    entity.product_description,
                    entity.campaign_idea,
                    entity.executive_summary,
                    entity.description,
                    json.dumps(entity.objectives),
                    entity.primary_objective,
                    entity.target_audience,
                    entity.target_market,
                    entity.preferred_language,
                    entity.campaign_category,
                    entity.primary_message,
                    entity.desired_cta,
                    json.dumps(entity.platforms),
                    deliverables_json,
                    cd_json,
                    cc_json,
                    ct_json,
                    json.dumps(entity.sections),
                    entity.budget_cents,
                    entity.start_date.isoformat() if entity.start_date else None,
                    entity.deadline.isoformat() if entity.deadline else None,
                    json.dumps(entity.required_tools),
                    ai_json,
                    entity.cover_image_url,
                    1 if entity.is_public else 0,
                    entity.status.value if hasattr(entity.status, "value") else str(entity.status),
                    now_str,
                    updated_str,
                ),
            )
            conn.commit()
        return entity

    async def update(self, id: UUID, update_data: Dict[str, Any]) -> Optional[CampaignBriefResponse]:
        existing = await self.get_by_id(id)
        if not existing:
            return None
        existing_dict = existing.model_dump()
        existing_dict.update(update_data)
        existing_dict["updated_at"] = datetime.now(timezone.utc)
        updated_entity = CampaignBriefResponse(**existing_dict)
        return await self.create(updated_entity)

    async def delete(self, id: UUID) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM campaign_briefs WHERE id = ?", (str(id),))
            conn.commit()
            return cursor.rowcount > 0

    async def create_application(self, entity: CampaignApplicationResponse) -> CampaignApplicationResponse:
        now_str = entity.created_at.isoformat()
        updated_str = entity.updated_at.isoformat()
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO campaign_applications (
                    id, brief_id, creator_id, brand_id, proposed_rate_cents,
                    pitch, relevant_skills, relevant_tools, portfolio_item_ids,
                    estimated_days, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(entity.id),
                    str(entity.brief_id),
                    str(entity.creator_id),
                    str(entity.brand_id),
                    entity.proposed_rate_cents,
                    entity.pitch,
                    json.dumps(entity.relevant_skills),
                    json.dumps(entity.relevant_tools),
                    json.dumps(entity.portfolio_item_ids),
                    entity.estimated_days,
                    entity.status.value if hasattr(entity.status, "value") else str(entity.status),
                    now_str,
                    updated_str,
                ),
            )
            conn.commit()
        return entity

    async def get_application_by_id(self, application_id: UUID) -> Optional[CampaignApplicationResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM campaign_applications WHERE id = ?", (str(application_id),))
            row = cursor.fetchone()
            return _row_to_application(row) if row else None

    async def get_application_by_brief_and_creator(self, brief_id: str, creator_id: str) -> Optional[CampaignApplicationResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM campaign_applications WHERE brief_id = ? AND creator_id = ?",
                (str(brief_id), str(creator_id)),
            )
            row = cursor.fetchone()
            return _row_to_application(row) if row else None

    async def list_applications_for_brief(self, brief_id: str) -> List[CampaignApplicationResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT a.*, cp.full_name as creator_name, cp.handle as creator_handle,
                       cp.avatar_url as creator_avatar_url, cp.primary_specialization as creator_specialization,
                       cb.title as brief_title
                FROM campaign_applications a
                LEFT JOIN creator_profiles cp ON a.creator_id = cp.id OR a.creator_id = cp.user_id
                LEFT JOIN campaign_briefs cb ON a.brief_id = cb.id
                WHERE a.brief_id = ?
                ORDER BY a.created_at DESC
                """,
                (str(brief_id),),
            )
            rows = cursor.fetchall()
            return [_row_to_application(r) for r in rows]

    async def list_applications_for_creator(self, creator_id: str) -> List[CampaignApplicationResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT a.*, cb.title as brief_title
                FROM campaign_applications a
                LEFT JOIN campaign_briefs cb ON a.brief_id = cb.id
                WHERE a.creator_id = ?
                ORDER BY a.created_at DESC
                """,
                (str(creator_id),),
            )
            rows = cursor.fetchall()
            return [_row_to_application(r) for r in rows]

    async def update_application_status(self, application_id: UUID, status: ApplicationStatus) -> Optional[CampaignApplicationResponse]:
        now_str = datetime.now(timezone.utc).isoformat()
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE campaign_applications SET status = ?, updated_at = ? WHERE id = ?",
                (status.value if hasattr(status, "value") else str(status), now_str, str(application_id)),
            )
            conn.commit()
        return await self.get_application_by_id(application_id)
