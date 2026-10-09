"""Pydantic schemas for adaptive creator onboarding and capability assessments."""

from typing import List, Optional, Dict, Any, Union
from enum import Enum
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class QuestionType(str, Enum):
    SINGLE_CHOICE = "SINGLE_CHOICE"
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    MULTIPLE_SELECT = "MULTIPLE_SELECT"
    RANKING = "RANKING"
    WORKFLOW_ORDERING = "WORKFLOW_ORDERING"
    SCENARIO = "SCENARIO"
    CONFIDENCE_SCALE = "CONFIDENCE_SCALE"
    SHORT_TEXT = "SHORT_TEXT"


class QuestionDifficulty(str, Enum):
    FOUNDATION = "FOUNDATION"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"


class SkillDimension(str, Enum):
    TECHNICAL = "TECHNICAL"
    CREATIVE = "CREATIVE"
    WORKFLOW = "WORKFLOW"
    PROBLEM_SOLVING = "PROBLEM_SOLVING"
    COMMERCIAL = "COMMERCIAL"


class AssessmentStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class QuestionOption(BaseModel):
    id: str
    label: str
    description: Optional[str] = None
    icon: Optional[str] = None
    tag: Optional[str] = None


class SurveyQuestion(BaseModel):
    id: str
    niche: str
    category: str
    difficulty: QuestionDifficulty
    type: QuestionType
    question: str
    scenario: Optional[str] = None
    options: List[QuestionOption] = []
    weight: int = 1
    skill_dimension: SkillDimension
    branch_condition: Optional[Dict[str, Any]] = None
    placeholder: Optional[str] = None
    min_rating: Optional[int] = None
    max_rating: Optional[int] = None
    required: bool = True


class SpecializationOption(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    popular_tools: List[str]
    primary_dimensions: List[str]


class SurveyConfigResponse(BaseModel):
    specializations: List[SpecializationOption]
    tool_catalog: List[Dict[str, Any]]
    experience_options: List[str]


class StartAssessmentRequest(BaseModel):
    primary_specialization: Optional[str] = None
    secondary_specializations: List[str] = Field(default_factory=list)


class ResponseItem(BaseModel):
    question_id: str
    response_value: Any


class SaveResponseRequest(BaseModel):
    assessment_id: Optional[UUID] = None
    question_id: str
    response_value: Any
    current_step_index: Optional[int] = None
    integrity_signals: Optional[Dict[str, Any]] = None


class BatchResponsesRequest(BaseModel):
    assessment_id: Optional[UUID] = None
    responses: List[ResponseItem]
    current_step_index: int
    integrity_signals: Optional[Dict[str, Any]] = None


class DimensionScores(BaseModel):
    technical: float
    creative: float
    workflow: float
    problem_solving: float
    commercial: float


class AssessmentProgressResponse(BaseModel):
    assessment_id: UUID
    status: AssessmentStatus
    current_step_index: int
    total_steps: int
    primary_specialization: Optional[str] = None
    secondary_specializations: List[str] = []
    responses: Dict[str, Any] = {}
    integrity_signals: Dict[str, Any] = {}


class AssessmentResultResponse(BaseModel):
    id: UUID
    assessment_id: UUID
    user_id: str
    overall_score: float
    calculated_level: str
    level_name: str
    technical_score: float
    creative_score: float
    workflow_score: float
    problem_solving_score: float
    commercial_readiness_score: float
    dimension_scores: DimensionScores
    strengths: List[str]
    growth_areas: List[str]
    recommended_paths: List[str]
    created_at: datetime
