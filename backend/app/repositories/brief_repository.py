"""Campaign brief repository implementation with persistent SQLite storage."""

import json
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from uuid import UUID, uuid4
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
    ClipSubmissionResponse,
    SubmissionStatus,
    CampaignParticipantResponse,
    CampaignAnalyticsResponse,
    CreatorLeaderboardItem,
    BrandCommunityPostResponse,
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

    keys = row.keys()
    reward_type = row["reward_type"] if "reward_type" in keys and row["reward_type"] else "CPM"
    cpm_rate_cents = row["cpm_rate_cents"] if "cpm_rate_cents" in keys and row["cpm_rate_cents"] is not None else 150
    total_pool_cents = row["total_pool_cents"] if "total_pool_cents" in keys and row["total_pool_cents"] is not None else (row["budget_cents"] or 1500000)
    paid_pool_cents = row["paid_pool_cents"] if "paid_pool_cents" in keys and row["paid_pool_cents"] is not None else 0
    views_count = row["views_count"] if "views_count" in keys and row["views_count"] is not None else 0
    participants_count = row["participants_count"] if "participants_count" in keys and row["participants_count"] is not None else 0

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
        reward_type=reward_type,
        cpm_rate_cents=cpm_rate_cents,
        total_pool_cents=total_pool_cents,
        paid_pool_cents=paid_pool_cents,
        views_count=views_count,
        participants_count=participants_count,
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


def _row_to_submission(row) -> ClipSubmissionResponse:
    submitted_at_dt = datetime.fromisoformat(row["submitted_at"]) if row["submitted_at"] else datetime.now(timezone.utc)
    reviewed_at_dt = datetime.fromisoformat(row["reviewed_at"]) if row["reviewed_at"] else None
    created_at_dt = datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now(timezone.utc)
    updated_at_dt = datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else datetime.now(timezone.utc)
    if submitted_at_dt.tzinfo is None:
        submitted_at_dt = submitted_at_dt.replace(tzinfo=timezone.utc)
    if reviewed_at_dt and reviewed_at_dt.tzinfo is None:
        reviewed_at_dt = reviewed_at_dt.replace(tzinfo=timezone.utc)
    if created_at_dt.tzinfo is None:
        created_at_dt = created_at_dt.replace(tzinfo=timezone.utc)
    if updated_at_dt.tzinfo is None:
        updated_at_dt = updated_at_dt.replace(tzinfo=timezone.utc)

    status_val = row["status"]
    try:
        status = SubmissionStatus(status_val)
    except ValueError:
        status = SubmissionStatus.PENDING_REVIEW

    try:
        sub_id = UUID(str(row["id"]))
    except (ValueError, TypeError):
        import uuid
        sub_id = uuid.uuid5(uuid.NAMESPACE_DNS, str(row["id"]))

    keys = row.keys()
    return ClipSubmissionResponse(
        id=sub_id,
        campaign_id=row["campaign_id"],
        creator_id=row["creator_id"],
        brand_id=row["brand_id"],
        clip_url=row["clip_url"],
        platform=row["platform"],
        title=row["title"],
        description=row["description"],
        ai_tools=json.loads(row["ai_tools"]) if row["ai_tools"] else [],
        views_count=row["views_count"] or 0,
        earned_cents=row["earned_cents"] or 0,
        status=status,
        feedback=row["feedback"],
        submitted_at=submitted_at_dt,
        reviewed_at=reviewed_at_dt,
        creator_name=row["creator_name"] if "creator_name" in keys else None,
        creator_handle=row["creator_handle"] if "creator_handle" in keys else None,
        creator_avatar_url=row["creator_avatar_url"] if "creator_avatar_url" in keys else None,
        campaign_title=row["campaign_title"] if "campaign_title" in keys else None,
        brand_name=row["brand_name"] if "brand_name" in keys else None,
        created_at=created_at_dt,
        updated_at=updated_at_dt,
    )


def _row_to_participant(row) -> CampaignParticipantResponse:
    joined_at_dt = datetime.fromisoformat(row["joined_at"]) if row["joined_at"] else datetime.now(timezone.utc)
    if joined_at_dt.tzinfo is None:
        joined_at_dt = joined_at_dt.replace(tzinfo=timezone.utc)
    keys = row.keys()
    return CampaignParticipantResponse(
        id=row["id"],
        campaign_id=row["campaign_id"],
        creator_id=row["creator_id"],
        status=row["status"] or "JOINED",
        joined_at=joined_at_dt,
        creator_name=row["creator_name"] if "creator_name" in keys else None,
        creator_handle=row["creator_handle"] if "creator_handle" in keys else None,
        creator_avatar_url=row["creator_avatar_url"] if "creator_avatar_url" in keys else None,
    )


def _row_to_community_post(row) -> BrandCommunityPostResponse:
    created_at_dt = datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now(timezone.utc)
    updated_at_dt = datetime.fromisoformat(row["updated_at"]) if row["updated_at"] else datetime.now(timezone.utc)
    if created_at_dt.tzinfo is None:
        created_at_dt = created_at_dt.replace(tzinfo=timezone.utc)
    if updated_at_dt.tzinfo is None:
        updated_at_dt = updated_at_dt.replace(tzinfo=timezone.utc)

    try:
        post_id = UUID(str(row["id"]))
    except (ValueError, TypeError):
        import uuid
        post_id = uuid.uuid5(uuid.NAMESPACE_DNS, str(row["id"]))

    keys = row.keys()
    return BrandCommunityPostResponse(
        id=post_id,
        brand_id=row["brand_id"],
        brand_name=row["brand_name"] if "brand_name" in keys else None,
        brand_logo_url=row["brand_logo_url"] if "brand_logo_url" in keys else None,
        title=row["title"],
        content=row["content"],
        category=row["category"] or "ANNOUNCEMENT",
        pinned=bool(row["pinned"]),
        likes_count=row["likes_count"] or 0,
        media_url=row["media_url"],
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

        reward_type = entity.reward_type or "CPM"
        cpm_rate_cents = entity.cpm_rate_cents or 150
        total_pool_cents = entity.total_pool_cents or entity.budget_cents or 1500000
        paid_pool_cents = entity.paid_pool_cents or 0
        views_count = entity.views_count or 0
        participants_count = entity.participants_count or 0

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
                    commercial_terms, sections, budget_cents, reward_type, cpm_rate_cents,
                    total_pool_cents, paid_pool_cents, views_count, participants_count,
                    start_date, deadline, required_tools, ai_metadata, cover_image_url,
                    is_public, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    reward_type,
                    cpm_rate_cents,
                    total_pool_cents,
                    paid_pool_cents,
                    views_count,
                    participants_count,
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

    # =========================================================================
    # CAMPAIGN PARTICIPATION (Content Rewards Join Workflow)
    # =========================================================================
    async def join_campaign(self, campaign_id: str, creator_id: str) -> bool:
        now_str = datetime.now(timezone.utc).isoformat()
        part_id = f"part_{int(datetime.now(timezone.utc).timestamp()*1000)}"
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO campaign_participants (id, campaign_id, creator_id, status, joined_at)
                VALUES (?, ?, ?, 'JOINED', ?)
                ON CONFLICT(campaign_id, creator_id) DO UPDATE SET status = 'JOINED'
                """,
                (part_id, str(campaign_id), str(creator_id), now_str)
            )
            cursor.execute(
                """
                UPDATE campaign_briefs 
                SET participants_count = (SELECT COUNT(*) FROM campaign_participants WHERE campaign_id = ? AND status = 'JOINED')
                WHERE id = ?
                """,
                (str(campaign_id), str(campaign_id))
            )
            conn.commit()
            return True

    async def get_campaign_participant(self, campaign_id: str, creator_id: str) -> Optional[CampaignParticipantResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT p.*, cp.full_name as creator_name, cp.handle as creator_handle, cp.avatar_url as creator_avatar_url
                FROM campaign_participants p
                LEFT JOIN creator_profiles cp ON p.creator_id = cp.id OR p.creator_id = cp.user_id
                WHERE p.campaign_id = ? AND p.creator_id = ?
                """,
                (str(campaign_id), str(creator_id))
            )
            row = cursor.fetchone()
            return _row_to_participant(row) if row else None

    async def list_campaign_participants(self, campaign_id: str) -> List[CampaignParticipantResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT p.*, cp.full_name as creator_name, cp.handle as creator_handle, cp.avatar_url as creator_avatar_url
                FROM campaign_participants p
                LEFT JOIN creator_profiles cp ON p.creator_id = cp.id OR p.creator_id = cp.user_id
                WHERE p.campaign_id = ?
                ORDER BY p.joined_at DESC
                """,
                (str(campaign_id),)
            )
            rows = cursor.fetchall()
            return [_row_to_participant(r) for r in rows]

    # =========================================================================
    # CLIP SUBMISSIONS (Content Rewards Clip Workflow)
    # =========================================================================
    async def create_clip_submission(
        self,
        campaign_id: str,
        creator_id: str,
        brand_id: str,
        clip_url: str,
        platform: str,
        title: str,
        description: Optional[str] = None,
        ai_tools: Optional[List[str]] = None,
        initial_views: int = 0,
    ) -> Optional[ClipSubmissionResponse]:
        now = datetime.now(timezone.utc)
        now_str = now.isoformat()
        sub_id = uuid4()
        ai_tools_list = ai_tools or []

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO clip_submissions (
                    id, campaign_id, creator_id, brand_id, clip_url, platform,
                    title, description, ai_tools, views_count, earned_cents,
                    status, feedback, submitted_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_REVIEW', NULL, ?, ?, ?)
                """,
                (
                    str(sub_id),
                    str(campaign_id),
                    str(creator_id),
                    str(brand_id),
                    clip_url,
                    platform,
                    title,
                    description,
                    json.dumps(ai_tools_list),
                    initial_views,
                    0,
                    now_str,
                    now_str,
                    now_str,
                )
            )
            conn.commit()

        return await self.get_submission_by_id(sub_id)

    async def get_submission_by_id(self, submission_id: UUID) -> Optional[ClipSubmissionResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT s.*, cp.full_name as creator_name, cp.handle as creator_handle, cp.avatar_url as creator_avatar_url,
                       cb.title as campaign_title, bp.company_name as brand_name
                FROM clip_submissions s
                LEFT JOIN creator_profiles cp ON s.creator_id = cp.id OR s.creator_id = cp.user_id
                LEFT JOIN campaign_briefs cb ON s.campaign_id = cb.id
                LEFT JOIN brand_profiles bp ON s.brand_id = bp.id OR s.brand_id = bp.user_id
                WHERE s.id = ?
                """,
                (str(submission_id),)
            )
            row = cursor.fetchone()
            return _row_to_submission(row) if row else None

    async def list_submissions_for_campaign(self, campaign_id: str) -> List[ClipSubmissionResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT s.*, cp.full_name as creator_name, cp.handle as creator_handle, cp.avatar_url as creator_avatar_url,
                       cb.title as campaign_title, bp.company_name as brand_name
                FROM clip_submissions s
                LEFT JOIN creator_profiles cp ON s.creator_id = cp.id OR s.creator_id = cp.user_id
                LEFT JOIN campaign_briefs cb ON s.campaign_id = cb.id
                LEFT JOIN brand_profiles bp ON s.brand_id = bp.id OR s.brand_id = bp.user_id
                WHERE s.campaign_id = ?
                ORDER BY s.submitted_at DESC
                """,
                (str(campaign_id),)
            )
            rows = cursor.fetchall()
            return [_row_to_submission(r) for r in rows]

    async def list_creator_submissions(self, creator_id: str) -> List[ClipSubmissionResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT s.*, cp.full_name as creator_name, cp.handle as creator_handle, cp.avatar_url as creator_avatar_url,
                       cb.title as campaign_title, bp.company_name as brand_name
                FROM clip_submissions s
                LEFT JOIN creator_profiles cp ON s.creator_id = cp.id OR s.creator_id = cp.user_id
                LEFT JOIN campaign_briefs cb ON s.campaign_id = cb.id
                LEFT JOIN brand_profiles bp ON s.brand_id = bp.id OR s.brand_id = bp.user_id
                WHERE s.creator_id = ?
                ORDER BY s.submitted_at DESC
                """,
                (str(creator_id),)
            )
            rows = cursor.fetchall()
            return [_row_to_submission(r) for r in rows]

    async def review_clip_submission(
        self,
        submission_id: UUID,
        brand_id: str,
        status: SubmissionStatus,
        feedback: Optional[str] = None,
        verified_views: Optional[int] = None,
        payout_cents: Optional[int] = None,
    ) -> Optional[ClipSubmissionResponse]:
        sub = await self.get_submission_by_id(submission_id)
        if not sub:
            return None

        views = verified_views if verified_views is not None else sub.views_count
        if views < 0:
            views = 0

        brief = await self.get_by_id(UUID(sub.campaign_id))

        if status == SubmissionStatus.APPROVED:
            earned = payout_cents
            if earned is None and brief and brief.cpm_rate_cents:
                # views / 1000 * cpm_rate_cents
                earned = int((views / 1000.0) * brief.cpm_rate_cents)
            elif earned is None:
                earned = sub.earned_cents

            if earned < 0:
                earned = 0

            # Enforce campaign pool limits (cap payout to remaining pool if defined)
            if brief and brief.total_pool_cents:
                with get_db_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        "SELECT COALESCE(SUM(earned_cents), 0) FROM clip_submissions WHERE campaign_id = ? AND status = 'APPROVED' AND id != ?",
                        (sub.campaign_id, str(submission_id))
                    )
                    row = cursor.fetchone()
                    current_paid = row[0] if row else 0
                    remaining = max(0, brief.total_pool_cents - current_paid)
                    earned = min(earned, remaining)
        else:
            # Unapproved, rejected, or revision-requested clips must have 0 earned reward
            earned = 0

        now_str = datetime.now(timezone.utc).isoformat()
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE clip_submissions
                SET status = ?, feedback = ?, views_count = ?, earned_cents = ?, reviewed_at = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    status.value if hasattr(status, "value") else str(status),
                    feedback,
                    views,
                    earned,
                    now_str,
                    now_str,
                    str(submission_id),
                )
            )

            # Recalculate campaign totals based on all currently approved submissions
            cursor.execute(
                """
                UPDATE campaign_briefs
                SET views_count = (SELECT COALESCE(SUM(views_count), 0) FROM clip_submissions WHERE campaign_id = ? AND status = 'APPROVED'),
                    paid_pool_cents = (SELECT COALESCE(SUM(earned_cents), 0) FROM clip_submissions WHERE campaign_id = ? AND status = 'APPROVED')
                WHERE id = ?
                """,
                (sub.campaign_id, sub.campaign_id, sub.campaign_id)
            )

            conn.commit()

        return await self.get_submission_by_id(submission_id)

    # =========================================================================
    # CAMPAIGN ANALYTICS (Whop-style Insights & Leaderboards)
    # =========================================================================
    async def get_campaign_analytics(self, campaign_id: str, brand_id: Optional[str] = None) -> Optional[CampaignAnalyticsResponse]:
        brief = await self.get_by_id(UUID(campaign_id))
        if not brief:
            return None

        total_views = 0
        total_subs = 0
        approved_subs = 0
        pending_subs = 0
        rejected_subs = 0
        paid_cents = 0

        leaderboard_map: Dict[str, Dict[str, Any]] = {}

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT s.*, cp.full_name, cp.handle, cp.avatar_url
                FROM clip_submissions s
                LEFT JOIN creator_profiles cp ON s.creator_id = cp.id OR s.creator_id = cp.user_id
                WHERE s.campaign_id = ?
                """,
                (str(campaign_id),)
            )
            subs = cursor.fetchall()
            for s in subs:
                total_subs += 1
                st = s["status"]
                vw = s["views_count"] or 0
                er = s["earned_cents"] or 0
                if st == "APPROVED":
                    approved_subs += 1
                    total_views += vw
                    paid_cents += er
                elif st == "PENDING_REVIEW":
                    pending_subs += 1
                elif st in ["REJECTED", "REVISION_REQUESTED"]:
                    rejected_subs += 1

                cid = s["creator_id"]
                if cid not in leaderboard_map:
                    leaderboard_map[cid] = {
                        "creator_id": cid,
                        "creator_name": s["full_name"] or "AI Creator",
                        "creator_handle": s["handle"] or "creator",
                        "creator_avatar_url": s["avatar_url"],
                        "total_views": 0,
                        "approved_clips": 0,
                        "total_earned_cents": 0,
                    }
                if st == "APPROVED":
                    leaderboard_map[cid]["total_views"] += vw
                    leaderboard_map[cid]["approved_clips"] += 1
                    leaderboard_map[cid]["total_earned_cents"] += er

        pool_total = brief.total_pool_cents or brief.budget_cents or 1500000
        rem_cents = max(0, pool_total - paid_cents)

        sorted_leaders = sorted(leaderboard_map.values(), key=lambda x: x["total_views"], reverse=True)
        leaderboard_items = [CreatorLeaderboardItem(**l) for l in sorted_leaders]

        now = datetime.now(timezone.utc)
        views_trend = [
            {"date": (now - timedelta(days=6-i)).strftime("%b %d"), "views": int(total_views * (0.05 + 0.15 * (i + 1) / 7))}
            for i in range(7)
        ]

        return CampaignAnalyticsResponse(
            campaign_id=str(brief.id),
            title=brief.title,
            status=brief.status.value if hasattr(brief.status, "value") else str(brief.status),
            total_views=total_views or brief.views_count or 0,
            total_submissions=total_subs,
            approved_submissions=approved_subs,
            pending_submissions=pending_subs,
            rejected_submissions=rejected_subs,
            total_pool_cents=pool_total,
            paid_pool_cents=paid_cents or brief.paid_pool_cents or 0,
            remaining_pool_cents=rem_cents,
            cpm_rate_cents=brief.cpm_rate_cents or 150,
            participants_count=brief.participants_count or len(leaderboard_map),
            views_over_time=views_trend,
            leaderboard=leaderboard_items,
        )

    # =========================================================================
    # BRAND COMMUNITY (Announcements, Guidelines & Contests)
    # =========================================================================
    async def create_community_post(
        self,
        brand_id: str,
        title: str,
        content: str,
        category: str = "ANNOUNCEMENT",
        pinned: bool = False,
        media_url: Optional[str] = None,
    ) -> Optional[BrandCommunityPostResponse]:
        now = datetime.now(timezone.utc)
        now_str = now.isoformat()
        post_id = uuid4()

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO brand_community_posts (
                    id, brand_id, title, content, category, pinned, likes_count, media_url, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
                """,
                (
                    str(post_id),
                    str(brand_id),
                    title,
                    content,
                    category,
                    1 if pinned else 0,
                    media_url,
                    now_str,
                    now_str,
                )
            )
            conn.commit()

        return await self.get_community_post_by_id(post_id)

    async def get_community_post_by_id(self, post_id: UUID) -> Optional[BrandCommunityPostResponse]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT p.*, bp.company_name as brand_name, bp.logo_url as brand_logo_url
                FROM brand_community_posts p
                LEFT JOIN brand_profiles bp ON p.brand_id = bp.id OR p.brand_id = bp.user_id
                WHERE p.id = ?
                """,
                (str(post_id),)
            )
            row = cursor.fetchone()
            return _row_to_community_post(row) if row else None

    async def list_community_posts(
        self, brand_id: Optional[str] = None, category: Optional[str] = None
    ) -> List[BrandCommunityPostResponse]:
        query = """
            SELECT p.*, bp.company_name as brand_name, bp.logo_url as brand_logo_url
            FROM brand_community_posts p
            LEFT JOIN brand_profiles bp ON p.brand_id = bp.id OR p.brand_id = bp.user_id
            WHERE 1=1
        """
        params: List[Any] = []
        if brand_id:
            query += " AND (p.brand_id = ? OR bp.user_id = ?)"
            params.extend([str(brand_id), str(brand_id)])
        if category and category.strip() and category != "ALL":
            query += " AND p.category = ?"
            params.append(category.strip())

        query += " ORDER BY p.pinned DESC, p.created_at DESC"

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            return [_row_to_community_post(r) for r in rows]

    async def delete_community_post(self, post_id: UUID, brand_id: str) -> bool:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "DELETE FROM brand_community_posts WHERE id = ? AND (brand_id = ? OR brand_id IN (SELECT id FROM brand_profiles WHERE user_id = ?))",
                (str(post_id), str(brand_id), str(brand_id))
            )
            conn.commit()
            return cursor.rowcount > 0

    async def like_community_post(self, post_id: UUID) -> int:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE brand_community_posts SET likes_count = likes_count + 1 WHERE id = ?",
                (str(post_id),)
            )
            cursor.execute("SELECT likes_count FROM brand_community_posts WHERE id = ?", (str(post_id),))
            row = cursor.fetchone()
            conn.commit()
            return row["likes_count"] if row else 1
