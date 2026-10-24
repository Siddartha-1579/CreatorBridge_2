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

        # If brand approved the project during update, award achievement points
        if data.status == ProjectStatus.APPROVED:
            try:
                from datetime import datetime, timezone
                from app.services.achievement_service import achievement_service
                deadline_at = project.due_date.isoformat() if project.due_date else None
                achievement_service.record_verified_completion(
                    creator_id=str(project.creator_id),
                    engagement_id=str(project.id),
                    verified_by=str(user_id),
                    completed_at=datetime.now(timezone.utc).isoformat(),
                    deadline_at=deadline_at,
                    quality_score=85.0,
                    brief_compliance_score=85.0,
                    collaboration_score=85.0,
                    accepted=True,
                )
            except Exception as e:
                self.logger.warning(f"Could not record achievement for project {project_id}: {e}")

        return updated

    async def accept_project(
        self,
        project_id: UUID,
        user_id: str,
        quality_score: float = 85.0,
        brief_compliance_score: float = 85.0,
        collaboration_score: float = 85.0,
        feedback: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Formally accept a project workspace deliverable with structured rubric, awarding creator achievement points."""
        project = await self.repo.get_by_id(project_id)
        if not project:
            raise NotFoundException("Project Workspace", project_id)

        # Verify acting user is the brand client
        from app.repositories import brand_repository
        brand_profile = await brand_repository.get_by_user_id(user_id)
        brand_profile_id_str = str(brand_profile.id) if brand_profile else None
        allowed_brand_ids = {str(user_id)}
        if brand_profile_id_str:
            allowed_brand_ids.add(brand_profile_id_str)

        # Allow known demo brand accounts (Lumina Skincare)
        is_demo_brand = str(user_id) in ["00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000003"]
        if str(project.brand_id) not in allowed_brand_ids and not is_demo_brand:
            raise ForbiddenException("Only the project brand client can accept deliverables and award achievement points.")

        if project.status == ProjectStatus.CANCELLED:
            raise ForbiddenException("Cannot accept a cancelled project.")

        # Update project status to APPROVED
        await self.repo.update(project_id, {"status": ProjectStatus.APPROVED.value})

        # Calculate deadline vs completion
        from datetime import datetime, timezone
        from app.services.achievement_service import achievement_service
        completed_at = datetime.now(timezone.utc).isoformat()
        deadline_at = project.due_date.isoformat() if project.due_date else None

        # Award points via verified completion
        award_res = achievement_service.record_verified_completion(
            creator_id=str(project.creator_id),
            engagement_id=str(project.id),
            verified_by=str(user_id),
            completed_at=completed_at,
            deadline_at=deadline_at,
            quality_score=quality_score,
            brief_compliance_score=brief_compliance_score,
            collaboration_score=collaboration_score,
            accepted=True,
        )

        return {
            "project_id": str(project_id),
            "status": ProjectStatus.APPROVED.value,
            "award": award_res,
        }



project_service = ProjectService()

