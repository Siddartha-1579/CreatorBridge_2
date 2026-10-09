"""AI generation job schemas."""

from typing import Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel
from app.models.base import BaseDomainModel
from app.schemas.portfolio import AssetType


class GenerationJobStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class GenerationJobCreate(BaseModel):
    modality: AssetType
    prompt: str
    project_id: Optional[str] = None
    parameters: Dict[str, Any] = {}
    preferred_provider: Optional[str] = None


class GenerationJobResponse(BaseDomainModel):
    user_id: str
    project_id: Optional[str] = None
    provider_name: str
    modality: AssetType
    status: GenerationJobStatus = GenerationJobStatus.PENDING
    parameters: Dict[str, Any] = {}
    result_asset_path: Optional[str] = None
    result_metadata: Dict[str, Any] = {}
    error_message: Optional[str] = None
