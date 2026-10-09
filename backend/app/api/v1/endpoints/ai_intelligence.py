"""API endpoints for Phase 2: AI Question Generation, Survey Intelligence, and Description Improvement."""

from fastapi import APIRouter, Depends, Body
from app.core.security import get_current_user, require_role, AuthenticatedUser, UserRole
from app.core.rate_limit import api_rate_limiter
from app.schemas.common import ApiResponse
from app.schemas.ai_intelligence import (
    SurveyIntelligenceRequest,
    SurveyIntelligenceResponse,
    ProfileImprovementRequest,
    ProfileImprovementResponse,
    BriefClarificationRequest,
    BriefClarificationResponse,
    AIUsageStatusResponse,
)
from app.services.ai_intelligence_service import ai_intelligence_service
from app.core.logging import get_logger

logger = get_logger("endpoints.ai_intelligence")

router = APIRouter()


@router.post(
    "/survey/evaluate",
    response_model=ApiResponse[SurveyIntelligenceResponse],
    dependencies=[Depends(api_rate_limiter)],
    summary="Evaluate survey answers and generate adaptive follow-up questions",
)
async def evaluate_survey_intelligence(
    request: SurveyIntelligenceRequest = Body(...),
) -> ApiResponse[SurveyIntelligenceResponse]:
    """
    Evaluates current Creator or Brand survey responses.
    Detects missing required fields, logical contradictions, and ambiguities,
    and returns prioritized, validated follow-up questions.
    """
    result = await ai_intelligence_service.evaluate_survey(request)
    return ApiResponse(
        success=True,
        data=result,
        message="Survey intelligence evaluation completed",
    )


@router.post(
    "/creator/improve-profile",
    response_model=ApiResponse[ProfileImprovementResponse],
    dependencies=[Depends(api_rate_limiter)],
    summary="AI profile description and headline improvement",
)
async def improve_creator_profile(
    request: ProfileImprovementRequest = Body(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[ProfileImprovementResponse]:
    """
    Refines a creator's biography and headline for professional clarity and brand appeal.
    Strictly preserves declared facts, tools, and skills with zero fabrication.
    """
    result = await ai_intelligence_service.improve_creator_profile(request)
    return ApiResponse(
        success=True,
        data=result,
        message="Profile description refined successfully",
    )


@router.post(
    "/brand/clarify-brief",
    response_model=ApiResponse[BriefClarificationResponse],
    dependencies=[Depends(api_rate_limiter)],
    summary="AI campaign brief clarification and detail review",
)
async def clarify_brand_brief(
    request: BriefClarificationRequest = Body(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.BRAND, UserRole.AGENCY])),
) -> ApiResponse[BriefClarificationResponse]:
    """
    Analyzes an in-progress campaign brief draft, identifies missing deliverables,
    timeline discrepancies, and suggests tailored refinements without publishing.
    """
    result = await ai_intelligence_service.clarify_brand_brief(request)
    return ApiResponse(
        success=True,
        data=result,
        message="Brief clarification assessment completed",
    )


@router.get(
    "/usage-status",
    response_model=ApiResponse[AIUsageStatusResponse],
    summary="Get AI intelligence service status and cost tracking",
)
async def get_ai_usage_status(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[AIUsageStatusResponse]:
    """
    Returns AI provider status, model configuration, and cost tracking metrics.
    Never exposes provider API keys or authorization headers.
    """
    status = ai_intelligence_service.get_usage_status()
    return ApiResponse(
        success=True,
        data=status,
    )
