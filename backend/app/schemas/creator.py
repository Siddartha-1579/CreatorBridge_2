"""Creator schemas with portfolio integration, verification signals, and completeness tracking."""

from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, HttpUrl
from app.models.base import BaseDomainModel


class CreatorLevel(str, Enum):
    EXPLORER = "EXPLORER"
    PRACTITIONER = "PRACTITIONER"
    SKILLED = "SKILLED"
    PRO_CREATOR = "PRO_CREATOR"
    ADVANCED = "ADVANCED"
    AI_MASTER = "AI_MASTER"
    STUDIO_PARTNER = "STUDIO_PARTNER"


class VerificationType(str, Enum):
    EMAIL_VERIFIED = "EMAIL_VERIFIED"
    TOOL_VERIFIED = "TOOL_VERIFIED"
    PORTFOLIO_VERIFIED = "PORTFOLIO_VERIFIED"
    WORKFLOW_VERIFIED = "WORKFLOW_VERIFIED"
    IDENTITY_VERIFIED = "IDENTITY_VERIFIED"
    EXPERIENCE_VERIFIED = "EXPERIENCE_VERIFIED"


class VerificationStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class VerificationBadge(BaseModel):
    type: VerificationType
    label: str
    status: VerificationStatus
    target_id: Optional[str] = None
    verified_at: Optional[datetime] = None


class VerificationRecordCreate(BaseModel):
    verification_type: VerificationType
    target_id: Optional[str] = None
    evidence_reference: Optional[str] = Field(None, max_length=500, description="Private proof URL or evidence note")
    notes: Optional[str] = Field(None, max_length=1000)


class VerificationRecordResponse(BaseModel):
    id: UUID
    creator_id: UUID
    verification_type: VerificationType
    target_id: Optional[str] = None
    status: VerificationStatus
    notes: Optional[str] = None
    created_at: datetime


class ProfileCompletenessItem(BaseModel):
    key: str
    label: str
    completed: bool
    impact_pct: int
    action_hint: str


class ProfileCompletenessResponse(BaseModel):
    percentage: int
    items: List[ProfileCompletenessItem]
    improvement_tips: List[str]


class CreatorProfileBase(BaseModel):
    handle: str
    headline: Optional[str] = None
    primary_specialization: Optional[str] = None
    secondary_specializations: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    ai_tools: List[str] = Field(default_factory=list)
    content_types: List[str] = Field(default_factory=list)
    target_niches: List[str] = Field(default_factory=list)
    preferred_formats: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    social_links: Dict[str, str] = Field(default_factory=dict)
    hourly_rate_cents: Optional[int] = None
    bio: Optional[str] = None
    visibility: str = "PUBLIC"


class CreatorProfileCreate(CreatorProfileBase):
    pass


class CreatorProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    social_links: Optional[Dict[str, str]] = None
    primary_specialization: Optional[str] = None
    secondary_specializations: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    ai_tools: Optional[List[str]] = None
    content_types: Optional[List[str]] = None
    target_niches: Optional[List[str]] = None
    preferred_formats: Optional[List[str]] = None
    hourly_rate_cents: Optional[int] = None
    visibility: Optional[str] = None


class CreatorProfileResponse(BaseDomainModel, CreatorProfileBase):
    user_id: str
    full_name: str
    level: CreatorLevel = CreatorLevel.EXPLORER
    level_name: str = "AI Explorer"
    reputation_score: float = 0.00
    is_verified: bool = False
    assessment_completed: bool = False
    profile_completeness_pct: int = 50
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CreatorProfileDetailResponse(CreatorProfileResponse):
    verification_badges: List[VerificationBadge] = Field(default_factory=list)
    dimension_scores: Dict[str, float] = Field(default_factory=dict)
    portfolio_count: int = 0
    trust_signals: List[str] = Field(default_factory=list)
