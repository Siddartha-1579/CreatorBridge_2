"""Search request and history schemas with strict input sanitization."""

import re
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from app.schemas.creator import CreatorProfileResponse


class SearchRequest(BaseModel):
    """
    Validated search query schema.
    Guarantees search inputs are treated purely as text data, never SQL.
    """
    query: str = Field(min_length=1, max_length=100, description="Search term")
    tools: List[str] = Field(default_factory=list, max_length=10)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=50)

    @field_validator("query")
    @classmethod
    def sanitize_query_text(cls, v: str) -> str:
        # Strip null bytes and control characters
        cleaned = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", v).strip()
        if not cleaned:
            raise ValueError("Search query cannot be empty after sanitization")
        return cleaned


class SearchHistoryResponse(BaseModel):
    """Private search history item belonging strictly to the authenticated user."""
    id: UUID
    query: str
    created_at: datetime
    source: str = "marketplace"
