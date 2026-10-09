"""Trust, Professional Reliability & Demerit API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Path, Body
from app.core.security import get_current_user, AuthenticatedUser, require_role, UserRole
from app.core.rate_limit import api_rate_limiter
from app.schemas.common import ApiResponse
from app.schemas.trust import (
    TrustScoreResponse,
    PublicTrustProfileResponse,
    TrustCaseResponse,
    CaseCreateRequest,
    CaseReviewRequest,
    CaseAppealRequest,
    CaseAppealDecisionRequest,
)
from app.repositories.trust_repository import trust_repository
from app.core.logging import get_logger

logger = get_logger("endpoints.trust")

router = APIRouter()


@router.get(
    "/me",
    response_model=ApiResponse[TrustScoreResponse],
    summary="Get current user's trust score and transparent breakdown",
)
async def get_my_trust_score(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[TrustScoreResponse]:
    """
    Returns the authenticated user's authoritative trust score,
    breakdown of active demerits, recovery points, badges, and active incidents.
    """
    score = await trust_repository.get_or_create_score(str(current_user.id))
    return ApiResponse(success=True, data=score)


@router.get(
    "/accounts/{account_id}/public",
    response_model=ApiResponse[PublicTrustProfileResponse],
    summary="Get public trust score and verified badges for any account",
)
async def get_public_trust_profile(
    account_id: str = Path(..., description="Target account UUID"),
) -> ApiResponse[PublicTrustProfileResponse]:
    """
    Returns sanitized public trust indicators: numerical score, status label,
    verified badges, and incident count. Private evidence and dispute allegations are NOT disclosed.
    """
    public_prof = await trust_repository.get_public_profile(account_id)
    return ApiResponse(success=True, data=public_prof)


@router.post(
    "/cases",
    response_model=ApiResponse[TrustCaseResponse],
    dependencies=[Depends(api_rate_limiter)],
    summary="Submit a professional conduct or contractual dispute report",
)
async def create_dispute_case(
    body: CaseCreateRequest = Body(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[TrustCaseResponse]:
    """
    Submits a dispute case for human review.
    A pending report does NOT immediately deduct points; it initiates a review case.
    """
    case = await trust_repository.create_case(
        reporting_account_id=str(current_user.id),
        reported_account_id=body.reported_account_id,
        category=body.category,
        description=body.description,
        evidence_urls=body.evidence_urls,
        reference_id=body.reference_id,
    )
    return ApiResponse(
        success=True,
        data=case,
        message="Dispute case submitted for platform review.",
    )


@router.get(
    "/cases",
    response_model=ApiResponse[List[TrustCaseResponse]],
    summary="List dispute cases associated with current account",
)
async def list_my_cases(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[List[TrustCaseResponse]]:
    """Lists dispute cases where current user is either reported or the reporter."""
    cases = await trust_repository.get_cases_for_account(str(current_user.id))
    return ApiResponse(success=True, data=cases)


@router.post(
    "/cases/{case_id}/review",
    response_model=ApiResponse[TrustCaseResponse],
    dependencies=[Depends(api_rate_limiter)],
    summary="Authorized reviewer decision on dispute case",
)
async def review_dispute_case(
    case_id: str = Path(..., description="Case UUID"),
    body: CaseReviewRequest = Body(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[TrustCaseResponse]:
    """
    Applies authorized review decision.
    If CONFIRM: assesses severity, calculates recurrence penalty, and records incident in ledger.
    If DISMISS: closes case without penalty.
    """
    reviewed = await trust_repository.review_case(
        case_id=case_id,
        reviewer_id=str(current_user.id),
        decision=body.decision,
        rationale=body.rationale,
        severity=body.severity,
    )
    return ApiResponse(
        success=True,
        data=reviewed,
        message=f"Case decision applied: {body.decision}",
    )


@router.post(
    "/cases/{case_id}/appeal",
    response_model=ApiResponse[TrustCaseResponse],
    dependencies=[Depends(api_rate_limiter)],
    summary="Submit appeal against a confirmed case decision",
)
async def submit_case_appeal(
    case_id: str = Path(..., description="Case UUID"),
    body: CaseAppealRequest = Body(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[TrustCaseResponse]:
    """Allows reported account to submit a formal appeal with counter-evidence."""
    appealed = await trust_repository.submit_appeal(
        case_id=case_id,
        account_id=str(current_user.id),
        appeal_text=body.appeal_text,
        supporting_evidence=body.supporting_evidence,
    )
    return ApiResponse(
        success=True,
        data=appealed,
        message="Appeal submitted for independent review.",
    )


@router.post(
    "/cases/{case_id}/appeal-decision",
    response_model=ApiResponse[TrustCaseResponse],
    dependencies=[Depends(api_rate_limiter)],
    summary="Reviewer decision on appeal",
)
async def decide_case_appeal(
    case_id: str = Path(..., description="Case UUID"),
    body: CaseAppealDecisionRequest = Body(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[TrustCaseResponse]:
    """
    Decision on appeal:
    If OVERTURN: reverses penalty in the incident ledger and deterministically recalculates score.
    If UPHOLD: confirms original finding.
    """
    decided = await trust_repository.decide_appeal(
        case_id=case_id,
        reviewer_id=str(current_user.id),
        decision=body.decision,
        rationale=body.rationale,
    )
    return ApiResponse(
        success=True,
        data=decided,
        message=f"Appeal decision applied: {body.decision}",
    )
