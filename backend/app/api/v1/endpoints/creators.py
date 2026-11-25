"""Creator endpoints."""

from typing import List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Path
from app.core.security import get_current_user, AuthenticatedUser, require_role, UserRole
from app.schemas.common import ApiResponse
from app.schemas.creator import (
    CreatorProfileCreate,
    CreatorProfileUpdate,
    CreatorProfileResponse,
    CreatorProfileDetailResponse,
    ProfileCompletenessResponse,
    VerificationBadge,
    VerificationRecordCreate,
    VerificationRecordResponse,
)
from app.services import creator_service
from app.services.verification_service import verification_service

router = APIRouter()


@router.get("", response_model=ApiResponse[List[CreatorProfileResponse]], summary="List creators")
async def list_creators(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> ApiResponse[List[CreatorProfileResponse]]:
    """Lists creator profiles with pagination."""
    creators = await creator_service.list_creators(skip=skip, limit=limit)
    return ApiResponse(success=True, data=creators)


@router.get("/me", response_model=ApiResponse[CreatorProfileResponse], summary="Get current creator profile")
async def get_my_profile(
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[CreatorProfileResponse]:
    """Retrieves profile of the authenticated creator, creating baseline if absent."""
    profile = await creator_service.get_profile_by_user_id(
        user_id=current_user.id,
        user_email=current_user.email,
    )
    return ApiResponse(success=True, data=profile)


@router.patch("/me", response_model=ApiResponse[CreatorProfileResponse], summary="Update current creator profile")
async def update_my_profile(
    data: CreatorProfileUpdate,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[CreatorProfileResponse]:
    """Updates profile attributes for current creator while strictly protecting calculated fields."""
    updated = await creator_service.update_profile_by_user_id(
        user_id=current_user.id,
        data=data,
    )
    return ApiResponse(success=True, data=updated, message="Creator profile updated successfully")


@router.get("/me/completeness", response_model=ApiResponse[ProfileCompletenessResponse], summary="Profile completeness")
async def get_my_completeness(
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[ProfileCompletenessResponse]:
    """Returns dynamic breakdown of creator profile completeness across 10 milestones."""
    profile = await creator_service.get_profile_by_user_id(current_user.id, current_user.email)
    completeness = await creator_service.calculate_completeness(profile.id)
    return ApiResponse(success=True, data=completeness)


@router.get("/me/verifications", response_model=ApiResponse[List[VerificationBadge]], summary="List creator verification badges")
async def get_my_verifications(
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[List[VerificationBadge]]:
    """Returns all 6 verification badge categories and their current statuses."""
    profile = await creator_service.get_profile_by_user_id(current_user.id, current_user.email)
    badges = await verification_service.get_badges_for_creator(profile.id)
    return ApiResponse(success=True, data=badges)


@router.post("/me/verifications", response_model=ApiResponse[VerificationRecordResponse], summary="Submit verification claim")
async def submit_my_verification(
    data: VerificationRecordCreate,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[VerificationRecordResponse]:
    """Submits evidence or claims for identity, tool, workflow, or portfolio verification."""
    profile = await creator_service.get_profile_by_user_id(current_user.id, current_user.email)
    record = await verification_service.submit_verification_claim(profile.id, data)
    return ApiResponse(success=True, data=record, message="Verification claim submitted for review")


@router.get("/{creator_id}", response_model=ApiResponse[CreatorProfileDetailResponse], summary="Get public creator profile")
async def get_creator(
    creator_id: str = Path(..., description="Creator UUID or unique handle"),
) -> ApiResponse[CreatorProfileDetailResponse]:
    """
    Retrieves public creator profile by ID or handle.
    Includes verification badges, capability metrics, public portfolio showcase, and trust signals.
    """
    creator_detail = await creator_service.get_public_profile(creator_id)
    return ApiResponse(success=True, data=creator_detail)


@router.post("", response_model=ApiResponse[CreatorProfileResponse], summary="Create creator profile")
async def create_creator(
    data: CreatorProfileCreate,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[CreatorProfileResponse]:
    """Initializes creator profile for the authenticated creator."""
    profile = await creator_service.create_profile(
        user_id=current_user.id,
        full_name=current_user.email.split("@")[0].capitalize(),
        data=data,
    )
    return ApiResponse(success=True, data=profile, message="Creator profile initialized")


@router.patch("/{creator_id}", response_model=ApiResponse[CreatorProfileResponse], summary="Update creator profile by ID")
async def update_creator(
    creator_id: UUID,
    data: CreatorProfileUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[CreatorProfileResponse]:
    """Updates creator profile attributes by ID."""
    profile = await creator_service.update_profile(creator_id, data)
    return ApiResponse(success=True, data=profile, message="Creator profile updated")
