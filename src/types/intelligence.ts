/**
 * CreatorBridge - AI Question Generation & Intelligence Types
 * Defines data structures for adaptive questions, missing info & contradiction detection,
 * bio improvement, and campaign brief clarification.
 */

export type CompletionStatus = "complete" | "needs_clarification" | "incomplete"

export type IssueSeverity = "info" | "warning" | "error"

export type FieldImportance = "required" | "recommended" | "optional"

export type QuestionPriority = "high" | "medium" | "low"

export interface MissingFieldItem {
  field_id: string
  section_key: string
  field_name: string
  importance: FieldImportance
  reason: string
}

export interface ContradictionItem {
  field_ids: string[]
  title: string
  description: string
  severity: IssueSeverity
  recommended_resolution: string
}

export interface AmbiguityItem {
  field_id: string
  current_value: any
  clarification_needed: string
  why: string
}

export interface GeneratedFollowupQuestion {
  id: string
  section: string
  field: string
  question: string
  input_type: "text" | "textarea" | "single_choice" | "multi_select" | "number" | string
  required: boolean
  options?: Array<{ label: string; value: string; description?: string }>
  help_text?: string
  why_asking: string
  priority: QuestionPriority
}

export interface SurveyIntelligenceRequest {
  survey_type: "creator" | "brand" | string
  current_answers: Record<string, any>
  current_section?: string
  questions_already_asked?: string[]
  max_questions?: number
  user_requested_clarification?: string
}

export interface SurveyIntelligenceResponse {
  completion_status: CompletionStatus
  completion_percentage: number
  missing_fields: MissingFieldItem[]
  contradictions: ContradictionItem[]
  ambiguities: AmbiguityItem[]
  questions: GeneratedFollowupQuestion[]
  reasoning_summary: string
  is_ai_powered: boolean
  fallback_mode: boolean
  usage?: Record<string, any>
}

export interface ProfileImprovementRequest {
  original_headline?: string
  original_bio: string
  skills?: string[]
  specializations?: string[]
  ai_tools?: string[]
  tone?: string
}

export interface ProfileImprovementResponse {
  improved_headline?: string
  improved_bio: string
  original_bio: string
  changes_summary: string
  missing_info_suggestions: string[]
  preserved_facts: string[]
  is_ai_powered: boolean
}

export interface BriefClarificationRequest {
  brief_draft: Record<string, any>
}

export interface BriefClarificationResponse {
  missing_details: MissingFieldItem[]
  contradictions: ContradictionItem[]
  clarification_questions: GeneratedFollowupQuestion[]
  suggested_refinements: Record<string, any>
  reasoning_summary: string
  is_ai_powered: boolean
}

export interface AIUsageStatusResponse {
  provider: string
  model: string
  is_configured: boolean
  fallback_active: boolean
  max_questions_limit: number
  timeout_seconds: number
  total_requests_tracked: number
  total_tokens_tracked: number
}
