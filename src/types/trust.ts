export type IncidentCategory =
  | "MISREPRESENTATION"
  | "METRIC_FALSIFICATION"
  | "PAYMENT_FRAUD"
  | "ASSET_MISUSE"
  | "COMMITMENT_BREACH"
  | "POLICY_VIOLATION"

export type IncidentSeverity = "MINOR" | "MODERATE" | "MAJOR" | "CRITICAL"
export type IncidentStatus = "ACTIVE" | "RECOVERED" | "OVERTURNED"
export type CaseStatus =
  | "SUBMITTED"
  | "AWAITING_EVIDENCE"
  | "UNDER_REVIEW"
  | "CONFIRMED"
  | "DISMISSED"
  | "APPEALED"
  | "OVERTURNED"

export interface VerifiedBadge {
  id: string
  title: string
  description: string
  verified_at?: string
  verification_source: string
}

export interface TrustIncident {
  id: string
  account_id: string
  case_id?: string
  incident_category: IncidentCategory
  severity: IncidentSeverity
  base_penalty: number
  recurrence_count: number
  recurrence_multiplier: number
  calculated_penalty: number
  status: IncidentStatus
  rationale: string
  confirmed_at: string
  overturned_at?: string
  overturned_reason?: string
}

export interface TrustCase {
  id: string
  case_number: string
  reporting_account_id?: string
  reported_account_id: string
  category: IncidentCategory
  description: string
  evidence_urls: string[]
  reference_id?: string
  status: CaseStatus
  assigned_reviewer_id?: string
  decision_rationale?: string
  severity_assessed?: IncidentSeverity
  penalty_applied: number
  incident_id?: string
  appeal_text?: string
  appeal_submitted_at?: string
  appeal_rationale?: string
  created_at: string
  updated_at: string
}

export interface TrustScore {
  account_id: string
  score: number
  status_label: string
  total_active_demerits: number
  eligible_recovery_points: number
  confirmed_incidents_count: number
  overturned_incidents_count: number
  verified_badges: VerifiedBadge[]
  active_incidents: TrustIncident[]
  last_violation_at?: string
  last_recalculated_at: string
  scoring_policy_summary: string
}

export interface PublicTrustProfile {
  account_id: string
  score: number
  status_label: string
  verified_badges: VerifiedBadge[]
  active_incidents_count: number
  last_recalculated_at: string
  transparency_notice: string
}
