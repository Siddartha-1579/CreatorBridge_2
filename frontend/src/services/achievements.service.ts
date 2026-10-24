import { apiClient } from "@/lib/apiClient"
import type {
  AchievementSummary,
  PriorityBoost,
  PriorityBoostRequest,
  PublicAchievementSummary,
} from "@/types"

export const achievementsService = {
  /**
   * Retrieves the authenticated creator's achievement balances,
   * active temporary boosts, and verified achievement history.
   */
  async getMyAchievements(): Promise<AchievementSummary> {
    const res = await apiClient.get<AchievementSummary>("achievements/me")
    return res
  },

  /**
   * Spends available achievement points to activate a 24-hour priority boost.
   */
  async createPriorityBoost(data: PriorityBoostRequest): Promise<PriorityBoost> {
    const res = await apiClient.post<PriorityBoost>("achievements/boosts", data)
    return res
  },

  /**
   * Public summary of lifetime achievement reputation without private spendable balances.
   */
  async getPublicSummary(creatorId: string): Promise<PublicAchievementSummary> {
    const res = await apiClient.get<PublicAchievementSummary>(`achievements/accounts/${creatorId}`)
    return res
  },
}
