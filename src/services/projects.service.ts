import { apiClient } from "@/lib/apiClient"
import type { ProjectWorkspace, ProjectWorkspaceCreate, ProjectWorkspaceUpdate } from "@/types"

export const projectsService = {
  async listProjects(): Promise<ProjectWorkspace[]> {
    return apiClient.get<ProjectWorkspace[]>("projects")
  },

  async getProject(id: string): Promise<ProjectWorkspace> {
    return apiClient.get<ProjectWorkspace>(`projects/${id}`)
  },

  async createProject(data: ProjectWorkspaceCreate): Promise<ProjectWorkspace> {
    return apiClient.post<ProjectWorkspace>("projects", data)
  },

  async updateProject(id: string, data: ProjectWorkspaceUpdate): Promise<ProjectWorkspace> {
    return apiClient.patch<ProjectWorkspace>(`projects/${id}`, data)
  },
}
