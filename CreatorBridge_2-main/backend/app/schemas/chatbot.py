"""Pydantic schemas for the CreatorBridge Support Chatbot."""

from typing import List, Optional
from pydantic import BaseModel, Field


class ChatbotMessageRequest(BaseModel):
    """Incoming user message payload with strict length boundaries."""

    message: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="User question about CreatorBridge platform, workflows, or troubleshooting.",
    )
    conversation_id: Optional[str] = Field(
        default=None,
        description="Optional client-side session identifier for UI tracking (not persisted in DB).",
    )


class ChatbotMessageResponse(BaseModel):
    """Structured response from the support assistant."""

    answer: str = Field(..., description="Grounded answer or polite scope refusal.")
    in_scope: bool = Field(..., description="Whether the query was classified as CreatorBridge-related.")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Confidence score in the answer grounding.")
    suggested_questions: List[str] = Field(default_factory=list, description="Follow-up suggested questions.")
    sources: List[str] = Field(default_factory=list, description="Knowledge base source modules referenced.")
    fallback_used: bool = Field(default=False, description="Whether deterministic FAQ fallback was utilized.")


class ChatbotSuggestionsResponse(BaseModel):
    """Starter prompts and supported topics for the UI widget."""

    starter_questions: List[str]
    supported_topics: List[str]
