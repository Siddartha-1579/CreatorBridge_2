"""Engagement lifecycle endpoints for shortlisting, invitations, scope confirmation, production, and deliverable review."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Path, Body, File, UploadFile, Form
from app.schemas.delivery_check import DeliveryCheckReport
from app.core.security import get_current_user, AuthenticatedUser, require_role, UserRole
from app.schemas.common import ApiResponse
from app.schemas.engagement import (
    EngagementResponse,
    EngagementDetailResponse,
    ShortlistRequest,
    EngagementInvitationRequest,
    InvitationResponseRequest,
    ScopeConfirmationRequest,
    ProductionProgressUpdateRequest,
    DeliverableSubmissionCreate,
    DeliverableReviewRequest,
    EngagementCancellationRequest,
    EngagementDeliverableSubmissionResponse,
    EngagementProgressUpdateResponse,
    ShortlistCreatorItem,
)
from app.services.engagement_service import engagement_service

router = APIRouter()


# -----------------------------------------------------------------------------
# Stage A — Shortlisting
# -----------------------------------------------------------------------------
@router.post("/shortlist", response_model=ApiResponse[EngagementResponse], summary="Add creator to campaign shortlist")
async def shortlist_creator(
    data: ShortlistRequest = Body(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY, UserRole.ADMIN])),
) -> ApiResponse[EngagementResponse]:
    """Adds a creator to a brand campaign brief's shortlist."""
    engagement = await engagement_service.shortlist_creator(
        brand_user_id=current_user.id,
        brief_id=data.brief_id,
        creator_id=data.creator_id,
        notes=data.notes,
    )
    return ApiResponse(success=True, data=engagement, message="Creator added to campaign shortlist.")


@router.delete("/shortlist/{engagement_id}", response_model=ApiResponse[bool], summary="Remove creator from shortlist")
async def remove_from_shortlist(
    engagement_id: UUID = Path(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY, UserRole.ADMIN])),
) -> ApiResponse[bool]:
    """Removes a creator from a brief's candidate shortlist."""
    success = await engagement_service.remove_from_shortlist(
        brand_user_id=current_user.id,
        engagement_id=engagement_id,
    )
    return ApiResponse(success=True, data=success, message="Creator removed from shortlist.")


@router.get("/briefs/{brief_id}/shortlist", response_model=ApiResponse[List[ShortlistCreatorItem]], summary="Get shortlisted creators for brief")
async def get_brief_shortlist(
    brief_id: str = Path(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY, UserRole.ADMIN])),
) -> ApiResponse[List[ShortlistCreatorItem]]:
    """Retrieves all shortlisted creators for a specific brand brief with joined profile context."""
    items = await engagement_service.list_shortlist_for_brief(
        brand_user_id=current_user.id,
        brief_id=brief_id,
    )
    return ApiResponse(success=True, data=items)


# -----------------------------------------------------------------------------
# Stage B — Invitations
# -----------------------------------------------------------------------------
@router.post("/invitations", response_model=ApiResponse[EngagementResponse], summary="Send engagement invitation with proposed terms")
async def send_invitation(
    data: EngagementInvitationRequest = Body(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY, UserRole.ADMIN])),
) -> ApiResponse[EngagementResponse]:
    """Sends a formal engagement invitation with proposed scope terms to a shortlisted creator."""
    engagement = await engagement_service.send_invitation(
        brand_user_id=current_user.id,
        brief_id=data.brief_id,
        creator_id=data.creator_id,
        proposed_terms=data.proposed_terms,
        invitation_message=data.invitation_message,
    )
    return ApiResponse(success=True, data=engagement, message="Engagement invitation sent to creator.")


@router.post("/{engagement_id}/respond", response_model=ApiResponse[EngagementResponse], summary="Accept or decline engagement invitation")
async def respond_to_invitation(
    engagement_id: UUID = Path(...),
    data: InvitationResponseRequest = Body(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[EngagementResponse]:
    """Allows the invited creator to accept or decline the brand's proposed engagement."""
    engagement = await engagement_service.respond_to_invitation(
        creator_user_id=current_user.id,
        engagement_id=engagement_id,
        action=data.action,
        decline_reason=data.decline_reason,
    )
    action_text = "accepted" if data.action.upper() == "ACCEPT" else "declined"
    return ApiResponse(success=True, data=engagement, message=f"Invitation successfully {action_text}.")


# -----------------------------------------------------------------------------
# Stage C — Selection & Scope Confirmation
# -----------------------------------------------------------------------------
@router.post("/{engagement_id}/confirm-terms", response_model=ApiResponse[EngagementResponse], summary="Confirm engagement terms")
async def confirm_terms(
    engagement_id: UUID = Path(...),
    data: ScopeConfirmationRequest = Body(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[EngagementResponse]:
    """Records formal scope confirmation from Brand or Creator."""
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    engagement = await engagement_service.confirm_terms(
        user_id=current_user.id,
        user_role=user_role,
        engagement_id=engagement_id,
        confirmed_terms=data.confirmed_terms,
        notes=data.notes,
    )
    return ApiResponse(success=True, data=engagement, message="Scope terms confirmed.")


# -----------------------------------------------------------------------------
# Stage D — Production
# -----------------------------------------------------------------------------
@router.post("/{engagement_id}/start-production", response_model=ApiResponse[EngagementResponse], summary="Transition to production")
async def start_production(
    engagement_id: UUID = Path(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[EngagementResponse]:
    """Transitions a confirmed engagement into IN_PRODUCTION phase."""
    engagement = await engagement_service.start_production(
        user_id=current_user.id,
        engagement_id=engagement_id,
    )
    return ApiResponse(success=True, data=engagement, message="Production phase initiated.")


@router.post("/{engagement_id}/progress", response_model=ApiResponse[EngagementProgressUpdateResponse], summary="Post production progress update")
async def update_production_progress(
    engagement_id: UUID = Path(...),
    data: ProductionProgressUpdateRequest = Body(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[EngagementProgressUpdateResponse]:
    """Posts a production progress update, status flag (NOT_STARTED, IN_PROGRESS, BLOCKED), or blocker explanation."""
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    update = await engagement_service.update_production_progress(
        user_id=current_user.id,
        user_role=user_role,
        engagement_id=engagement_id,
        production_status=data.production_status,
        content=data.content,
        blocker_details=data.blocker_details,
    )
    return ApiResponse(success=True, data=update, message="Production update posted.")


# -----------------------------------------------------------------------------
# Stage E — Deliverable Submission & Review
# -----------------------------------------------------------------------------
@router.post("/{engagement_id}/submit", response_model=ApiResponse[EngagementDeliverableSubmissionResponse], summary="Submit final deliverable")
async def submit_deliverable(
    engagement_id: UUID = Path(...),
    data: DeliverableSubmissionCreate = Body(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[EngagementDeliverableSubmissionResponse]:
    """Creator submits a deliverable for brand review, incrementing the version number."""
    submission = await engagement_service.submit_deliverable(
        creator_user_id=current_user.id,
        engagement_id=engagement_id,
        data=data,
    )
    status_label = "passed" if submission.delivery_check_status == "PASSED" else "requires creator correction"
    return ApiResponse(
        success=True,
        data=submission,
        message=f"Deliverable submission v{submission.version_number} received — delivery check {status_label}."
    )


@router.post("/{engagement_id}/submit-file", response_model=ApiResponse[EngagementDeliverableSubmissionResponse], summary="Upload deliverable file with automated delivery checks")
async def submit_deliverable_file(
    engagement_id: UUID = Path(...),
    file: UploadFile = File(...),
    title: str = Form(...),
    submission_notes: Optional[str] = Form(None),
    deliverable_item_id: Optional[str] = Form(None),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[EngagementDeliverableSubmissionResponse]:
    """Uploads deliverable media binary file and executes automated Delivery Check validation against campaign brief specifications."""
    content = await file.read()
    submission = await engagement_service.submit_deliverable_file(
        creator_user_id=current_user.id,
        engagement_id=engagement_id,
        title=title,
        filename=file.filename or "deliverable.mp4",
        content=content,
        content_type=file.content_type or "video/mp4",
        deliverable_item_id=deliverable_item_id,
        submission_notes=submission_notes,
    )
    status_label = "passed" if submission.delivery_check_status == "PASSED" else "requires creator correction"
    return ApiResponse(
        success=True,
        data=submission,
        message=f"Deliverable v{submission.version_number} processed — delivery check {status_label}."
    )


@router.get("/{engagement_id}/submissions/{submission_id}/delivery-check", response_model=ApiResponse[Optional[DeliveryCheckReport]], summary="Get delivery check report")
async def get_submission_delivery_check(
    engagement_id: UUID = Path(...),
    submission_id: UUID = Path(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[Optional[DeliveryCheckReport]]:
    """Retrieves the full Delivery Check report for a specific deliverable submission."""
    submission = await engagement_service.repo.get_submission_by_id(submission_id)
    if not submission or submission.engagement_id != engagement_id:
        from app.core.errors import NotFoundException
        raise NotFoundException("Deliverable Submission", submission_id)
    return ApiResponse(success=True, data=submission.delivery_check_report)


@router.post("/{engagement_id}/submissions/{submission_id}/review", response_model=ApiResponse[EngagementResponse], summary="Review deliverable submission")
async def review_submission(
    engagement_id: UUID = Path(...),
    submission_id: UUID = Path(...),
    data: DeliverableReviewRequest = Body(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY, UserRole.ADMIN])),
) -> ApiResponse[EngagementResponse]:
    """Brand reviews deliverable submission (ACCEPT or REQUEST_CHANGES)."""
    engagement = await engagement_service.review_submission(
        brand_user_id=current_user.id,
        engagement_id=engagement_id,
        submission_id=submission_id,
        decision=data.decision,
        review_notes=data.review_notes,
        quality_score=data.quality_score or 85.0,
        brief_compliance_score=data.brief_compliance_score or 85.0,
        collaboration_score=data.collaboration_score or 85.0,
    )
    msg = "Deliverable accepted and engagement completed!" if data.decision.upper() == "ACCEPT" else "Revision request recorded."
    return ApiResponse(success=True, data=engagement, message=msg)


# -----------------------------------------------------------------------------
# Cancellation, Details & Listing
# -----------------------------------------------------------------------------
@router.post("/{engagement_id}/cancel", response_model=ApiResponse[EngagementResponse], summary="Cancel engagement")
async def cancel_engagement(
    engagement_id: UUID = Path(...),
    data: EngagementCancellationRequest = Body(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[EngagementResponse]:
    """Cancels an active engagement with recorded cancellation reason and actor."""
    engagement = await engagement_service.cancel_engagement(
        user_id=current_user.id,
        engagement_id=engagement_id,
        reason=data.reason,
    )
    return ApiResponse(success=True, data=engagement, message="Engagement cancelled.")


@router.get("/{engagement_id}", response_model=ApiResponse[EngagementDetailResponse], summary="Get engagement detail")
async def get_engagement_detail(
    engagement_id: UUID = Path(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[EngagementDetailResponse]:
    """Retrieves full engagement details including deliverable submissions, progress logs, and audit timeline."""
    detail = await engagement_service.get_engagement_detail(
        user_id=current_user.id,
        engagement_id=engagement_id,
    )
    return ApiResponse(success=True, data=detail)


@router.get("", response_model=ApiResponse[List[EngagementResponse]], summary="List engagements for user")
async def list_engagements(
    brief_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[List[EngagementResponse]]:
    """Lists all engagements accessible to the authenticated brand or creator."""
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    engagements = await engagement_service.list_engagements_for_user(
        user_id=current_user.id,
        user_role=user_role,
        brief_id=brief_id,
        status=status,
    )
    return ApiResponse(success=True, data=engagements)
