"""Brand & Agency endpoints."""

from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Path, Body
from app.core.security import get_current_user, AuthenticatedUser, require_role, UserRole
from app.schemas.common import ApiResponse
from app.schemas.brand import (
    BrandProfileCreate,
    BrandProfileUpdate,
    BrandProfileResponse,
    BrandPreferencesBase,
    BrandPreferencesResponse,
    BrandCompletenessResponse,
    BrandVerificationBadge,
    BrandVerificationClaimCreate,
    BrandVerificationRecordResponse,
    BrandDashboardOverviewResponse,
    BrandSurveyResponseSave,
    BrandSurveySessionResponse,
)
from app.services import brand_service, brand_onboarding_service

router = APIRouter()


# ============================================================
# BRAND ORGANIZATION PROFILE & DASHBOARD (/me)
# ============================================================

@router.get("/me", response_model=ApiResponse[BrandProfileResponse], summary="Get current brand profile")
async def get_my_brand_profile(
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[BrandProfileResponse]:
    """Retrieves profile of authenticated brand/agency organization."""
    profile = await brand_service.get_brand_by_user_id(current_user.id, current_user.email)
    return ApiResponse(success=True, data=profile)


@router.patch("/me", response_model=ApiResponse[BrandProfileResponse], summary="Update current brand profile")
async def update_my_brand_profile(
    data: BrandProfileUpdate,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[BrandProfileResponse]:
    """Updates attributes of authenticated brand/agency organization."""
    updated = await brand_service.update_profile_by_user_id(current_user.id, data)
    return ApiResponse(success=True, data=updated, message="Organization profile updated successfully")


@router.get("/me/overview", response_model=ApiResponse[BrandDashboardOverviewResponse], summary="Get dashboard overview")
async def get_my_dashboard_overview(
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[BrandDashboardOverviewResponse]:
    """Unified brand dashboard data: profile, preferences, dynamic completeness, and badges."""
    overview = await brand_service.get_dashboard_overview(current_user.id, current_user.email)
    return ApiResponse(success=True, data=overview)


@router.get("/me/completeness", response_model=ApiResponse[BrandCompletenessResponse], summary="Get profile completeness")
async def get_my_completeness(
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[BrandCompletenessResponse]:
    """Dynamic profile completeness percentage across 10 checklist milestones."""
    profile = await brand_service.get_brand_by_user_id(current_user.id, current_user.email)
    comp = await brand_service.calculate_completeness(profile.id)
    return ApiResponse(success=True, data=comp)


@router.get("/me/preferences", response_model=ApiResponse[Optional[BrandPreferencesResponse]], summary="Get creative preferences")
async def get_my_preferences(
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[Optional[BrandPreferencesResponse]]:
    """Retrieves structured creative preferences of authenticated brand."""
    profile = await brand_service.get_brand_by_user_id(current_user.id, current_user.email)
    pref = await brand_service.get_preferences(profile.id)
    return ApiResponse(success=True, data=pref)


@router.put("/me/preferences", response_model=ApiResponse[BrandPreferencesResponse], summary="Update creative preferences")
async def update_my_preferences(
    data: BrandPreferencesBase,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[BrandPreferencesResponse]:
    """Updates creative content requirements, styles, formats, and commercial criteria."""
    profile = await brand_service.get_brand_by_user_id(current_user.id, current_user.email)
    pref = await brand_service.update_preferences(profile.id, data)
    return ApiResponse(success=True, data=pref, message="Brand preferences updated successfully")


@router.get("/me/verifications", response_model=ApiResponse[List[BrandVerificationBadge]], summary="List brand verification badges")
async def get_my_verifications(
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[List[BrandVerificationBadge]]:
    """Lists organization verification badges and their truthful states."""
    profile = await brand_service.get_brand_by_user_id(current_user.id, current_user.email)
    badges = await brand_service.get_verification_badges(profile.id)
    return ApiResponse(success=True, data=badges)


@router.post("/me/verifications", response_model=ApiResponse[BrandVerificationRecordResponse], summary="Submit verification claim")
async def submit_my_verification(
    data: BrandVerificationClaimCreate,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[BrandVerificationRecordResponse]:
    """Submits evidence or claims for organization identity, corporate domain, or registration."""
    profile = await brand_service.get_brand_by_user_id(current_user.id, current_user.email)
    record = await brand_service.submit_verification_claim(profile.id, data)
    return ApiResponse(success=True, data=record, message="Verification claim submitted for review")


# ============================================================
# BRAND ONBOARDING & ADAPTIVE SURVEY
# ============================================================

@router.get("/onboarding/catalog", response_model=ApiResponse[Dict[str, Any]], summary="Get onboarding survey options")
async def get_onboarding_catalog() -> ApiResponse[Dict[str, Any]]:
    """Returns data-driven survey options catalog for the 8 onboarding sections."""
    catalog = brand_onboarding_service.get_survey_catalog()
    return ApiResponse(success=True, data=catalog)


@router.post("/onboarding/adaptive", response_model=ApiResponse[List[Dict[str, Any]]], summary="Get adaptive question branches")
async def get_adaptive_branches(
    responses: Dict[str, Any] = Body(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[List[Dict[str, Any]]]:
    """Dynamically returns tailored question branches based on current responses."""
    branches = brand_onboarding_service.get_adaptive_branches(responses)
    return ApiResponse(success=True, data=branches)


@router.get("/onboarding/session", response_model=ApiResponse[BrandSurveySessionResponse], summary="Get survey session")
async def get_survey_session(
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[BrandSurveySessionResponse]:
    """Retrieves active onboarding survey session for save-and-resume support."""
    profile = await brand_service.get_brand_by_user_id(current_user.id, current_user.email)
    session = await brand_onboarding_service.get_or_create_session(profile.id)
    return ApiResponse(success=True, data=session)


@router.post("/onboarding/save", response_model=ApiResponse[BrandSurveySessionResponse], summary="Save survey progress")
async def save_survey_progress(
    data: BrandSurveyResponseSave,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[BrandSurveySessionResponse]:
    """Saves current survey step and responses without requiring completion."""
    profile = await brand_service.get_brand_by_user_id(current_user.id, current_user.email)
    session = await brand_onboarding_service.save_progress(
        brand_id=profile.id,
        current_step=data.current_step,
        responses=data.responses,
    )
    return ApiResponse(success=True, data=session, message="Onboarding progress saved")


@router.post("/onboarding/complete", response_model=ApiResponse[BrandDashboardOverviewResponse], summary="Complete brand onboarding")
async def complete_onboarding(
    responses: Dict[str, Any] = Body(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[BrandDashboardOverviewResponse]:
    """Finalizes onboarding, sets profile and preferences, and returns dashboard overview."""
    profile = await brand_service.get_brand_by_user_id(current_user.id, current_user.email)
    overview = await brand_onboarding_service.complete_onboarding(
        brand_id=profile.id,
        user_id=current_user.id,
        responses=responses,
    )
    return ApiResponse(success=True, data=overview, message="Brand onboarding completed successfully")


# ============================================================
# PUBLIC / DISCOVERY ENDPOINTS
# ============================================================

@router.get("", response_model=ApiResponse[List[BrandProfileResponse]], summary="List brand profiles")
async def list_brands(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> ApiResponse[List[BrandProfileResponse]]:
    """Lists registered brands."""
    brands = await brand_service.list_brands(skip=skip, limit=limit)
    return ApiResponse(success=True, data=brands)


@router.get("/{brand_id}", response_model=ApiResponse[BrandProfileResponse], summary="Get brand profile by ID")
async def get_brand(brand_id: UUID = Path(...)) -> ApiResponse[BrandProfileResponse]:
    """Retrieves brand profile by ID."""
    brand = await brand_service.get_brand_by_id(brand_id)
    return ApiResponse(success=True, data=brand)


@router.post("", response_model=ApiResponse[BrandProfileResponse], summary="Create brand profile")
async def create_brand(
    data: BrandProfileCreate,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[BrandProfileResponse]:
    """Initializes brand profile for authenticated brand/agency."""
    brand = await brand_service.create_profile(user_id=current_user.id, data=data)
    return ApiResponse(success=True, data=brand, message="Brand profile created")
