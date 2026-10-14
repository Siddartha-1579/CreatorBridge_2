export type BriefStatus =
  | "DRAFT"
  | "READY_TO_PUBLISH"
  | "PUBLISHED"
  | "ACTIVE"
  | "PAUSED"
  | "MATCHING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ARCHIVED"

export interface DeliverableItem {
  id: string
  content_type: string // Short-form video, Long-form video, Instagram Reels, TikTok, YouTube Shorts, Static, Carousel, etc.
  quantity: number
  placement_or_platform?: string
  aspect_ratio: string // 9:16, 16:9, 1:1, 4:5, custom
  resolution?: string
  duration_seconds?: number
  file_format?: string
  raw_footage_required?: boolean
  captions_required?: boolean
  creator_on_camera?: boolean
  production_notes?: string
}

export interface CreativeDirection {
  tone_and_personality?: string
  styles: string[]
  custom_style_notes?: string
  color_palette?: string
  mood_atmosphere?: string
  visual_references?: string[]
  key_product_benefits?: string
  mandatory_talking_points?: string
  call_to_action?: string
  required_hashtags_or_mentions?: string
  brand_guidelines?: string
  reference_links?: string[]
  things_to_include?: string[]
  things_to_avoid?: string[]
  competitor_restrictions?: string
  experimentation_level?: "CONSERVATIVE" | "BALANCED" | "HIGHLY_EXPERIMENTAL" | string
}

export interface CreatorCapabilityRequirements {
  preferred_niches?: string[]
  preferred_platforms?: string[]
  audience_location?: string
  audience_age_range?: string
  preferred_language?: string
  audience_size_range?: string
  engagement_requirements?: string
  experience_level?: string
  required_capabilities: string[]
  preferred_capabilities: string[]
  flexible_capabilities: string[]
  preferred_tools: string[]
}

export interface CommercialTerms {
  budget_tier?: string
  budget_cents?: number
  budget_per_deliverable_cents?: number
  currency: string
  compensation_model?: "PAID" | "GIFTING" | "HYBRID" | string
  payment_model: "FIXED_PRICE" | "MILESTONE" | "RETAINER" | "OPEN_TO_PROPOSALS" | string
  intended_usage: string[]
  paid_advertising_whitelisting?: boolean
  organic_usage_duration?: string
  territory: string
  channels?: string[]
  exclusivity_required: boolean
  exclusivity_duration?: string
  commercial_rights_required: boolean
  source_files_required: boolean
  revisions_count: number
  application_deadline?: string
  content_delivery_deadline?: string
  publishing_window?: string
  attribution_required: boolean
  ongoing_work_considered: boolean
}

export interface BriefAIMetadata {
  ai_generated: boolean
  open_questions?: string[]
  constraints?: string[]
  success_criteria?: string
  provider_used?: string
  generated_at?: string
}

export interface CampaignBrief {
  id: string
  brand_id: string
  title: string
  description: string
  brand_or_product_name?: string
  product_or_service?: string
  product_description?: string
  campaign_idea?: string
  executive_summary?: string
  objectives: string[]
  primary_objective?: string
  target_audience?: string
  target_market?: string
  preferred_language?: string
  campaign_category?: string
  primary_message?: string
  desired_cta?: string
  platforms: string[]
  deliverables: DeliverableItem[]
  creative_direction: CreativeDirection
  creator_capabilities: CreatorCapabilityRequirements
  commercial_terms: CommercialTerms
  sections?: Record<string, string>
  budget_cents?: number
  reward_type?: string
  cpm_rate_cents?: number
  total_pool_cents?: number
  paid_pool_cents?: number
  views_count?: number
  participants_count?: number
  start_date?: string
  deadline?: string
  required_tools: string[]
  ai_metadata: BriefAIMetadata
  cover_image_url?: string
  is_public: boolean
  status: BriefStatus
  created_at: string
  updated_at: string
}

export interface CampaignBriefCreate {
  title: string
  description?: string
  brand_or_product_name?: string
  product_or_service?: string
  product_description?: string
  campaign_idea?: string
  executive_summary?: string
  objectives?: string[]
  primary_objective?: string
  target_audience?: string
  target_market?: string
  preferred_language?: string
  campaign_category?: string
  primary_message?: string
  desired_cta?: string
  platforms?: string[]
  deliverables?: DeliverableItem[]
  creative_direction?: Partial<CreativeDirection>
  creator_capabilities?: Partial<CreatorCapabilityRequirements>
  commercial_terms?: Partial<CommercialTerms>
  sections?: Record<string, string>
  budget_cents?: number
  start_date?: string
  deadline?: string
  required_tools?: string[]
  ai_metadata?: Partial<BriefAIMetadata>
  cover_image_url?: string
  is_public?: boolean
  status?: BriefStatus
}

export interface CampaignBriefUpdate extends Partial<CampaignBriefCreate> {}

export type ApplicationStatus = "PENDING" | "SHORTLISTED" | "ACCEPTED" | "REJECTED"

export interface CampaignApplication {
  id: string
  brief_id: string
  creator_id: string
  brand_id: string
  proposed_rate_cents?: number
  pitch: string
  relevant_skills: string[]
  relevant_tools: string[]
  portfolio_item_ids: string[]
  estimated_days?: number
  status: ApplicationStatus
  creator_name?: string
  creator_handle?: string
  creator_avatar_url?: string
  creator_specialization?: string
  brief_title?: string
  created_at: string
  updated_at: string
}

export interface CampaignApplicationCreate {
  proposed_rate_cents?: number
  pitch: string
  relevant_skills?: string[]
  relevant_tools?: string[]
  portfolio_item_ids?: string[]
  estimated_days?: number
}

export interface CampaignApplicationUpdate {
  status: ApplicationStatus
}

export interface GenerateCoverImageRequest {
  custom_prompt?: string
  style_preset?: string
  aspect_ratio?: string
}

export interface GenerateCoverImageResponse {
  image_url: string
  prompt_used: string
  model: string
  provider: string
  saved_to_brief: boolean
}


export interface AIBriefGenerationRequest {
  campaign_name?: string
  campaign_idea: string
  template_category?: string
  objectives?: string[]
  primary_objective?: string
  brand_or_product_name?: string
  product_or_service?: string
  product_description?: string
  target_audience?: string
  target_market?: string
  preferred_language?: string
  campaign_category?: string
  primary_message?: string
  desired_cta?: string
  platforms?: string[]
  deliverables?: DeliverableItem[]
  styles?: string[]
  commercial_intent?: string
}

export interface AIBriefGenerationResponse {
  refined_title: string
  executive_summary: string
  suggested_objectives: string[]
  suggested_deliverables: DeliverableItem[]
  suggested_creative_direction: CreativeDirection
  suggested_capabilities: CreatorCapabilityRequirements
  suggested_commercial_terms: CommercialTerms
  suggested_budget_cents?: number
  sections: Record<string, string>
  open_questions: string[]
  constraints: string[]
  success_criteria: string
  provider_used: string
}

export interface RefineIdeaRequest {
  campaign_name?: string
  brand_or_product_name?: string
  product_description?: string
  campaign_idea: string
  primary_objective?: string
  campaign_category?: string
}

export interface RefineIdeaResponse {
  refined_idea: string
  suggested_hooks: string[]
  key_angles: string[]
}

export interface CreativeDirectionOption {
  id: string
  name: string
  tone: string
  style: string
  visual_theme: string
  recommended_prompt_hook: string
}

export interface SuggestCreativeDirectionsRequest {
  campaign_idea: string
  product_or_service?: string
  primary_objective?: string
  campaign_category?: string
}

export interface SuggestCreativeDirectionsResponse {
  options: CreativeDirectionOption[]
}

export interface RegenerateSectionRequest {
  section_id: string
  brief_data: Record<string, any>
  current_content?: string
  custom_guidance?: string
}

export interface RegenerateSectionResponse {
  section_id: string
  regenerated_content: string
}

export interface BriefValidationResult {
  is_valid: boolean
  can_publish: boolean
  blocking_errors: string[]
  warnings: string[]
}

export type SubmissionStatus =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REVISION_REQUESTED"

export interface ClipSubmission {
  id: string
  campaign_id: string
  creator_id: string
  brand_id: string
  clip_url: string
  platform: "TIKTOK" | "INSTAGRAM" | "YOUTUBE_SHORTS" | string
  title: string
  description?: string
  ai_tools: string[]
  views_count: number
  earned_cents: number
  status: SubmissionStatus
  feedback?: string
  submitted_at: string
  reviewed_at?: string
  creator_name?: string
  creator_handle?: string
  creator_avatar_url?: string
  campaign_title?: string
  brand_name?: string
  created_at: string
  updated_at: string
}

export interface ClipSubmissionCreate {
  clip_url: string
  platform: string
  title: string
  description?: string
  ai_tools?: string[]
  initial_views?: number
}

export interface ClipSubmissionReview {
  status: SubmissionStatus
  feedback?: string
  verified_views?: number
  payout_cents?: number
}

export interface CampaignParticipant {
  id: string
  campaign_id: string
  creator_id: string
  status: string
  joined_at: string
  creator_name?: string
  creator_handle?: string
  creator_avatar_url?: string
}

export interface CreatorLeaderboardItem {
  creator_id: string
  creator_name: string
  creator_handle: string
  creator_avatar_url?: string
  total_views: number
  approved_clips: number
  total_earned_cents: number
}

export interface CampaignAnalytics {
  campaign_id: string
  title: string
  status: string
  total_views: number
  total_submissions: number
  approved_submissions: number
  pending_submissions: number
  rejected_submissions: number
  total_pool_cents: number
  paid_pool_cents: number
  remaining_pool_cents: number
  cpm_rate_cents: number
  participants_count: number
  views_over_time: Array<{ date: string; views: number }>
  leaderboard: CreatorLeaderboardItem[]
}

export interface BrandCommunityPost {
  id: string
  brand_id: string
  brand_name?: string
  brand_logo_url?: string
  title: string
  content: string
  category: "ANNOUNCEMENT" | "CONTEST" | "WINNERS" | "GUIDELINES" | "ASSET_PACK" | string
  pinned: boolean
  likes_count: number
  media_url?: string
  created_at: string
  updated_at: string
}

export interface BrandCommunityPostCreate {
  title: string
  content: string
  category?: string
  pinned?: boolean
  media_url?: string
}

