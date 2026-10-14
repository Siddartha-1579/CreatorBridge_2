"""Campaign brief endpoints for creation, drafts, AI assistance, and publication."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Path, Body
from app.core.security import get_current_user, get_optional_user, AuthenticatedUser, require_role, UserRole
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
    ClipSubmissionCreate,
    ClipSubmissionReview,
    ClipSubmissionResponse,
    CampaignParticipantResponse,
    CampaignAnalyticsResponse,
    BrandCommunityPostCreate,
    BrandCommunityPostResponse,
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


# =============================================================================
# CONTENT REWARDS: PARTICIPATION (Join Workflow)
# =============================================================================
@router.post("/{brief_id}/join", response_model=ApiResponse[bool], summary="Join a campaign")
async def join_campaign(
    brief_id: UUID = Path(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[bool]:
    """Registers an authenticated creator as a participant in an open rewards campaign."""
    joined = await brief_service.join_campaign(brief_id=brief_id, creator_id=current_user.id)
    return ApiResponse(success=True, data=joined, message="Successfully joined campaign")


@router.get("/{brief_id}/participation", response_model=ApiResponse[Optional[CampaignParticipantResponse]], summary="Check participation status")
async def get_participation(
    brief_id: UUID = Path(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[Optional[CampaignParticipantResponse]]:
    """Checks whether the authenticated creator has joined this campaign."""
    part = await brief_service.get_participation(brief_id=brief_id, creator_id=current_user.id)
    return ApiResponse(success=True, data=part)


@router.get("/{brief_id}/participants", response_model=ApiResponse[List[CampaignParticipantResponse]], summary="List campaign participants")
async def list_participants(
    brief_id: UUID = Path(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[List[CampaignParticipantResponse]]:
    """Lists creators participating in a campaign. Brands see full list only for campaigns they own; creators see their own record."""
    is_brand = current_user.role in [UserRole.BRAND, UserRole.AGENCY]
    parts = await brief_service.list_campaign_participants(
        brief_id=brief_id, current_user_id=current_user.id, is_brand=is_brand
    )
    return ApiResponse(success=True, data=parts)


# =============================================================================
# CONTENT REWARDS: CLIP SUBMISSIONS
# =============================================================================
@router.post("/{brief_id}/submissions", response_model=ApiResponse[ClipSubmissionResponse], summary="Submit clip for campaign")
async def submit_clip(
    brief_id: UUID = Path(...),
    data: ClipSubmissionCreate = Body(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[ClipSubmissionResponse]:
    """Allows an enrolled creator to submit a short-form video clip to an active rewards campaign."""
    sub = await brief_service.submit_clip(brief_id=brief_id, creator_id=current_user.id, data=data)
    return ApiResponse(success=True, data=sub, message="Clip submitted for brand review")


@router.get("/{brief_id}/submissions", response_model=ApiResponse[List[ClipSubmissionResponse]], summary="List campaign clip submissions")
async def list_submissions_for_campaign(
    brief_id: UUID = Path(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[List[ClipSubmissionResponse]]:
    """Lists clip submissions for a campaign. Brands see all; creators see their own."""
    is_brand = current_user.role in [UserRole.BRAND, UserRole.AGENCY]
    subs = await brief_service.list_submissions(brief_id=brief_id, current_user_id=current_user.id, is_brand=is_brand)
    return ApiResponse(success=True, data=subs)


@router.get("/submissions/my", response_model=ApiResponse[List[ClipSubmissionResponse]], summary="List creator submissions across all campaigns")
@router.get("/submissions/mine", response_model=ApiResponse[List[ClipSubmissionResponse]], summary="List creator submissions (alias)")
async def list_my_submissions(
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[List[ClipSubmissionResponse]]:
    """Retrieves all clip submissions submitted by the authenticated creator across all campaigns."""
    subs = await brief_service.list_creator_submissions(creator_id=current_user.id)
    return ApiResponse(success=True, data=subs)


@router.patch("/submissions/{submission_id}/review", response_model=ApiResponse[ClipSubmissionResponse], summary="Review clip submission")
async def review_clip_submission(
    submission_id: UUID = Path(...),
    data: ClipSubmissionReview = Body(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[ClipSubmissionResponse]:
    """Allows a brand to approve, reject, or request revisions on a submitted clip."""
    updated = await brief_service.review_submission(submission_id=submission_id, brand_id=current_user.id, data=data)
    return ApiResponse(success=True, data=updated, message=f"Submission status updated to {data.status.value}")


# =============================================================================
# CAMPAIGN ANALYTICS & LIFECYCLE
# =============================================================================
@router.get("/{brief_id}/analytics", response_model=ApiResponse[CampaignAnalyticsResponse], summary="Get campaign analytics")
async def get_campaign_analytics(
    brief_id: UUID = Path(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[CampaignAnalyticsResponse]:
    """Retrieves real-time analytics, views tracked, payout totals, and creator leaderboard for a brand's campaign."""
    analytics = await brief_service.get_analytics(brief_id=brief_id, brand_id=current_user.id)
    return ApiResponse(success=True, data=analytics)


@router.post("/{brief_id}/pause", response_model=ApiResponse[CampaignBriefResponse], summary="Pause campaign")
async def pause_campaign(
    brief_id: UUID = Path(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[CampaignBriefResponse]:
    """Pauses an active campaign so no new submissions are accepted."""
    paused = await brief_service.pause_brief(brief_id=brief_id, brand_id=current_user.id)
    return ApiResponse(success=True, data=paused, message="Campaign paused")


@router.post("/{brief_id}/resume", response_model=ApiResponse[CampaignBriefResponse], summary="Resume campaign")
async def resume_campaign(
    brief_id: UUID = Path(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[CampaignBriefResponse]:
    """Resumes a paused campaign."""
    resumed = await brief_service.resume_brief(brief_id=brief_id, brand_id=current_user.id)
    return ApiResponse(success=True, data=resumed, message="Campaign resumed")


# =============================================================================
# BRAND COMMUNITY (Announcements, Guidelines & Contests)
# =============================================================================
@router.get("/community/posts", response_model=ApiResponse[List[BrandCommunityPostResponse]], summary="List brand community posts")
async def list_community_posts(
    brand_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
) -> ApiResponse[List[BrandCommunityPostResponse]]:
    """Lists community posts, announcements, asset packs, and winner spotlights."""
    posts = await brief_service.list_community_posts(brand_id=brand_id, category=category)
    return ApiResponse(success=True, data=posts)


@router.post("/community/posts", response_model=ApiResponse[BrandCommunityPostResponse], summary="Publish community post")
async def create_community_post(
    data: BrandCommunityPostCreate = Body(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[BrandCommunityPostResponse]:
    """Allows a brand to publish an announcement, asset pack link, or contest update to their community."""
    post = await brief_service.create_community_post(brand_id=current_user.id, data=data)
    return ApiResponse(success=True, data=post, message="Community post published")


@router.delete("/community/posts/{post_id}", response_model=ApiResponse[bool], summary="Delete community post")
async def delete_community_post(
    post_id: UUID = Path(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[bool]:
    """Allows a brand to remove an existing post from their community."""
    success = await brief_service.delete_community_post(post_id=post_id, brand_id=current_user.id)
    return ApiResponse(success=True, data=success, message="Community post deleted")


@router.post("/community/posts/{post_id}/like", response_model=ApiResponse[int], summary="Like community post")
async def like_community_post(
    post_id: UUID = Path(...),
) -> ApiResponse[int]:
    """Increments like counter for a community post."""
    count = await brief_service.like_community_post(post_id=post_id)
    return ApiResponse(success=True, data=count)


