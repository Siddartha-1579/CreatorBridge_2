"""Project workspace schemas."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict
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
    model_config = ConfigDict(populate_by_name=True)

    title: str
    brief_id: Optional[str] = Field(None, alias="briefId")
    brand_id: Optional[str] = Field(None, alias="brandId")
    creator_id: str = Field(..., alias="creatorId")
    agreed_budget_cents: int = Field(..., alias="agreedBudgetCents")
    due_date: Optional[datetime] = Field(None, alias="dueDate")


class ProjectWorkspaceCreate(ProjectWorkspaceBase):
    milestones: List[Dict[str, Any]] = []
    deliverables: List[Dict[str, Any]] = []
    messages: List[Dict[str, Any]] = []


class ProjectWorkspaceUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: Optional[str] = None
    status: Optional[ProjectStatus] = None
    milestones: Optional[List[Dict[str, Any]]] = None
    deliverables: Optional[List[Dict[str, Any]]] = None
    messages: Optional[List[Dict[str, Any]]] = None
    agreed_budget_cents: Optional[int] = Field(None, alias="agreedBudgetCents")
    due_date: Optional[datetime] = Field(None, alias="dueDate")


class ProjectWorkspaceResponse(BaseDomainModel, ProjectWorkspaceBase):
    status: ProjectStatus = ProjectStatus.INITIATED
    milestones: List[Dict[str, Any]] = []
    deliverables: List[Dict[str, Any]] = []
    messages: List[Dict[str, Any]] = []
