import { apiClient } from "@/lib/apiClient"
import type {
  SurveyIntelligenceRequest,
  SurveyIntelligenceResponse,
  ProfileImprovementRequest,
  ProfileImprovementResponse,
  BriefClarificationRequest,
  BriefClarificationResponse,
  AIUsageStatusResponse,
} from "@/types"

export const intelligenceService = {
  /**
   * Evaluate survey answers for completion, missing information, contradictions,
   * and generate prioritized adaptive follow-up questions.
   */
  async evaluateSurvey(
    request: SurveyIntelligenceRequest
  ): Promise<SurveyIntelligenceResponse> {
    return apiClient.post<SurveyIntelligenceResponse>(
      "/ai/survey/evaluate",
      request
    )
  },

  /**
   * Improve a creator's headline and bio with strict factual preservation,
   * tone alignment, and suggestion of missing details.
   */
  async improveProfile(
    request: ProfileImprovementRequest
  ): Promise<ProfileImprovementResponse> {
    return apiClient.post<ProfileImprovementResponse>(
      "/ai/creator/improve-profile",
      request
    )
  },

  /**
   * Inspect a draft brand brief for missing specs and timeline conflicts,
   * proposing refinements without auto-publishing.
   */
  async clarifyBrief(
    request: BriefClarificationRequest
  ): Promise<BriefClarificationResponse> {
    return apiClient.post<BriefClarificationResponse>(
      "/ai/brand/clarify-brief",
      request
    )
  },

  /**
   * Fetch AI usage and token telemetry, active limits, and fallback status.
   */
  async getUsageStatus(): Promise<AIUsageStatusResponse> {
    return apiClient.get<AIUsageStatusResponse>("/ai/usage-status")
  },
}
