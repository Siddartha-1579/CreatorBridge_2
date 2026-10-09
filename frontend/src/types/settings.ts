export type IntegrationCategory =
  | "REQUIRED_FOR_PRODUCTION"
  | "REQUIRED_FOR_AI_FEATURES"
  | "CREATIVE_MODALITY"
  | "OPTIONAL_SERVICE"
  | "COMMERCIAL_ESCROW"

export type IntegrationStatus =
  | "CONFIGURED"
  | "REUSES_OPENAI"
  | "DEVELOPMENT_MOCK"
  | "MISSING"

export interface IntegrationDetail {
  id: string
  name: string
  category: IntegrationCategory
  status: IntegrationStatus
  is_ready: boolean
  requires_action: boolean
  env_keys_checked: string[]
  masked_key?: string | null
  provider_selected: string
  model_or_endpoint?: string | null
  guidance: string
}

export interface SystemReadinessReport {
  app_name: string
  app_env: string
  app_version: string
  system_status: string
  total_integrations: number
  configured_count: number
  missing_count: number
  mock_count: number
  integrations: IntegrationDetail[]
  summary_message: string
}
