"""Portfolio schemas for AI creative project showcases."""

from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.base import BaseDomainModel


class AssetType(str, Enum):
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"
    ANIMATION = "ANIMATION"
    AUDIO = "AUDIO"
    GRAPHIC = "GRAPHIC"
    TEXT = "TEXT"
    STORYBOARD = "STORYBOARD"
    WORKFLOW = "WORKFLOW"


class CommercialUseStatus(str, Enum):
    COMMERCIAL_READY = "COMMERCIAL_READY"
    COMMERCIAL_USE_WITH_PERMISSION = "COMMERCIAL_USE_WITH_PERMISSION"
    PERSONAL_PROJECT = "PERSONAL_PROJECT"
    UNKNOWN = "UNKNOWN"


class AIGenerationType(str, Enum):
    AI_GENERATED = "AI_GENERATED"
    AI_ASSISTED = "AI_ASSISTED"


class ProjectVisibility(str, Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"
    UNPUBLISHED = "UNPUBLISHED"


class WorkflowStage(BaseModel):
    stage_name: str
    description: str
    tools_used: List[str] = Field(default_factory=list)


class PortfolioProjectBase(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    description: Optional[str] = Field(None, max_length=2000)
    category: str = "AI Video"
    content_type: str = "Short-form Video"
    media_type: AssetType = AssetType.VIDEO
    thumbnail_url: Optional[str] = None
    media_url: str = Field(min_length=1)
    tools: List[str] = Field(default_factory=list)
    models: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    workflow_summary: Optional[str] = Field(None, max_length=2000)
    workflow_stages: List[WorkflowStage] = Field(default_factory=list)
    aspect_ratio: str = "16:9"
    resolution: str = "1080p"
    duration_seconds: Optional[int] = None
    commercial_use_status: CommercialUseStatus = CommercialUseStatus.COMMERCIAL_READY
    ai_generation_type: AIGenerationType = AIGenerationType.AI_GENERATED
    visibility: ProjectVisibility = ProjectVisibility.PUBLIC
    is_featured: bool = False
    external_url: Optional[str] = None


class PortfolioProjectCreate(PortfolioProjectBase):
    pass


class PortfolioProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    category: Optional[str] = None
    content_type: Optional[str] = None
    media_type: Optional[AssetType] = None
    thumbnail_url: Optional[str] = None
    media_url: Optional[str] = None
    tools: Optional[List[str]] = None
    models: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    workflow_summary: Optional[str] = None
    workflow_stages: Optional[List[WorkflowStage]] = None
    aspect_ratio: Optional[str] = None
    resolution: Optional[str] = None
    duration_seconds: Optional[int] = None
    commercial_use_status: Optional[CommercialUseStatus] = None
    ai_generation_type: Optional[AIGenerationType] = None
    visibility: Optional[ProjectVisibility] = None
    is_featured: Optional[bool] = None
    external_url: Optional[str] = None


class PortfolioProjectResponse(BaseDomainModel, PortfolioProjectBase):
    creator_id: UUID
    verification_status: str = "UNVERIFIED"
    public_url: Optional[str] = None


class PortfolioUploadResponse(BaseModel):
    storage_path: str
    public_url: str
    media_type: str
    file_size_bytes: int


# Backward compatibility aliases
PortfolioItemBase = PortfolioProjectBase
PortfolioItemCreate = PortfolioProjectCreate
PortfolioItemResponse = PortfolioProjectResponse

