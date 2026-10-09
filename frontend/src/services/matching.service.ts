import { apiClient } from "@/lib/apiClient"
import type { MatchCriteria, CreatorMatchResult, BriefMatchResult } from "@/types"

export const matchingService = {
  async computeMatches(criteria: MatchCriteria): Promise<CreatorMatchResult[]> {
    return apiClient.post<CreatorMatchResult[]>("matches/compute", criteria)
  },

  async getMatchesForBrief(briefId: string): Promise<CreatorMatchResult[]> {
    return apiClient.get<CreatorMatchResult[]>(`matches/briefs/${briefId}`)
  },

  async refreshMatchesForBrief(briefId: string): Promise<CreatorMatchResult[]> {
    return apiClient.post<CreatorMatchResult[]>(`matches/briefs/${briefId}/refresh`, {})
  },

  async getCreatorRecommendations(): Promise<BriefMatchResult[]> {
    return apiClient.get<BriefMatchResult[]>("matches/creator/recommendations")
  },
}
