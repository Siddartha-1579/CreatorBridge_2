"""Pydantic schemas for CreatorBridge Adaptive Surveys."""

from typing import List, Dict, Any, Optional, Union
from enum import Enum
from pydantic import BaseModel, Field


class InputType(str, Enum):
    TEXT = "text"
    TEXTAREA = "textarea"
    SINGLE_CHOICE = "single_choice"
    MULTI_SELECT = "multi_select"
    NUMBER = "number"
    RANGE = "range"
    URL = "url"
    DATE = "date"
    TOOL_CATALOG = "tool_catalog"
    DELIVERABLE_SPECS = "deliverable_specs"


class MatchingRelevance(str, Enum):
    HIGH = "HIGH"
    STANDARD = "STANDARD"
    LOW = "LOW"
    NONE = "NONE"


class DataSensitivity(str, Enum):
    PUBLIC = "PUBLIC"
    INTERNAL_MATCHING = "INTERNAL_MATCHING"
    CONFIDENTIAL_ADMIN = "CONFIDENTIAL_ADMIN"


class SurveyQuestionOption(BaseModel):
    label: str
    value: str
    description: Optional[str] = None


class SurveyValidationRules(BaseModel):
    min: Optional[int] = None
    max: Optional[int] = None
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    pattern: Optional[str] = None
    min_items: Optional[int] = None
    max_items: Optional[int] = None


class SurveyConditionalRule(BaseModel):
    depends_on: str
    operator: str = "contains"  # "equals", "not_equals", "contains", "in", "is_true", "is_false"
    value: Any
    show_if: bool = True


class SurveyQuestion(BaseModel):
    id: str
    survey_id: str
    survey_type: str  # "CREATOR" or "BRAND"
    section_key: str
    question_text: str
    help_text: Optional[str] = None
    input_type: InputType
    is_required: bool = False
    display_order: int = 0
    options: List[SurveyQuestionOption] = Field(default_factory=list)
    validation_rules: Optional[SurveyValidationRules] = None
    conditional_rules: Optional[List[SurveyConditionalRule]] = None
    matching_relevance: MatchingRelevance = MatchingRelevance.STANDARD
    data_sensitivity: DataSensitivity = DataSensitivity.PUBLIC
    requires_verification: bool = False


class SurveySection(BaseModel):
    key: str
    title: str
    description: str
    display_order: int
    questions: List[SurveyQuestion] = Field(default_factory=list)


class SurveySchemaResponse(BaseModel):
    survey_id: str
    survey_type: str
    version: str
    title: str
    description: str
    sections: List[SurveySection]


class SurveyDraftSaveRequest(BaseModel):
    survey_type: str
    current_section_index: int = 0
    answers: Dict[str, Any] = Field(default_factory=dict)


class SurveySubmitRequest(BaseModel):
    survey_type: str
    answers: Dict[str, Any]


class SurveyResponseRecord(BaseModel):
    id: str
    user_id: str
    survey_type: str
    survey_version: str
    current_section_index: int
    is_completed: bool
    answers: Dict[str, Any]
    completed_at: Optional[str] = None
    updated_at: str


class AdaptiveEvaluationRequest(BaseModel):
    survey_type: str
    current_answers: Dict[str, Any] = Field(default_factory=dict)
    section_key: Optional[str] = None


class AIFollowupQuestion(BaseModel):
    id: str
    question_text: str
    purpose: str
    section_key: str
    input_type: InputType = InputType.TEXT
    is_required: bool = False
    options: List[SurveyQuestionOption] = Field(default_factory=list)
    trigger_reason: str


class AdaptiveEvaluationResponse(BaseModel):
    visible_question_ids: List[str]
    suggested_followups: List[AIFollowupQuestion] = Field(default_factory=list)
    ai_assisted: bool = False
    explanation: str
