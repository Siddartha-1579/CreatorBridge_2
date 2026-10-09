export type InputType =
  | "text"
  | "textarea"
  | "single_choice"
  | "multi_select"
  | "number"
  | "range"
  | "url"
  | "date"
  | "tool_catalog"
  | "deliverable_specs"

export interface SurveyQuestionOption {
  label: string
  value: string
  description?: string
}

export interface SurveyValidationRules {
  min?: number
  max?: number
  min_length?: number
  max_length?: number
  pattern?: string
  min_items?: number
  max_items?: number
}

export interface SurveyConditionalRule {
  depends_on: string
  operator: "equals" | "not_equals" | "contains" | "in" | "is_true" | "is_false" | "greater_than"
  value: any
  show_if: boolean
}

export interface AdaptiveSurveyQuestion {
  id: string
  survey_id: string
  survey_type: "CREATOR" | "BRAND"
  section_key: string
  question_text: string
  help_text?: string
  input_type: InputType
  is_required: boolean
  display_order: number
  options?: SurveyQuestionOption[]
  validation_rules?: SurveyValidationRules
  conditional_rules?: SurveyConditionalRule[]
  matching_relevance?: "HIGH" | "STANDARD" | "LOW" | "NONE"
  data_sensitivity?: "PUBLIC" | "INTERNAL_MATCHING" | "CONFIDENTIAL_ADMIN"
  requires_verification?: boolean
}

export type SurveyQuestion = AdaptiveSurveyQuestion

export interface SurveySection {
  key: string
  title: string
  description: string
  display_order: number
  questions: AdaptiveSurveyQuestion[]
}

export interface SurveySchemaResponse {
  survey_id: string
  survey_type: "CREATOR" | "BRAND"
  version: string
  title: string
  description: string
  sections: SurveySection[]
}

export interface SurveyResponseRecord {
  id: string
  user_id: string
  survey_type: "CREATOR" | "BRAND"
  survey_version: string
  current_section_index: number
  is_completed: boolean
  answers: Record<string, any>
  completed_at?: string
  updated_at: string
}

export interface AIFollowupQuestion {
  id: string
  question_text: string
  purpose: string
  section_key: string
  input_type: InputType
  is_required: boolean
  options?: SurveyQuestionOption[]
  trigger_reason: string
}

export interface AdaptiveEvaluationResponse {
  visible_question_ids: string[]
  suggested_followups: AIFollowupQuestion[]
  ai_assisted: boolean
  explanation: string
}
