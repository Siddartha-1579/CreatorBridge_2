"""Base domain model definitions."""

from datetime import datetime, timezone
from uuid import UUID, uuid4
from pydantic import BaseModel, Field, ConfigDict


class BaseDomainModel(BaseModel):
    """
    Standard domain entity base model.
    Enforces UUID primary keys and UTC timestamps across all domain objects.
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
