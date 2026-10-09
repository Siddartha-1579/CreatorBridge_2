"""Project workspace endpoints."""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.common import ApiResponse
from app.schemas.project import ProjectWorkspaceCreate, ProjectWorkspaceResponse
from app.services import project_service

router = APIRouter()


@router.get("", response_model=ApiResponse[List[ProjectWorkspaceResponse]], summary="List project workspaces")
async def list_projects(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[List[ProjectWorkspaceResponse]]:
    """Lists project workspaces for current user."""
    projects = await project_service.list_for_user(current_user.id)
    return ApiResponse(success=True, data=projects)


@router.get("/{project_id}", response_model=ApiResponse[ProjectWorkspaceResponse], summary="Get project workspace")
async def get_project(
    project_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[ProjectWorkspaceResponse]:
    """Retrieves project workspace details."""
    project = await project_service.get_project_by_id(project_id)
    return ApiResponse(success=True, data=project)


@router.post("", response_model=ApiResponse[ProjectWorkspaceResponse], summary="Create project workspace")
async def create_project(
    data: ProjectWorkspaceCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[ProjectWorkspaceResponse]:
    """Creates a new project collaboration workspace."""
    project = await project_service.create_workspace(data)
    return ApiResponse(success=True, data=project, message="Project workspace created")
