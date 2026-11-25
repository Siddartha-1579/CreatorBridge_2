"""Creator and Brief matching schemas implementing deterministic, explainable evidence-based matching."""

from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field


class EligibilityStatus(str, Enum):
    """Eligibility classification for a creator evaluated against a brief."""
    ELIGIBLE_MATCH = "ELIGIBLE_MATCH"
    POTENTIAL_MATCH_INFO_MISSING = "POTENTIAL_MATCH_INFO_MISSING"
    NOT_ELIGIBLE = "NOT_ELIGIBLE"


class RequirementState(str, Enum):
    """Tri-state requirement verification status."""
    SATISFIED = "SATISFIED"
    UNMET = "UNMET"
    UNKNOWN = "UNKNOWN"


class RequirementCheck(BaseModel):
    """Audit of a single mandatory or optional brief requirement against creator evidence."""
    requirement_name: str
    requirement_type: str  # TOOL, SKILL, LICENSING, BUDGET, AVAILABILITY, FORMAT, VERIFICATION
    is_mandatory: bool = False
    state: RequirementState = RequirementState.SATISFIED
    details: str


class PortfolioEvidenceReference(BaseModel):
    """Concrete reference to a saved creator portfolio project supporting the match."""
    project_id: str
    title: str
    media_type: str = "VIDEO"
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    aspect_ratio: Optional[str] = None
    content_type: Optional[str] = None
    tools_used: List[str] = Field(default_factory=list)
    relevance_score: float = Field(ge=0.0, le=100.0)
    commercial_use_status: str = "COMMERCIAL_READY"
    is_verified: bool = False


class MatchScoreFactor(BaseModel):
    """Individual explainable factor score in the deterministic matching engine."""
    factor_name: str
    weight: float = Field(ge=0.0, le=1.0)
    score: float = Field(ge=0.0, le=100.0)
    explanation: str
    confidence: float = Field(default=0.9, ge=0.0, le=1.0)
    evidence: List[str] = Field(default_factory=list)


class CreatorMatchResult(BaseModel):
    """Ranked match result for a single creator evaluated against a campaign brief."""
    creator_id: str
    creator_handle: str
    creator_name: Optional[str] = None
    creator_level: Optional[str] = None
    creator_avatar_url: Optional[str] = None
    reputation_score: float = 0.0
    trust_score: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    trust_status: Optional[str] = None
    priority_placement: bool = False
    overall_match_score: float = Field(ge=0.0, le=100.0)
    score_meaning: str = "Calculated match score based on available evidence, not a probability of success or delivery guarantee."
    eligibility_status: EligibilityStatus = EligibilityStatus.ELIGIBLE_MATCH
    is_eligible: bool = True
    achievement_points: int = Field(default=0, ge=0)
    achievement_reputation_bonus: float = Field(default=0.0, ge=0.0, le=5.0)
    temporary_priority_bonus: float = Field(default=0.0, ge=0.0, le=8.0)
    priority_score: float = Field(default=0.0, ge=0.0, le=100.0)
    factors: List[MatchScoreFactor] = Field(default_factory=list)
    summary_explanation: str
    top_strengths: List[str] = Field(default_factory=list)
    potential_gaps: List[str] = Field(default_factory=list)
    unmet_requirements: List[str] = Field(default_factory=list)
    unknown_information: List[str] = Field(default_factory=list)
    requirement_checks: List[RequirementCheck] = Field(default_factory=list)
    portfolio_evidence: List[PortfolioEvidenceReference] = Field(default_factory=list)
    commercial_status: str = "UNKNOWN"
    commercial_rights_cleared: bool = False
    relative_rank_explanation: Optional[str] = None
    hourly_rate_cents: Optional[int] = None
    ai_tools: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)


class BriefMatchResult(BaseModel):
    """Ranked campaign brief opportunity recommended for an authenticated creator."""
    brief_id: str
    brief_title: str
    brand_name: Optional[str] = None
    overall_match_score: float = Field(ge=0.0, le=100.0)
    factors: List[MatchScoreFactor] = Field(default_factory=list)
    summary_explanation: str
    budget_cents: Optional[int] = None
    deadline: Optional[datetime] = None
    category: Optional[str] = None
    platforms: List[str] = Field(default_factory=list)
    required_tools: List[str] = Field(default_factory=list)


class MatchCriteria(BaseModel):
    """Input parameters for computing matches for a campaign brief."""
    brief_id: str
    required_skills: List[str] = Field(default_factory=list)
    required_tools: List[str] = Field(default_factory=list)
    target_niches: List[str] = Field(default_factory=list)
    target_platforms: List[str] = Field(default_factory=list)
    min_creator_level: Optional[str] = None
    max_budget_cents: Optional[int] = None
    require_commercial_rights: bool = True
    limit: int = Field(default=20, ge=1, le=100)


class MatchEngineWeights(BaseModel):
    """Configuration weights for the deterministic evidence-based matching engine (sums to 1.0)."""
    content_fit: float = 0.25
    skills_and_tools: float = 0.20
    portfolio_evidence: float = 0.20
    commercial_fit: float = 0.20
    trust_and_verification: float = 0.10
    practical_feasibility: float = 0.05
