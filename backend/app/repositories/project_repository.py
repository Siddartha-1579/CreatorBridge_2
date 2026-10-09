"""Project workspace repository implementation."""

from typing import List, Optional, Dict, Any
from uuid import UUID
from app.repositories.base import BaseRepository
from app.schemas.project import ProjectWorkspaceResponse, ProjectStatus


class ProjectRepository(BaseRepository[ProjectWorkspaceResponse]):
    """Repository handling project workspaces database persistence."""

    def __init__(self):
        self._store: Dict[UUID, ProjectWorkspaceResponse] = {}

    async def get_by_id(self, id: UUID) -> Optional[ProjectWorkspaceResponse]:
        return self._store.get(id)

    async def list_for_user(self, user_id: str) -> List[ProjectWorkspaceResponse]:
        return [
            p for p in self._store.values()
            if str(p.creator_id) == user_id or str(p.brand_id) == user_id
        ]

    async def list_all(
        self, skip: int = 0, limit: int = 20, filters: Optional[Dict[str, Any]] = None
    ) -> List[ProjectWorkspaceResponse]:
        projects = list(self._store.values())
        return projects[skip : skip + limit]

    async def create(self, entity: ProjectWorkspaceResponse) -> ProjectWorkspaceResponse:
        self._store[entity.id] = entity
        return entity

    async def update(self, id: UUID, update_data: Dict[str, Any]) -> Optional[ProjectWorkspaceResponse]:
        existing = self._store.get(id)
        if not existing:
            return None
        updated_dict = existing.model_dump()
        updated_dict.update(update_data)
        updated_entity = ProjectWorkspaceResponse(**updated_dict)
        self._store[id] = updated_entity
        return updated_entity

    async def delete(self, id: UUID) -> bool:
        if id in self._store:
            del self._store[id]
            return True
        return False
