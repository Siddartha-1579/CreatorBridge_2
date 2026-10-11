from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone
import httpx
from app.services.base import BaseService
from app.core.config import settings
from app.core.errors import NotFoundException, ValidationException, ForbiddenException, ConflictException, IntegrationException
from app.repositories import brief_repository, BriefRepository
from app.schemas.brief import (
    CampaignBriefCreate,
    CampaignBriefUpdate,
    CampaignBriefResponse,
    BriefStatus,
    BriefValidationResult,
    DeliverableItem,
    GenerateCoverImageRequest,
    GenerateCoverImageResponse,
    CampaignApplicationCreate,
    CampaignApplicationUpdate,
    CampaignApplicationResponse,
    ApplicationStatus,
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

    async def list_briefs(
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
        """Lists public, published campaign briefs for creator discovery with optional filters."""
        return await self.repo.list_published(
            skip=skip,
            limit=limit,
            content_type=content_type,
            category=category,
            min_budget_cents=min_budget_cents,
            max_budget_cents=max_budget_cents,
            tool=tool,
            search=search,
        )

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
            brand_or_product_name=data.brand_or_product_name,
            product_or_service=data.product_or_service,
            product_description=data.product_description,
            campaign_idea=data.campaign_idea,
            executive_summary=data.executive_summary,
            objectives=data.objectives,
            primary_objective=data.primary_objective,
            target_audience=data.target_audience,
            target_market=data.target_market,
            preferred_language=data.preferred_language,
            campaign_category=data.campaign_category,
            primary_message=data.primary_message,
            desired_cta=data.desired_cta,
            platforms=data.platforms,
            deliverables=data.deliverables,
            creative_direction=data.creative_direction,
            creator_capabilities=data.creator_capabilities,
            commercial_terms=data.commercial_terms,
            sections=data.sections or {},
            budget_cents=data.budget_cents or (data.commercial_terms.budget_cents if data.commercial_terms else None),
            start_date=data.start_date,
            deadline=data.deadline,
            required_tools=data.required_tools,
            ai_metadata=data.ai_metadata,
            cover_image_url=data.cover_image_url,
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

        description = getattr(brief, "description", "") or ""
        exec_summary = getattr(brief, "executive_summary", "") or ""
        campaign_idea = getattr(brief, "campaign_idea", "") or ""
        product_desc = getattr(brief, "product_description", "") or ""
        if not description.strip() and not exec_summary.strip() and not campaign_idea.strip() and not product_desc.strip():
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

    async def generate_cover_image(
        self,
        brief_id: UUID,
        brand_id: str,
        request: GenerateCoverImageRequest,
    ) -> GenerateCoverImageResponse:
        """Synthesizes a visual campaign cover image using AI provider and attaches it to the brief."""
        existing = await self.repo.get_by_id(brief_id)
        if not existing:
            raise NotFoundException("Campaign Brief", brief_id)
        if str(existing.brand_id) != str(brand_id):
            raise ForbiddenException("You do not have permission to modify this brief")

        # Synthesize prompt from brief context
        prompt_parts = []
        if request.custom_prompt and request.custom_prompt.strip():
            prompt_parts.append(request.custom_prompt.strip())
        else:
            title = existing.title or "Creative Campaign"
            product = existing.product_or_service or existing.brand_or_product_name or ""
            idea = existing.campaign_idea or existing.executive_summary or existing.description or ""
            cd = existing.creative_direction
            style = cd.style if cd and cd.style else (request.style_preset or "Cinematic commercial photography")
            mood = cd.mood if cd and cd.mood else "modern, premium, authentic"
            prompt_parts.append(f"Editorial promotional campaign cover photo for '{title}'.")
            if product:
                prompt_parts.append(f"Product focus: {product}.")
            if idea:
                prompt_parts.append(f"Visual concept: {idea[:180]}.")
            prompt_parts.append(f"Style: {style}, {mood}, professional 8k advertising lighting, clean composition.")

        final_prompt = " ".join(prompt_parts)

        # Call AI provider gateway for image generation
        from app.integrations.ai.gateway import ai_gateway
        from app.integrations.ai.base import ImageGenerationRequest

        dims = {"16:9": (1792, 1024), "1:1": (1024, 1024), "9:16": (1024, 1792)}.get(request.aspect_ratio, (1792, 1024))
        img_res = await ai_gateway.generate_image(
            ImageGenerationRequest(
                prompt=final_prompt,
                aspect_ratio=request.aspect_ratio,
                width=dims[0],
                height=dims[1],
            )
        )

        image_url = img_res.image_urls[0] if img_res.image_urls else ""
        if not image_url:
            raise IntegrationException("Image Generation", "Failed to synthesize visual asset from provider.")

        # Persist cover image URL to campaign brief
        await self.repo.update(brief_id, {"cover_image_url": image_url})

        return GenerateCoverImageResponse(
            image_url=image_url,
            prompt_used=final_prompt,
            model=img_res.model or "dall-e-3",
            provider=img_res.provider or "openai",
            saved_to_brief=True,
        )

    async def apply_to_brief(
        self,
        brief_id: UUID,
        creator_id: str,
        data: CampaignApplicationCreate,
    ) -> CampaignApplicationResponse:
        """Allows a creator to submit an application/proposal to an active published campaign."""
        existing = await self.repo.get_by_id(brief_id)
        if not existing:
            raise NotFoundException("Campaign Brief", brief_id)
        if existing.status != BriefStatus.PUBLISHED:
            raise ValidationException("Cannot apply to an unpublished campaign brief.")

        # Check for existing duplicate application
        prev = await self.repo.get_application_by_brief_and_creator(str(brief_id), str(creator_id))
        if prev:
            raise ConflictException("You have already submitted an application for this campaign brief.")

        now = datetime.now(timezone.utc)
        app_entity = CampaignApplicationResponse(
            id=uuid4(),
            brief_id=str(brief_id),
            creator_id=str(creator_id),
            brand_id=str(existing.brand_id),
            proposed_rate_cents=data.proposed_rate_cents or existing.budget_cents,
            pitch=data.pitch,
            relevant_skills=data.relevant_skills,
            relevant_tools=data.relevant_tools,
            portfolio_item_ids=data.portfolio_item_ids,
            estimated_days=data.estimated_days,
            status=ApplicationStatus.PENDING,
            brief_title=existing.title,
            created_at=now,
            updated_at=now,
        )
        return await self.repo.create_application(app_entity)

    async def list_applications_for_brief(
        self,
        brief_id: UUID,
        brand_id: str,
    ) -> List[CampaignApplicationResponse]:
        """Lists all applications submitted for a brand's campaign brief."""
        existing = await self.repo.get_by_id(brief_id)
        if not existing:
            raise NotFoundException("Campaign Brief", brief_id)
        if str(existing.brand_id) != str(brand_id):
            raise ForbiddenException("You do not have permission to view applications for this brief.")
        return await self.repo.list_applications_for_brief(str(brief_id))

    async def list_my_applications(self, creator_id: str) -> List[CampaignApplicationResponse]:
        """Lists all applications submitted by the authenticated creator."""
        return await self.repo.list_applications_for_creator(str(creator_id))

    async def update_application_status(
        self,
        application_id: UUID,
        brand_id: str,
        data: CampaignApplicationUpdate,
    ) -> CampaignApplicationResponse:
        """Allows a brand to accept, shortlist, or reject an application, initializing a project on acceptance."""
        app = await self.repo.get_application_by_id(application_id)
        if not app:
            raise NotFoundException("Campaign Application", application_id)
        if str(app.brand_id) != str(brand_id):
            raise ForbiddenException("You do not have permission to modify this application.")

        updated = await self.repo.update_application_status(application_id, data.status)
        if not updated:
            raise NotFoundException("Campaign Application", application_id)

        # If application was accepted, automatically create / seed the project workspace
        if data.status == ApplicationStatus.ACCEPTED:
            from app.services.project_service import project_service
            from app.schemas.project import ProjectWorkspaceCreate
            brief = await self.repo.get_by_id(UUID(app.brief_id))
            milestones = []
            if brief and brief.deliverables:
                for idx, d in enumerate(brief.deliverables):
                    ctype = d.content_type.value if hasattr(d.content_type, "value") else str(d.content_type)
                    milestones.append({
                        "id": f"ms-{idx+1}",
                        "title": f"Deliverable #{idx+1}: {d.quantity}x {ctype}",
                        "amount_cents": (app.proposed_rate_cents or 10000) // max(len(brief.deliverables), 1),
                        "status": "PENDING",
                    })
            await project_service.create_workspace(
                ProjectWorkspaceCreate(
                    title=f"Collaboration: {app.brief_title or (brief.title if brief else 'Campaign Project')}",
                    brief_id=str(app.brief_id),
                    brand_id=app.brand_id,
                    creator_id=app.creator_id,
                    agreed_budget_cents=app.proposed_rate_cents or (brief.budget_cents if brief else 10000),
                    due_date=brief.deadline if brief else None,
                    deliverables=[
                        {
                            "id": f"del-{idx+1}",
                            "title": f"{d.quantity}x {d.content_type.value if hasattr(d.content_type, 'value') else str(d.content_type)}",
                            "type": d.content_type.value if hasattr(d.content_type, "value") else str(d.content_type),
                            "status": "NOT_STARTED",
                        }
                        for idx, d in enumerate(brief.deliverables if brief else [])
                    ],
                    milestones=milestones,
                )
            )

        return updated


brief_service = BriefService()

