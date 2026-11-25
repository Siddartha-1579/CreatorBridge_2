"""AI Generation endpoints."""

from typing import List, Dict, Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.common import ApiResponse
from app.schemas.generation import GenerationJobCreate, GenerationJobResponse
from app.services import generation_service

router = APIRouter()


class SavePortfolioRequest(BaseModel):
    title: Optional[str] = None


@router.get("/jobs", response_model=ApiResponse[List[GenerationJobResponse]], summary="List AI generation jobs")
async def list_generation_jobs(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[List[GenerationJobResponse]]:
    """Lists AI generation jobs for authenticated user."""
    jobs = await generation_service.list_jobs_for_user(current_user.id)
    return ApiResponse(success=True, data=jobs)


@router.get("/jobs/{job_id}", response_model=ApiResponse[GenerationJobResponse], summary="Get AI generation job")
async def get_generation_job(
    job_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[GenerationJobResponse]:
    """Retrieves AI generation job status and output."""
    job = await generation_service.get_job_by_id(job_id)
    return ApiResponse(success=True, data=job)


@router.post("/jobs", response_model=ApiResponse[GenerationJobResponse], summary="Submit AI generation job")
async def submit_generation_job(
    data: GenerationJobCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[GenerationJobResponse]:
    """Submits a new generation job through the AI Provider Gateway."""
    job = await generation_service.submit_job(user_id=current_user.id, data=data)
    return ApiResponse(success=True, data=job, message="Generation job processed")


@router.post("/jobs/{job_id}/save-portfolio", response_model=ApiResponse[Dict[str, Any]], summary="Save generation to portfolio")
async def save_job_to_portfolio(
    job_id: UUID,
    req: SavePortfolioRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[Dict[str, Any]]:
    """Saves a completed AI asset directly to the creator's portfolio."""
    result = await generation_service.save_asset_to_portfolio(
        user_id=current_user.id,
        job_id=job_id,
        title=req.title or "AI Studio Asset",
    )
    return ApiResponse(success=True, data=result, message="Asset saved to portfolio")
