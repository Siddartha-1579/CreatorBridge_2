"""Campaign brief schemas for structured brief builder and AI assistance."""

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field
from app.models.base import BaseDomainModel


class BriefStatus(str, Enum):
    DRAFT = "DRAFT"
    READY_TO_PUBLISH = "READY_TO_PUBLISH"
    PUBLISHED = "PUBLISHED"
    MATCHING = "MATCHING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class DeliverableItem(BaseModel):
    """Specification for an individual deliverable within a brief."""
    id: str = Field(default_factory=lambda: f"deliv_{int(datetime.now(timezone.utc).timestamp()*1000)}")
    content_type: str = "Short-form Video"  # Short-form Video, Instagram Reels, TikTok, YouTube Shorts, Static, Carousel, etc.
    quantity: int = Field(default=1, ge=1, le=100)
    placement_or_platform: Optional[str] = None  # e.g. Instagram Reels, TikTok, YouTube
    aspect_ratio: str = "9:16"  # 9:16, 16:9, 1:1, 4:5, custom
    resolution: Optional[str] = "4K"
    duration_seconds: Optional[int] = None
    file_format: Optional[str] = None
    raw_footage_required: bool = False
    captions_required: bool = True
    creator_on_camera: bool = False
    production_notes: Optional[str] = None


class CreativeDirection(BaseModel):
    """Aesthetic, mood, and brand styling directives."""
    tone_and_personality: Optional[str] = None
    styles: List[str] = Field(default_factory=list)
    custom_style_notes: Optional[str] = None
    color_palette: Optional[str] = None
    mood_atmosphere: Optional[str] = None
    visual_references: List[str] = Field(default_factory=list)
    key_product_benefits: Optional[str] = None
    mandatory_talking_points: Optional[str] = None
    call_to_action: Optional[str] = None
    required_hashtags_or_mentions: Optional[str] = None
    brand_guidelines: Optional[str] = None
    reference_links: List[str] = Field(default_factory=list)
    things_to_include: List[str] = Field(default_factory=list)
    things_to_avoid: List[str] = Field(default_factory=list)
    competitor_restrictions: Optional[str] = None
    experimentation_level: str = "BALANCED"  # CONSERVATIVE, BALANCED, HIGHLY_EXPERIMENTAL


class CreatorCapabilityRequirements(BaseModel):
    """Required, preferred, and flexible creator technical competencies."""
    preferred_niches: List[str] = Field(default_factory=list)
    preferred_platforms: List[str] = Field(default_factory=list)
    audience_location: Optional[str] = None
    audience_age_range: Optional[str] = None
    preferred_language: str = "English"
    audience_size_range: Optional[str] = None
    engagement_requirements: Optional[str] = None
    experience_level: Optional[str] = None
    required_capabilities: List[str] = Field(default_factory=list)
    preferred_capabilities: List[str] = Field(default_factory=list)
    flexible_capabilities: List[str] = Field(default_factory=list)
    preferred_tools: List[str] = Field(default_factory=list)


class CommercialTerms(BaseModel):
    """Commercial terms, usage licensing preferences, and delivery expectations."""
    budget_tier: Optional[str] = None
    budget_cents: Optional[int] = None
    budget_per_deliverable_cents: Optional[int] = None
    currency: str = "USD"
    compensation_model: str = "PAID"  # PAID, GIFTING, HYBRID
    payment_model: str = "MILESTONE"  # FIXED_PRICE, MILESTONE, RETAINER, OPEN_TO_PROPOSALS
    intended_usage: List[str] = Field(default_factory=list)  # ORGANIC_SOCIAL, PAID_ADS, ECOMMERCE, INTERNAL
    paid_advertising_whitelisting: bool = True
    organic_usage_duration: str = "Perpetual"
    territory: str = "Global"
    channels: List[str] = Field(default_factory=list)
    exclusivity_required: bool = False
    exclusivity_duration: Optional[str] = None
    commercial_rights_required: bool = True
    source_files_required: bool = False
    revisions_count: int = 2
    application_deadline: Optional[datetime] = None
    content_delivery_deadline: Optional[datetime] = None
    publishing_window: Optional[str] = None
    attribution_required: bool = False
    ongoing_work_considered: bool = True


class BriefAIMetadata(BaseModel):
    """Metadata regarding AI generation, clarifying questions, and boundary constraints."""
    ai_generated: bool = False
    open_questions: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    success_criteria: Optional[str] = None
    provider_used: Optional[str] = None
    generated_at: Optional[datetime] = None


class CampaignBriefBase(BaseModel):
    """Base schema for campaign briefs."""
    title: str = "Untitled Creative Brief"
    brand_or_product_name: Optional[str] = None
    product_or_service: Optional[str] = None
    product_description: Optional[str] = None
    campaign_idea: Optional[str] = None
    executive_summary: Optional[str] = None
    description: str = ""
    objectives: List[str] = Field(default_factory=list)
    primary_objective: Optional[str] = None
    target_audience: Optional[str] = None
    target_market: Optional[str] = None
    preferred_language: str = "English"
    campaign_category: Optional[str] = None
    primary_message: Optional[str] = None
    desired_cta: Optional[str] = None
    platforms: List[str] = Field(default_factory=list)
    deliverables: List[DeliverableItem] = Field(default_factory=list)
    creative_direction: CreativeDirection = Field(default_factory=CreativeDirection)
    creator_capabilities: CreatorCapabilityRequirements = Field(default_factory=CreatorCapabilityRequirements)
    commercial_terms: CommercialTerms = Field(default_factory=CommercialTerms)
    sections: Dict[str, str] = Field(default_factory=dict)
    budget_cents: Optional[int] = None
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    required_tools: List[str] = Field(default_factory=list)
    ai_metadata: BriefAIMetadata = Field(default_factory=BriefAIMetadata)
    is_public: bool = True


class CampaignBriefCreate(CampaignBriefBase):
    """Payload to create a new campaign brief or draft."""
    status: BriefStatus = BriefStatus.DRAFT


class CampaignBriefUpdate(BaseModel):
    """Partial update payload for saving brief progress."""
    title: Optional[str] = None
    brand_or_product_name: Optional[str] = None
    product_or_service: Optional[str] = None
    product_description: Optional[str] = None
    description: Optional[str] = None
    campaign_idea: Optional[str] = None
    executive_summary: Optional[str] = None
    objectives: Optional[List[str]] = None
    primary_objective: Optional[str] = None
    target_audience: Optional[str] = None
    target_market: Optional[str] = None
    preferred_language: Optional[str] = None
    campaign_category: Optional[str] = None
    primary_message: Optional[str] = None
    desired_cta: Optional[str] = None
    platforms: Optional[List[str]] = None
    deliverables: Optional[List[DeliverableItem]] = None
    creative_direction: Optional[CreativeDirection] = None
    creator_capabilities: Optional[CreatorCapabilityRequirements] = None
    commercial_terms: Optional[CommercialTerms] = None
    sections: Optional[Dict[str, str]] = None
    budget_cents: Optional[int] = None
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    required_tools: Optional[List[str]] = None
    ai_metadata: Optional[BriefAIMetadata] = None
    is_public: Optional[bool] = None
    status: Optional[BriefStatus] = None


class CampaignBriefResponse(BaseDomainModel, CampaignBriefBase):
    """Response model for a saved or published campaign brief."""
    brand_id: str
    status: BriefStatus = BriefStatus.DRAFT


class AIBriefGenerationRequest(BaseModel):
    """Request payload to synthesize a campaign idea into a structured brief."""
    campaign_name: Optional[str] = None
    campaign_idea: str
    template_category: Optional[str] = None
    objectives: List[str] = Field(default_factory=list)
    primary_objective: Optional[str] = None
    brand_or_product_name: Optional[str] = None
    product_or_service: Optional[str] = None
    product_description: Optional[str] = None
    target_audience: Optional[str] = None
    target_market: Optional[str] = None
    preferred_language: Optional[str] = "English"
    campaign_category: Optional[str] = None
    primary_message: Optional[str] = None
    desired_cta: Optional[str] = None
    platforms: List[str] = Field(default_factory=list)
    deliverables: List[DeliverableItem] = Field(default_factory=list)
    styles: List[str] = Field(default_factory=list)
    commercial_intent: Optional[str] = None


class AIBriefGenerationResponse(BaseModel):
    """Structured AI output with actionable specifications, 16 sections, and clarifying questions."""
    refined_title: str
    executive_summary: str
    suggested_objectives: List[str]
    suggested_deliverables: List[DeliverableItem]
    suggested_creative_direction: CreativeDirection
    suggested_capabilities: CreatorCapabilityRequirements
    suggested_commercial_terms: CommercialTerms
    suggested_budget_cents: Optional[int] = None
    sections: Dict[str, str] = Field(default_factory=dict)
    open_questions: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    success_criteria: str
    provider_used: str = "ai_gateway"


class RefineIdeaRequest(BaseModel):
    """Payload to refine an initial campaign concept into high-impact creative angles."""
    campaign_name: Optional[str] = None
    brand_or_product_name: Optional[str] = None
    product_description: Optional[str] = None
    campaign_idea: str
    primary_objective: Optional[str] = None
    campaign_category: Optional[str] = None


class RefineIdeaResponse(BaseModel):
    """Refined campaign concept and creative hooks."""
    refined_idea: str
    suggested_hooks: List[str] = Field(default_factory=list)
    key_angles: List[str] = Field(default_factory=list)


class SuggestCreativeDirectionsRequest(BaseModel):
    """Payload to request AI creative direction suggestions."""
    campaign_idea: str
    product_or_service: Optional[str] = None
    primary_objective: Optional[str] = None
    campaign_category: Optional[str] = None


class CreativeDirectionOption(BaseModel):
    """Individual selectable creative direction preset."""
    id: str
    name: str
    tone: str
    style: str
    visual_theme: str
    recommended_prompt_hook: str


class SuggestCreativeDirectionsResponse(BaseModel):
    """Selectable creative direction presets."""
    options: List[CreativeDirectionOption] = Field(default_factory=list)


class RegenerateSectionRequest(BaseModel):
    """Payload to regenerate a single specific section of the 16-section brief."""
    section_id: str
    brief_data: Dict[str, Any] = Field(default_factory=dict)
    current_content: Optional[str] = None
    custom_guidance: Optional[str] = None


class RegenerateSectionResponse(BaseModel):
    """Regenerated content for a single section."""
    section_id: str
    regenerated_content: str


class BriefValidationResult(BaseModel):
    """Validation report verifying whether a brief is complete enough to publish."""
    is_valid: bool
    can_publish: bool
    blocking_errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
