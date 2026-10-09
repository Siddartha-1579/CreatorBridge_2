"""Creator domain service."""

from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from app.services.base import BaseService
from app.core.errors import NotFoundException, ConflictException, ForbiddenException
from app.repositories import creator_repository, CreatorRepository
from app.schemas.creator import (
    CreatorProfileCreate,
    CreatorProfileUpdate,
    CreatorProfileResponse,
    CreatorProfileDetailResponse,
    ProfileCompletenessResponse,
    ProfileCompletenessItem,
    CreatorLevel,
)
from app.services.portfolio_service import portfolio_service
from app.services.verification_service import verification_service


class CreatorService(BaseService):
    """Business logic for Creator profiles, completeness, and trust signals."""

    def __init__(self, repo: Optional[CreatorRepository] = None):
        super().__init__("creator")
        self.repo = repo or creator_repository

    async def get_creator_by_id(self, creator_id: UUID) -> CreatorProfileResponse:
        creator = await self.repo.get_by_id(creator_id)
        if not creator:
            raise NotFoundException("Creator", creator_id)
        return creator

    async def get_creator_by_handle(self, handle: str) -> CreatorProfileResponse:
        creator = await self.repo.get_by_handle(handle)
        if not creator:
            raise NotFoundException("Creator handle", handle)
        return creator

    async def list_creators(self, skip: int = 0, limit: int = 20) -> List[CreatorProfileResponse]:
        return await self.repo.list_all(skip=skip, limit=limit)

    async def get_profile_by_user_id(
        self,
        user_id: str,
        user_email: Optional[str] = None,
    ) -> CreatorProfileResponse:
        """Retrieves creator profile by authenticated user ID or creates a baseline draft."""
        profile = await self.repo.get_by_user_id(user_id)
        if profile:
            return profile

        # Generate default handle and full name
        email_prefix = user_email.split("@")[0] if user_email else f"creator_{user_id[:8]}"
        base_handle = email_prefix.replace(".", "_").lower()
        full_name = email_prefix.replace(".", " ").capitalize()

        # Check handle uniqueness
        existing = await self.repo.get_by_handle(base_handle)
        if existing:
            base_handle = f"{base_handle}_{str(uuid4())[:4]}"

        new_profile = CreatorProfileResponse(
            id=uuid4(),
            user_id=user_id,
            full_name=full_name,
            handle=base_handle,
            level=CreatorLevel.EXPLORER,
            level_name="AI Explorer",
            reputation_score=0.00,
            is_verified=False,
            assessment_completed=False,
            profile_completeness_pct=20,
            primary_specialization=None,
            skills=[],
            ai_tools=[],
            content_types=[],
            target_niches=[],
            preferred_formats=[],
            social_links={},
        )
        return await self.repo.create(new_profile)

    async def update_profile_by_user_id(
        self,
        user_id: str,
        data: CreatorProfileUpdate,
    ) -> CreatorProfileResponse:
        """Updates creator profile attributes while strictly guarding calculated fields."""
        profile = await self.get_profile_by_user_id(user_id)

        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}

        # Guard against tampering with server-calculated fields
        protected_fields = ["id", "user_id", "level", "level_name", "reputation_score", "is_verified", "assessment_completed"]
        for field in protected_fields:
            update_dict.pop(field, None)

        # Apply update
        updated = await self.repo.update(profile.id, update_dict)
        if not updated:
            raise NotFoundException("Creator", profile.id)

        # Recalculate completeness
        completeness = await self.calculate_completeness(updated.id)
        if updated.profile_completeness_pct != completeness.percentage:
            updated = await self.repo.update(updated.id, {"profile_completeness_pct": completeness.percentage})

        return updated

    async def update_profile(
        self,
        creator_id: UUID,
        data: CreatorProfileUpdate,
    ) -> CreatorProfileResponse:
        """Legacy updater by creator_id."""
        existing = await self.repo.get_by_id(creator_id)
        if not existing:
            raise NotFoundException("Creator", creator_id)
        return await self.update_profile_by_user_id(existing.user_id, data)

    async def calculate_completeness(self, creator_id: UUID) -> ProfileCompletenessResponse:
        """
        Dynamically calculates profile completeness across 10 checklist criteria.
        Returns percentage (0-100), checklist items with hints, and prioritized tips.
        """
        creator = await self.repo.get_by_id(creator_id)
        if not creator:
            raise NotFoundException("Creator", creator_id)

        # Fetch projects to check portfolio density
        projects = await portfolio_service.list_by_creator(creator_id)
        has_portfolio = len(projects) > 0
        has_workflow = any(len(p.workflow_stages) > 0 or (p.workflow_summary and len(p.workflow_summary) > 20) for p in projects)

        items: List[ProfileCompletenessItem] = [
            ProfileCompletenessItem(
                key="headline",
                label="Professional Headline",
                completed=bool(creator.headline and len(creator.headline.strip()) >= 5),
                impact_pct=10,
                action_hint="Add a punchy 1-line specialty (e.g. 'Senior AI Commercial Director & Prompt Engineer')",
            ),
            ProfileCompletenessItem(
                key="bio",
                label="Creator Biography",
                completed=bool(creator.bio and len(creator.bio.strip()) >= 30),
                impact_pct=10,
                action_hint="Write a bio with at least 30 characters detailing your production experience",
            ),
            ProfileCompletenessItem(
                key="primary_specialization",
                label="Primary Specialization",
                completed=bool(creator.primary_specialization and len(creator.primary_specialization.strip()) > 0),
                impact_pct=10,
                action_hint="Select your primary creative discipline (e.g. Photorealistic Video, Concept Art)",
            ),
            ProfileCompletenessItem(
                key="ai_tools",
                label="AI Tools & Platforms",
                completed=bool(creator.ai_tools and len(creator.ai_tools) >= 1),
                impact_pct=10,
                action_hint="Add the generative AI tools you use daily (e.g. Midjourney, Runway, ComfyUI)",
            ),
            ProfileCompletenessItem(
                key="skills",
                label="Creative Skills",
                completed=bool(creator.skills and len(creator.skills) >= 2),
                impact_pct=10,
                action_hint="Add at least 2 relevant creative or technical skills",
            ),
            ProfileCompletenessItem(
                key="preferred_formats",
                label="Preferred Media Formats",
                completed=bool(creator.preferred_formats and len(creator.preferred_formats) >= 1),
                impact_pct=10,
                action_hint="Select aspect ratios and formats you deliver (e.g. 16:9 4K, 9:16 Vertical Reel)",
            ),
            ProfileCompletenessItem(
                key="target_niches",
                label="Target Commercial Niches",
                completed=bool(creator.target_niches and len(creator.target_niches) >= 1),
                impact_pct=10,
                action_hint="Choose commercial industries you create for (e.g. Fashion, Tech, Gaming)",
            ),
            ProfileCompletenessItem(
                key="location_or_social",
                label="Location & Social Links",
                completed=bool(creator.location or (creator.social_links and len(creator.social_links) > 0)),
                impact_pct=10,
                action_hint="Add your location and at least one social / portfolio link",
            ),
            ProfileCompletenessItem(
                key="portfolio_project",
                label="At least 1 Portfolio Showcase",
                completed=has_portfolio,
                impact_pct=10,
                action_hint="Upload or publish at least one showcase project to your AI portfolio",
            ),
            ProfileCompletenessItem(
                key="workflow_details",
                label="Documented AI Production Workflow",
                completed=has_workflow,
                impact_pct=10,
                action_hint="Document generation stages and prompt pipeline in at least one portfolio project",
            ),
        ]

        total_pct = sum(item.impact_pct for item in items if item.completed)

        tips = [item.action_hint for item in items if not item.completed][:3]
        if not tips:
            tips.append("Your profile is 100% complete and highly visible to premier brand briefs!")

        return ProfileCompletenessResponse(
            percentage=total_pct,
            items=items,
            improvement_tips=tips,
        )

    async def get_public_profile(self, identifier: str) -> CreatorProfileDetailResponse:
        """
        Retrieves full public creator profile by UUID or handle.
        Combines profile, public portfolio projects, verified badges, and trust signals.
        """
        creator: Optional[CreatorProfileResponse] = None
        try:
            creator_uuid = UUID(identifier)
            creator = await self.repo.get_by_id(creator_uuid)
        except ValueError:
            creator = await self.repo.get_by_handle(identifier)

        if not creator:
            raise NotFoundException("Creator", identifier)

        # Get badges & public portfolio
        badges = await verification_service.get_badges_for_creator(creator.id)
        public_projects = await portfolio_service.list_public_by_creator(creator.id)

        # Extract dimension scores from metadata if available, or generate standard scores
        dimension_scores = {
            "Prompt Engineering": 88.0,
            "Tool Proficiency": 92.0,
            "Workflow Consistency": 85.0,
            "Commercial Suitability": 90.0,
            "Creative Direction": 87.0,
        }
        if creator.metadata and "dimension_scores" in creator.metadata:
            dimension_scores = creator.metadata["dimension_scores"]

        # Generate trust signals strictly based on verified facts
        trust_signals = verification_service.generate_trust_signals(
            creator=creator,
            badges=badges,
            portfolio_count=len(public_projects),
        )

        return CreatorProfileDetailResponse(
            **creator.model_dump(),
            verification_badges=badges,
            dimension_scores=dimension_scores,
            portfolio_count=len(public_projects),
            trust_signals=trust_signals,
        )


creator_service = CreatorService()
