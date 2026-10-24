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
    CreativeDirection,
    CreatorCapabilityRequirements,
    CommercialTerms,
    BriefAIMetadata,
    GenerateCoverImageRequest,
    GenerateCoverImageResponse,
    CampaignApplicationCreate,
    CampaignApplicationUpdate,
    CampaignApplicationResponse,
    ApplicationStatus,
    ClipSubmissionCreate,
    ClipSubmissionReview,
    ClipSubmissionResponse,
    SubmissionStatus,
    CampaignParticipantResponse,
    CampaignAnalyticsResponse,
    BrandCommunityPostCreate,
    BrandCommunityPostResponse,
)


class BriefService(BaseService):
    """Business logic for Campaign Brief creation, validation, publication, and persistence."""

    def __init__(self, repo: Optional[BriefRepository] = None):
        super().__init__("brief")
        self.repo = repo or brief_repository

    def _is_brand_owner(self, brief_brand_id: str, current_user_id: str) -> bool:
        """Determines if current_user_id owns brief_brand_id (handling user_id, brand_profile.id, and demo aliases)."""
        if not brief_brand_id or not current_user_id:
            return False
        if str(brief_brand_id) == str(current_user_id):
            return True
        # Demo Lumina Skincare parity alias check
        lumina_aliases = {"usr_lumina_skincare", "00000000-0000-0000-0000-000000000002", "00000000-0000-0000-0000-000000000010"}
        if str(brief_brand_id) in lumina_aliases and str(current_user_id) in lumina_aliases:
            return True
        # Demo Terra Outdoor Gear parity alias check
        terra_aliases = {"usr_terra_outdoor", "00000000-0000-0000-0000-000000000011"}
        if str(brief_brand_id) in terra_aliases and str(current_user_id) in terra_aliases:
            return True
        from app.core.db import get_db_connection
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id FROM brand_profiles WHERE (id = ? OR user_id = ?) AND (user_id = ? OR id = ?)",
                (str(brief_brand_id), str(brief_brand_id), str(current_user_id), str(current_user_id))
            )
            return cursor.fetchone() is not None

    def _is_creator_owner(self, creator_id: str, current_user_id: str) -> bool:
        """Determines if current_user_id owns creator_id (handling user_id, creator_profile.id, and demo aliases)."""
        if not creator_id or not current_user_id:
            return False
        if str(creator_id) == str(current_user_id):
            return True
        # Demo Elena Rostova parity alias check
        elena_aliases = {"usr_elena_rostova", "00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000021"}
        if str(creator_id) in elena_aliases and str(current_user_id) in elena_aliases:
            return True
        from app.core.db import get_db_connection
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id FROM creator_profiles WHERE (id = ? OR user_id = ?) AND (user_id = ? OR id = ?)",
                (str(creator_id), str(creator_id), str(current_user_id), str(current_user_id))
            )
            return cursor.fetchone() is not None

    async def get_brief_by_id(
        self, brief_id: UUID, current_user_id: Optional[str] = None
    ) -> CampaignBriefResponse:
        """Retrieves brief by ID, enforcing privacy for drafts."""
        brief = await self.repo.get_by_id(brief_id)
        if not brief:
            raise NotFoundException("Campaign Brief", brief_id)

        # If brief is draft or private, verify user is owning brand
        if brief.status != BriefStatus.PUBLISHED:
            if not current_user_id or not self._is_brand_owner(brief.brand_id, current_user_id):
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
        """Updates an existing campaign brief, checking ownership, or upserts if creating with known ID."""
        existing = await self.repo.get_by_id(brief_id)
        if not existing:
            # Upsert fallback: allows draft briefs with pre-generated or client-referenced IDs
            # (e.g. c3e6063a-5bab-4a0c-acb5-09505594026f) to be safely created and persisted.
            now = datetime.now(timezone.utc)
            update_dict = data.model_dump(exclude_unset=True)
            title = update_dict.get("title") or "Untitled Creative Brief"
            new_brief = CampaignBriefResponse(
                id=brief_id,
                brand_id=brand_id,
                title=title.strip() if title else "Untitled Creative Brief",
                description=update_dict.get("description", update_dict.get("executive_summary", "")),
                brand_or_product_name=update_dict.get("brand_or_product_name"),
                product_or_service=update_dict.get("product_or_service"),
                product_description=update_dict.get("product_description"),
                campaign_idea=update_dict.get("campaign_idea"),
                executive_summary=update_dict.get("executive_summary"),
                objectives=update_dict.get("objectives", []),
                primary_objective=update_dict.get("primary_objective"),
                target_audience=update_dict.get("target_audience"),
                target_market=update_dict.get("target_market"),
                preferred_language=update_dict.get("preferred_language", "English"),
                campaign_category=update_dict.get("campaign_category"),
                primary_message=update_dict.get("primary_message"),
                desired_cta=update_dict.get("desired_cta"),
                platforms=update_dict.get("platforms", []),
                deliverables=update_dict.get("deliverables", []),
                creative_direction=update_dict.get("creative_direction") or CreativeDirection(),
                creator_capabilities=update_dict.get("creator_capabilities") or CreatorCapabilityRequirements(),
                commercial_terms=update_dict.get("commercial_terms") or CommercialTerms(),
                sections=update_dict.get("sections", {}),
                budget_cents=update_dict.get("budget_cents"),
                start_date=update_dict.get("start_date"),
                deadline=update_dict.get("deadline"),
                required_tools=update_dict.get("required_tools", []),
                ai_metadata=update_dict.get("ai_metadata") or BriefAIMetadata(),
                cover_image_url=update_dict.get("cover_image_url"),
                is_public=update_dict.get("is_public", False),
                status=update_dict.get("status") or BriefStatus.DRAFT,
                created_at=now,
                updated_at=now,
            )
            return await self.repo.create(new_brief)

        if not self._is_brand_owner(existing.brand_id, brand_id):
            raise ForbiddenException("You do not have permission to modify this brief")

        update_dict = data.model_dump(exclude_unset=True)
        if "title" in update_dict and update_dict["title"]:
            update_dict["title"] = update_dict["title"].strip()

        # Preserve existing publication timestamp if campaign was already published
        if existing.published_at and "published_at" not in update_dict:
            update_dict["published_at"] = existing.published_at.isoformat() if hasattr(existing.published_at, "isoformat") else str(existing.published_at)

        updated = await self.repo.update(brief_id, update_dict)
        if not updated:
            raise NotFoundException("Campaign Brief", brief_id)
        return updated

    async def publish_brief(self, brief_id: UUID, brand_id: str) -> CampaignBriefResponse:
        """Validates blocking requirements and publishes the campaign brief to the marketplace."""
        existing = await self.repo.get_by_id(brief_id)
        if not existing:
            raise NotFoundException("Campaign Brief", brief_id)

        if not self._is_brand_owner(existing.brand_id, brand_id):
            raise ForbiddenException("You do not have permission to publish this brief")

        # Validate publication readiness
        val_result = self.validate_brief(existing)
        if not val_result.can_publish:
            errors_str = "; ".join(val_result.blocking_errors)
            raise ValidationException(f"Cannot publish brief due to missing requirements: {errors_str}")

        now = datetime.now(timezone.utc)
        pub_at = existing.published_at or now

        updated = await self.repo.update(brief_id, {
            "status": BriefStatus.PUBLISHED,
            "is_public": True,
            "published_at": pub_at.isoformat() if hasattr(pub_at, "isoformat") else str(pub_at),
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
        if not self._is_brand_owner(existing.brand_id, brand_id):
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
        if not self._is_brand_owner(existing.brand_id, brand_id):
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
        if not self._is_brand_owner(app.brand_id, brand_id):
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

    async def join_campaign(self, brief_id: UUID, creator_id: str) -> bool:
        brief = await self.repo.get_by_id(brief_id)
        if not brief:
            raise NotFoundException("Campaign", brief_id)
        if brief.status != BriefStatus.PUBLISHED:
            raise ValidationException("Campaign is not accepting new participants")
        return await self.repo.join_campaign(str(brief_id), creator_id)

    async def get_participation(self, brief_id: UUID, creator_id: str) -> Optional[CampaignParticipantResponse]:
        return await self.repo.get_campaign_participant(str(brief_id), creator_id)

    async def list_campaign_participants(
        self, brief_id: UUID, current_user_id: str, is_brand: bool = False
    ) -> List[CampaignParticipantResponse]:
        brief = await self.repo.get_by_id(brief_id)
        if not brief:
            raise NotFoundException("Campaign", brief_id)
        if brief.status != BriefStatus.PUBLISHED:
            if not self._is_brand_owner(brief.brand_id, current_user_id):
                raise ForbiddenException("Access to unpublished campaign participants requires ownership")

        all_parts = await self.repo.list_campaign_participants(str(brief_id))
        if is_brand:
            if not self._is_brand_owner(brief.brand_id, current_user_id):
                raise ForbiddenException("Only the campaign brand owner can view participant identities for this campaign")
            return all_parts

        # Creators can ONLY see their own participation record
        return [
            p for p in all_parts
            if self._is_creator_owner(p.creator_id, current_user_id)
        ]

    async def submit_clip(
        self, brief_id: UUID, creator_id: str, data: ClipSubmissionCreate
    ) -> ClipSubmissionResponse:
        brief = await self.repo.get_by_id(brief_id)
        if not brief:
            raise NotFoundException("Campaign", brief_id)
        if brief.status != BriefStatus.PUBLISHED:
            raise ValidationException("Campaign is not currently accepting submissions")

        await self.repo.join_campaign(str(brief_id), creator_id)

        sub = await self.repo.create_clip_submission(
            campaign_id=str(brief_id),
            creator_id=creator_id,
            brand_id=str(brief.brand_id),
            clip_url=data.clip_url,
            platform=data.platform,
            title=data.title,
            description=data.description,
            ai_tools=data.ai_tools,
            initial_views=data.initial_views or 0,
        )
        if not sub:
            raise ValidationException("Failed to register clip submission")
        return sub

    async def list_submissions(
        self, brief_id: UUID, current_user_id: str, is_brand: bool
    ) -> List[ClipSubmissionResponse]:
        brief = await self.repo.get_by_id(brief_id)
        if not brief:
            raise NotFoundException("Campaign", brief_id)
        all_subs = await self.repo.list_submissions_for_campaign(str(brief_id))
        if is_brand:
            if not self._is_brand_owner(brief.brand_id, current_user_id):
                raise ForbiddenException("Only the campaign brand owner can view all submissions for this campaign")
            return all_subs
        return [s for s in all_subs if self._is_creator_owner(s.creator_id, current_user_id)]

    async def list_creator_submissions(self, creator_id: str) -> List[ClipSubmissionResponse]:
        return await self.repo.list_creator_submissions(creator_id)

    async def review_submission(
        self, submission_id: UUID, brand_id: str, data: ClipSubmissionReview
    ) -> ClipSubmissionResponse:
        sub = await self.repo.get_submission_by_id(submission_id)
        if not sub:
            raise NotFoundException("Clip Submission", submission_id)

        if not self._is_brand_owner(sub.brand_id, brand_id):
            raise ForbiddenException("Only the campaign brand owner can review submissions")

        if data.verified_views is not None and data.verified_views < 0:
            raise ValidationException("Verified views cannot be negative")

        if data.payout_cents is not None and data.payout_cents < 0:
            raise ValidationException("Payout amount cannot be negative")

        updated = await self.repo.review_clip_submission(
            submission_id=submission_id,
            brand_id=brand_id,
            status=data.status,
            feedback=data.feedback,
            verified_views=data.verified_views,
            payout_cents=data.payout_cents,
        )
        if not updated:
            raise ValidationException("Failed to update submission review")

        # Award verified achievement points if deliverable was approved
        if data.status == SubmissionStatus.APPROVED:
            try:
                from app.services.achievement_service import achievement_service
                brief = None
                try:
                    brief = await self.repo.get_by_id(UUID(sub.campaign_id))
                except Exception:
                    pass

                deadline_at = brief.deadline if brief and hasattr(brief, "deadline") else None
                q_score = data.quality_score if data.quality_score is not None else 85.0
                comp_score = data.brief_compliance_score if data.brief_compliance_score is not None else 85.0
                collab_score = data.collaboration_score if data.collaboration_score is not None else 85.0

                achievement_service.record_verified_completion(
                    creator_id=str(sub.creator_id),
                    engagement_id=f"clip_sub_{sub.id}",
                    verified_by=str(brand_id),
                    completed_at=datetime.now(timezone.utc).isoformat(),
                    deadline_at=deadline_at,
                    quality_score=q_score,
                    brief_compliance_score=comp_score,
                    collaboration_score=collab_score,
                    accepted=True,
                )
            except Exception as e:
                self.logger.warning(f"Failed to record achievement points for approved submission {submission_id}: {e}")

        return updated

    async def get_analytics(
        self, brief_id: UUID, brand_id: Optional[str] = None
    ) -> CampaignAnalyticsResponse:
        brief = await self.repo.get_by_id(brief_id)
        if not brief:
            raise NotFoundException("Campaign", brief_id)
        if not brand_id or not self._is_brand_owner(brief.brand_id, brand_id):
            raise ForbiddenException("Access to internal campaign analytics requires campaign ownership")
        analytics = await self.repo.get_campaign_analytics(str(brief_id), brand_id)
        if not analytics:
            raise NotFoundException("Analytics for Campaign", brief_id)
        return analytics

    async def pause_brief(self, brief_id: UUID, brand_id: str) -> CampaignBriefResponse:
        brief = await self.repo.get_by_id(brief_id)
        if not brief:
            raise NotFoundException("Campaign", brief_id)
        if not self._is_brand_owner(brief.brand_id, brand_id):
            raise ForbiddenException("Only the campaign owner can pause campaigns")
        return await self.repo.update(brief_id, {"status": BriefStatus.PAUSED.value})

    async def resume_brief(self, brief_id: UUID, brand_id: str) -> CampaignBriefResponse:
        brief = await self.repo.get_by_id(brief_id)
        if not brief:
            raise NotFoundException("Campaign", brief_id)
        if not self._is_brand_owner(brief.brand_id, brand_id):
            raise ForbiddenException("Only the campaign owner can resume campaigns")
        return await self.repo.update(brief_id, {"status": BriefStatus.PUBLISHED.value})

    async def create_community_post(
        self, brand_id: str, data: BrandCommunityPostCreate
    ) -> BrandCommunityPostResponse:
        post = await self.repo.create_community_post(
            brand_id=brand_id,
            title=data.title,
            content=data.content,
            category=data.category,
            pinned=data.pinned,
            media_url=data.media_url,
        )
        if not post:
            raise ValidationException("Failed to publish community post")
        return post

    async def list_community_posts(
        self, brand_id: Optional[str] = None, category: Optional[str] = None
    ) -> List[BrandCommunityPostResponse]:
        return await self.repo.list_community_posts(brand_id=brand_id, category=category)

    async def delete_community_post(self, post_id: UUID, brand_id: str) -> bool:
        post = await self.repo.get_community_post_by_id(post_id)
        if not post:
            raise NotFoundException("Community Post", post_id)
        if not self._is_brand_owner(post.brand_id, brand_id):
            raise ForbiddenException("You do not have permission to delete another brand's community post")
        success = await self.repo.delete_community_post(post_id=post_id, brand_id=brand_id)
        if not success:
            raise NotFoundException("Community Post", post_id)
        return True

    async def like_community_post(self, post_id: UUID) -> int:
        return await self.repo.like_community_post(post_id=post_id)



brief_service = BriefService()

