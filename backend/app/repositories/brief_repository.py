"""Campaign brief repository implementation."""

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
)


class BriefRepository(BaseRepository[CampaignBriefResponse]):
    """Repository handling campaign briefs persistence."""

    def __init__(self):
        self._store: Dict[UUID, CampaignBriefResponse] = {}
        self._seed_foundational_brief()

    def _seed_foundational_brief(self):
        sample_id = UUID("00000000-0000-0000-0000-000000000004")
        brand_id = "00000000-0000-0000-0000-000000000002"
        now = datetime.now(timezone.utc)

        self._store[sample_id] = CampaignBriefResponse(
            id=sample_id,
            brand_id=brand_id,
            title="Futuristic Beverage Launch Campaign",
            description="Seeking an AI video creator to produce three 15-second hyper-realistic product videos featuring neon cyberpunk visuals and dynamic camera moves.",
            campaign_idea="A high-energy sci-fi beverage commercial campaign emphasizing clean hydration with a futuristic neon aesthetic.",
            executive_summary="Production of multi-format promotional video and still assets for the Q3 release of 'CyberElixir Zero'. Deliverables include three 15s 9:16 vertical cuts for TikTok/Meta and five 1:1 e-commerce master stills.",
            objectives=["PRODUCT_LAUNCH", "BRAND_AWARENESS", "DRIVE_SALES"],
            product_or_service="CyberElixir Zero Sugar Energy",
            target_audience="Gen-Z gamers, tech enthusiasts, and fitness creatives aged 18-32",
            primary_message="Pure neural energy with zero compromise.",
            desired_cta="Order early access at cyberelixir.io",
            platforms=["TikTok", "Instagram Reels", "YouTube Shorts", "Web / E-Commerce"],
            deliverables=[
                DeliverableItem(
                    id="deliv_001",
                    content_type="video",
                    quantity=3,
                    placement_or_platform="TikTok & Reels",
                    aspect_ratio="9:16",
                    resolution="4K",
                    duration_seconds=15,
                    production_notes="High energy pacing with product hero lock in last 3 seconds.",
                ),
                DeliverableItem(
                    id="deliv_002",
                    content_type="image",
                    quantity=5,
                    placement_or_platform="E-Commerce Catalog",
                    aspect_ratio="1:1",
                    resolution="8K",
                    production_notes="Clean studio lighting with volumetric backlighting.",
                ),
            ],
            creative_direction=CreativeDirection(
                styles=["Photorealistic", "Cinematic", "Futuristic"],
                custom_style_notes="High-contrast volumetric rim lighting, neon cyan and magenta reflections.",
                color_palette="Electric Cyan (#00F0FF), Neon Violet (#9D00FF), Matte Obsidian (#111115)",
                mood_atmosphere="Energetic, premium, forward-thinking, sleek",
                visual_references=["Blade Runner 2049 aesthetic", "Apple Keynote lighting"],
                things_to_include=["Distinct condensation beads on the can", "Crisp liquid splash dynamics"],
                things_to_avoid=["Cartoonish renders", "Blurry motion artifacts", "Inconsistent product logo"],
                experimentation_level="BALANCED",
            ),
            creator_capabilities=CreatorCapabilityRequirements(
                required_capabilities=["AI Video Generation", "Advanced Prompting", "Character / Object Consistency"],
                preferred_capabilities=["Motion Design & VFX", "Audio & Sound Design"],
                flexible_capabilities=["3D Pre-visualization"],
                preferred_tools=["Runway Gen-3", "Midjourney v6", "ElevenLabs", "ComfyUI"],
            ),
            commercial_terms=CommercialTerms(
                budget_tier="GROWTH",
                budget_cents=250000,
                currency="USD",
                payment_model="MILESTONE",
                intended_usage=["PAID_ADS", "ORGANIC_SOCIAL", "ECOMMERCE"],
                commercial_rights_required=True,
                source_files_required=True,
                revisions_count=2,
                exclusivity_required=False,
                territory="Global",
                usage_duration="Perpetual",
                attribution_required=False,
                ongoing_work_considered=True,
            ),
            budget_cents=250000,
            required_tools=["Runway Gen-3", "Midjourney", "ElevenLabs"],
            ai_metadata=BriefAIMetadata(
                ai_generated=True,
                open_questions=["Will 3D CAD models of the can geometry be provided, or should the creator model it?"],
                constraints=["Product typography must match brand vector guide precisely."],
                success_criteria="At least 3 viable video cuts ready for paid Meta/TikTok advertising with certified commercial rights.",
                provider_used="ai_gateway",
                generated_at=now,
            ),
            is_public=True,
            status=BriefStatus.PUBLISHED,
            created_at=now,
            updated_at=now,
        )

    async def get_by_id(self, id: UUID) -> Optional[CampaignBriefResponse]:
        return self._store.get(id)

    async def list_by_brand(self, brand_id: str) -> List[CampaignBriefResponse]:
        return [brief for brief in self._store.values() if str(brief.brand_id) == str(brand_id)]

    async def list_published(self, skip: int = 0, limit: int = 20) -> List[CampaignBriefResponse]:
        published = [
            brief for brief in self._store.values()
            if brief.status == BriefStatus.PUBLISHED and brief.is_public
        ]
        return published[skip : skip + limit]

    async def list_all(
        self, skip: int = 0, limit: int = 20, filters: Optional[Dict[str, Any]] = None
    ) -> List[CampaignBriefResponse]:
        briefs = list(self._store.values())
        return briefs[skip : skip + limit]

    async def create(self, entity: CampaignBriefResponse) -> CampaignBriefResponse:
        self._store[entity.id] = entity
        return entity

    async def update(self, id: UUID, update_data: Dict[str, Any]) -> Optional[CampaignBriefResponse]:
        existing = self._store.get(id)
        if not existing:
            return None
        existing_dict = existing.model_dump()
        existing_dict.update(update_data)
        existing_dict["updated_at"] = datetime.now(timezone.utc)
        updated_entity = CampaignBriefResponse(**existing_dict)
        self._store[id] = updated_entity
        return updated_entity

    async def delete(self, id: UUID) -> bool:
        if id in self._store:
            del self._store[id]
            return True
        return False


brief_repository = BriefRepository()
