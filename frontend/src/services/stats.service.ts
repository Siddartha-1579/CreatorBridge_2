import { apiClient } from "@/lib/apiClient"
import type { PublicStats } from "@/types"

export const statsService = {
  async getPublicStats(): Promise<PublicStats> {
    const response = await apiClient.get<PublicStats>("stats/public")
    return response
  },
}
