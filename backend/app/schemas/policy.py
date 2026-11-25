"""Pydantic schemas for CreatorBridge Platform Policies and Acceptance."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class PolicySection(BaseModel):
    """Structured policy section within the CreatorBridge Platform Policy document."""
    id: str
    title: str
    category: str
    summary: str
    content: str
    key_rules: List[str] = Field(default_factory=list)


class PlatformPolicyResponse(BaseModel):
    """Complete platform policy document with active versioning and legal status."""
    model_config = ConfigDict(populate_by_name=True)

    version: str
    policy_reference: str = Field(alias="policyReference")
    status: str
    effective_date: str = Field(alias="effectiveDate")
    title: str
    sections: List[PolicySection]
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PolicyStatusResponse(BaseModel):
    """User-specific policy acceptance status and compliance check."""
    model_config = ConfigDict(populate_by_name=True)

    user_id: Optional[str] = Field(default=None, alias="userId")
    current_version: str = Field(alias="currentVersion")
    current_reference: str = Field(alias="currentReference")
    accepted: bool
    accepted_version: Optional[str] = Field(default=None, alias="acceptedVersion")
    accepted_at: Optional[str] = Field(default=None, alias="acceptedAt")
    requires_acceptance: bool = Field(alias="requiresAcceptance")


class PolicyAcceptanceRequest(BaseModel):
    """Request payload to record authenticated policy acceptance."""
    model_config = ConfigDict(populate_by_name=True)

    policy_version: str = Field(min_length=1, max_length=32, alias="policyVersion", description="Accepted policy version string")


class PolicyAcceptanceRecord(BaseModel):
    """Immutable audit record of a user's policy acceptance."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    user_id: str = Field(alias="userId")
    policy_version: str = Field(alias="policyVersion")
    policy_reference: str = Field(alias="policyReference")
    accepted_at: str = Field(alias="acceptedAt")
    ip_address: Optional[str] = Field(default=None, alias="ipAddress")
