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
} from "@/types"

export const briefsService = {
  async listBriefs(skip: number = 0, limit: number = 20): Promise<CampaignBrief[]> {
    return apiClient.get<CampaignBrief[]>("briefs", {
      params: { skip, limit },
    })
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
