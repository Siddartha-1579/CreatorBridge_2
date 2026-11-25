"""Engagement management schemas implementing the full Stage A through E lifecycle."""

from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.base import BaseDomainModel
from app.schemas.delivery_check import DeliveryCheckReport


class EngagementStatus(str, Enum):
    """Business stages in the engagement lifecycle state machine."""
    SHORTLISTED = "SHORTLISTED"
    INVITED = "INVITED"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    AWAITING_CONFIRMATION = "AWAITING_CONFIRMATION"
    CONFIRMED = "CONFIRMED"
    IN_PRODUCTION = "IN_PRODUCTION"
    SUBMITTED = "SUBMITTED"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class ProductionProgressStatus(str, Enum):
    """Granular production states separate from overall lifecycle."""
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    BLOCKED = "BLOCKED"


class SubmissionReviewDecision(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"


class EngagementScopeTerms(BaseModel):
    """Scope, deliverables, commercial and financial terms for an engagement."""
    deliverables: List[Dict[str, Any]] = Field(default_factory=list)
    scope_description: Optional[str] = None
    budget_cents: Optional[int] = None
    currency: str = "INR"
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    revision_allowance: int = 2
    usage_rights: Optional[str] = "Commercial digital advertising and social distribution"
    commercial_rights_required: bool = True
    additional_notes: Optional[str] = None


# -----------------------------------------------------------------------------
# Request Schemas
# -----------------------------------------------------------------------------
class ShortlistRequest(BaseModel):
    """Request to shortlist a creator for a brief."""
    brief_id: str
    creator_id: str
    notes: Optional[str] = None


class EngagementInvitationRequest(BaseModel):
    """Request by a brand to invite a shortlisted creator."""
    brief_id: str
    creator_id: str
    proposed_terms: EngagementScopeTerms
    invitation_message: Optional[str] = None


class InvitationResponseRequest(BaseModel):
    """Creator response to an incoming engagement invitation."""
    action: str = Field(..., description="'ACCEPT' or 'DECLINE'")
    decline_reason: Optional[str] = None


class ScopeConfirmationRequest(BaseModel):
    """Mutual scope confirmation request."""
    confirmed_terms: EngagementScopeTerms
    notes: Optional[str] = None


class ProductionProgressUpdateRequest(BaseModel):
    """Update on production progress or blocker explanation."""
    production_status: ProductionProgressStatus
    content: str = Field(min_length=3, max_length=2000)
    blocker_details: Optional[str] = None


class DeliverableSubmissionCreate(BaseModel):
    """Creator submission of final deliverable for brand review."""
    title: str = Field(min_length=2, max_length=200)
    media_url: str = Field(min_length=5, max_length=1000)
    thumbnail_url: Optional[str] = None
    file_format: Optional[str] = "video/mp4"
    submission_notes: Optional[str] = None
    deliverable_item_id: Optional[str] = None
    file_bytes_base64: Optional[str] = None


class DeliverableReviewRequest(BaseModel):
    """Brand review decision on a submitted deliverable."""
    decision: str = Field(..., description="'ACCEPT' or 'REQUEST_CHANGES'")
    review_notes: str = Field(min_length=5, max_length=2000, description="Required review feedback or explanation of changes requested")
    quality_score: Optional[float] = Field(default=85.0, ge=0.0, le=100.0)
    brief_compliance_score: Optional[float] = Field(default=85.0, ge=0.0, le=100.0)
    collaboration_score: Optional[float] = Field(default=85.0, ge=0.0, le=100.0)


class EngagementCancellationRequest(BaseModel):
    """Request to cancel an engagement."""
    reason: str = Field(min_length=3, max_length=1000)


# -----------------------------------------------------------------------------
# Response Schemas
# -----------------------------------------------------------------------------
class EngagementDeliverableSubmissionResponse(BaseModel):
    id: UUID
    engagement_id: UUID
    creator_id: str
    version_number: int
    title: str
    media_url: str
    thumbnail_url: Optional[str] = None
    file_format: Optional[str] = None
    submission_notes: Optional[str] = None
    review_decision: str
    review_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    delivery_check_status: Optional[str] = "PENDING"
    delivery_check_report: Optional[DeliveryCheckReport] = None
    created_at: datetime
    updated_at: datetime


class EngagementProgressUpdateResponse(BaseModel):
    id: UUID
    engagement_id: UUID
    sender_id: str
    sender_role: str
    production_status: Optional[str] = None
    content: str
    blocker_details: Optional[str] = None
    created_at: datetime


class EngagementTimelineEventResponse(BaseModel):
    id: UUID
    engagement_id: UUID
    actor_id: str
    actor_role: str
    action: str
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime


class EngagementResponse(BaseDomainModel):
    brief_id: str
    brand_id: str
    creator_id: str
    status: EngagementStatus
    production_status: ProductionProgressStatus = ProductionProgressStatus.NOT_STARTED
    proposed_terms: EngagementScopeTerms = Field(default_factory=EngagementScopeTerms)
    confirmed_terms: EngagementScopeTerms = Field(default_factory=EngagementScopeTerms)
    brand_confirmed_at: Optional[datetime] = None
    brand_confirmed_by: Optional[str] = None
    creator_confirmed_at: Optional[datetime] = None
    creator_confirmed_by: Optional[str] = None
    invitation_message: Optional[str] = None
    decline_reason: Optional[str] = None
    cancellation_reason: Optional[str] = None
    cancelled_by: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completed_by: Optional[str] = None
    # Joined context for convenient UI presentation
    brief_title: Optional[str] = None
    brand_name: Optional[str] = None
    creator_name: Optional[str] = None
    creator_handle: Optional[str] = None
    creator_avatar_url: Optional[str] = None
    compatibility_score: Optional[float] = None


class EngagementDetailResponse(EngagementResponse):
    submissions: List[EngagementDeliverableSubmissionResponse] = Field(default_factory=list)
    progress_updates: List[EngagementProgressUpdateResponse] = Field(default_factory=list)
    timeline_events: List[EngagementTimelineEventResponse] = Field(default_factory=list)


class ShortlistCreatorItem(BaseModel):
    engagement_id: UUID
    brief_id: str
    creator_id: str
    creator_name: str
    creator_handle: str
    creator_avatar_url: Optional[str] = None
    primary_specialization: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    ai_tools: List[str] = Field(default_factory=list)
    hourly_rate_cents: Optional[int] = None
    reputation_score: float = 4.8
    is_verified: bool = False
    compatibility_score: Optional[float] = None
    status: EngagementStatus
    shortlisted_at: datetime
