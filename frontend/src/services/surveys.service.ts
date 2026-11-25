import { apiClient } from "@/lib/apiClient"
import type {
  SurveySchemaResponse,
  SurveyResponseRecord,
  AdaptiveEvaluationResponse,
} from "@/types"

export const surveysService = {
  async getSchema(surveyType: "creator" | "brand"): Promise<SurveySchemaResponse> {
    return apiClient.get<SurveySchemaResponse>(`/surveys/${surveyType}/schema`)
  },

  async evaluateAdaptive(
    surveyType: "creator" | "brand",
    currentAnswers: Record<string, any>,
    sectionKey?: string
  ): Promise<AdaptiveEvaluationResponse> {
    return apiClient.post<AdaptiveEvaluationResponse>(
      `/surveys/${surveyType}/evaluate-adaptive`,
      {
        survey_type: surveyType.toUpperCase(),
        current_answers: currentAnswers,
        section_key: sectionKey,
      }
    )
  },

  async getDraft(surveyType: "creator" | "brand"): Promise<SurveyResponseRecord | null> {
    return apiClient.get<SurveyResponseRecord | null>(`/surveys/${surveyType}/draft`)
  },

  async saveDraft(
    surveyType: "creator" | "brand",
    currentSectionIndex: number,
    answers: Record<string, any>
  ): Promise<SurveyResponseRecord> {
    return apiClient.post<SurveyResponseRecord>(`/surveys/${surveyType}/draft`, {
      survey_type: surveyType.toUpperCase(),
      current_section_index: currentSectionIndex,
      answers,
    })
  },

  async submitSurvey(
    surveyType: "creator" | "brand",
    answers: Record<string, any>
  ): Promise<SurveyResponseRecord> {
    return apiClient.post<SurveyResponseRecord>(`/surveys/${surveyType}/submit`, {
      survey_type: surveyType.toUpperCase(),
      answers,
    })
  },
}
