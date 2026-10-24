export type EngagementStatus =
  | "SHORTLISTED"
  | "INVITED"
  | "ACCEPTED"
  | "DECLINED"
  | "AWAITING_CONFIRMATION"
  | "CONFIRMED"
  | "IN_PRODUCTION"
  | "SUBMITTED"
  | "CHANGES_REQUESTED"
  | "COMPLETED"
  | "CANCELLED"

export type ProductionProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED"

export type SubmissionReviewDecision = "PENDING" | "ACCEPTED" | "CHANGES_REQUESTED"

export interface EngagementScopeTerms {
  deliverables?: Array<Record<string, unknown>>
  scope_description?: string
  budget_cents?: number
  currency: string
  start_date?: string
  deadline?: string
  revision_allowance: number
  usage_rights?: string
  commercial_rights_required: boolean
  additional_notes?: string
}

export interface ShortlistRequest {
  brief_id: string
  creator_id: string
  notes?: string
}

export interface EngagementInvitationRequest {
  brief_id: string
  creator_id: string
  proposed_terms: EngagementScopeTerms
  invitation_message?: string
}

export interface InvitationResponseRequest {
  action: "ACCEPT" | "DECLINE"
  decline_reason?: string
}

export interface ScopeConfirmationRequest {
  confirmed_terms: EngagementScopeTerms
  notes?: string
}

export interface ProductionProgressUpdateRequest {
  production_status: ProductionProgressStatus
  content: string
  blocker_details?: string
}

export interface DeliverableSubmissionCreate {
  title: string
  media_url: string
  thumbnail_url?: string
  file_format?: string
  submission_notes?: string
}

export interface DeliverableReviewRequest {
  decision: "ACCEPT" | "REQUEST_CHANGES"
  review_notes: string
  quality_score?: number
  brief_compliance_score?: number
  collaboration_score?: number
}

export interface EngagementCancellationRequest {
  reason: string
}

export interface EngagementDeliverableSubmission {
  id: string
  engagement_id: string
  creator_id: string
  version_number: number
  title: string
  media_url: string
  thumbnail_url?: string
  file_format?: string
  submission_notes?: string
  review_decision: string
  review_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface EngagementProgressUpdate {
  id: string
  engagement_id: string
  sender_id: string
  sender_role: string
  production_status?: string
  content: string
  blocker_details?: string
  created_at: string
}

export interface EngagementTimelineEvent {
  id: string
  engagement_id: string
  actor_id: string
  actor_role: string
  action: string
  from_status?: string
  to_status?: string
  details?: string
  created_at: string
}

export interface Engagement {
  id: string
  brief_id: string
  brand_id: string
  creator_id: string
  status: EngagementStatus
  production_status: ProductionProgressStatus
  proposed_terms: EngagementScopeTerms
  confirmed_terms: EngagementScopeTerms
  brand_confirmed_at?: string
  brand_confirmed_by?: string
  creator_confirmed_at?: string
  creator_confirmed_by?: string
  invitation_message?: string
  decline_reason?: string
  cancellation_reason?: string
  cancelled_by?: string
  cancelled_at?: string
  completed_at?: string
  completed_by?: string
  brief_title?: string
  brand_name?: string
  creator_name?: string
  creator_handle?: string
  creator_avatar_url?: string
  compatibility_score?: number
  created_at: string
  updated_at: string
}

export interface EngagementDetail extends Engagement {
  submissions: EngagementDeliverableSubmission[]
  progress_updates: EngagementProgressUpdate[]
  timeline_events: EngagementTimelineEvent[]
}

export interface ShortlistCreatorItem {
  engagement_id: string
  brief_id: string
  creator_id: string
  creator_name: string
  creator_handle: string
  creator_avatar_url?: string
  primary_specialization?: string
  skills: string[]
  ai_tools: string[]
  hourly_rate_cents?: number
  reputation_score: number
  is_verified: boolean
  compatibility_score?: number
  status: EngagementStatus
  shortlisted_at: string
}
