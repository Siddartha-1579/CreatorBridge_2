"""Creator matching endpoints implementing deterministic, explainable evidence-based matching."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Path
from app.core.security import require_role, get_current_user, get_optional_user, UserRole, AuthenticatedUser
from app.core.errors import ValidationException, NotFoundException, ForbiddenException
from app.schemas.common import ApiResponse
from app.schemas.brief import BriefStatus
from app.schemas.match import MatchCriteria, CreatorMatchResult, BriefMatchResult
from app.services import matching_service, brief_service
from app.repositories import brief_repository

router = APIRouter()


@router.post("/compute", response_model=ApiResponse[List[CreatorMatchResult]], summary="Compute creator matches")
async def compute_matches(
    criteria: MatchCriteria,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
) -> ApiResponse[List[CreatorMatchResult]]:
    """
    Computes explainable match scores between a campaign brief and verified creators
    across all 6 weighted dimensions (Content Fit, Skills & Tools, Portfolio Evidence,
    Commercial-Use Fit, Trust & Verification, Practical Feasibility).
    """
    # If brief_id specified, check existence and brand access authorization
    if criteria.brief_id:
        brief_id_clean = criteria.brief_id.strip()
        if brief_id_clean and brief_id_clean.lower() != "general":
            try:
                b_uuid = UUID(brief_id_clean)
            except (ValueError, AttributeError):
                raise ValidationException(f"Invalid brief ID format: '{criteria.brief_id}'")

            brief = await brief_repository.get_by_id(b_uuid)
            if not brief:
                raise NotFoundException("Campaign Brief", criteria.brief_id)

            # Public, published briefs follow standard public access policy
            is_public_published = (brief.status == BriefStatus.PUBLISHED and bool(brief.is_public))

            if not is_public_published:
                # Private or draft briefs must ONLY be accessible to authenticated brand owner
                if not current_user:
                    raise ForbiddenException("You do not have permission to compute matches for this campaign brief.")

                if current_user.role not in [UserRole.BRAND, UserRole.AGENCY]:
                    raise ForbiddenException("You do not have permission to compute matches for this campaign brief.")

                if not brief_service._is_brand_owner(brief.brand_id, current_user.id):
                    raise ForbiddenException("You do not have permission to compute matches for this campaign brief.")

    matches = await matching_service.compute_matches_for_brief(criteria)
    msg = f"Found {len(matches)} ranked creator matches" if matches else "No suitable creators found matching the specified requirements."
    return ApiResponse(
        success=True,
        data=matches,
        message=msg,
    )


@router.get("/briefs/{brief_id}", response_model=ApiResponse[List[CreatorMatchResult]], summary="Get matches for brief")
async def get_matches_for_brief(
    brief_id: str = Path(..., description="Campaign Brief ID"),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[List[CreatorMatchResult]]:
    """Retrieves ranked creator matches for a specific campaign brief ID with brand authorization."""
    try:
        b_uuid = UUID(brief_id)
    except ValueError:
        raise ValidationException(f"Invalid campaign brief ID format: '{brief_id}'")

    brief = await brief_repository.get_by_id(b_uuid)
    if not brief:
        raise NotFoundException("Campaign Brief", brief_id)

    # Brand data isolation: verify brand ownership
    if not brief_service._is_brand_owner(brief.brand_id, current_user.id):
        raise ForbiddenException("You do not have permission to view matches for this campaign brief.")

    criteria = MatchCriteria(brief_id=brief_id)
    matches = await matching_service.compute_matches_for_brief(criteria)
    msg = f"Found {len(matches)} ranked creator matches" if matches else "No suitable creators found matching the brief requirements."
    return ApiResponse(success=True, data=matches, message=msg)


@router.post("/briefs/{brief_id}/refresh", response_model=ApiResponse[List[CreatorMatchResult]], summary="Refresh matches for brief")
async def refresh_matches_for_brief(
    brief_id: str = Path(..., description="Campaign Brief ID"),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[List[CreatorMatchResult]]:
    """Recomputes real-time match rankings for an authorized campaign brief."""
    try:
        b_uuid = UUID(brief_id)
    except ValueError:
        raise ValidationException(f"Invalid campaign brief ID format: '{brief_id}'")

    brief = await brief_repository.get_by_id(b_uuid)
    if not brief:
        raise NotFoundException("Campaign Brief", brief_id)

    # Brand data isolation: verify brand ownership
    if not brief_service._is_brand_owner(brief.brand_id, current_user.id):
        raise ForbiddenException("You do not have permission to refresh matches for this campaign brief.")

    criteria = MatchCriteria(brief_id=brief_id)
    matches = await matching_service.compute_matches_for_brief(criteria)
    msg = f"Refreshed {len(matches)} ranked creator matches" if matches else "No suitable creators found matching the brief requirements."
    return ApiResponse(success=True, data=matches, message=msg)


@router.get("/creator/recommendations", response_model=ApiResponse[List[BriefMatchResult]], summary="Get creator project recommendations")
async def get_creator_recommendations(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[List[BriefMatchResult]]:
    """Returns top matched campaign brief opportunities for the authenticated creator."""
    recommendations = await matching_service.get_recommended_briefs_for_creator(current_user.id)
    msg = f"Found {len(recommendations)} recommended campaigns" if recommendations else "No matching campaigns available at this time."
    return ApiResponse(success=True, data=recommendations, message=msg)
