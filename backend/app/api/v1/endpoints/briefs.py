"""Campaign brief endpoints for creation, drafts, AI assistance, and publication."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Path, Body
from app.core.security import get_current_user, AuthenticatedUser, require_role, UserRole
from app.schemas.common import ApiResponse
from app.schemas.brief import (
    CampaignBriefCreate,
    CampaignBriefUpdate,
    CampaignBriefResponse,
    AIBriefGenerationRequest,
    AIBriefGenerationResponse,
    RefineIdeaRequest,
    RefineIdeaResponse,
    SuggestCreativeDirectionsRequest,
    SuggestCreativeDirectionsResponse,
    RegenerateSectionRequest,
    RegenerateSectionResponse,
    BriefValidationResult,
    GenerateCoverImageRequest,
    GenerateCoverImageResponse,
    CampaignApplicationCreate,
    CampaignApplicationUpdate,
    CampaignApplicationResponse,
)
from app.services import brief_service, ai_brief_service

router = APIRouter()


@router.get("", response_model=ApiResponse[List[CampaignBriefResponse]], summary="List marketplace campaign briefs")
async def list_briefs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    content_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    min_budget_cents: Optional[int] = Query(None),
    max_budget_cents: Optional[int] = Query(None),
    tool: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
) -> ApiResponse[List[CampaignBriefResponse]]:
    """Lists publicly accessible and published campaign briefs for creators with optional filtering."""
    briefs = await brief_service.list_briefs(
        skip=skip,
        limit=limit,
        content_type=content_type,
        category=category,
        min_budget_cents=min_budget_cents,
        max_budget_cents=max_budget_cents,
        tool=tool,
        search=search,
    )
    return ApiResponse(success=True, data=briefs)



@router.get("/mine", response_model=ApiResponse[List[CampaignBriefResponse]], summary="List brand's campaign briefs")
@router.get("/my", response_model=ApiResponse[List[CampaignBriefResponse]], summary="List brand's campaign briefs (alias)")
async def list_my_briefs(
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[List[CampaignBriefResponse]]:
    """Retrieves all briefs (drafts and published) belonging to the authenticated brand."""
    briefs = await brief_service.list_by_brand(brand_id=current_user.id)
    return ApiResponse(success=True, data=briefs)


@router.get("/{brief_id}", response_model=ApiResponse[CampaignBriefResponse], summary="Get campaign brief details")
async def get_brief(
    brief_id: UUID = Path(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user),
) -> ApiResponse[CampaignBriefResponse]:
    """Retrieves campaign brief details, verifying ownership if the brief is in draft state."""
    user_id = current_user.id if current_user else None
    brief = await brief_service.get_brief_by_id(brief_id=brief_id, current_user_id=user_id)
    return ApiResponse(success=True, data=brief)


@router.post("", response_model=ApiResponse[CampaignBriefResponse], summary="Create or save draft campaign brief")
async def create_brief(
    data: CampaignBriefCreate,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[CampaignBriefResponse]:
    """Creates a new campaign brief or draft for the authenticated brand organization."""
    brief = await brief_service.create_brief(brand_id=current_user.id, data=data)
    message = "Campaign brief published" if brief.status == "PUBLISHED" else "Campaign brief draft saved"
    return ApiResponse(success=True, data=brief, message=message)


@router.patch("/{brief_id}", response_model=ApiResponse[CampaignBriefResponse], summary="Update campaign brief draft")
@router.put("/{brief_id}", response_model=ApiResponse[CampaignBriefResponse], summary="Update campaign brief draft (PUT alias)")
async def update_brief(
    brief_id: UUID = Path(...),
    data: CampaignBriefUpdate = Body(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[CampaignBriefResponse]:
    """Updates fields of an existing draft campaign brief owned by the brand."""
    updated = await brief_service.update_brief(brief_id=brief_id, brand_id=current_user.id, data=data)
    return ApiResponse(success=True, data=updated, message="Campaign brief updated successfully")


@router.post("/{brief_id}/publish", response_model=ApiResponse[CampaignBriefResponse], summary="Publish campaign brief")
async def publish_brief(
    brief_id: UUID = Path(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[CampaignBriefResponse]:
    """Validates completeness and publishes a brief to the creator discovery marketplace."""
    published = await brief_service.publish_brief(brief_id=brief_id, brand_id=current_user.id)
    return ApiResponse(success=True, data=published, message="Campaign brief published to marketplace")


@router.post("/ai/generate", response_model=ApiResponse[AIBriefGenerationResponse], summary="Generate creative brief with AI")
async def generate_brief_with_ai(
    request: AIBriefGenerationRequest,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[AIBriefGenerationResponse]:
    """
    Transforms unstructured campaign concepts and preferred criteria into
    a structured, production-ready creative brief with deliverables and parameters.
    """
    result = await ai_brief_service.generate_brief(request)
    return ApiResponse(success=True, data=result, message="Creative brief synthesized successfully")


@router.post("/ai/refine-idea", response_model=ApiResponse[RefineIdeaResponse], summary="Refine campaign concept with AI")
async def refine_campaign_idea(
    request: RefineIdeaRequest,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[RefineIdeaResponse]:
    """Refines campaign premise, suggesting visual hooks and psychological marketing angles."""
    result = await ai_brief_service.refine_idea(request)
    return ApiResponse(success=True, data=result, message="Campaign concept refined successfully")


@router.post("/ai/suggest-directions", response_model=ApiResponse[SuggestCreativeDirectionsResponse], summary="Suggest creative directions")
async def suggest_creative_directions(
    request: SuggestCreativeDirectionsRequest,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[SuggestCreativeDirectionsResponse]:
    """Provides selectable aesthetic and visual direction presets tailored to the campaign."""
    result = await ai_brief_service.suggest_creative_directions(request)
    return ApiResponse(success=True, data=result, message="Creative directions generated")


@router.post("/ai/regenerate-section", response_model=ApiResponse[RegenerateSectionResponse], summary="Regenerate single brief section")
async def regenerate_brief_section(
    request: RegenerateSectionRequest,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[RegenerateSectionResponse]:
    """Regenerates a specific brief section while preserving all other sections and manual edits."""
    result = await ai_brief_service.regenerate_section(request)
    return ApiResponse(success=True, data=result, message="Brief section regenerated successfully")


@router.post("/validate", response_model=ApiResponse[BriefValidationResult], summary="Pre-flight brief validation")
async def validate_brief_payload(
    brief: CampaignBriefCreate,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[BriefValidationResult]:
    """Evaluates brief for blocking publication requirements and improvement suggestions."""
    result = brief_service.validate_brief(brief)
    return ApiResponse(success=True, data=result)


@router.post("/{brief_id}/validate", response_model=ApiResponse[BriefValidationResult], summary="Validate existing campaign brief")
async def validate_brief_by_id(
    brief_id: UUID = Path(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[BriefValidationResult]:
    """Evaluates an existing brief by ID for blocking publication requirements."""
    brief = await brief_service.get_brief_by_id(brief_id=brief_id, current_user_id=current_user.id)
    create_payload = CampaignBriefCreate(**brief.model_dump())
    result = brief_service.validate_brief(create_payload)
    return ApiResponse(success=True, data=result)


@router.post("/{brief_id}/cover-image", response_model=ApiResponse[GenerateCoverImageResponse], summary="Synthesize campaign cover image")
async def generate_cover_image(
    brief_id: UUID = Path(...),
    request: GenerateCoverImageRequest = Body(default_factory=GenerateCoverImageRequest),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[GenerateCoverImageResponse]:
    """Generates a visual campaign cover image using AI provider and attaches it to the brief."""
    result = await brief_service.generate_cover_image(brief_id=brief_id, brand_id=current_user.id, request=request)
    return ApiResponse(success=True, data=result, message="Campaign cover image synthesized successfully")


@router.post("/{brief_id}/apply", response_model=ApiResponse[CampaignApplicationResponse], summary="Apply to campaign brief")
async def apply_to_brief(
    brief_id: UUID = Path(...),
    data: CampaignApplicationCreate = Body(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[CampaignApplicationResponse]:
    """Allows an authenticated creator to submit an application/proposal to a published campaign."""
    app_result = await brief_service.apply_to_brief(brief_id=brief_id, creator_id=current_user.id, data=data)
    return ApiResponse(success=True, data=app_result, message="Application submitted successfully")


@router.get("/{brief_id}/applications", response_model=ApiResponse[List[CampaignApplicationResponse]], summary="List applications for brief")
async def list_applications_for_brief(
    brief_id: UUID = Path(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[List[CampaignApplicationResponse]]:
    """Retrieves all creator proposals/applications submitted for a brand's campaign brief."""
    apps = await brief_service.list_applications_for_brief(brief_id=brief_id, brand_id=current_user.id)
    return ApiResponse(success=True, data=apps)


@router.get("/applications/my", response_model=ApiResponse[List[CampaignApplicationResponse]], summary="List creator's applications")
@router.get("/applications/mine", response_model=ApiResponse[List[CampaignApplicationResponse]], summary="List creator's applications (alias)")
async def list_my_applications(
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[List[CampaignApplicationResponse]]:
    """Retrieves all applications submitted by the authenticated creator."""
    apps = await brief_service.list_my_applications(creator_id=current_user.id)
    return ApiResponse(success=True, data=apps)


@router.patch("/applications/{application_id}/status", response_model=ApiResponse[CampaignApplicationResponse], summary="Update application status")
async def update_application_status(
    application_id: UUID = Path(...),
    data: CampaignApplicationUpdate = Body(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[CampaignApplicationResponse]:
    """Updates application status (e.g. ACCEPTED, SHORTLISTED, REJECTED) and initializes collaboration workspace on accept."""
    updated = await brief_service.update_application_status(application_id=application_id, brand_id=current_user.id, data=data)
    return ApiResponse(success=True, data=updated, message=f"Application status updated to {data.status.value}")

