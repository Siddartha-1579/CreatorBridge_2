"""Creator matching endpoints with 7-factor explainable engine."""

from typing import List
from fastapi import APIRouter, Depends
from app.core.security import require_role, get_current_user, UserRole, AuthenticatedUser
from app.schemas.common import ApiResponse
from app.schemas.match import MatchCriteria, CreatorMatchResult, BriefMatchResult
from app.services import matching_service

router = APIRouter()


@router.post("/compute", response_model=ApiResponse[List[CreatorMatchResult]], summary="Compute creator matches")
async def compute_matches(
    criteria: MatchCriteria,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[List[CreatorMatchResult]]:
    """
    Computes explainable match scores between a campaign brief and verified creators
    across all 7 weighted dimensions (Skills, Niche, Format, Audience, Budget, Timeline, Values).
    """
    matches = await matching_service.compute_matches_for_brief(criteria)
    return ApiResponse(
        success=True,
        data=matches,
        message=f"Found {len(matches)} ranked creator matches",
    )


@router.get("/briefs/{brief_id}", response_model=ApiResponse[List[CreatorMatchResult]], summary="Get matches for brief")
async def get_matches_for_brief(
    brief_id: str,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[List[CreatorMatchResult]]:
    """Retrieves ranked creator matches for a specific campaign brief ID."""
    matches = await matching_service.get_matches_for_brief_id(brief_id)
    return ApiResponse(success=True, data=matches)


@router.post("/briefs/{brief_id}/refresh", response_model=ApiResponse[List[CreatorMatchResult]], summary="Refresh matches for brief")
async def refresh_matches_for_brief(
    brief_id: str,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[List[CreatorMatchResult]]:
    """Recomputes real-time match rankings for a brief."""
    matches = await matching_service.get_matches_for_brief_id(brief_id)
    return ApiResponse(success=True, data=matches, message="Creator matches refreshed successfully")


@router.get("/creator/recommendations", response_model=ApiResponse[List[BriefMatchResult]], summary="Get creator project recommendations")
async def get_creator_recommendations(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[List[BriefMatchResult]]:
    """Returns top matched campaign brief opportunities for the authenticated creator."""
    recommendations = await matching_service.get_recommended_briefs_for_creator(current_user.id)
    return ApiResponse(success=True, data=recommendations)
