from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, Body
from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.common import ApiResponse
from app.schemas.project import ProjectWorkspaceCreate, ProjectWorkspaceUpdate, ProjectWorkspaceResponse
from app.services import project_service

router = APIRouter()


class ProjectAcceptanceRequest(BaseModel):
    quality_score: float = Field(default=85.0, ge=0, le=100)
    brief_compliance_score: float = Field(default=85.0, ge=0, le=100)
    collaboration_score: float = Field(default=85.0, ge=0, le=100)
    feedback: Optional[str] = None


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
    """Retrieves project workspace details, enforcing ownership."""
    project = await project_service.get_project_by_id(project_id, user_id=current_user.id)
    return ApiResponse(success=True, data=project)


@router.post("", response_model=ApiResponse[ProjectWorkspaceResponse], summary="Create project workspace")
async def create_project(
    data: ProjectWorkspaceCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[ProjectWorkspaceResponse]:
    """Creates a new project collaboration workspace."""
    if not data.brand_id or current_user.role in ["BRAND", "AGENCY"]:
        data.brand_id = current_user.id
    project = await project_service.create_workspace(data)
    return ApiResponse(success=True, data=project, message="Project workspace created")


@router.patch("/{project_id}", response_model=ApiResponse[ProjectWorkspaceResponse], summary="Update project workspace")
async def update_project(
    project_id: UUID,
    data: ProjectWorkspaceUpdate = Body(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[ProjectWorkspaceResponse]:
    """Updates status, milestones, deliverables, or messages in project workspace."""
    updated = await project_service.update_workspace(project_id, current_user.id, data)
    return ApiResponse(success=True, data=updated, message="Project workspace updated")


@router.post("/{project_id}/accept", response_model=ApiResponse[Dict[str, Any]], summary="Accept project deliverable and award achievements")
async def accept_project(
    project_id: UUID,
    body: ProjectAcceptanceRequest = Body(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[Dict[str, Any]]:
    """Allows an authorized brand client to formally accept a completed project workspace deliverable,
    transitioning status to APPROVED and recording verified creator achievement points.
    """
    result = await project_service.accept_project(
        project_id=project_id,
        user_id=current_user.id,
        quality_score=body.quality_score,
        brief_compliance_score=body.brief_compliance_score,
        collaboration_score=body.collaboration_score,
        feedback=body.feedback,
    )
    return ApiResponse(success=True, data=result, message="Project accepted and creator achievement points awarded.")
