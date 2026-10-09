"""Creator and Brief matching schemas implementing 7 explainable weighted factors."""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class MatchScoreFactor(BaseModel):
    """Individual explainable factor score in the 7-factor matching model."""
    factor_name: str
    weight: float = Field(ge=0.0, le=1.0)
    score: float = Field(ge=0.0, le=100.0)
    explanation: str
    confidence: float = Field(default=0.9, ge=0.0, le=1.0)


class CreatorMatchResult(BaseModel):
    """Ranked match result for a single creator evaluated against a campaign brief."""
    creator_id: str
    creator_handle: str
    creator_name: Optional[str] = None
    creator_level: Optional[str] = None
    creator_avatar_url: Optional[str] = None
    reputation_score: float = 4.8
    overall_match_score: float = Field(ge=0.0, le=100.0)
    factors: List[MatchScoreFactor] = Field(default_factory=list)
    summary_explanation: str
    top_strengths: List[str] = Field(default_factory=list)
    potential_gaps: List[str] = Field(default_factory=list)
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
    limit: int = Field(default=20, ge=1, le=100)


class MatchEngineWeights(BaseModel):
    """Configuration weights for the 7 matching engine dimensions (sums to 1.0)."""
    skills_and_portfolio: float = 0.30
    niche_and_category: float = 0.20
    format_and_platform: float = 0.15
    target_audience: float = 0.10
    budget_compatibility: float = 0.10
    timeline_and_availability: float = 0.10
    preferences_and_values: float = 0.05
