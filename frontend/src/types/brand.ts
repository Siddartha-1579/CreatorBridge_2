export type OrganizationType = 
  | "Consumer Brand"
  | "D2C Brand"
  | "E-commerce Business"
  | "Startup"
  | "Small or Medium Business"
  | "Enterprise"
  | "Creative Agency"
  | "Advertising Agency"
  | "Marketing Agency"
  | "Production Studio"
  | "Creator Management Agency"
  | "Nonprofit Organization"
  | "Educational Institution"
  | "Other"

export type BrandVerificationStatus = 
  | "NOT_STARTED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"

export type BrandVerificationCategory = 
  | "EMAIL_VERIFIED"
  | "ORGANIZATION_IDENTITY"
  | "DOMAIN_VERIFIED"
  | "BUSINESS_REGISTRATION"

export interface BrandVerificationBadge {
  category: BrandVerificationCategory
  label: string
  status: BrandVerificationStatus
  verified_at?: string
}

export interface BrandVerificationClaimCreate {
  verification_type: BrandVerificationCategory
  target_identifier?: string
  evidence_reference?: string
  notes?: string
}

export interface BrandVerificationRecord {
  id: string
  brand_id: string
  verification_type: BrandVerificationCategory
  status: BrandVerificationStatus
  notes?: string
  created_at: string
}

export interface BrandProfile {
  id: string
  user_id: string
  company_name: string
  organization_type: OrganizationType | string
  primary_industry?: string
  secondary_industries: string[]
  contact_name?: string
  business_email?: string
  website?: string
  logo_url?: string
  description?: string
  location?: string
  team_size?: string
  social_links?: Record<string, string>
  brand_guidelines_url?: string
  preferred_communication?: string
  is_agency: boolean
  verification_status: BrandVerificationStatus
  onboarding_completed: boolean
  profile_completeness_pct: number
  created_at: string
  updated_at: string

  // Backward compatibility aliases
  companyName?: string
  industry?: string
  companySize?: string
  billingEmail?: string
}

export interface BrandProfileCreate {
  company_name: string
  organization_type?: string
  primary_industry?: string
  secondary_industries?: string[]
  contact_name?: string
  business_email?: string
  website?: string
  description?: string
  team_size?: string
  location?: string
  is_agency?: boolean

  // Backward compatibility aliases
  companyName?: string
  industry?: string
  companySize?: string
  billingEmail?: string
}

export interface BrandProfileUpdate {
  company_name?: string
  organization_type?: string
  primary_industry?: string
  secondary_industries?: string[]
  contact_name?: string
  business_email?: string
  website?: string
  logo_url?: string
  description?: string
  location?: string
  team_size?: string
  social_links?: Record<string, string>
  brand_guidelines_url?: string
  preferred_communication?: string
  is_agency?: boolean
}

export interface BrandPreferences {
  id?: string
  brand_id?: string
  intended_uses: string[]
  content_requirements: string[]
  target_niches: string[]
  preferred_formats: string[]
  creative_styles: string[]
  style_description?: string
  intended_usage_channels: string[]
  project_timeline?: string
  commercial_rights_required: boolean
  exclusive_usage_required: boolean
  source_files_required: boolean
  budget_range?: string
  engagement_type?: string
  adaptive_data?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface BrandPreferencesUpdate {
  intended_uses?: string[]
  content_requirements?: string[]
  target_niches?: string[]
  preferred_formats?: string[]
  creative_styles?: string[]
  style_description?: string
  intended_usage_channels?: string[]
  project_timeline?: string
  commercial_rights_required?: boolean
  exclusive_usage_required?: boolean
  source_files_required?: boolean
  budget_range?: string
  engagement_type?: string
  adaptive_data?: Record<string, any>
}

export interface BrandCompletenessItem {
  key: string
  label: string
  completed: boolean
  impact_pct: number
  action_hint: string
}

export interface BrandCompletenessResponse {
  percentage: number
  items: BrandCompletenessItem[]
  improvement_tips: string[]
}

export interface BrandDashboardOverview {
  profile: BrandProfile
  preferences?: BrandPreferences
  completeness: BrandCompletenessResponse
  verification_badges: BrandVerificationBadge[]
  active_briefs_count: number
}

export interface BrandSurveySession {
  id: string
  brand_id: string
  current_step: number
  responses: Record<string, any>
  is_completed: boolean
  updated_at: string
}
