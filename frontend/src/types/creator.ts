export type CreatorLevel = 
  | "EXPLORER" 
  | "PRACTITIONER" 
  | "SKILLED" 
  | "PRO_CREATOR" 
  | "ADVANCED" 
  | "AI_MASTER" 
  | "STUDIO_PARTNER"

export type VerificationType = 
  | "EMAIL_VERIFIED"
  | "TOOL_VERIFIED"
  | "PORTFOLIO_VERIFIED"
  | "WORKFLOW_VERIFIED"
  | "IDENTITY_VERIFIED"
  | "EXPERIENCE_VERIFIED"

export type VerificationStatus = 
  | "NOT_STARTED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"

export interface VerificationBadge {
  type: VerificationType
  label: string
  status: VerificationStatus
  target_id?: string
  verified_at?: string
}

export interface VerificationRecordCreate {
  verification_type: VerificationType
  target_id?: string
  evidence_reference?: string
  notes?: string
}

export interface VerificationRecordResponse {
  id: string
  creator_id: string
  verification_type: VerificationType
  target_id?: string
  status: VerificationStatus
  notes?: string
  created_at: string
}

export interface ProfileCompletenessItem {
  key: string
  label: string
  completed: boolean
  impact_pct: number
  action_hint: string
}

export interface ProfileCompletenessResponse {
  percentage: number
  items: ProfileCompletenessItem[]
  improvement_tips: string[]
}

export interface CreatorProfile {
  id: string
  user_id: string
  full_name: string
  handle: string
  level: CreatorLevel
  level_name?: string
  reputation_score: number
  is_verified: boolean
  assessment_completed: boolean
  profile_completeness_pct: number
  headline?: string
  bio?: string
  location?: string
  social_links?: Record<string, string>
  primary_specialization?: string
  secondary_specializations?: string[]
  skills: string[]
  ai_tools: string[]
  content_types?: string[]
  target_niches?: string[]
  preferred_formats?: string[]
  hourly_rate_cents?: number
  visibility?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string

  // Backward-compatibility aliases
  fullName?: string
  primarySpecialization?: string
  aiTools?: string[]
  reputationScore?: number
}

export interface CreatorProfileCreate {
  handle: string
  primary_specialization?: string
  skills?: string[]
  ai_tools?: string[]
  hourly_rate_cents?: number
  bio?: string
}

export interface CreatorProfileUpdate {
  full_name?: string
  headline?: string
  bio?: string
  location?: string
  social_links?: Record<string, string>
  primary_specialization?: string
  secondary_specializations?: string[]
  skills?: string[]
  ai_tools?: string[]
  content_types?: string[]
  target_niches?: string[]
  preferred_formats?: string[]
  hourly_rate_cents?: number
  visibility?: string
}

export interface CreatorProfileDetail extends CreatorProfile {
  verification_badges: VerificationBadge[]
  dimension_scores: Record<string, number>
  portfolio_count: number
  trust_signals: string[]
}

