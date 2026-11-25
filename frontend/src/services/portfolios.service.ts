import { apiClient } from "@/lib/apiClient"
import type {
  PortfolioProject,
  PortfolioProjectCreate,
  PortfolioProjectUpdate,
  PortfolioUploadResponse,
  ProjectVisibility,
} from "@/types"

export const portfoliosService = {
  async listProjects(creatorId: string, publicOnly: boolean = false): Promise<PortfolioProject[]> {
    return apiClient.get<PortfolioProject[]>("portfolios", {
      params: { creator_id: creatorId, public_only: publicOnly },
    })
  },

  async getProject(id: string): Promise<PortfolioProject> {
    return apiClient.get<PortfolioProject>(`portfolios/${id}`)
  },

  async createProject(data: PortfolioProjectCreate): Promise<PortfolioProject> {
    return apiClient.post<PortfolioProject>("portfolios", data)
  },

  async updateProject(id: string, data: PortfolioProjectUpdate): Promise<PortfolioProject> {
    return apiClient.patch<PortfolioProject>(`portfolios/${id}`, data)
  },

  async deleteProject(id: string): Promise<boolean> {
    return apiClient.delete<boolean>(`portfolios/${id}`)
  },

  async toggleVisibility(id: string, visibility: ProjectVisibility): Promise<PortfolioProject> {
    return apiClient.post<PortfolioProject>(`portfolios/${id}/visibility`, null, {
      params: { visibility },
    })
  },

  async uploadAsset(file: File): Promise<PortfolioUploadResponse> {
    const formData = new FormData()
    formData.append("file", file)
    return apiClient.post<PortfolioUploadResponse>("portfolios/upload", formData)
  },

  // Backward compatibility aliases
  async listByCreator(creatorId: string): Promise<PortfolioProject[]> {
    return this.listProjects(creatorId, false)
  },

  async getItem(id: string): Promise<PortfolioProject> {
    return this.getProject(id)
  },

  async addItem(data: PortfolioProjectCreate): Promise<PortfolioProject> {
    return this.createProject(data)
  },
}
