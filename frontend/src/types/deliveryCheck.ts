export type CheckItemStatus = "PASSED" | "FAILED" | "NOT_SPECIFIED" | "UNABLE_TO_VERIFY"

export type DeliveryCheckStatus = "PASSED" | "FAILED" | "UNABLE_TO_VERIFY" | "PENDING"

export interface DeliveryCheckRuleItem {
  rule_name: string
  label: string
  status: CheckItemStatus
  required_value?: string | null
  detected_value?: string | null
  failure_reason?: string | null
  actionable_correction?: string | null
}

export interface MediaInspectionMetadata {
  media_type?: string | null
  mime_type?: string | null
  container_or_format?: string | null
  width?: number | null
  height?: number | null
  aspect_ratio_label?: string | null
  aspect_ratio_value?: number | null
  duration_seconds?: number | null
  file_size_bytes?: number | null
  video_codec?: string | null
  audio_codec?: string | null
  is_valid_media?: boolean
  error_message?: string | null
}

export interface DeliveryCheckReport {
  overall_status: DeliveryCheckStatus
  is_review_ready: boolean
  checks: DeliveryCheckRuleItem[]
  passed_count: number
  failed_count: number
  not_specified_count: number
  unable_to_verify_count: number
  suggested_fixes: string[]
  checked_at: string
  media_metadata?: MediaInspectionMetadata | null
}
