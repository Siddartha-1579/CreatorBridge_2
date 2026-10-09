"""Survey API endpoints for CreatorBridge Adaptive Surveys."""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Path, Body
from app.core.security import get_current_user, AuthenticatedUser
from app.core.rate_limit import api_rate_limiter
from app.core.errors import ValidationException
from app.schemas.common import ApiResponse
from app.schemas.surveys import (
    SurveySchemaResponse,
    SurveyDraftSaveRequest,
    SurveySubmitRequest,
    SurveyResponseRecord,
    AdaptiveEvaluationRequest,
    AdaptiveEvaluationResponse,
)
from app.services.survey_engine import survey_engine
from app.repositories.survey_repository import survey_repository
from app.core.logging import get_logger

logger = get_logger("endpoints.surveys")

router = APIRouter()


@router.get(
    "/{survey_type}/schema",
    response_model=ApiResponse[SurveySchemaResponse],
    summary="Get complete declarative survey schema",
)
async def get_survey_schema(
    survey_type: str = Path(..., description="Survey type: 'creator' or 'brand'"),
) -> ApiResponse[SurveySchemaResponse]:
    """Retrieves full declarative schema with all sections and questions."""
    try:
        schema = survey_engine.get_survey_schema(survey_type)
        return ApiResponse(success=True, data=schema)
    except ValueError as e:
        raise ValidationException(str(e))


@router.post(
    "/{survey_type}/evaluate-adaptive",
    response_model=ApiResponse[AdaptiveEvaluationResponse],
    dependencies=[Depends(api_rate_limiter)],
    summary="Evaluate dynamic conditional questions and AI checkpoints",
)
async def evaluate_adaptive_survey(
    survey_type: str = Path(..., description="Survey type: 'creator' or 'brand'"),
    body: AdaptiveEvaluationRequest = Body(...),
) -> ApiResponse[AdaptiveEvaluationResponse]:
    """
    Evaluates conditional visibility rules against currently selected answers,
    and returns visible question IDs plus optional checkpoint follow-ups.
    """
    try:
        eval_result = survey_engine.evaluate_adaptive(
            survey_type=survey_type,
            current_answers=body.current_answers,
            section_key=body.section_key,
        )
        return ApiResponse(success=True, data=eval_result)
    except ValueError as e:
        raise ValidationException(str(e))


@router.get(
    "/{survey_type}/draft",
    response_model=ApiResponse[Optional[SurveyResponseRecord]],
    summary="Get saved survey draft for current user",
)
async def get_survey_draft(
    survey_type: str = Path(..., description="Survey type: 'creator' or 'brand'"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[Optional[SurveyResponseRecord]]:
    """Retrieves ongoing survey draft if previously saved."""
    draft = await survey_repository.get_response(str(current_user.id), survey_type)
    return ApiResponse(success=True, data=draft)


@router.post(
    "/{survey_type}/draft",
    response_model=ApiResponse[SurveyResponseRecord],
    dependencies=[Depends(api_rate_limiter)],
    summary="Save partial survey draft to resume later",
)
async def save_survey_draft(
    survey_type: str = Path(..., description="Survey type: 'creator' or 'brand'"),
    body: SurveyDraftSaveRequest = Body(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[SurveyResponseRecord]:
    """Saves progress at the current section with partial responses."""
    record = await survey_repository.save_draft(
        user_id=str(current_user.id),
        survey_type=survey_type,
        current_section_index=body.current_section_index,
        answers=body.answers,
    )
    return ApiResponse(
        success=True,
        data=record,
        message="Survey progress saved successfully.",
    )


@router.post(
    "/{survey_type}/submit",
    response_model=ApiResponse[SurveyResponseRecord],
    dependencies=[Depends(api_rate_limiter)],
    summary="Validate and submit completed onboarding survey",
)
async def submit_survey(
    survey_type: str = Path(..., description="Survey type: 'creator' or 'brand'"),
    body: SurveySubmitRequest = Body(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[SurveyResponseRecord]:
    """
    Performs comprehensive validation of all visible required questions,
    records submission, and structures the professional profile.
    """
    errors = survey_engine.validate_responses(survey_type, body.answers)
    if errors:
        raise ValidationException(
            f"Survey validation failed: {'; '.join(errors)}"
        )

    record = await survey_repository.submit_survey(
        user_id=str(current_user.id),
        survey_type=survey_type,
        answers=body.answers,
    )
    return ApiResponse(
        success=True,
        data=record,
        message="Onboarding survey successfully submitted and profile established.",
    )
