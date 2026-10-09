import { apiClient } from "@/lib/apiClient"
import type {
  CreatorProfile,
  CreatorProfileCreate,
  CreatorProfileUpdate,
  CreatorProfileDetail,
  ProfileCompletenessResponse,
  VerificationBadge,
  VerificationRecordCreate,
  VerificationRecordResponse,
} from "@/types"

export const creatorsService = {
  async listCreators(skip: number = 0, limit: number = 20): Promise<CreatorProfile[]> {
    return apiClient.get<CreatorProfile[]>("creators", {
      params: { skip, limit },
    })
  },

  async getMyProfile(): Promise<CreatorProfile> {
    return apiClient.get<CreatorProfile>("creators/me")
  },

  async updateMyProfile(data: CreatorProfileUpdate): Promise<CreatorProfile> {
    return apiClient.patch<CreatorProfile>("creators/me", data)
  },

  async getMyCompleteness(): Promise<ProfileCompletenessResponse> {
    return apiClient.get<ProfileCompletenessResponse>("creators/me/completeness")
  },

  async getMyVerifications(): Promise<VerificationBadge[]> {
    return apiClient.get<VerificationBadge[]>("creators/me/verifications")
  },

  async submitVerificationClaim(data: VerificationRecordCreate): Promise<VerificationRecordResponse> {
    return apiClient.post<VerificationRecordResponse>("creators/me/verifications", data)
  },

  async getPublicCreator(idOrHandle: string): Promise<CreatorProfileDetail> {
    return apiClient.get<CreatorProfileDetail>(`creators/${idOrHandle}`)
  },

  async getCreator(id: string): Promise<CreatorProfile> {
    return apiClient.get<CreatorProfile>(`creators/${id}`)
  },

  async createProfile(data: CreatorProfileCreate): Promise<CreatorProfile> {
    return apiClient.post<CreatorProfile>("creators", data)
  },

  async updateProfile(id: string, data: Partial<CreatorProfileCreate>): Promise<CreatorProfile> {
    return apiClient.patch<CreatorProfile>(`creators/${id}`, data)
  },
}
