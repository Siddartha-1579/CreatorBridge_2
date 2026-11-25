"""Common API response and request envelope schemas."""

from typing import Generic, Optional, TypeVar, Any, Dict, List
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Query parameters for paginated endpoints."""
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")


class PaginationMeta(BaseModel):
    """Pagination metadata in responses."""
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard generic envelope for paginated collections."""
    items: List[T]
    total: int
    page: int
    page_size: int
    has_next: bool = False


class ApiResponse(BaseModel, Generic[T]):
    """Standard unified success envelope for all endpoints."""
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None


class ApiErrorDetail(BaseModel):
    """Detailed error object inside error response."""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ApiErrorResponse(BaseModel):
    """Standard unified error envelope for all failures."""
    success: bool = False
    error: ApiErrorDetail
