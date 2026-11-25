"""Business logic and deterministic state machine for CreatorBridge Engagement Management."""

from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.services.base import BaseService
from app.core.errors import NotFoundException, ValidationException, ForbiddenException, ConflictException
from app.repositories import (
    engagement_repository,
    EngagementRepository,
    brief_repository,
    BriefRepository,
    creator_repository,
    CreatorRepository,
)
from app.services.brief_service import brief_service
from app.services.achievement_service import achievement_service
from app.services.delivery_check_service import delivery_check_service
from app.schemas.delivery_check import DeliveryCheckStatus, DeliveryCheckReport
from app.schemas.engagement import (
    EngagementResponse,
    EngagementDetailResponse,
    EngagementStatus,
    ProductionProgressStatus,
    EngagementScopeTerms,
    DeliverableSubmissionCreate,
    EngagementDeliverableSubmissionResponse,
    EngagementProgressUpdateResponse,
    EngagementTimelineEventResponse,
    ShortlistCreatorItem,
)
from app.core.logging import get_logger

logger = get_logger("services.engagement")


class EngagementService(BaseService):
    """Enforces strict, validated state transitions, brand/creator data isolation, and auditable engagement history."""

    def __init__(
        self,
        repo: Optional[EngagementRepository] = None,
        brief_repo: Optional[BriefRepository] = None,
        creator_repo: Optional[CreatorRepository] = None,
    ):
        super().__init__("engagement")
        self.repo = repo or engagement_repository
        self.brief_repo = brief_repo or brief_repository
        self.creator_repo = creator_repo or creator_repository

    async def _resolve_creator_profile_id(self, creator_id_or_user_id: str) -> str:
        """Resolves user_id to creator_profile id if available."""
        creator = await self.creator_repo.get_by_user_id(creator_id_or_user_id)
        if creator:
            return str(creator.id)
        try:
            creator_by_uuid = await self.creator_repo.get_by_id(UUID(creator_id_or_user_id))
            if creator_by_uuid:
                return str(creator_by_uuid.id)
        except Exception:
            pass
        return str(creator_id_or_user_id)

    async def _record_timeline(
        self,
        engagement_id: UUID,
        actor_id: str,
        actor_role: str,
        action: str,
        from_status: Optional[str] = None,
        to_status: Optional[str] = None,
        details: Optional[str] = None,
    ):
        """Appends an immutable audit event to the engagement timeline."""
        event = EngagementTimelineEventResponse(
            id=uuid4(),
            engagement_id=engagement_id,
            actor_id=actor_id,
            actor_role=actor_role,
            action=action,
            from_status=from_status,
            to_status=to_status,
            details=details,
            created_at=datetime.now(timezone.utc),
        )
        await self.repo.create_timeline_event(event)

    # -------------------------------------------------------------------------
    # STAGE A — SHORTLISTING
    # -------------------------------------------------------------------------
    async def shortlist_creator(
        self, brand_user_id: str, brief_id: str, creator_id: str, notes: Optional[str] = None
    ) -> EngagementResponse:
        """Adds a creator to a brief shortlist. Prevents duplicates and verifies brand ownership."""
        try:
            b_uuid = brief_id if isinstance(brief_id, UUID) else UUID(str(brief_id))
        except ValueError:
            raise ValidationException(f"Invalid brief ID format: '{brief_id}'")

        brief = await self.brief_repo.get_by_id(b_uuid)
        if not brief:
            raise NotFoundException("Campaign Brief", brief_id)

        if not brief_service._is_brand_owner(brief.brand_id, brand_user_id):
            raise ForbiddenException("You do not have permission to manage shortlists for this campaign brief.")

        # Check existing engagement
        existing = await self.repo.get_by_brief_and_creator(brief_id, creator_id)
        if existing:
            if existing.status == EngagementStatus.SHORTLISTED:
                # Already shortlisted (idempotent success)
                return existing
            if existing.status in [EngagementStatus.CANCELLED, EngagementStatus.DECLINED]:
                # Reopen to shortlisted
                updated = await self.repo.update(
                    existing.id,
                    {
                        "status": EngagementStatus.SHORTLISTED.value,
                        "decline_reason": None,
                        "cancellation_reason": None,
                    },
                )
                await self._record_timeline(
                    existing.id, brand_user_id, "BRAND", "RE_SHORTLISTED", existing.status.value, EngagementStatus.SHORTLISTED.value, notes
                )
                return updated or existing
            # If already invited, confirmed, in production, etc., return existing active engagement
            return existing

        now = datetime.now(timezone.utc)
        resolved_creator_id = await self._resolve_creator_profile_id(creator_id)

        # Populate proposed terms baseline from brief deliverables & commercial terms
        comm = brief.commercial_terms if hasattr(brief, "commercial_terms") and brief.commercial_terms else None
        currency = getattr(comm, "currency", "INR") if comm else "INR"
        deadline = brief.deadline or (getattr(comm, "content_delivery_deadline", None) if comm else None)
        revisions = getattr(comm, "revisions_count", 2) if comm else 2
        comm_req = getattr(comm, "commercial_rights_required", True) if comm else True
        territory = getattr(comm, "territory", "Global") if comm else "Global"
        duration = getattr(comm, "organic_usage_duration", "Perpetual") if comm else "Perpetual"

        proposed_terms = EngagementScopeTerms(
            deliverables=[d.model_dump(mode="json") if hasattr(d, "model_dump") else d for d in (brief.deliverables or [])],
            scope_description=brief.description or brief.title,
            budget_cents=brief.budget_cents or 250000,
            currency=currency,
            deadline=deadline,
            revision_allowance=revisions,
            commercial_rights_required=comm_req,
            usage_rights=f"Commercial rights: {territory} territory, {duration} duration",
            additional_notes=notes,
        )

        engagement_id = uuid4()
        entity = EngagementResponse(
            id=engagement_id,
            brief_id=brief_id,
            brand_id=str(brief.brand_id),
            creator_id=resolved_creator_id,
            status=EngagementStatus.SHORTLISTED,
            production_status=ProductionProgressStatus.NOT_STARTED,
            proposed_terms=proposed_terms,
            created_at=now,
            updated_at=now,
        )

        saved = await self.repo.create(entity)
        await self._record_timeline(
            engagement_id, brand_user_id, "BRAND", "SHORTLISTED", None, EngagementStatus.SHORTLISTED.value, notes or "Added to candidate shortlist"
        )
        return saved

    async def remove_from_shortlist(self, brand_user_id: str, engagement_id: UUID) -> bool:
        """Removes a creator from a brief shortlist."""
        engagement = await self.repo.get_by_id(engagement_id)
        if not engagement:
            raise NotFoundException("Engagement", engagement_id)

        if not brief_service._is_brand_owner(engagement.brand_id, brand_user_id):
            raise ForbiddenException("You do not have permission to modify this shortlist.")

        if engagement.status != EngagementStatus.SHORTLISTED:
            raise ConflictException(f"Cannot remove from shortlist: engagement is currently in {engagement.status.value} state.")

        await self._record_timeline(
            engagement_id, brand_user_id, "BRAND", "REMOVED_FROM_SHORTLIST", engagement.status.value, "DELETED"
        )
        return await self.repo.delete(engagement_id)

    async def list_shortlist_for_brief(self, brand_user_id: str, brief_id: str) -> List[ShortlistCreatorItem]:
        """Lists all shortlisted creators for an authorized campaign brief with joined profile context."""
        try:
            b_uuid = brief_id if isinstance(brief_id, UUID) else UUID(str(brief_id))
        except ValueError:
            raise ValidationException(f"Invalid brief ID format: '{brief_id}'")

        brief = await self.brief_repo.get_by_id(b_uuid)
        if not brief:
            raise NotFoundException("Campaign Brief", brief_id)

        if not brief_service._is_brand_owner(brief.brand_id, brand_user_id):
            raise ForbiddenException("You do not have permission to view shortlists for this campaign brief.")

        engagements = await self.repo.list_by_brief(brief_id)
        items: List[ShortlistCreatorItem] = []

        for eng in engagements:
            # We display all pipeline candidates or shortlist items
            creator = None
            try:
                creator = await self.creator_repo.get_by_id(UUID(eng.creator_id))
            except Exception:
                pass
            if not creator:
                creator = await self.creator_repo.get_by_user_id(eng.creator_id)

            c_name = creator.full_name if creator else (eng.creator_name or "AI Creator")
            c_handle = creator.handle if creator else (eng.creator_handle or "creator")
            c_meta_avatar = creator.metadata.get("avatar_url") if (creator and hasattr(creator, "metadata") and isinstance(creator.metadata, dict)) else None
            c_avatar = getattr(creator, "avatar_url", None) or c_meta_avatar or eng.creator_avatar_url
            c_spec = creator.primary_specialization if creator else "Generative Visuals"
            c_skills = creator.skills if creator else []
            c_tools = creator.ai_tools if creator else []
            c_rate = creator.hourly_rate_cents if creator else None
            c_rep = float(creator.reputation_score or 4.8) if creator else 4.8
            c_ver = bool(creator.is_verified) if creator else False

            items.append(
                ShortlistCreatorItem(
                    engagement_id=eng.id,
                    brief_id=eng.brief_id,
                    creator_id=eng.creator_id,
                    creator_name=c_name,
                    creator_handle=c_handle,
                    creator_avatar_url=c_avatar,
                    primary_specialization=c_spec,
                    skills=c_skills,
                    ai_tools=c_tools,
                    hourly_rate_cents=c_rate,
                    reputation_score=c_rep,
                    is_verified=c_ver,
                    compatibility_score=eng.compatibility_score or 85.0,
                    status=eng.status,
                    shortlisted_at=eng.created_at,
                )
            )
        return items

    # -------------------------------------------------------------------------
    # STAGE B — CONTACTING & INVITATIONS
    # -------------------------------------------------------------------------
    async def send_invitation(
        self,
        brand_user_id: str,
        brief_id: str,
        creator_id: str,
        proposed_terms: EngagementScopeTerms,
        invitation_message: Optional[str] = None,
    ) -> EngagementResponse:
        """Sends a formal engagement invitation with proposed scope terms to a creator."""
        try:
            b_uuid = brief_id if isinstance(brief_id, UUID) else UUID(str(brief_id))
        except ValueError:
            raise ValidationException(f"Invalid brief ID format: '{brief_id}'")

        brief = await self.brief_repo.get_by_id(b_uuid)
        if not brief:
            raise NotFoundException("Campaign Brief", brief_id)

        if not brief_service._is_brand_owner(brief.brand_id, brand_user_id):
            raise ForbiddenException("You do not have permission to send invitations for this campaign brief.")

        # Resolve creator profile
        resolved_creator_id = await self._resolve_creator_profile_id(creator_id)

        existing = await self.repo.get_by_brief_and_creator(brief_id, resolved_creator_id)
        now = datetime.now(timezone.utc)

        if existing:
            # Cannot re-invite if already active
            if existing.status in [EngagementStatus.INVITED]:
                raise ConflictException("An active invitation is already pending for this creator on this campaign brief.")
            if existing.status in [EngagementStatus.CONFIRMED, EngagementStatus.IN_PRODUCTION, EngagementStatus.SUBMITTED, EngagementStatus.COMPLETED]:
                raise ConflictException(f"Cannot invite creator: engagement is already active in {existing.status.value} stage.")

            # Transition from SHORTLISTED, DECLINED, or CANCELLED to INVITED
            updated = await self.repo.update(
                existing.id,
                {
                    "status": EngagementStatus.INVITED.value,
                    "proposed_terms": proposed_terms.model_dump(mode="json"),
                    "invitation_message": invitation_message,
                    "decline_reason": None,
                    "cancellation_reason": None,
                },
            )
            await self._record_timeline(
                existing.id,
                brand_user_id,
                "BRAND",
                "INVITATION_SENT",
                existing.status.value,
                EngagementStatus.INVITED.value,
                f"Proposed budget: {proposed_terms.budget_cents/100 if proposed_terms.budget_cents else 0} {proposed_terms.currency}",
            )
            return updated or existing

        # Create new engagement in INVITED state
        engagement_id = uuid4()
        entity = EngagementResponse(
            id=engagement_id,
            brief_id=brief_id,
            brand_id=str(brief.brand_id),
            creator_id=resolved_creator_id,
            status=EngagementStatus.INVITED,
            production_status=ProductionProgressStatus.NOT_STARTED,
            proposed_terms=proposed_terms,
            invitation_message=invitation_message,
            created_at=now,
            updated_at=now,
        )
        saved = await self.repo.create(entity)
        await self._record_timeline(
            engagement_id,
            brand_user_id,
            "BRAND",
            "INVITATION_SENT",
            None,
            EngagementStatus.INVITED.value,
            invitation_message or "Formal engagement invitation dispatched",
        )
        return saved

    async def respond_to_invitation(
        self, creator_user_id: str, engagement_id: UUID, action: str, decline_reason: Optional[str] = None
    ) -> EngagementResponse:
        """Allows the intended creator to accept or decline an engagement invitation."""
        engagement = await self.repo.get_by_id(engagement_id)
        if not engagement:
            raise NotFoundException("Engagement", engagement_id)

        # Strict creator ownership check: prevent creator A from accepting creator B's invitation
        if not brief_service._is_creator_owner(engagement.creator_id, creator_user_id):
            raise ForbiddenException("You do not have permission to respond to this invitation.")

        if engagement.status != EngagementStatus.INVITED:
            raise ConflictException(f"Cannot respond to invitation: engagement is currently in {engagement.status.value} status.")

        clean_action = action.strip().upper()
        if clean_action not in ["ACCEPT", "DECLINE"]:
            raise ValidationException(f"Invalid response action: '{action}'. Must be 'ACCEPT' or 'DECLINE'.")

        if clean_action == "ACCEPT":
            # Acceptance moves to ACCEPTED (ready for Selection and Scope Confirmation stage)
            updated = await self.repo.update(
                engagement_id,
                {
                    "status": EngagementStatus.ACCEPTED.value,
                },
            )
            await self._record_timeline(
                engagement_id,
                creator_user_id,
                "CREATOR",
                "INVITATION_ACCEPTED",
                EngagementStatus.INVITED.value,
                EngagementStatus.ACCEPTED.value,
                "Creator accepted invitation terms. Ready for mutual scope confirmation.",
            )
            return updated or engagement
        else:
            # Decline moves to DECLINED
            updated = await self.repo.update(
                engagement_id,
                {
                    "status": EngagementStatus.DECLINED.value,
                    "decline_reason": decline_reason or "Creator declined proposed engagement terms.",
                },
            )
            await self._record_timeline(
                engagement_id,
                creator_user_id,
                "CREATOR",
                "INVITATION_DECLINED",
                EngagementStatus.INVITED.value,
                EngagementStatus.DECLINED.value,
                decline_reason or "Declined by creator",
            )
            return updated or engagement

    # -------------------------------------------------------------------------
    # STAGE C — SELECTION AND SCOPE CONFIRMATION
    # -------------------------------------------------------------------------
    async def confirm_terms(
        self, user_id: str, user_role: str, engagement_id: UUID, confirmed_terms: EngagementScopeTerms, notes: Optional[str] = None
    ) -> EngagementResponse:
        """
        Records formal scope confirmation from Brand or Creator.
        The engagement transitions to CONFIRMED only when valid business criteria are satisfied.
        """
        engagement = await self.repo.get_by_id(engagement_id)
        if not engagement:
            raise NotFoundException("Engagement", engagement_id)

        is_brand = brief_service._is_brand_owner(engagement.brand_id, user_id)
        is_creator = brief_service._is_creator_owner(engagement.creator_id, user_id)

        if not is_brand and not is_creator:
            raise ForbiddenException("You do not have permission to confirm terms for this engagement.")

        # Engagement must be in ACCEPTED or AWAITING_CONFIRMATION status
        if engagement.status not in [EngagementStatus.ACCEPTED, EngagementStatus.AWAITING_CONFIRMATION]:
            raise ConflictException(f"Cannot confirm terms: engagement is currently in {engagement.status.value} status.")

        now = datetime.now(timezone.utc)
        updates: Dict[str, Any] = {
            "confirmed_terms": confirmed_terms.model_dump(mode="json"),
        }

        if is_brand:
            updates["brand_confirmed_at"] = now.isoformat()
            updates["brand_confirmed_by"] = user_id
            updates["status"] = EngagementStatus.CONFIRMED.value
            next_status = EngagementStatus.CONFIRMED.value
            role_label = "BRAND"
        else:
            updates["creator_confirmed_at"] = now.isoformat()
            updates["creator_confirmed_by"] = user_id
            updates["status"] = EngagementStatus.AWAITING_CONFIRMATION.value
            next_status = EngagementStatus.AWAITING_CONFIRMATION.value
            role_label = "CREATOR"

        # If brand confirms an accepted engagement, it becomes CONFIRMED for production
        updated = await self.repo.update(engagement_id, updates)
        await self._record_timeline(
            engagement_id,
            user_id,
            role_label,
            "TERMS_CONFIRMED",
            engagement.status.value,
            next_status,
            notes or f"Scope terms confirmed by {role_label.lower()}",
        )
        return updated or engagement

    # -------------------------------------------------------------------------
    # STAGE D — PRODUCTION
    # -------------------------------------------------------------------------
    async def start_production(self, user_id: str, engagement_id: UUID) -> EngagementResponse:
        """Transitions confirmed engagement into IN_PRODUCTION."""
        engagement = await self.repo.get_by_id(engagement_id)
        if not engagement:
            raise NotFoundException("Engagement", engagement_id)

        is_brand = brief_service._is_brand_owner(engagement.brand_id, user_id)
        is_creator = brief_service._is_creator_owner(engagement.creator_id, user_id)
        if not is_brand and not is_creator:
            raise ForbiddenException("You do not have permission to transition this engagement.")

        if engagement.status != EngagementStatus.CONFIRMED:
            raise ConflictException(f"Cannot enter production: engagement is in {engagement.status.value} status.")

        updated = await self.repo.update(
            engagement_id,
            {
                "status": EngagementStatus.IN_PRODUCTION.value,
                "production_status": ProductionProgressStatus.IN_PROGRESS.value,
            },
        )
        await self._record_timeline(
            engagement_id,
            user_id,
            "BRAND" if is_brand else "CREATOR",
            "PRODUCTION_STARTED",
            EngagementStatus.CONFIRMED.value,
            EngagementStatus.IN_PRODUCTION.value,
            "Engagement production phase initiated.",
        )
        return updated or engagement

    async def update_production_progress(
        self,
        user_id: str,
        user_role: str,
        engagement_id: UUID,
        production_status: ProductionProgressStatus,
        content: str,
        blocker_details: Optional[str] = None,
    ) -> EngagementProgressUpdateResponse:
        """Posts a production progress update, clarifying notes, or blocker explanation."""
        engagement = await self.repo.get_by_id(engagement_id)
        if not engagement:
            raise NotFoundException("Engagement", engagement_id)

        is_brand = brief_service._is_brand_owner(engagement.brand_id, user_id)
        is_creator = brief_service._is_creator_owner(engagement.creator_id, user_id)
        if not is_brand and not is_creator:
            raise ForbiddenException("You do not have permission to post updates to this engagement.")

        if engagement.status not in [EngagementStatus.CONFIRMED, EngagementStatus.IN_PRODUCTION, EngagementStatus.CHANGES_REQUESTED]:
            raise ConflictException(f"Cannot update progress: engagement is in {engagement.status.value} status.")

        sender_role = "BRAND" if is_brand else "CREATOR"
        update_entity = EngagementProgressUpdateResponse(
            id=uuid4(),
            engagement_id=engagement_id,
            sender_id=user_id,
            sender_role=sender_role,
            production_status=production_status.value,
            content=content,
            blocker_details=blocker_details,
            created_at=datetime.now(timezone.utc),
        )

        saved = await self.repo.create_progress_update(update_entity)

        # Update engagement production_status and ensure status is IN_PRODUCTION if not already
        new_status = engagement.status
        if engagement.status == EngagementStatus.CONFIRMED:
            new_status = EngagementStatus.IN_PRODUCTION

        await self.repo.update(
            engagement_id,
            {
                "production_status": production_status.value,
                "status": new_status.value,
            },
        )

        await self._record_timeline(
            engagement_id,
            user_id,
            sender_role,
            "PROGRESS_UPDATED",
            engagement.status.value,
            new_status.value,
            f"Status: {production_status.value} — {content[:100]}",
        )
        return saved

    # -------------------------------------------------------------------------
    # STAGE E — DELIVERY AND REVIEW
    # -------------------------------------------------------------------------
    async def submit_deliverable(
        self,
        creator_user_id: str,
        engagement_id: UUID,
        data: DeliverableSubmissionCreate,
        file_content: Optional[bytes] = None,
    ) -> EngagementDeliverableSubmissionResponse:
        """Allows creator to submit final deliverables with automated delivery check validation.
        
        If delivery checks pass: review_decision='PENDING', engagement status='SUBMITTED'.
        If delivery checks fail: review_decision='FAILED_VALIDATION', engagement stays in production for creator correction.
        """
        engagement = await self.repo.get_by_id(engagement_id)
        if not engagement:
            raise NotFoundException("Engagement", engagement_id)

        if not brief_service._is_creator_owner(engagement.creator_id, creator_user_id):
            raise ForbiddenException("You do not have permission to submit deliverables for this engagement.")

        # Creator cannot submit deliverables for an unconfirmed engagement
        if engagement.status not in [EngagementStatus.CONFIRMED, EngagementStatus.IN_PRODUCTION, EngagementStatus.CHANGES_REQUESTED]:
            raise ConflictException(f"Cannot submit deliverables: engagement is not confirmed (status: {engagement.status.value}).")

        # Determine revision version number
        existing_submissions = await self.repo.list_submissions(engagement_id)
        next_version = len(existing_submissions) + 1

        # Fetch campaign brief to validate requirements
        brief = None
        try:
            brief = await self.brief_repo.get_by_id(engagement.brief_id)
        except Exception as e:
            logger.warning(f"Could not load brief {engagement.brief_id} for deliverable check: {e}")

        # Decode base64 or fetch bytes if provided
        raw_bytes = file_content
        if raw_bytes is None and getattr(data, "file_bytes_base64", None):
            try:
                import base64
                raw_bytes = base64.b64decode(data.file_bytes_base64)
            except Exception as e:
                logger.warning(f"Failed to decode base64 file content: {e}")
        elif raw_bytes is None and data.media_url and data.media_url.startswith("data:"):
            try:
                import base64
                header, encoded = data.media_url.split(",", 1)
                raw_bytes = base64.b64decode(encoded)
            except Exception as e:
                logger.warning(f"Failed to decode data URI: {e}")

        # Execute automated Delivery Check
        report = delivery_check_service.validate_deliverable(
            brief_data=brief,
            file_content=raw_bytes,
            media_url=data.media_url,
            filename=data.title,
            declared_format=data.file_format,
            deliverable_item_id=getattr(data, "deliverable_item_id", None),
        )

        is_passed = report.overall_status == DeliveryCheckStatus.PASSED
        review_decision = "PENDING" if is_passed else "FAILED_VALIDATION"
        check_status = report.overall_status.value

        now = datetime.now(timezone.utc)
        submission = EngagementDeliverableSubmissionResponse(
            id=uuid4(),
            engagement_id=engagement_id,
            creator_id=str(engagement.creator_id),
            version_number=next_version,
            title=data.title,
            media_url=data.media_url,
            thumbnail_url=data.thumbnail_url,
            file_format=data.file_format or "video/mp4",
            submission_notes=data.submission_notes,
            review_decision=review_decision,
            delivery_check_status=check_status,
            delivery_check_report=report,
            created_at=now,
            updated_at=now,
        )

        saved = await self.repo.create_submission(submission)

        if is_passed:
            # Transition engagement to SUBMITTED for brand review
            await self.repo.update(
                engagement_id,
                {
                    "status": EngagementStatus.SUBMITTED.value,
                    "production_status": ProductionProgressStatus.IN_PROGRESS.value,
                },
            )
            await self._record_timeline(
                engagement_id,
                creator_user_id,
                "CREATOR",
                "DELIVERABLE_SUBMITTED",
                engagement.status.value,
                EngagementStatus.SUBMITTED.value,
                f"Version {next_version}: '{data.title}' — Delivery Check: PASSED ({report.passed_count} checks verified)",
            )
        else:
            # Delivery checks failed: keep in production/correction-required state
            failed_rules = [c.label for c in report.checks if c.status.value == "FAILED"]
            await self.repo.update(
                engagement_id,
                {
                    "production_status": ProductionProgressStatus.IN_PROGRESS.value,
                },
            )
            await self._record_timeline(
                engagement_id,
                creator_user_id,
                "CREATOR",
                "DELIVERABLE_VALIDATION_FAILED",
                engagement.status.value,
                engagement.status.value,
                f"Version {next_version}: '{data.title}' — Delivery Check: FAILED ({', '.join(failed_rules)}). Creator correction required.",
            )
        return saved

    async def submit_deliverable_file(
        self,
        creator_user_id: str,
        engagement_id: UUID,
        title: str,
        filename: str,
        content: bytes,
        content_type: str,
        deliverable_item_id: Optional[str] = None,
        submission_notes: Optional[str] = None,
    ) -> EngagementDeliverableSubmissionResponse:
        """Processes binary file upload for deliverable submission, validates against brief, and saves asset."""
        engagement = await self.repo.get_by_id(engagement_id)
        if not engagement:
            raise NotFoundException("Engagement", engagement_id)

        if not brief_service._is_creator_owner(engagement.creator_id, creator_user_id):
            raise ForbiddenException("You do not have permission to submit deliverables for this engagement.")

        if engagement.status not in [EngagementStatus.CONFIRMED, EngagementStatus.IN_PRODUCTION, EngagementStatus.CHANGES_REQUESTED]:
            raise ConflictException(f"Cannot submit deliverables: engagement is not confirmed (status: {engagement.status.value}).")

        # Save media asset to storage if configured, or create local public media path
        clean_name = filename.replace("\\", "/").rsplit("/", 1)[-1]
        unique_name = f"{uuid4()}_{clean_name.replace(' ', '_')}"
        storage_path = f"engagements/{engagement_id}/deliverables/{unique_name}"

        media_url = f"/uploads/deliverables/{unique_name}"
        try:
            from app.integrations.storage import storage_provider
            if storage_provider and storage_provider.is_configured():
                await storage_provider.upload_file("deliverables", storage_path, content, content_type)
                media_url = await storage_provider.get_public_url("deliverables", storage_path)
        except Exception as e:
            logger.info(f"Using local deliverable asset URL ({e})")

        data = DeliverableSubmissionCreate(
            title=title,
            media_url=media_url,
            file_format=content_type,
            submission_notes=submission_notes,
            deliverable_item_id=deliverable_item_id,
        )

        return await self.submit_deliverable(
            creator_user_id=creator_user_id,
            engagement_id=engagement_id,
            data=data,
            file_content=content,
        )

    async def review_submission(
        self,
        brand_user_id: str,
        engagement_id: UUID,
        submission_id: UUID,
        decision: str,
        review_notes: str,
        quality_score: float = 85.0,
        brief_compliance_score: float = 85.0,
        collaboration_score: float = 85.0,
    ) -> EngagementResponse:
        """Allows brand to review deliverable: ACCEPT (transitions to COMPLETED) or REQUEST_CHANGES (transitions to CHANGES_REQUESTED)."""
        engagement = await self.repo.get_by_id(engagement_id)
        if not engagement:
            raise NotFoundException("Engagement", engagement_id)

        if not brief_service._is_brand_owner(engagement.brand_id, brand_user_id):
            raise ForbiddenException("You do not have permission to review deliverables for this engagement.")

        submission = await self.repo.get_submission_by_id(submission_id)
        if not submission or submission.engagement_id != engagement_id:
            raise NotFoundException("Deliverable Submission", submission_id)

        # Gate brand review: Deliverable MUST have passed automated delivery checks
        if submission.delivery_check_status == "FAILED" or submission.review_decision == "FAILED_VALIDATION":
            raise ConflictException(
                f"Cannot review deliverable: Submission v{submission.version_number} failed automated delivery validation. "
                f"The creator must upload a corrected version before brand review."
            )

        if engagement.status != EngagementStatus.SUBMITTED:
            raise ConflictException(f"Cannot review deliverable: engagement is in {engagement.status.value} status, not SUBMITTED.")

        if submission.review_decision != "PENDING":
            raise ConflictException(
                f"Cannot review deliverable: Submission v{submission.version_number} is already in '{submission.review_decision}' status."
            )

        clean_dec = decision.strip().upper()
        if clean_dec not in ["ACCEPT", "REQUEST_CHANGES"]:
            raise ValidationException(f"Invalid review decision: '{decision}'. Must be 'ACCEPT' or 'REQUEST_CHANGES'.")

        now = datetime.now(timezone.utc)

        if clean_dec == "ACCEPT":
            # 1. Update submission record
            await self.repo.update_submission(
                submission_id,
                {
                    "review_decision": "ACCEPTED",
                    "review_notes": review_notes,
                    "reviewed_by": brand_user_id,
                    "reviewed_at": now.isoformat(),
                },
            )

            # 2. Mark engagement completed
            updated = await self.repo.update(
                engagement_id,
                {
                    "status": EngagementStatus.COMPLETED.value,
                    "completed_at": now.isoformat(),
                    "completed_by": brand_user_id,
                },
            )

            # 3. Award verified creator achievements
            try:
                deadline_str = None
                if engagement.confirmed_terms and engagement.confirmed_terms.deadline:
                    deadline_str = engagement.confirmed_terms.deadline.isoformat()
                elif engagement.proposed_terms and engagement.proposed_terms.deadline:
                    deadline_str = engagement.proposed_terms.deadline.isoformat()

                achievement_service.record_verified_completion(
                    creator_id=str(engagement.creator_id),
                    engagement_id=str(engagement_id),
                    verified_by=str(brand_user_id),
                    completed_at=now.isoformat(),
                    deadline_at=deadline_str,
                    quality_score=quality_score,
                    brief_compliance_score=brief_compliance_score,
                    collaboration_score=collaboration_score,
                    accepted=True,
                )
            except Exception as e:
                self.logger.warning(f"Notice awarding achievements for engagement {engagement_id}: {e}")

            await self._record_timeline(
                engagement_id,
                brand_user_id,
                "BRAND",
                "DELIVERABLE_ACCEPTED",
                EngagementStatus.SUBMITTED.value,
                EngagementStatus.COMPLETED.value,
                f"Accepted by brand. Review notes: {review_notes}",
            )
            return updated or engagement

        else:
            # Require explicit explanation for change requests
            if not review_notes or len(review_notes.strip()) < 5:
                raise ValidationException("A clear explanation of required changes is required when requesting revisions.")

            # Update submission record
            await self.repo.update_submission(
                submission_id,
                {
                    "review_decision": "CHANGES_REQUESTED",
                    "review_notes": review_notes,
                    "reviewed_by": brand_user_id,
                    "reviewed_at": now.isoformat(),
                },
            )

            # Return engagement to CHANGES_REQUESTED
            updated = await self.repo.update(
                engagement_id,
                {
                    "status": EngagementStatus.CHANGES_REQUESTED.value,
                    "production_status": ProductionProgressStatus.IN_PROGRESS.value,
                },
            )

            await self._record_timeline(
                engagement_id,
                brand_user_id,
                "BRAND",
                "CHANGES_REQUESTED",
                EngagementStatus.SUBMITTED.value,
                EngagementStatus.CHANGES_REQUESTED.value,
                f"Revision requested: {review_notes}",
            )
            return updated or engagement

    # -------------------------------------------------------------------------
    # CANCELLATION
    # -------------------------------------------------------------------------
    async def cancel_engagement(self, user_id: str, engagement_id: UUID, reason: str) -> EngagementResponse:
        """Cancels an engagement with recorded reason and actor."""
        engagement = await self.repo.get_by_id(engagement_id)
        if not engagement:
            raise NotFoundException("Engagement", engagement_id)

        is_brand = brief_service._is_brand_owner(engagement.brand_id, user_id)
        is_creator = brief_service._is_creator_owner(engagement.creator_id, user_id)
        if not is_brand and not is_creator:
            raise ForbiddenException("You do not have permission to cancel this engagement.")

        if engagement.status == EngagementStatus.COMPLETED:
            raise ConflictException("A completed engagement cannot be cancelled.")

        if engagement.status == EngagementStatus.CANCELLED:
            return engagement

        now = datetime.now(timezone.utc)
        updated = await self.repo.update(
            engagement_id,
            {
                "status": EngagementStatus.CANCELLED.value,
                "cancellation_reason": reason,
                "cancelled_by": user_id,
                "cancelled_at": now.isoformat(),
            },
        )
        await self._record_timeline(
            engagement_id,
            user_id,
            "BRAND" if is_brand else "CREATOR",
            "ENGAGEMENT_CANCELLED",
            engagement.status.value,
            EngagementStatus.CANCELLED.value,
            f"Cancelled reason: {reason}",
        )
        return updated or engagement

    # -------------------------------------------------------------------------
    # DETAILS & LISTINGS
    # -------------------------------------------------------------------------
    async def get_engagement_detail(self, user_id: str, engagement_id: UUID) -> EngagementDetailResponse:
        """Retrieves full engagement details including submissions, updates, and timeline history."""
        engagement = await self.repo.get_by_id(engagement_id)
        if not engagement:
            raise NotFoundException("Engagement", engagement_id)

        is_brand = brief_service._is_brand_owner(engagement.brand_id, user_id)
        is_creator = brief_service._is_creator_owner(engagement.creator_id, user_id)
        if not is_brand and not is_creator:
            raise ForbiddenException("You do not have permission to view this engagement.")

        submissions = await self.repo.list_submissions(engagement_id)
        updates = await self.repo.list_progress_updates(engagement_id)
        timeline = await self.repo.list_timeline_events(engagement_id)

        return EngagementDetailResponse(
            **engagement.model_dump(),
            submissions=submissions,
            progress_updates=updates,
            timeline_events=timeline,
        )

    async def list_engagements_for_user(
        self, user_id: str, user_role: str, brief_id: Optional[str] = None, status: Optional[str] = None
    ) -> List[EngagementResponse]:
        """Lists engagements accessible to the authenticated user."""
        eng_status = EngagementStatus(status) if status else None
        if user_role in ["BRAND", "AGENCY"]:
            return await self.repo.list_by_brand(user_id, brief_id=brief_id, status=eng_status)
        else:
            creator_id = await self._resolve_creator_profile_id(user_id)
            return await self.repo.list_by_creator(creator_id, status=eng_status)


engagement_service = EngagementService()
