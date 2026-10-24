import { apiClient } from "@/lib/apiClient"
import type {
  Engagement,
  EngagementDetail,
  ShortlistCreatorItem,
  ShortlistRequest,
  EngagementInvitationRequest,
  InvitationResponseRequest,
  ScopeConfirmationRequest,
  ProductionProgressUpdateRequest,
  DeliverableSubmissionCreate,
  DeliverableReviewRequest,
  EngagementCancellationRequest,
  EngagementDeliverableSubmission,
  EngagementProgressUpdate,
} from "@/types"

export const engagementsService = {
  /**
   * Adds a candidate creator to a brand brief shortlist.
   */
  async shortlistCreator(data: ShortlistRequest): Promise<Engagement> {
    const res = await apiClient.post<Engagement>("engagements/shortlist", data)
    return res
  },

  /**
   * Removes a candidate creator from a brand brief shortlist.
   */
  async removeFromShortlist(engagementId: string): Promise<boolean> {
    const res = await apiClient.delete<boolean>(`engagements/shortlist/${engagementId}`)
    return res
  },

  /**
   * Retrieves all shortlisted creators and pipeline candidates for a specific campaign brief.
   */
  async getBriefShortlist(briefId: string): Promise<ShortlistCreatorItem[]> {
    const res = await apiClient.get<ShortlistCreatorItem[]>(`engagements/briefs/${briefId}/shortlist`)
    return res
  },

  /**
   * Sends a formal engagement invitation with proposed terms to a shortlisted creator.
   */
  async sendInvitation(data: EngagementInvitationRequest): Promise<Engagement> {
    const res = await apiClient.post<Engagement>("engagements/invitations", data)
    return res
  },

  /**
   * Creator accepts or declines an incoming engagement invitation.
   */
  async respondToInvitation(engagementId: string, data: InvitationResponseRequest): Promise<Engagement> {
    const res = await apiClient.post<Engagement>(`engagements/${engagementId}/respond`, data)
    return res
  },

  /**
   * Records formal scope terms confirmation from brand or creator.
   */
  async confirmTerms(engagementId: string, data: ScopeConfirmationRequest): Promise<Engagement> {
    const res = await apiClient.post<Engagement>(`engagements/${engagementId}/confirm-terms`, data)
    return res
  },

  /**
   * Transitions a confirmed engagement into active production.
   */
  async startProduction(engagementId: string): Promise<Engagement> {
    const res = await apiClient.post<Engagement>(`engagements/${engagementId}/start-production`)
    return res
  },

  /**
   * Posts a production progress update, status flag, or blocker explanation.
   */
  async updateProgress(
    engagementId: string,
    data: ProductionProgressUpdateRequest
  ): Promise<EngagementProgressUpdate> {
    const res = await apiClient.post<EngagementProgressUpdate>(`engagements/${engagementId}/progress`, data)
    return res
  },

  /**
   * Creator submits final deliverable for brand review, creating a versioned record.
   */
  async submitDeliverable(
    engagementId: string,
    data: DeliverableSubmissionCreate
  ): Promise<EngagementDeliverableSubmission> {
    const res = await apiClient.post<EngagementDeliverableSubmission>(`engagements/${engagementId}/submit`, data)
    return res
  },

  /**
   * Brand reviews deliverable submission (ACCEPT or REQUEST_CHANGES).
   */
  async reviewSubmission(
    engagementId: string,
    submissionId: string,
    data: DeliverableReviewRequest
  ): Promise<Engagement> {
    const res = await apiClient.post<Engagement>(
      `engagements/${engagementId}/submissions/${submissionId}/review`,
      data
    )
    return res
  },

  /**
   * Cancels an active engagement with recorded reason and actor.
   */
  async cancelEngagement(engagementId: string, data: EngagementCancellationRequest): Promise<Engagement> {
    const res = await apiClient.post<Engagement>(`engagements/${engagementId}/cancel`, data)
    return res
  },

  /**
   * Retrieves full engagement details including deliverable submissions, progress logs, and audit timeline.
   */
  async getEngagementDetail(engagementId: string): Promise<EngagementDetail> {
    const res = await apiClient.get<EngagementDetail>(`engagements/${engagementId}`)
    return res
  },

  /**
   * Lists all engagements accessible to the authenticated brand or creator.
   */
  async listEngagements(params?: { brief_id?: string; status?: string }): Promise<Engagement[]> {
    const res = await apiClient.get<Engagement[]>("engagements", { params })
    return res
  },
}
