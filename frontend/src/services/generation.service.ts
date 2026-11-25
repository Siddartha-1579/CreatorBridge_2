import { apiClient } from "@/lib/apiClient"
import type { GenerationJob, GenerationJobCreate, AIStatusData } from "@/types"

export const generationService = {
  async listJobs(): Promise<GenerationJob[]> {
    return apiClient.get<GenerationJob[]>("generation/jobs")
  },

  async getJob(id: string): Promise<GenerationJob> {
    return apiClient.get<GenerationJob>(`generation/jobs/${id}`)
  },

  async submitJob(data: GenerationJobCreate): Promise<GenerationJob> {
    return apiClient.post<GenerationJob>("generation/jobs", data)
  },

  async saveToPortfolio(jobId: string, title?: string): Promise<{ success: boolean; portfolio_item_id: string; title: string }> {
    return apiClient.post<{ success: boolean; portfolio_item_id: string; title: string }>(
      `generation/jobs/${jobId}/save-portfolio`,
      { title }
    )
  },

  async getAIStatus(): Promise<AIStatusData> {
    return apiClient.get<AIStatusData>("ai/status")
  },
}
