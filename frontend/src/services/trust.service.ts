import { apiClient } from "@/lib/apiClient"
import type {
  TrustScore,
  PublicTrustProfile,
  TrustCase,
  IncidentCategory,
  IncidentSeverity,
} from "@/types"

export const trustService = {
  async getMyTrustScore(): Promise<TrustScore> {
    return apiClient.get<TrustScore>("/trust/me")
  },

  async getPublicTrustProfile(accountId: string): Promise<PublicTrustProfile> {
    return apiClient.get<PublicTrustProfile>(`/trust/accounts/${accountId}/public`)
  },

  async createCase(payload: {
    reported_account_id: string
    category: IncidentCategory
    description: string
    evidence_urls?: string[]
    reference_id?: string
  }): Promise<TrustCase> {
    return apiClient.post<TrustCase>("/trust/cases", payload)
  },

  async listMyCases(): Promise<TrustCase[]> {
    return apiClient.get<TrustCase[]>("/trust/cases")
  },

  async reviewCase(
    caseId: string,
    payload: {
      decision: "CONFIRM" | "DISMISS"
      rationale: string
      severity?: IncidentSeverity
    }
  ): Promise<TrustCase> {
    return apiClient.post<TrustCase>(`/trust/cases/${caseId}/review`, payload)
  },

  async appealCase(
    caseId: string,
    payload: {
      appeal_text: string
      supporting_evidence?: string[]
    }
  ): Promise<TrustCase> {
    return apiClient.post<TrustCase>(`/trust/cases/${caseId}/appeal`, payload)
  },
}
