import { apiClient } from "@/lib/apiClient"
import type {
  SurveyConfig,
  SurveyQuestion,
  AssessmentProgress,
  AssessmentResult,
} from "@/types"

export const onboardingService = {
  async getSurveyConfig(): Promise<SurveyConfig> {
    return await apiClient.get<SurveyConfig>("onboarding/survey/config")
  },

  async getAdaptiveQuestions(specialization?: string): Promise<SurveyQuestion[]> {
    const query = specialization ? `?specialization=${encodeURIComponent(specialization)}` : ""
    return await apiClient.get<SurveyQuestion[]>(`onboarding/survey/questions${query}`)
  },

  async startOrResumeAssessment(
    primarySpecialization?: string,
    secondarySpecializations?: string[]
  ): Promise<AssessmentProgress> {
    return await apiClient.post<AssessmentProgress>("onboarding/assessment/start", {
      primary_specialization: primarySpecialization,
      secondary_specializations: secondarySpecializations || [],
    })
  },

  async saveResponse(
    questionId: string,
    responseValue: any,
    currentStepIndex?: number,
    assessmentId?: string,
    integritySignals?: Record<string, any>
  ): Promise<AssessmentProgress> {
    return await apiClient.post<AssessmentProgress>("onboarding/assessment/response", {
      assessment_id: assessmentId,
      question_id: questionId,
      response_value: responseValue,
      current_step_index: currentStepIndex,
      integrity_signals: integritySignals,
    })
  },

  async batchSaveResponses(
    responses: Array<{ question_id: string; response_value: any }>,
    currentStepIndex: number,
    assessmentId?: string,
    integritySignals?: Record<string, any>
  ): Promise<AssessmentProgress> {
    return await apiClient.post<AssessmentProgress>("onboarding/assessment/batch", {
      assessment_id: assessmentId,
      responses,
      current_step_index: currentStepIndex,
      integrity_signals: integritySignals,
    })
  },

  async getProgress(): Promise<AssessmentProgress> {
    return await apiClient.get<AssessmentProgress>("onboarding/assessment/progress")
  },

  async submitAssessment(assessmentId?: string): Promise<AssessmentResult> {
    const query = assessmentId ? `?assessment_id=${encodeURIComponent(assessmentId)}` : ""
    return await apiClient.post<AssessmentResult>(`onboarding/assessment/submit${query}`)
  },

  async getAssessmentResult(assessmentId?: string): Promise<AssessmentResult> {
    const query = assessmentId ? `?assessment_id=${encodeURIComponent(assessmentId)}` : ""
    return await apiClient.get<AssessmentResult>(`onboarding/assessment/result${query}`)
  },
}
