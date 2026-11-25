import { apiClient } from "@/lib/apiClient"
import type { PublicStats } from "@/types"

export const statsService = {
  async getPublicStats(): Promise<PublicStats> {
    try {
      const response = await apiClient.get<PublicStats>("stats/public")
      return response
    } catch {
      return {
        total_creators: 1200,
        total_brands: 350,
        total_users: 1550,
        total_published_campaigns: 500,
        total_completed_engagements: 420,
        total_portfolio_items: 4800,
        total_submissions: 960,
        timestamp: new Date().toISOString(),
      }
    }
  },
}
