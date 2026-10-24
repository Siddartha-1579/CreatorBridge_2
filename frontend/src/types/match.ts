export interface MatchScoreFactor {
  factor_name: string
  weight: number
  score: number
  explanation: string
  confidence?: number
}

export interface CreatorMatchResult {
  creator_id: string
  creator_handle: string
  creator_name?: string
  creator_level?: string
  creator_avatar_url?: string
  reputation_score?: number
  trust_score?: number | null
  trust_status?: string | null
  priority_placement?: boolean
  priority_score?: number
  achievement_points?: number
  achievement_reputation_bonus?: number
  temporary_priority_bonus?: number
  overall_match_score: number
  factors: MatchScoreFactor[]
  summary_explanation: string
  top_strengths?: string[]
  potential_gaps?: string[]
  hourly_rate_cents?: number
  ai_tools?: string[]
  skills?: string[]
}

export interface BriefMatchResult {
  brief_id: string
  brief_title: string
  brand_name?: string
  overall_match_score: number
  factors: MatchScoreFactor[]
  summary_explanation: string
  budget_cents?: number
  deadline?: string
  category?: string
  platforms?: string[]
  required_tools?: string[]
}

export interface MatchCriteria {
  brief_id: string
  required_skills?: string[]
  required_tools?: string[]
  target_niches?: string[]
  target_platforms?: string[]
  min_creator_level?: string
  max_budget_cents?: number
  limit?: number
}
