import { apiClient } from "@/lib/apiClient"
import type {
  CampaignBrief,
  CampaignBriefCreate,
  CampaignBriefUpdate,
  AIBriefGenerationRequest,
  AIBriefGenerationResponse,
  RefineIdeaRequest,
  RefineIdeaResponse,
  SuggestCreativeDirectionsRequest,
  SuggestCreativeDirectionsResponse,
  RegenerateSectionRequest,
  RegenerateSectionResponse,
  BriefValidationResult,
  CampaignApplication,
  CampaignApplicationCreate,
  CampaignApplicationUpdate,
  GenerateCoverImageRequest,
  GenerateCoverImageResponse,
} from "@/types"

export interface ListBriefsOptions {
  skip?: number
  limit?: number
  content_type?: string
  category?: string
  min_budget_cents?: number
  max_budget_cents?: number
  tool?: string
  search?: string
}

export const briefsService = {
  async listBriefs(options: ListBriefsOptions | number = 0, limitParam: number = 20): Promise<CampaignBrief[]> {
    let params: Record<string, string | number | undefined> = {}
    if (typeof options === "number") {
      params = { skip: options, limit: limitParam }
    } else {
      params = {
        skip: options.skip ?? 0,
        limit: options.limit ?? 20,
        content_type: options.content_type,
        category: options.category,
        min_budget_cents: options.min_budget_cents,
        max_budget_cents: options.max_budget_cents,
        tool: options.tool,
        search: options.search,
      }
    }
    return apiClient.get<CampaignBrief[]>("briefs", { params })
  },

  async listMyBriefs(): Promise<CampaignBrief[]> {
    return apiClient.get<CampaignBrief[]>("briefs/mine")
  },

  async getBrief(id: string): Promise<CampaignBrief> {
    return apiClient.get<CampaignBrief>(`briefs/${id}`)
  },

  async createBrief(data: CampaignBriefCreate): Promise<CampaignBrief> {
    return apiClient.post<CampaignBrief>("briefs", data)
  },

  async updateBrief(id: string, data: CampaignBriefUpdate): Promise<CampaignBrief> {
    return apiClient.patch<CampaignBrief>(`briefs/${id}`, data)
  },

  async publishBrief(id: string): Promise<CampaignBrief> {
    return apiClient.post<CampaignBrief>(`briefs/${id}/publish`)
  },

  async generateCoverImage(
    id: string,
    request: GenerateCoverImageRequest = {}
  ): Promise<GenerateCoverImageResponse> {
    return apiClient.post<GenerateCoverImageResponse>(`briefs/${id}/cover-image`, request)
  },

  async applyToBrief(
    briefId: string,
    data: CampaignApplicationCreate
  ): Promise<CampaignApplication> {
    return apiClient.post<CampaignApplication>(`briefs/${briefId}/apply`, data)
  },

  async listApplicationsForBrief(briefId: string): Promise<CampaignApplication[]> {
    return apiClient.get<CampaignApplication[]>(`briefs/${briefId}/applications`)
  },

  async listMyApplications(): Promise<CampaignApplication[]> {
    return apiClient.get<CampaignApplication[]>("briefs/applications/my")
  },

  async updateApplicationStatus(
    applicationId: string,
    data: CampaignApplicationUpdate
  ): Promise<CampaignApplication> {
    return apiClient.patch<CampaignApplication>(`briefs/applications/${applicationId}/status`, data)
  },

  async generateWithAI(request: AIBriefGenerationRequest): Promise<AIBriefGenerationResponse> {
    return apiClient.post<AIBriefGenerationResponse>("briefs/ai/generate", request)
  },

  async refineIdea(request: RefineIdeaRequest): Promise<RefineIdeaResponse> {
    return apiClient.post<RefineIdeaResponse>("briefs/ai/refine-idea", request)
  },

  async suggestCreativeDirections(
    request: SuggestCreativeDirectionsRequest
  ): Promise<SuggestCreativeDirectionsResponse> {
    return apiClient.post<SuggestCreativeDirectionsResponse>("briefs/ai/suggest-directions", request)
  },

  async regenerateSection(request: RegenerateSectionRequest): Promise<RegenerateSectionResponse> {
    return apiClient.post<RegenerateSectionResponse>("briefs/ai/regenerate-section", request)
  },

  async validateBrief(data: CampaignBriefCreate): Promise<BriefValidationResult> {
    return apiClient.post<BriefValidationResult>("briefs/validate", data)
  },
}

