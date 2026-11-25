export type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "MULTIPLE_SELECT"
  | "RANKING"
  | "WORKFLOW_ORDERING"
  | "SCENARIO"
  | "CONFIDENCE_SCALE"
  | "SHORT_TEXT"

export type QuestionDifficulty = "FOUNDATION" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"

export type SkillDimension =
  | "TECHNICAL"
  | "CREATIVE"
  | "WORKFLOW"
  | "PROBLEM_SOLVING"
  | "COMMERCIAL"

export type AssessmentStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"

export interface QuestionOption {
  id: string
  label: string
  description?: string
  icon?: string
  tag?: string
}

export interface SurveyQuestion {
  id: string
  niche: string
  category: string
  difficulty: QuestionDifficulty
  type: QuestionType
  question: string
  scenario?: string
  options: QuestionOption[]
  weight: number
  skill_dimension: SkillDimension
  branch_condition?: Record<string, any>
  placeholder?: string
  min_rating?: number
  max_rating?: number
  required?: boolean
}

export interface SpecializationOption {
  id: string
  name: string
  description: string
  icon: string
  popular_tools: string[]
  primary_dimensions: string[]
}

export interface SurveyConfig {
  specializations: SpecializationOption[]
  tool_catalog: Array<{ id: string; name: string; category: string; badge: string }>
  experience_options: string[]
}

export interface DimensionScores {
  technical: number
  creative: number
  workflow: number
  problem_solving: number
  commercial: number
}

export interface AssessmentProgress {
  assessment_id: string
  status: AssessmentStatus
  current_step_index: number
  total_steps: number
  primary_specialization?: string
  secondary_specializations: string[]
  responses: Record<string, any>
  integrity_signals: Record<string, any>
}

export interface AssessmentResult {
  id: string
  assessment_id: string
  user_id: string
  overall_score: number
  calculated_level: string
  level_name: string
  technical_score: number
  creative_score: number
  workflow_score: number
  problem_solving_score: number
  commercial_readiness_score: number
  dimension_scores: DimensionScores
  strengths: string[]
  growth_areas: string[]
  recommended_paths: string[]
  created_at: string
}
