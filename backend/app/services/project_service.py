from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from app.services.base import BaseService
from app.core.errors import NotFoundException, ForbiddenException
from app.repositories import project_repository, ProjectRepository
from app.schemas.project import (
    ProjectWorkspaceCreate,
    ProjectWorkspaceUpdate,
    ProjectWorkspaceResponse,
    ProjectStatus,
)


class ProjectService(BaseService):
    """Business logic for Project Workspaces and collaboration."""

    def __init__(self, repo: Optional[ProjectRepository] = None):
        super().__init__("project")
        self.repo = repo or project_repository

    async def get_project_by_id(self, project_id: UUID, user_id: Optional[str] = None) -> ProjectWorkspaceResponse:
        project = await self.repo.get_by_id(project_id)
        if not project:
            raise NotFoundException("Project Workspace", project_id)
        if user_id:
            from app.repositories import creator_repository
            creator = await creator_repository.get_by_user_id(user_id)
            profile_id_str = str(creator.id) if creator else None
            allowed_ids = {str(user_id)}
            if profile_id_str:
                allowed_ids.add(profile_id_str)
            if str(project.brand_id) not in allowed_ids and str(project.creator_id) not in allowed_ids:
                raise ForbiddenException("You do not have permission to view this project workspace")
        return project

    async def list_for_user(self, user_id: str) -> List[ProjectWorkspaceResponse]:
        from app.repositories import creator_repository
        creator = await creator_repository.get_by_user_id(user_id)
        profile_id_str = str(creator.id) if creator else None
        return await self.repo.list_for_user(user_id, profile_id=profile_id_str)

    async def create_workspace(self, data: ProjectWorkspaceCreate) -> ProjectWorkspaceResponse:
        workspace = ProjectWorkspaceResponse(
            id=uuid4(),
            title=data.title,
            brief_id=data.brief_id,
            brand_id=data.brand_id,
            creator_id=data.creator_id,
            agreed_budget_cents=data.agreed_budget_cents,
            due_date=data.due_date,
            status=ProjectStatus.INITIATED,
            milestones=data.milestones,
            deliverables=data.deliverables,
            messages=data.messages or [],
        )
        return await self.repo.create(workspace)

    async def update_workspace(
        self, project_id: UUID, user_id: str, data: ProjectWorkspaceUpdate
    ) -> ProjectWorkspaceResponse:
        project = await self.get_project_by_id(project_id, user_id=user_id)
        update_data = data.model_dump(exclude_unset=True)
        updated = await self.repo.update(project_id, update_data)
        if not updated:
            raise NotFoundException("Project Workspace", project_id)
        return updated
