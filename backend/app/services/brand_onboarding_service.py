"""Brand adaptive survey and onboarding domain service."""

from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime, timezone
from app.services.base import BaseService
from app.core.errors import NotFoundException, ValidationException
from app.repositories import (
    brand_repository,
    brand_survey_repository,
    brand_preferences_repository,
    BrandRepository,
    BrandSurveyRepository,
    BrandPreferencesRepository,
)
from app.schemas.brand import (
    BrandSurveySessionResponse,
    BrandPreferencesBase,
    BrandDashboardOverviewResponse,
    BrandProfileUpdate,
)
from app.services.brand_service import brand_service


class BrandOnboardingService(BaseService):
    """
    Manages brand organization onboarding questionnaire, adaptive branching,
    save-and-resume persistence, and preference mapping.
    """

    def __init__(
        self,
        repo: Optional[BrandRepository] = None,
        survey_repo: Optional[BrandSurveyRepository] = None,
        pref_repo: Optional[BrandPreferencesRepository] = None,
    ):
        super().__init__("brand_onboarding")
        self.repo = repo or brand_repository
        self.survey_repo = survey_repo or brand_survey_repository
        self.pref_repo = pref_repo or brand_preferences_repository

    def get_survey_catalog(self) -> Dict[str, Any]:
        """Returns structured metadata options for the 8 onboarding sections."""
        return {
            "organization_types": [
                "Consumer Brand",
                "D2C Brand",
                "E-commerce Business",
                "Startup",
                "Small or Medium Business",
                "Enterprise",
                "Creative Agency",
                "Advertising Agency",
                "Marketing Agency",
                "Production Studio",
                "Creator Management Agency",
                "Nonprofit Organization",
                "Educational Institution",
                "Other",
            ],
            "industries": [
                "Technology & Software",
                "Fashion & Apparel",
                "Gaming & Esports",
                "Beauty & Cosmetics",
                "Food & Beverage",
                "Automotive & Mobility",
                "Travel & Hospitality",
                "Education & EdTech",
                "Entertainment & Streaming",
                "Sports & Fitness",
                "Finance & Fintech",
                "Lifestyle & Wellness",
                "Healthcare & Pharma",
                "Real Estate & Architecture",
                "Other",
            ],
            "intended_uses": [
                "Discovering AI creators",
                "Producing advertising campaigns",
                "Producing social content",
                "Developing AI-generated videos",
                "Producing product visuals",
                "Creating animations",
                "Finding AI voice or audio specialists",
                "Managing multiple creators",
                "Exploring AI creative capabilities",
            ],
            "content_requirements": [
                "Short-form videos (Reels/TikTok/Shorts)",
                "Long-form videos & mini-docs",
                "Product advertisements & commercial spots",
                "AI-generated keyframe images",
                "Product visualizations & packshots",
                "Motion graphics & title design",
                "2D / 3D Stylized animations",
                "AI filmmaking & narrative trailers",
                "Voiceovers & multilingual lipsync",
                "Audio, soundscapes and music scores",
                "Social media content & static carousels",
            ],
            "preferred_formats": [
                "9:16 vertical (Mobile First)",
                "16:9 landscape (Commercial / Web)",
                "1:1 square (Feed / Display)",
                "4:5 portrait (Social Feed)",
                "21:9 cinematic (Wide Screen)",
            ],
            "creative_styles": [
                "Cinematic & High-Dynamic",
                "Photorealistic & Hyper-real",
                "Minimalist & Clean",
                "Editorial & High Fashion",
                "Futuristic & Cyberpunk",
                "Animated & Anime",
                "Stylized 3D & Claymation",
                "Documentary & Gritty",
                "Surreal & Dreamlike",
                "Product-focused & Packshot Crisp",
                "Brand-led storytelling",
                "Experimental & Avant-garde",
            ],
            "usage_channels": [
                "Paid Social Advertising",
                "Organic Social Media",
                "Official Website & Landing Pages",
                "E-commerce & Amazon / Shopify Listings",
                "Digital Out-of-Home (OOH)",
                "Broadcast & Streaming Pre-rolls",
                "Internal Corporate Communications",
            ],
            "budget_ranges": [
                "Under ₹5,000",
                "₹5,000–₹15,000",
                "₹15,000–₹50,000",
                "₹50,000–₹1,00,000",
                "Above ₹1,00,000",
                "Not decided yet",
                "Prefer not to disclose",
            ],
            "engagement_types": [
                "One-time project",
                "Multi-asset Campaign",
                "Monthly retainer",
                "Ongoing creator partnership",
                "Not decided",
            ],
        }

    def get_adaptive_branches(self, responses: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Dynamically calculates specialized question branches according to current responses.
        Enables seamless tailored questioning without overwhelming the brand.
        """
        branches: List[Dict[str, Any]] = []

        org_type = responses.get("organization_type", "")
        content_reqs = responses.get("content_requirements", [])

        # Agency branch
        is_agency = "Agency" in org_type or "Studio" in org_type or responses.get("is_agency", False)
        if is_agency:
            branches.append({
                "id": "agency_structure",
                "title": "Agency & Client Governance",
                "questions": [
                    {
                        "id": "agency_multiple_clients",
                        "label": "Do you manage creative briefs across multiple external client accounts?",
                        "type": "boolean",
                        "default": True,
                    },
                    {
                        "id": "agency_client_tagging",
                        "label": "Would you like campaign briefs to be grouped by client code / brand sub-accounts?",
                        "type": "boolean",
                        "default": True,
                    },
                ],
            })

        # D2C / E-commerce branch
        if org_type in ["D2C Brand", "E-commerce Business"]:
            branches.append({
                "id": "d2c_ecommerce_focus",
                "title": "E-Commerce Creative Priorities",
                "questions": [
                    {
                        "id": "d2c_asset_priority",
                        "label": "Which asset deliverables drive the highest conversion for your brand?",
                        "type": "multi_select",
                        "options": [
                            "Shopify / Amazon Hero Packshots",
                            "Lifestyle Product in Context",
                            "UGC-style Performance Video Ads",
                            "Unboxing & Feature Explainer Videos",
                            "Seasonal / Festive Discount Banners",
                        ],
                    },
                ],
            })

        # AI Filmmaking branch
        if any("filmmaking" in req.lower() for req in content_reqs):
            branches.append({
                "id": "filmmaking_specs",
                "title": "AI Filmmaking & Cinematic Trajectory",
                "questions": [
                    {
                        "id": "filmmaking_duration",
                        "label": "Target narrative video runtime",
                        "type": "select",
                        "options": ["15s - 30s Teaser", "60s - 90s Commercial Trailer", "2 - 5 min Short Film", "Episodic Series"],
                    },
                    {
                        "id": "filmmaking_continuity",
                        "label": "Are character and face consistency across scenes strictly mandatory?",
                        "type": "boolean",
                        "default": True,
                    },
                ],
            })

        # Social Content branch
        if any("social" in req.lower() for req in content_reqs):
            branches.append({
                "id": "social_cadence",
                "title": "Social Distribution & Cadence",
                "questions": [
                    {
                        "id": "social_platforms",
                        "label": "Primary target platforms",
                        "type": "multi_select",
                        "options": ["Instagram Reels", "YouTube Shorts", "TikTok", "LinkedIn", "X / Twitter"],
                    },
                    {
                        "id": "social_frequency",
                        "label": "Estimated monthly creative asset volume",
                        "type": "select",
                        "options": ["1 - 4 assets / month", "5 - 12 assets / month", "15+ high volume assets / month"],
                    },
                ],
            })

        # Product Visualization branch
        if any("product visual" in req.lower() for req in content_reqs):
            branches.append({
                "id": "product_viz_readiness",
                "title": "Product Visualization Requirements",
                "questions": [
                    {
                        "id": "has_product_references",
                        "label": "Do you have existing physical 360 photos or 3D CAD files for the products?",
                        "type": "boolean",
                        "default": True,
                    },
                    {
                        "id": "product_lighting_style",
                        "label": "Preferred lighting & studio treatment",
                        "type": "select",
                        "options": ["Studio Softbox Clean", "Outdoor Natural Sunlight", "Dramatic Moody Contrast", "Neon Cyberpunk"],
                    },
                ],
            })

        # Audio & Voiceover branch
        if any("voice" in req.lower() or "audio" in req.lower() for req in content_reqs):
            branches.append({
                "id": "audio_voiceover_specs",
                "title": "Audio, Voice & Music Specifications",
                "questions": [
                    {
                        "id": "voice_languages",
                        "label": "Target voiceover languages / accents",
                        "type": "text",
                        "placeholder": "e.g. English (Indian accent), Hindi, US Neutral",
                    },
                    {
                        "id": "audio_separate_stems",
                        "label": "Do you require separate audio stem files (SFX, dialogue, music) for final mastering?",
                        "type": "boolean",
                        "default": True,
                    },
                ],
            })

        return branches

    async def get_or_create_session(self, brand_id: UUID) -> BrandSurveySessionResponse:
        """Retrieves existing active survey session or initializes a new draft."""
        session = await self.survey_repo.get_by_brand_id(brand_id)
        if session:
            return session

        return await self.survey_repo.save_session(
            brand_id=brand_id,
            current_step=0,
            responses={},
            is_completed=False,
        )

    async def save_progress(
        self,
        brand_id: UUID,
        current_step: int,
        responses: Dict[str, Any],
    ) -> BrandSurveySessionResponse:
        """Persists responses with save-and-resume capability."""
        return await self.survey_repo.save_session(
            brand_id=brand_id,
            current_step=current_step,
            responses=responses,
            is_completed=False,
        )

    async def complete_onboarding(
        self,
        brand_id: UUID,
        user_id: str,
        responses: Dict[str, Any],
    ) -> BrandDashboardOverviewResponse:
        """
        Finalizes onboarding: maps survey answers to organization profile and
        structured preferences, marks onboarding completed, and computes completeness.
        """
        # 1. Update brand organization profile fields
        org_type = responses.get("organization_type", "Consumer Brand")
        is_agency = "Agency" in org_type or "Studio" in org_type or responses.get("is_agency", False)

        profile_update = BrandProfileUpdate(
            company_name=responses.get("company_name"),
            organization_type=org_type,
            primary_industry=responses.get("primary_industry"),
            secondary_industries=responses.get("secondary_industries", []),
            contact_name=responses.get("contact_name"),
            website=responses.get("website"),
            description=responses.get("description"),
            team_size=responses.get("team_size"),
            location=responses.get("location"),
            is_agency=is_agency,
        )
        await brand_service.update_profile(brand_id, profile_update)

        # 2. Extract and upsert structured brand preferences
        preferences_data = BrandPreferencesBase(
            intended_uses=responses.get("intended_uses", []),
            content_requirements=responses.get("content_requirements", []),
            target_niches=responses.get("target_niches", []),
            preferred_formats=responses.get("preferred_formats", []),
            creative_styles=responses.get("creative_styles", []),
            style_description=responses.get("style_description"),
            intended_usage_channels=responses.get("intended_usage_channels", []),
            project_timeline=responses.get("project_timeline"),
            commercial_rights_required=responses.get("commercial_rights_required", True),
            exclusive_usage_required=responses.get("exclusive_usage_required", False),
            source_files_required=responses.get("source_files_required", False),
            budget_range=responses.get("budget_range"),
            engagement_type=responses.get("engagement_type"),
            adaptive_data={
                k: v for k, v in responses.items()
                if k not in [
                    "company_name", "organization_type", "primary_industry", "secondary_industries",
                    "contact_name", "website", "description", "team_size", "location", "is_agency",
                    "intended_uses", "content_requirements", "target_niches", "preferred_formats",
                    "creative_styles", "style_description", "intended_usage_channels", "project_timeline",
                    "commercial_rights_required", "exclusive_usage_required", "source_files_required",
                    "budget_range", "engagement_type",
                ]
            },
        )
        await self.pref_repo.upsert(brand_id, preferences_data)

        # 3. Mark brand profile as onboarding_completed = True
        await self.repo.update(brand_id, {"onboarding_completed": True})

        # 4. Mark survey session completed
        await self.survey_repo.save_session(
            brand_id=brand_id,
            current_step=8,
            responses=responses,
            is_completed=True,
        )

        # 5. Return updated dashboard overview
        return await brand_service.get_dashboard_overview(user_id)


brand_onboarding_service = BrandOnboardingService()
