"""AI generation jobs repository implementation."""

from typing import List, Optional, Dict, Any
from uuid import UUID
from app.repositories.base import BaseRepository
from app.schemas.generation import GenerationJobResponse


class GenerationJobRepository(BaseRepository[GenerationJobResponse]):
    """Repository handling AI generation job tracking."""

    def __init__(self):
        self._store: Dict[UUID, GenerationJobResponse] = {}

    async def get_by_id(self, id: UUID) -> Optional[GenerationJobResponse]:
        return self._store.get(id)

    async def list_by_user(self, user_id: str) -> List[GenerationJobResponse]:
        return [job for job in self._store.values() if job.user_id == user_id]

    async def list_all(
        self, skip: int = 0, limit: int = 20, filters: Optional[Dict[str, Any]] = None
    ) -> List[GenerationJobResponse]:
        jobs = list(self._store.values())
        return jobs[skip : skip + limit]

    async def create(self, entity: GenerationJobResponse) -> GenerationJobResponse:
        self._store[entity.id] = entity
        return entity

    async def update(self, id: UUID, update_data: Dict[str, Any]) -> Optional[GenerationJobResponse]:
        existing = self._store.get(id)
        if not existing:
            return None
        updated_dict = existing.model_dump()
        updated_dict.update(update_data)
        updated_entity = GenerationJobResponse(**updated_dict)
        self._store[id] = updated_entity
        return updated_entity

    async def delete(self, id: UUID) -> bool:
        if id in self._store:
            del self._store[id]
            return True
        return False
