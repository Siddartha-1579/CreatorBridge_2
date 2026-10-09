"""Project workspace schemas."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel
from app.models.base import BaseDomainModel


class ProjectStatus(str, Enum):
    INITIATED = "INITIATED"
    IN_PRODUCTION = "IN_PRODUCTION"
    REVIEW = "REVIEW"
    REVISION_REQUESTED = "REVISION_REQUESTED"
    APPROVED = "APPROVED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class ProjectWorkspaceBase(BaseModel):
    title: str
    brief_id: Optional[str] = None
    brand_id: str
    creator_id: str
    agreed_budget_cents: int
    due_date: Optional[datetime] = None


class ProjectWorkspaceCreate(ProjectWorkspaceBase):
    milestones: List[Dict[str, Any]] = []


class ProjectWorkspaceResponse(BaseDomainModel, ProjectWorkspaceBase):
    status: ProjectStatus = ProjectStatus.INITIATED
    milestones: List[Dict[str, Any]] = []
