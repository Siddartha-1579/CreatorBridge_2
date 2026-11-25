import { apiClient } from "@/lib/apiClient"
import type {
  BrandProfile,
  BrandProfileCreate,
  BrandProfileUpdate,
  BrandPreferences,
  BrandPreferencesUpdate,
  BrandCompletenessResponse,
  BrandVerificationBadge,
  BrandVerificationClaimCreate,
  BrandVerificationRecord,
  BrandDashboardOverview,
  BrandSurveySession,
} from "@/types"

export const brandsService = {
  async getMyProfile(): Promise<BrandProfile> {
    return apiClient.get<BrandProfile>("brands/me")
  },

  async updateMyProfile(data: BrandProfileUpdate): Promise<BrandProfile> {
    return apiClient.patch<BrandProfile>("brands/me", data)
  },

  async getMyOverview(): Promise<BrandDashboardOverview> {
    return apiClient.get<BrandDashboardOverview>("brands/me/overview")
  },

  async getMyCompleteness(): Promise<BrandCompletenessResponse> {
    return apiClient.get<BrandCompletenessResponse>("brands/me/completeness")
  },

  async getMyPreferences(): Promise<BrandPreferences | null> {
    return apiClient.get<BrandPreferences | null>("brands/me/preferences")
  },

  async updateMyPreferences(data: BrandPreferencesUpdate): Promise<BrandPreferences> {
    return apiClient.put<BrandPreferences>("brands/me/preferences", data)
  },

  async getMyVerifications(): Promise<BrandVerificationBadge[]> {
    return apiClient.get<BrandVerificationBadge[]>("brands/me/verifications")
  },

  async submitVerificationClaim(data: BrandVerificationClaimCreate): Promise<BrandVerificationRecord> {
    return apiClient.post<BrandVerificationRecord>("brands/me/verifications", data)
  },

  async getOnboardingCatalog(): Promise<Record<string, any>> {
    return apiClient.get<Record<string, any>>("brands/onboarding/catalog")
  },

  async getAdaptiveBranches(responses: Record<string, any>): Promise<any[]> {
    return apiClient.post<any[]>("brands/onboarding/adaptive", responses)
  },

  async getSurveySession(): Promise<BrandSurveySession> {
    return apiClient.get<BrandSurveySession>("brands/onboarding/session")
  },

  async saveSurveyProgress(currentStep: number, responses: Record<string, any>): Promise<BrandSurveySession> {
    return apiClient.post<BrandSurveySession>("brands/onboarding/save", {
      current_step: currentStep,
      responses,
    })
  },

  async completeOnboarding(responses: Record<string, any>): Promise<BrandDashboardOverview> {
    return apiClient.post<BrandDashboardOverview>("brands/onboarding/complete", responses)
  },

  async listBrands(skip: number = 0, limit: number = 20): Promise<BrandProfile[]> {
    return apiClient.get<BrandProfile[]>("brands", {
      params: { skip, limit },
    })
  },

  async getBrand(id: string): Promise<BrandProfile> {
    return apiClient.get<BrandProfile>(`brands/${id}`)
  },

  async createProfile(data: BrandProfileCreate): Promise<BrandProfile> {
    return apiClient.post<BrandProfile>("brands", data)
  },
}
