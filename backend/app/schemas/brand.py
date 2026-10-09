"""Brand schemas for organization profiles, preferences, adaptive survey, and verification."""

from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.base import BaseDomainModel


class OrganizationType(str, Enum):
    CONSUMER_BRAND = "Consumer Brand"
    D2C_BRAND = "D2C Brand"
    ECOMMERCE_BUSINESS = "E-commerce Business"
    STARTUP = "Startup"
    SMB = "Small or Medium Business"
    ENTERPRISE = "Enterprise"
    CREATIVE_AGENCY = "Creative Agency"
    ADVERTISING_AGENCY = "Advertising Agency"
    MARKETING_AGENCY = "Marketing Agency"
    PRODUCTION_STUDIO = "Production Studio"
    CREATOR_MANAGEMENT = "Creator Management Agency"
    NONPROFIT = "Nonprofit Organization"
    EDUCATIONAL = "Educational Institution"
    OTHER = "Other"


class BrandVerificationStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class BrandVerificationCategory(str, Enum):
    EMAIL_VERIFIED = "EMAIL_VERIFIED"
    ORGANIZATION_IDENTITY = "ORGANIZATION_IDENTITY"
    DOMAIN_VERIFIED = "DOMAIN_VERIFIED"
    BUSINESS_REGISTRATION = "BUSINESS_REGISTRATION"


class BrandVerificationBadge(BaseModel):
    category: BrandVerificationCategory
    label: str
    status: BrandVerificationStatus
    verified_at: Optional[datetime] = None


class BrandVerificationClaimCreate(BaseModel):
    verification_type: BrandVerificationCategory
    target_identifier: Optional[str] = None
    evidence_reference: Optional[str] = Field(None, max_length=500, description="Private proof URL or corporate reference")
    notes: Optional[str] = Field(None, max_length=1000)


class BrandVerificationRecordResponse(BaseModel):
    id: UUID
    brand_id: UUID
    verification_type: BrandVerificationCategory
    status: BrandVerificationStatus
    notes: Optional[str] = None
    created_at: datetime


class BrandProfileBase(BaseModel):
    company_name: str = Field(min_length=2, max_length=100)
    organization_type: str = "Consumer Brand"
    primary_industry: Optional[str] = None
    secondary_industries: List[str] = Field(default_factory=list)
    contact_name: Optional[str] = None
    business_email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    team_size: Optional[str] = None
    social_links: Dict[str, str] = Field(default_factory=dict)
    brand_guidelines_url: Optional[str] = None
    preferred_communication: str = "EMAIL"
    is_agency: bool = False

    # Backward compatibility fields
    industry: Optional[str] = None
    company_size: Optional[str] = None
    billing_email: Optional[str] = None


class BrandProfileCreate(BrandProfileBase):
    pass


class BrandProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    organization_type: Optional[str] = None
    primary_industry: Optional[str] = None
    secondary_industries: Optional[List[str]] = None
    contact_name: Optional[str] = None
    business_email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    team_size: Optional[str] = None
    social_links: Optional[Dict[str, str]] = None
    brand_guidelines_url: Optional[str] = None
    preferred_communication: Optional[str] = None
    is_agency: Optional[bool] = None

    # Backward compatibility
    industry: Optional[str] = None
    company_size: Optional[str] = None
    billing_email: Optional[str] = None


class BrandProfileResponse(BaseDomainModel, BrandProfileBase):
    user_id: str
    verification_status: BrandVerificationStatus = BrandVerificationStatus.NOT_STARTED
    onboarding_completed: bool = False
    profile_completeness_pct: int = 25
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BrandPreferencesBase(BaseModel):
    intended_uses: List[str] = Field(default_factory=list)
    content_requirements: List[str] = Field(default_factory=list)
    target_niches: List[str] = Field(default_factory=list)
    preferred_formats: List[str] = Field(default_factory=list)
    creative_styles: List[str] = Field(default_factory=list)
    style_description: Optional[str] = None
    intended_usage_channels: List[str] = Field(default_factory=list)
    project_timeline: Optional[str] = None
    commercial_rights_required: bool = True
    exclusive_usage_required: bool = False
    source_files_required: bool = False
    budget_range: Optional[str] = None
    engagement_type: Optional[str] = None
    adaptive_data: Dict[str, Any] = Field(default_factory=dict)


class BrandPreferencesCreate(BrandPreferencesBase):
    pass


class BrandPreferencesUpdate(BaseModel):
    intended_uses: Optional[List[str]] = None
    content_requirements: Optional[List[str]] = None
    target_niches: Optional[List[str]] = None
    preferred_formats: Optional[List[str]] = None
    creative_styles: Optional[List[str]] = None
    style_description: Optional[str] = None
    intended_usage_channels: Optional[List[str]] = None
    project_timeline: Optional[str] = None
    commercial_rights_required: Optional[bool] = None
    exclusive_usage_required: Optional[bool] = None
    source_files_required: Optional[bool] = None
    budget_range: Optional[str] = None
    engagement_type: Optional[str] = None
    adaptive_data: Optional[Dict[str, Any]] = None


class BrandPreferencesResponse(BaseDomainModel, BrandPreferencesBase):
    brand_id: UUID


class BrandSurveyResponseSave(BaseModel):
    current_step: int
    responses: Dict[str, Any]


class BrandSurveySessionResponse(BaseModel):
    id: UUID
    brand_id: UUID
    current_step: int
    responses: Dict[str, Any]
    is_completed: bool
    updated_at: datetime


class BrandCompletenessItem(BaseModel):
    key: str
    label: str
    completed: bool
    impact_pct: int
    action_hint: str


class BrandCompletenessResponse(BaseModel):
    percentage: int
    items: List[BrandCompletenessItem]
    improvement_tips: List[str]


class BrandDashboardOverviewResponse(BaseModel):
    profile: BrandProfileResponse
    preferences: Optional[BrandPreferencesResponse] = None
    completeness: BrandCompletenessResponse
    verification_badges: List[BrandVerificationBadge]
    active_briefs_count: int = 0
