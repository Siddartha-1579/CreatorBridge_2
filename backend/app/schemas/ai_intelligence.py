"""Pydantic schemas for Phase 2: AI Question Generation, Intelligence, and Description Refinement."""

from typing import List, Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field
from app.schemas.surveys import SurveyQuestionOption, InputType


class CompletionStatus(str, Enum):
    COMPLETE = "complete"
    NEEDS_CLARIFICATION = "needs_clarification"
    INCOMPLETE = "incomplete"


class IssueSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class FieldImportance(str, Enum):
    REQUIRED = "required"
    RECOMMENDED = "recommended"
    OPTIONAL = "optional"


class QuestionPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class MissingFieldItem(BaseModel):
    field_id: str
    section_key: str
    field_name: str
    importance: FieldImportance = FieldImportance.REQUIRED
    reason: str


class ContradictionItem(BaseModel):
    field_ids: List[str]
    title: str
    description: str
    severity: IssueSeverity = IssueSeverity.WARNING
    recommended_resolution: str


class AmbiguityItem(BaseModel):
    field_id: str
    current_value: Any
    clarification_needed: str
    why: str


class GeneratedFollowupQuestion(BaseModel):
    id: str
    section: str
    field: str
    question: str
    input_type: str = "text"  # "text", "textarea", "single_choice", "multi_select", "number"
    required: bool = False
    options: List[SurveyQuestionOption] = Field(default_factory=list)
    help_text: Optional[str] = None
    why_asking: str
    priority: QuestionPriority = QuestionPriority.MEDIUM


class SurveyIntelligenceRequest(BaseModel):
    survey_type: str = Field(..., description="'creator' or 'brand'")
    current_answers: Dict[str, Any] = Field(default_factory=dict)
    current_section: Optional[str] = None
    questions_already_asked: List[str] = Field(default_factory=list)
    max_questions: int = Field(default=3, ge=1, le=10)
    user_requested_clarification: Optional[str] = None


class SurveyIntelligenceResponse(BaseModel):
    completion_status: CompletionStatus
    completion_percentage: int
    missing_fields: List[MissingFieldItem] = Field(default_factory=list)
    contradictions: List[ContradictionItem] = Field(default_factory=list)
    ambiguities: List[AmbiguityItem] = Field(default_factory=list)
    questions: List[GeneratedFollowupQuestion] = Field(default_factory=list)
    reasoning_summary: str
    is_ai_powered: bool = False
    fallback_mode: bool = False
    usage: Dict[str, Any] = Field(default_factory=dict)


class ProfileImprovementRequest(BaseModel):
    original_headline: Optional[str] = None
    original_bio: str = Field(..., min_length=5, max_length=2000)
    skills: List[str] = Field(default_factory=list)
    specializations: List[str] = Field(default_factory=list)
    ai_tools: List[str] = Field(default_factory=list)
    tone: Optional[str] = "professional_creative"


class ProfileImprovementResponse(BaseModel):
    improved_headline: Optional[str] = None
    improved_bio: str
    original_bio: str
    changes_summary: str
    missing_info_suggestions: List[str] = Field(default_factory=list)
    preserved_facts: List[str] = Field(default_factory=list)
    is_ai_powered: bool = False


class BriefClarificationRequest(BaseModel):
    brief_draft: Dict[str, Any] = Field(..., description="Draft brief data containing title, idea, deliverables, etc.")


class BriefClarificationResponse(BaseModel):
    missing_details: List[MissingFieldItem] = Field(default_factory=list)
    contradictions: List[ContradictionItem] = Field(default_factory=list)
    clarification_questions: List[GeneratedFollowupQuestion] = Field(default_factory=list)
    suggested_refinements: Dict[str, Any] = Field(default_factory=dict)
    reasoning_summary: str
    is_ai_powered: bool = False


class AIUsageStatusResponse(BaseModel):
    provider: str
    model: str
    is_configured: bool
    fallback_active: bool
    max_questions_limit: int
    timeout_seconds: int
    total_requests_tracked: int
    total_tokens_tracked: int
