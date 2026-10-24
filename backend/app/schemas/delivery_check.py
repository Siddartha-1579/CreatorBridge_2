"""Delivery check schemas for automated deliverable validation against campaign brief specifications."""

from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class CheckItemStatus(str, Enum):
    """Evaluation status for an individual deliverable requirement rule."""
    PASSED = "PASSED"
    FAILED = "FAILED"
    NOT_SPECIFIED = "NOT_SPECIFIED"
    UNABLE_TO_VERIFY = "UNABLE_TO_VERIFY"


class DeliveryCheckStatus(str, Enum):
    """Aggregate delivery validation status for a deliverable submission."""
    PASSED = "PASSED"
    FAILED = "FAILED"
    UNABLE_TO_VERIFY = "UNABLE_TO_VERIFY"
    PENDING = "PENDING"


class DeliveryCheckRuleItem(BaseModel):
    """Individual requirement check result with detected values and actionable guidance."""
    rule_name: str
    label: str
    status: CheckItemStatus
    required_value: Optional[str] = None
    detected_value: Optional[str] = None
    failure_reason: Optional[str] = None
    actionable_correction: Optional[str] = None


class MediaInspectionMetadata(BaseModel):
    """Detailed technical metadata extracted from the submitted binary asset."""
    media_type: Optional[str] = None  # VIDEO, IMAGE, AUDIO, ARCHIVE
    mime_type: Optional[str] = None
    container_or_format: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    aspect_ratio_label: Optional[str] = None
    aspect_ratio_value: Optional[float] = None
    duration_seconds: Optional[float] = None
    file_size_bytes: Optional[int] = None
    video_codec: Optional[str] = None
    audio_codec: Optional[str] = None
    is_valid_media: bool = True
    error_message: Optional[str] = None


class DeliveryCheckReport(BaseModel):
    """Comprehensive delivery validation report presented immediately upon submission."""
    overall_status: DeliveryCheckStatus
    is_review_ready: bool = False
    checks: List[DeliveryCheckRuleItem] = Field(default_factory=list)
    passed_count: int = 0
    failed_count: int = 0
    not_specified_count: int = 0
    unable_to_verify_count: int = 0
    suggested_fixes: List[str] = Field(default_factory=list)
    checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    media_metadata: Optional[MediaInspectionMetadata] = None
