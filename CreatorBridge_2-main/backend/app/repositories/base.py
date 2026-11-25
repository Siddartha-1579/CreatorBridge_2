"""Generic Base Repository abstraction for database operations."""

from typing import Generic, TypeVar, Optional, List, Dict, Any
from uuid import UUID
from app.models.base import BaseDomainModel

ModelType = TypeVar("ModelType", bound=BaseDomainModel)


class BaseRepository(Generic[ModelType]):
    """
    Abstract base repository providing standard CRUD operations.
    Encapsulates database access details.
    """

    async def get_by_id(self, id: UUID) -> Optional[ModelType]:
        raise NotImplementedError

    async def list_all(self, skip: int = 0, limit: int = 20, filters: Optional[Dict[str, Any]] = None) -> List[ModelType]:
        raise NotImplementedError

    async def create(self, entity: ModelType) -> ModelType:
        raise NotImplementedError

    async def update(self, id: UUID, update_data: Dict[str, Any]) -> Optional[ModelType]:
        raise NotImplementedError

    async def delete(self, id: UUID) -> bool:
        raise NotImplementedError
