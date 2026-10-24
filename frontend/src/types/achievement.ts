export interface PriorityBoost {
  id: string
  creator_id?: string
  brief_id?: string | null
  points_spent: number
  starts_at: string
  expires_at: string
  status: string
}

export interface AchievementEvidence {
  quality?: number
  timeliness?: number
  brief_compliance?: number
  collaboration?: number
  deadline_at?: string | null
  completed_at?: string
  accepted?: boolean
  weights?: Record<string, number>
}

export interface AchievementEvent {
  id: string
  source_engagement_id: string
  achievement_score: number
  points_awarded: number
  evidence?: AchievementEvidence
  completed_at: string
  created_at: string
}

export interface AchievementSummary {
  lifetime_points: number
  available_points: number
  spent_points: number
  long_term_reputation_bonus: number
  active_boosts: PriorityBoost[]
  recent_achievements: AchievementEvent[]
}

export interface PriorityBoostRequest {
  points: number
  brief_id?: string
}

export interface PublicAchievementSummary {
  lifetime_points: number
  long_term_reputation_bonus: number
  recent_achievements: AchievementEvent[]
}
