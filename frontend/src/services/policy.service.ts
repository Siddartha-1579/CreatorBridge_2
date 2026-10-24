import { apiClient } from "@/lib/apiClient"
import type { PlatformPolicy, PolicyStatus, PolicyAcceptanceRecord } from "@/types"

export const policyService = {
  /**
   * Fetches the complete, authoritative CreatorBridge Platform Policies document.
   */
  async getCurrentPolicy(): Promise<PlatformPolicy> {
    return await apiClient.get<PlatformPolicy>("policies/current")
  },

  /**
   * Retrieves active policy compliance status for the authenticated user.
   */
  async getPolicyStatus(): Promise<PolicyStatus> {
    return await apiClient.get<PolicyStatus>("policies/status")
  },

  /**
   * Records immutable acceptance of a specific policy version by the authenticated user.
   */
  async acceptPolicy(policyVersion: string): Promise<{ success: boolean; policy_version: string; accepted_at: string }> {
    return await apiClient.post<{ success: boolean; policy_version: string; accepted_at: string }>(
      "policies/accept",
      { policyVersion }
    )
  },

  /**
   * Returns complete historical policy acceptances for the authenticated user.
   */
  async getPolicyHistory(): Promise<PolicyAcceptanceRecord[]> {
    return await apiClient.get<PolicyAcceptanceRecord[]>("policies/history")
  },
}
