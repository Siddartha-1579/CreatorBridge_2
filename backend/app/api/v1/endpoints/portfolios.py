"""Portfolio endpoints for AI project showcases and asset management."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Path, UploadFile, File, Form
from app.core.security import get_current_user, AuthenticatedUser, require_role, UserRole
from app.schemas.common import ApiResponse
from app.schemas.portfolio import (
    PortfolioProjectCreate,
    PortfolioProjectUpdate,
    PortfolioProjectResponse,
    PortfolioUploadResponse,
    ProjectVisibility,
)
from app.services import portfolio_service, creator_service

router = APIRouter()


@router.get("", response_model=ApiResponse[List[PortfolioProjectResponse]], summary="List portfolio projects")
async def list_portfolios(
    creator_id: str = Query(..., description="Creator ID (UUID)"),
    public_only: bool = Query(True, description="Filter for public projects only"),
) -> ApiResponse[List[PortfolioProjectResponse]]:
    """Retrieves portfolio projects for a creator."""
    if public_only:
        items = await portfolio_service.list_public_by_creator(creator_id)
    else:
        items = await portfolio_service.list_by_creator(creator_id)
    return ApiResponse(success=True, data=items)


@router.get("/{project_id}", response_model=ApiResponse[PortfolioProjectResponse], summary="Get portfolio project")
async def get_portfolio_project(
    project_id: UUID = Path(..., description="Portfolio Project ID"),
) -> ApiResponse[PortfolioProjectResponse]:
    """Retrieves single portfolio project by ID."""
    item = await portfolio_service.get_project_by_id(project_id)
    return ApiResponse(success=True, data=item)


@router.post("", response_model=ApiResponse[PortfolioProjectResponse], summary="Create portfolio project")
async def create_portfolio_project(
    data: PortfolioProjectCreate,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[PortfolioProjectResponse]:
    """Adds a new showcase project to the authenticated creator's portfolio."""
    profile = await creator_service.get_profile_by_user_id(current_user.id, current_user.email)
    item = await portfolio_service.add_project(profile.id, data)
    return ApiResponse(success=True, data=item, message="Portfolio project created successfully")


@router.patch("/{project_id}", response_model=ApiResponse[PortfolioProjectResponse], summary="Update portfolio project")
async def update_portfolio_project(
    project_id: UUID,
    data: PortfolioProjectUpdate,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[PortfolioProjectResponse]:
    """Updates attributes of an existing portfolio project."""
    profile = await creator_service.get_profile_by_user_id(current_user.id, current_user.email)
    updated = await portfolio_service.update_project(project_id, profile.id, data)
    return ApiResponse(success=True, data=updated, message="Portfolio project updated successfully")


@router.delete("/{project_id}", response_model=ApiResponse[bool], summary="Delete portfolio project")
async def delete_portfolio_project(
    project_id: UUID,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[bool]:
    """Deletes a portfolio project owned by the authenticated creator."""
    profile = await creator_service.get_profile_by_user_id(current_user.id, current_user.email)
    success = await portfolio_service.delete_project(project_id, profile.id)
    return ApiResponse(success=success, data=success, message="Portfolio project deleted")


@router.post("/{project_id}/visibility", response_model=ApiResponse[PortfolioProjectResponse], summary="Toggle project visibility")
async def update_project_visibility(
    project_id: UUID,
    visibility: ProjectVisibility = Query(..., description="Visibility status: PUBLIC, PRIVATE, UNPUBLISHED"),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[PortfolioProjectResponse]:
    """Toggles visibility status of a portfolio project."""
    profile = await creator_service.get_profile_by_user_id(current_user.id, current_user.email)
    updated = await portfolio_service.toggle_visibility(project_id, profile.id, visibility)
    return ApiResponse(success=True, data=updated, message=f"Project visibility changed to {visibility.value}")


@router.post("/upload", response_model=ApiResponse[PortfolioUploadResponse], summary="Upload portfolio asset")
async def upload_portfolio_asset(
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(require_role([UserRole.CREATOR])),
) -> ApiResponse[PortfolioUploadResponse]:
    """Validates and processes media file upload for portfolio showcases."""
    profile = await creator_service.get_profile_by_user_id(current_user.id, current_user.email)
    
    # Read bytes or measure length
    content = await file.read()
    file_size = len(content)

    upload_result = portfolio_service.validate_and_process_upload(
        filename=file.filename or "upload.mp4",
        file_size_bytes=file_size,
        content_type=file.content_type or "video/mp4",
        creator_id=profile.id,
    )
    return ApiResponse(success=True, data=upload_result, message="Media asset uploaded and verified")
