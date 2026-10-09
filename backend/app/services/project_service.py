"""Project workspace domain service."""

from typing import List, Optional
from uuid import UUID, uuid4
from app.services.base import BaseService
from app.core.errors import NotFoundException
from app.repositories import project_repository, ProjectRepository
from app.schemas.project import ProjectWorkspaceCreate, ProjectWorkspaceResponse, ProjectStatus


class ProjectService(BaseService):
    """Business logic for Project Workspaces and collaboration."""

    def __init__(self, repo: Optional[ProjectRepository] = None):
        super().__init__("project")
        self.repo = repo or project_repository

    async def get_project_by_id(self, project_id: UUID) -> ProjectWorkspaceResponse:
        project = await self.repo.get_by_id(project_id)
        if not project:
            raise NotFoundException("Project Workspace", project_id)
        return project

    async def list_for_user(self, user_id: str) -> List[ProjectWorkspaceResponse]:
        return await self.repo.list_for_user(user_id)

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
        )
        return await self.repo.create(workspace)
