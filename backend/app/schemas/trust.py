"""Pydantic schemas for CreatorBridge Transparent Honesty, Reliability & Demerit System."""

from typing import List, Dict, Any, Optional
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field


class IncidentCategory(str, Enum):
    MISREPRESENTATION = "MISREPRESENTATION"
    METRIC_FALSIFICATION = "METRIC_FALSIFICATION"
    PAYMENT_FRAUD = "PAYMENT_FRAUD"
    ASSET_MISUSE = "ASSET_MISUSE"
    COMMITMENT_BREACH = "COMMITMENT_BREACH"
    POLICY_VIOLATION = "POLICY_VIOLATION"


class IncidentSeverity(str, Enum):
    MINOR = "MINOR"         # 5 points
    MODERATE = "MODERATE"   # 15 points
    MAJOR = "MAJOR"         # 30 points
    CRITICAL = "CRITICAL"   # 50 points


class IncidentStatus(str, Enum):
    ACTIVE = "ACTIVE"
    RECOVERED = "RECOVERED"
    OVERTURNED = "OVERTURNED"


class CaseStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    AWAITING_EVIDENCE = "AWAITING_EVIDENCE"
    UNDER_REVIEW = "UNDER_REVIEW"
    CONFIRMED = "CONFIRMED"
    DISMISSED = "DISMISSED"
    APPEALED = "APPEALED"
    OVERTURNED = "OVERTURNED"


class VerifiedBadge(BaseModel):
    id: str
    title: str
    description: str
    verified_at: Optional[str] = None
    verification_source: str = "PLATFORM_AUDIT"


class TrustIncidentResponse(BaseModel):
    id: str
    account_id: str
    case_id: Optional[str] = None
    incident_category: IncidentCategory
    severity: IncidentSeverity
    base_penalty: int
    recurrence_count: int
    recurrence_multiplier: float
    calculated_penalty: int
    status: IncidentStatus
    rationale: str
    confirmed_at: str
    overturned_at: Optional[str] = None
    overturned_reason: Optional[str] = None


class TrustCaseResponse(BaseModel):
    id: str
    case_number: str
    reporting_account_id: Optional[str] = None
    reported_account_id: str
    category: IncidentCategory
    description: str
    evidence_urls: List[str] = Field(default_factory=list)
    reference_id: Optional[str] = None
    status: CaseStatus
    assigned_reviewer_id: Optional[str] = None
    decision_rationale: Optional[str] = None
    severity_assessed: Optional[IncidentSeverity] = None
    penalty_applied: int = 0
    incident_id: Optional[str] = None
    appeal_text: Optional[str] = None
    appeal_submitted_at: Optional[str] = None
    appeal_rationale: Optional[str] = None
    created_at: str
    updated_at: str


class CaseCreateRequest(BaseModel):
    reported_account_id: str
    category: IncidentCategory
    description: str
    evidence_urls: List[str] = Field(default_factory=list)
    reference_id: Optional[str] = None


class CaseReviewRequest(BaseModel):
    decision: str  # "CONFIRM" or "DISMISS"
    rationale: str
    severity: Optional[IncidentSeverity] = None


class CaseAppealRequest(BaseModel):
    appeal_text: str
    supporting_evidence: List[str] = Field(default_factory=list)


class CaseAppealDecisionRequest(BaseModel):
    decision: str  # "OVERTURN" or "UPHOLD"
    rationale: str


class TrustScoreResponse(BaseModel):
    account_id: str
    score: int = Field(ge=0, le=100)
    status_label: str
    total_active_demerits: int
    eligible_recovery_points: int
    confirmed_incidents_count: int
    overturned_incidents_count: int
    verified_badges: List[VerifiedBadge] = Field(default_factory=list)
    active_incidents: List[TrustIncidentResponse] = Field(default_factory=list)
    last_violation_at: Optional[str] = None
    last_recalculated_at: str
    scoring_policy_summary: str = (
        "Baseline score: 100. Penalties: Minor (5), Moderate (15), Major (30), Critical (50). "
        "Recurrence multipliers (1.0x, 1.25x, 1.5x) capped at 50 pts/incident. "
        "Recovery: 5 pts per qualifying 90 days without confirmed violation (max 15 pts/year)."
    )


class PublicTrustProfileResponse(BaseModel):
    account_id: str
    score: int
    status_label: str
    verified_badges: List[VerifiedBadge] = Field(default_factory=list)
    active_incidents_count: int
    last_recalculated_at: str
    transparency_notice: str = (
        "This score is a platform-specific indicator based on verified evidence and contractual reliability. "
        "It does not represent an absolute probability of honesty."
    )
