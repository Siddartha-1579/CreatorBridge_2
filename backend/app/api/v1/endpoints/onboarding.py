"""Creator onboarding and adaptive capability assessment endpoints."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user, AuthenticatedUser, require_role, UserRole
from app.core.rate_limit import api_rate_limiter
from app.schemas.common import ApiResponse
from app.schemas.assessment import (
    SurveyConfigResponse,
    SurveyQuestion,
    StartAssessmentRequest,
    SaveResponseRequest,
    BatchResponsesRequest,
    AssessmentProgressResponse,
    AssessmentResultResponse,
)
from app.services import onboarding_service

router = APIRouter()


@router.get(
    "/survey/config",
    response_model=ApiResponse[SurveyConfigResponse],
    summary="Get onboarding survey configuration",
)
async def get_survey_config() -> ApiResponse[SurveyConfigResponse]:
    """Retrieves specialization categories, extensible tool catalog, and experience options."""
    config = onboarding_service.get_survey_config()
    return ApiResponse(success=True, data=config)


@router.get(
    "/survey/questions",
    response_model=ApiResponse[List[SurveyQuestion]],
    summary="Get adaptive questions for specialization",
)
async def get_survey_questions(
    specialization: Optional[str] = Query(None, description="Primary creator specialization"),
) -> ApiResponse[List[SurveyQuestion]]:
    """
    Returns structured, adaptive questions branched specifically for the given specialization.
    Adapts technical questions while retaining common basics, tool catalog, and commercial readiness.
    """
    questions = onboarding_service.get_questions_for_specialization(specialization)
    return ApiResponse(success=True, data=questions)


@router.post(
    "/assessment/start",
    response_model=ApiResponse[AssessmentProgressResponse],
    dependencies=[Depends(api_rate_limiter)],
    summary="Start or resume creator assessment session",
)
async def start_assessment(
    body: Optional[StartAssessmentRequest] = None,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[AssessmentProgressResponse]:
    """
    Initializes a new assessment or resumes an existing in-progress session.
    Protects against lost progress on page reload.
    """
    progress = await onboarding_service.start_or_resume_assessment(current_user.id, body)
    return ApiResponse(success=True, data=progress, message="Assessment session active")


@router.post(
    "/assessment/response",
    response_model=ApiResponse[AssessmentProgressResponse],
    dependencies=[Depends(api_rate_limiter)],
    summary="Auto-save question response",
)
async def save_response(
    body: SaveResponseRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[AssessmentProgressResponse]:
    """
    Saves an individual question answer with auto-save & progress tracking.
    Validates creator session ownership.
    """
    progress = await onboarding_service.save_response(current_user.id, body)
    return ApiResponse(success=True, data=progress, message="Response recorded")


@router.post(
    "/assessment/batch",
    response_model=ApiResponse[AssessmentProgressResponse],
    dependencies=[Depends(api_rate_limiter)],
    summary="Batch save responses and progress",
)
async def batch_save_responses(
    body: BatchResponsesRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[AssessmentProgressResponse]:
    """Batch persists multiple answers and advances current survey step."""
    progress = await onboarding_service.save_batch_responses(current_user.id, body)
    return ApiResponse(success=True, data=progress, message="Batch responses saved")


@router.get(
    "/assessment/progress",
    response_model=ApiResponse[AssessmentProgressResponse],
    summary="Get current assessment progress",
)
async def get_progress(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[AssessmentProgressResponse]:
    """Retrieves existing progress and previous responses for resume support."""
    progress = await onboarding_service.get_progress(current_user.id)
    return ApiResponse(success=True, data=progress)


@router.post(
    "/assessment/submit",
    response_model=ApiResponse[AssessmentResultResponse],
    dependencies=[Depends(api_rate_limiter)],
    summary="Submit assessment and calculate capability level",
)
async def submit_assessment(
    assessment_id: Optional[UUID] = Query(None, description="Assessment session ID"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[AssessmentResultResponse]:
    """
    Finalizes assessment, executes server-side capability scoring algorithm,
    assigns evidence-based Creator Level (Level 1 to Level 5), and updates profile.
    """
    result = await onboarding_service.submit_assessment(current_user.id, assessment_id)
    return ApiResponse(
        success=True,
        data=result,
        message="Assessment completed successfully. Capability level assigned.",
    )


@router.get(
    "/assessment/result",
    response_model=ApiResponse[AssessmentResultResponse],
    summary="Get authoritative capability assessment result",
)
async def get_assessment_result(
    assessment_id: Optional[UUID] = Query(None, description="Assessment session ID"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[AssessmentResultResponse]:
    """Retrieves calculated multi-dimensional capability scores and strengths."""
    result = await onboarding_service.get_assessment_result(current_user.id, assessment_id)
    return ApiResponse(success=True, data=result)
