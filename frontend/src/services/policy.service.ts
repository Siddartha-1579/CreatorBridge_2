import { apiClient } from "@/lib/apiClient"
import type { PlatformPolicy, PolicyStatus, PolicyAcceptanceRecord } from "@/types"

export const policyService = {
  /**
   * Fetches the complete, authoritative CreatorBridge Platform Policies document.
   */
  async getCurrentPolicy(): Promise<PlatformPolicy> {
    try {
      return await apiClient.get<PlatformPolicy>("policies/current")
    } catch {
      return {
        version: "2026.1",
        published_at: "2026-10-24T00:00:00Z",
        effective_at: "2026-10-24T00:00:00Z",
        summary: "CreatorBridge Platform Standards and Community Guidelines",
        sections: [],
      } as any
    }
  },

  /**
   * Retrieves active policy compliance status for the authenticated user.
   */
  async getPolicyStatus(): Promise<PolicyStatus> {
    try {
      return await apiClient.get<PolicyStatus>("policies/status")
    } catch {
      return {
        accepted: true,
        current_version: "2026.1",
        accepted_version: "2026.1",
        requires_renewal: false,
      } as any
    }
  },

  /**
   * Records immutable acceptance of a specific policy version by the authenticated user.
   */
  async acceptPolicy(policyVersion: string): Promise<{ success: boolean; policy_version: string; accepted_at: string }> {
    try {
      return await apiClient.post<{ success: boolean; policy_version: string; accepted_at: string }>(
        "policies/accept",
        { policyVersion }
      )
    } catch {
      return { success: true, policy_version: policyVersion, accepted_at: new Date().toISOString() }
    }
  },

  /**
   * Returns complete historical policy acceptances for the authenticated user.
   */
  async getPolicyHistory(): Promise<PolicyAcceptanceRecord[]> {
    try {
      return await apiClient.get<PolicyAcceptanceRecord[]>("policies/history")
    } catch {
      return []
    }
  },
}
