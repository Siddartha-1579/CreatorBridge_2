"""Campaign brief domain service."""

from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.services.base import BaseService
from app.core.errors import NotFoundException, ValidationException, ForbiddenException
from app.repositories import brief_repository, BriefRepository
from app.schemas.brief import (
    CampaignBriefCreate,
    CampaignBriefUpdate,
    CampaignBriefResponse,
    BriefStatus,
    BriefValidationResult,
    DeliverableItem,
)


class BriefService(BaseService):
    """Business logic for Campaign Brief creation, validation, publication, and persistence."""

    def __init__(self, repo: Optional[BriefRepository] = None):
        super().__init__("brief")
        self.repo = repo or brief_repository

    async def get_brief_by_id(
        self, brief_id: UUID, current_user_id: Optional[str] = None
    ) -> CampaignBriefResponse:
        """Retrieves brief by ID, enforcing privacy for drafts."""
        brief = await self.repo.get_by_id(brief_id)
        if not brief:
            raise NotFoundException("Campaign Brief", brief_id)

        # If brief is draft or private, verify user is owning brand
        if brief.status != BriefStatus.PUBLISHED:
            if not current_user_id or str(brief.brand_id) != str(current_user_id):
                raise ForbiddenException("You do not have permission to view this unpublished brief")

        return brief

    async def list_briefs(self, skip: int = 0, limit: int = 20) -> List[CampaignBriefResponse]:
        """Lists public, published campaign briefs for creator discovery."""
        return await self.repo.list_published(skip=skip, limit=limit)

    async def list_by_brand(self, brand_id: str) -> List[CampaignBriefResponse]:
        """Lists all briefs belonging to an organization, including drafts."""
        return await self.repo.list_by_brand(brand_id)

    async def create_brief(
        self, brand_id: str, data: CampaignBriefCreate
    ) -> CampaignBriefResponse:
        """Creates a new campaign brief or draft for a brand."""
        now = datetime.now(timezone.utc)
        brief = CampaignBriefResponse(
            id=uuid4(),
            brand_id=brand_id,
            title=data.title.strip() if data.title else "Untitled Creative Brief",
            description=data.description,
            campaign_idea=data.campaign_idea,
            executive_summary=data.executive_summary,
            objectives=data.objectives,
            product_or_service=data.product_or_service,
            target_audience=data.target_audience,
            primary_message=data.primary_message,
            desired_cta=data.desired_cta,
            platforms=data.platforms,
            deliverables=data.deliverables,
            creative_direction=data.creative_direction,
            creator_capabilities=data.creator_capabilities,
            commercial_terms=data.commercial_terms,
            budget_cents=data.budget_cents or (data.commercial_terms.budget_cents if data.commercial_terms else None),
            start_date=data.start_date,
            deadline=data.deadline,
            required_tools=data.required_tools,
            ai_metadata=data.ai_metadata,
            is_public=data.is_public,
            status=data.status or BriefStatus.DRAFT,
            created_at=now,
            updated_at=now,
        )
        return await self.repo.create(brief)

    async def update_brief(
        self, brief_id: UUID, brand_id: str, data: CampaignBriefUpdate
    ) -> CampaignBriefResponse:
        """Updates an existing campaign brief, checking ownership."""
        existing = await self.repo.get_by_id(brief_id)
        if not existing:
            raise NotFoundException("Campaign Brief", brief_id)

        if str(existing.brand_id) != str(brand_id):
            raise ForbiddenException("You do not have permission to modify this brief")

        update_dict = data.model_dump(exclude_unset=True)
        if "title" in update_dict and update_dict["title"]:
            update_dict["title"] = update_dict["title"].strip()

        updated = await self.repo.update(brief_id, update_dict)
        if not updated:
            raise NotFoundException("Campaign Brief", brief_id)
        return updated

    async def publish_brief(self, brief_id: UUID, brand_id: str) -> CampaignBriefResponse:
        """Validates blocking requirements and publishes the campaign brief to the marketplace."""
        existing = await self.repo.get_by_id(brief_id)
        if not existing:
            raise NotFoundException("Campaign Brief", brief_id)

        if str(existing.brand_id) != str(brand_id):
            raise ForbiddenException("You do not have permission to publish this brief")

        # Validate publication readiness
        val_result = self.validate_brief(existing)
        if not val_result.can_publish:
            errors_str = "; ".join(val_result.blocking_errors)
            raise ValidationException(f"Cannot publish brief due to missing requirements: {errors_str}")

        updated = await self.repo.update(brief_id, {
            "status": BriefStatus.PUBLISHED,
            "is_public": True,
        })
        return updated  # type: ignore

    def validate_brief(
        self, brief: Any
    ) -> BriefValidationResult:
        """
        Validates brief completeness. Distinguishes between blocking errors
        (which prevent publishing) and warnings (which prompt improvement).
        """
        blocking: List[str] = []
        warnings: List[str] = []

        title = getattr(brief, "title", "")
        if not title or title.strip() == "" or title.strip() == "Untitled Creative Brief":
            blocking.append("Campaign title is required before publishing.")

        description = getattr(brief, "description", "")
        exec_summary = getattr(brief, "executive_summary", "")
        if not description.strip() and not (exec_summary and exec_summary.strip()):
            blocking.append("A project description or executive summary is required.")

        deliverables: List[DeliverableItem] = getattr(brief, "deliverables", []) or []
        if len(deliverables) == 0:
            blocking.append("At least one deliverable must be specified.")
        else:
            for idx, d in enumerate(deliverables):
                if d.quantity <= 0:
                    blocking.append(f"Deliverable #{idx + 1} has an invalid quantity ({d.quantity}).")
                if not d.content_type:
                    blocking.append(f"Deliverable #{idx + 1} is missing a content type.")

        # Non-blocking warnings
        objectives = getattr(brief, "objectives", [])
        if not objectives:
            warnings.append("Selecting at least one campaign objective helps creators tailor proposals.")

        target_audience = getattr(brief, "target_audience", "")
        if not target_audience or len(target_audience.strip()) < 5:
            warnings.append("Specifying a target audience improves creator visual targeting.")

        budget_cents = getattr(brief, "budget_cents", None)
        if not budget_cents:
            warnings.append("A specified budget range attracts top-tier creators faster.")

        can_pub = len(blocking) == 0
        return BriefValidationResult(
            is_valid=can_pub,
            can_publish=can_pub,
            blocking_errors=blocking,
            warnings=warnings,
        )


brief_service = BriefService()
