import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Save,
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  Lightbulb,
  X,
  Zap,
} from "lucide-react"
import { surveysService } from "@/services/surveys.service"
import { intelligenceService } from "@/services/intelligence.service"
import type {
  SurveySchemaResponse,
  SurveySection,
  AdaptiveSurveyQuestion,
  AIFollowupQuestion,
  AdaptiveEvaluationResponse,
  SurveyIntelligenceResponse,
  GeneratedFollowupQuestion,
} from "@/types"

interface ToolCatalogEntry {
  tool_name: string
  model_version: string
  purpose: string
  experience_level: "beginner" | "intermediate" | "advanced" | "master"
  commercial_terms_verified: boolean
}

export const AdaptiveSurveyEngine: React.FC<{
  surveyType: "creator" | "brand"
  onComplete: () => void
}> = ({ surveyType, onComplete }) => {
  const [schema, setSchema] = useState<SurveySchemaResponse | null>(null)
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [visibleQuestionIds, setVisibleQuestionIds] = useState<string[]>([])
  const [suggestedFollowups, setSuggestedFollowups] = useState<AIFollowupQuestion[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [errors, setErrors] = useState<string[]>([])
  const [saveToast, setSaveToast] = useState<boolean>(false)
  const [isReviewStep, setIsReviewStep] = useState<boolean>(false)

  // AI Intelligence states
  const [intelligence, setIntelligence] = useState<SurveyIntelligenceResponse | null>(null)
  const [evaluatingAI, setEvaluatingAI] = useState<boolean>(false)
  const [dismissedQuestions, setDismissedQuestions] = useState<string[]>([])
  const [followupAnswers, setFollowupAnswers] = useState<Record<string, any>>({})

  // 1. Load schema and existing draft
  useEffect(() => {
    let isMounted = true
    async function init() {
      setLoading(true)
      try {
        const [schemaData, draftData] = await Promise.all([
          surveysService.getSchema(surveyType),
          surveysService.getDraft(surveyType),
        ])

        if (!isMounted) return
        setSchema(schemaData)

        if (draftData && draftData.answers) {
          setAnswers(draftData.answers)
          if (
            draftData.current_section_index !== undefined &&
            draftData.current_section_index < schemaData.sections.length
          ) {
            setCurrentSectionIndex(draftData.current_section_index)
          }
        }
      } catch (err) {
        console.error("Failed to load survey schema/draft:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    init()
    return () => {
      isMounted = false
    }
  }, [surveyType])

  // 2. Re-evaluate adaptive visibility whenever answers change
  useEffect(() => {
    if (!schema) return
    surveysService
      .evaluateAdaptive(surveyType, answers)
      .then((res: AdaptiveEvaluationResponse) => {
        setVisibleQuestionIds(res.visible_question_ids)
        setSuggestedFollowups(res.suggested_followups)
      })
      .catch((err) => console.error("Adaptive evaluation error:", err))
  }, [surveyType, answers, schema])

  const currentSection: SurveySection | undefined = schema?.sections[currentSectionIndex]

  // AI Survey Gap & Contradiction Evaluation
  const runAIEvaluation = useCallback(
    async (overrideAnswers?: Record<string, any>) => {
      try {
        setEvaluatingAI(true)
        const targetAnswers = overrideAnswers || answers
        const currentSecKey = schema?.sections[currentSectionIndex]?.key
        const res = await intelligenceService.evaluateSurvey({
          survey_type: surveyType,
          current_answers: targetAnswers,
          current_section: currentSecKey,
          questions_already_asked: dismissedQuestions,
          max_questions: 3,
        })
        setIntelligence(res)
      } catch (err) {
        console.error("AI intelligence evaluation failed:", err)
      } finally {
        setEvaluatingAI(false)
      }
    },
    [surveyType, answers, schema, currentSectionIndex, dismissedQuestions]
  )

  // Debounced/initial run on section change
  useEffect(() => {
    if (!schema) return
    const timer = setTimeout(() => {
      runAIEvaluation()
    }, 400)
    return () => clearTimeout(timer)
  }, [currentSectionIndex, schema?.survey_id, runAIEvaluation])

  const handleApplyFollowupAnswer = (question: GeneratedFollowupQuestion) => {
    const val = followupAnswers[question.id]
    if (val === undefined || val === "") return
    handleAnswerChange(question.field, val)
    setDismissedQuestions((prev) => [...prev, question.id])
    setFollowupAnswers((prev) => {
      const copy = { ...prev }
      delete copy[question.id]
      return copy
    })
  }

  const handleDismissFollowup = (questionId: string) => {
    setDismissedQuestions((prev) => [...prev, questionId])
  }

  const visibleQuestions: AdaptiveSurveyQuestion[] = useMemo(() => {
    if (!currentSection) return []
    return currentSection.questions.filter((q) =>
      visibleQuestionIds.includes(q.id)
    )
  }, [currentSection, visibleQuestionIds])

  // Handle Answer Changes
  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
    // Clear validation error if field was corrected
    setErrors([])
  }

  // Save Progress
  const handleSaveDraft = async () => {
    try {
      setSaving(true)
      await surveysService.saveDraft(surveyType, currentSectionIndex, answers)
      setSaveToast(true)
      setTimeout(() => setSaveToast(false), 3000)
    } catch (err) {
      console.error("Failed to save draft:", err)
    } finally {
      setSaving(false)
    }
  }

  // Validate current section before continuing
  const validateCurrentSection = (): boolean => {
    const currentErrors: string[] = []
    visibleQuestions.forEach((q) => {
      if (q.is_required) {
        const val = answers[q.id]
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          currentErrors.push(`"${q.question_text}" is required.`)
        }
      }
    })

    if (currentErrors.length > 0) {
      setErrors(currentErrors)
      return false
    }
    setErrors([])
    return true
  }

  const handleNext = () => {
    if (!validateCurrentSection()) return

    if (schema && currentSectionIndex < schema.sections.length - 1) {
      const nextIndex = currentSectionIndex + 1
      setCurrentSectionIndex(nextIndex)
      // Auto-save draft on step transition
      surveysService.saveDraft(surveyType, nextIndex, answers).catch(() => {})
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      // Transition to Review Step
      setIsReviewStep(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleBack = () => {
    if (isReviewStep) {
      setIsReviewStep(false)
      return
    }
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setErrors([])
      await surveysService.submitSurvey(surveyType, answers)
      onComplete()
    } catch (err: any) {
      const msg = err.message || "Failed to submit survey"
      setErrors([msg])
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !schema) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="text-sm">Loading adaptive questionnaire...</span>
      </div>
    )
  }

  const totalSections = schema.sections.length
  const progressPercent = Math.round(
    isReviewStep
      ? 100
      : ((currentSectionIndex + 1) / (totalSections + 1)) * 100
  )

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Save Draft Toast */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          Draft progress saved! You can return anytime.
        </div>
      )}

      {/* Header & Stepper */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-purple-50 text-purple-700 border border-purple-200">
              {surveyType === "creator" ? "Creator Onboarding" : "Brand Onboarding"}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
              {isReviewStep ? "Review & Confirm Details" : currentSection?.title}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isReviewStep
                ? "Review your structured submissions before publishing your profile."
                : currentSection?.description}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => runAIEvaluation()}
              disabled={evaluatingAI}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors shadow-2xs disabled:opacity-50"
              title="Run AI completeness audit and gap analysis"
            >
              <Sparkles className={`w-3.5 h-3.5 ${evaluatingAI ? "animate-spin text-purple-600" : "text-purple-600"}`} />
              {evaluatingAI ? "Auditing..." : "AI Gap Audit"}
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-2xs disabled:opacity-50"
            >
              <Save className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
              {saving ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </div>

        {/* AI Intelligence Status Bar */}
        {intelligence && (
          <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${intelligence.is_ai_powered ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="font-bold text-slate-100">
                {intelligence.is_ai_powered ? "AI Intelligence Active (GPT-4o)" : "Deterministic Rule Engine (Deterministic Mode)"}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-300">
                Score: <strong className="text-white">{intelligence.completion_percentage}%</strong>
              </span>
              {intelligence.contradictions.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/30 text-rose-300 border border-rose-400/40">
                  {intelligence.contradictions.length} Conflict{intelligence.contradictions.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span>{intelligence.reasoning_summary}</span>
            </div>
          </div>
        )}

        {/* Progress Bar & Indicators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>
              {isReviewStep
                ? "Final Review Step"
                : `Section ${currentSectionIndex + 1} of ${totalSections}`}
            </span>
            <span>{progressPercent}% completed</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Section Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {schema.sections.map((sec, idx) => (
            <button
              key={sec.key}
              onClick={() => {
                if (idx < currentSectionIndex || isReviewStep) {
                  setCurrentSectionIndex(idx)
                  setIsReviewStep(false)
                }
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                idx === currentSectionIndex && !isReviewStep
                  ? "bg-purple-600 text-white font-semibold shadow-xs"
                  : idx < currentSectionIndex
                  ? "bg-purple-50 text-purple-700 hover:bg-purple-100"
                  : "bg-slate-50 text-slate-400 cursor-not-allowed"
              }`}
            >
              {idx < currentSectionIndex ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <span>{idx + 1}.</span>
              )}
              {sec.title}
            </button>
          ))}
        </div>
      </div>

      {/* Contradiction Warnings Alert */}
      {intelligence?.contradictions && intelligence.contradictions.length > 0 && (
        <div className="space-y-2.5">
          {intelligence.contradictions.map((contra, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1.5 shadow-2xs"
            >
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{contra.title}</span>
                <span className="uppercase text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-200 text-amber-900 ml-auto">
                  {contra.severity}
                </span>
              </div>
              <p className="text-amber-800 leading-relaxed">{contra.description}</p>
              <div className="pt-1 flex items-start gap-1.5 text-amber-950 font-medium">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>Recommended Resolution: {contra.recommended_resolution}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Alert */}
      {errors.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            Please address the following requirements:
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-rose-700 pl-4">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Prioritized Follow-up Question Cards */}
      {intelligence?.questions &&
        intelligence.questions.filter((q) => !dismissedQuestions.includes(q.id)).length > 0 &&
        !isReviewStep && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                AI Gap Clarification Questions ({intelligence.questions.filter((q) => !dismissedQuestions.includes(q.id)).length})
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Answer inline to automatically enrich your profile
              </span>
            </div>

            {intelligence.questions
              .filter((q) => !dismissedQuestions.includes(q.id))
              .map((q) => (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-white border border-purple-200 shadow-sm space-y-3 transition-all hover:border-purple-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            q.priority === "high"
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : q.priority === "medium"
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {q.priority} Priority Gap
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Section: {q.section}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{q.question}</h4>
                      <p className="text-xs text-purple-700 font-medium">{q.why_asking}</p>
                    </div>

                    <button
                      onClick={() => handleDismissFollowup(q.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Dismiss question"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Inline input for the follow-up question */}
                  <div className="pt-1 space-y-2">
                    {q.options && q.options.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setFollowupAnswers((prev) => ({ ...prev, [q.id]: opt.value }))
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              followupAnswers[q.id] === opt.value
                                ? "bg-purple-600 text-white border-purple-600"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    ) : q.input_type === "textarea" ? (
                      <textarea
                        value={followupAnswers[q.id] || ""}
                        onChange={(e) =>
                          setFollowupAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        rows={2}
                        placeholder="Provide details here..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-purple-500"
                      />
                    ) : (
                      <input
                        type={q.input_type === "number" ? "number" : "text"}
                        value={followupAnswers[q.id] || ""}
                        onChange={(e) =>
                          setFollowupAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        placeholder="Type answer here..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-purple-500"
                      />
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleDismissFollowup(q.id)}
                        className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
                      >
                        Skip
                      </button>
                      <button
                        onClick={() => handleApplyFollowupAnswer(q)}
                        disabled={!followupAnswers[q.id]}
                        className="px-3 py-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-40"
                      >
                        Apply Answer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

      {/* Suggested Follow-up Checkpoints */}
      {suggestedFollowups.length > 0 && !isReviewStep && (
        <div className="space-y-3">
          {suggestedFollowups.map((sug) => (
            <div
              key={sug.id}
              className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-950 flex items-start gap-3"
            >
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-purple-900">
                  Adaptive Checkpoint Suggestion
                </p>
                <p className="text-purple-800 font-medium">{sug.question_text}</p>
                <p className="text-[11px] text-purple-600/90">{sug.trigger_reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION QUESTIONS FORM or REVIEW STEP */}
      {!isReviewStep ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          {visibleQuestions.map((q) => (
            <div key={q.id} className="space-y-2 pb-5 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-2">
                <label className="text-sm font-bold text-slate-900">
                  {q.question_text}
                  {q.is_required && (
                    <span className="text-rose-500 ml-1 font-normal">*</span>
                  )}
                </label>
                {q.requires_verification && (
                  <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                    Verification Eligible
                  </span>
                )}
              </div>

              {q.help_text && (
                <p className="text-xs text-slate-500 leading-relaxed">
                  {q.help_text}
                </p>
              )}

              {/* RENDER QUESTION BY INPUT TYPE */}
              {/* 1. TEXT */}
              {q.input_type === "text" && (
                <input
                  type="text"
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="Enter your response..."
                />
              )}

              {/* 2. TEXTAREA */}
              {q.input_type === "textarea" && (
                <textarea
                  rows={4}
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-y"
                  placeholder="Type your response here..."
                />
              )}

              {/* 3. NUMBER */}
              {q.input_type === "number" && (
                <input
                  type="number"
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    handleAnswerChange(
                      q.id,
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full sm:w-64 px-3.5 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              )}

              {/* 4. URL */}
              {q.input_type === "url" && (
                <input
                  type="url"
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="https://..."
                />
              )}

              {/* 5. SINGLE CHOICE */}
              {q.input_type === "single_choice" && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt.value
                    return (
                      <div
                        key={opt.value}
                        onClick={() => handleAnswerChange(q.id, opt.value)}
                        className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 ${
                          isSelected
                            ? "bg-purple-50/70 border-purple-500 text-purple-950 shadow-2xs font-semibold"
                            : "bg-slate-50/40 border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <p>{opt.label}</p>
                          {opt.description && (
                            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                              {opt.description}
                            </p>
                          )}
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? "border-purple-600 bg-purple-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 6. MULTI SELECT */}
              {q.input_type === "multi_select" && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt) => {
                    const currentArr: string[] = answers[q.id] || []
                    const isSelected = currentArr.includes(opt.value)

                    return (
                      <div
                        key={opt.value}
                        onClick={() => {
                          const updated = isSelected
                            ? currentArr.filter((x) => x !== opt.value)
                            : [...currentArr, opt.value]
                          handleAnswerChange(q.id, updated)
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-purple-50/70 border-purple-400 text-purple-950 font-semibold"
                            : "bg-slate-50/40 border-slate-200/80 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{opt.label}</span>
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "border-purple-600 bg-purple-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 7. TOOL CATALOG (Interactive Array Editor) */}
              {q.input_type === "tool_catalog" && (
                <div className="space-y-3 pt-1">
                  {((answers[q.id] as ToolCatalogEntry[]) || []).map(
                    (entry, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            Tool #{idx + 1}: {entry.tool_name || "New Tool"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const curr = [...(answers[q.id] || [])]
                              curr.splice(idx, 1)
                              handleAnswerChange(q.id, curr)
                            }}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <input
                            type="text"
                            placeholder="Provider / Tool (e.g. Midjourney)"
                            value={entry.tool_name}
                            onChange={(e) => {
                              const curr = [...(answers[q.id] || [])]
                              curr[idx].tool_name = e.target.value
                              handleAnswerChange(q.id, curr)
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                          />
                          <input
                            type="text"
                            placeholder="Version (e.g. v6.1)"
                            value={entry.model_version}
                            onChange={(e) => {
                              const curr = [...(answers[q.id] || [])]
                              curr[idx].model_version = e.target.value
                              handleAnswerChange(q.id, curr)
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                          />
                          <select
                            value={entry.experience_level}
                            onChange={(e) => {
                              const curr = [...(answers[q.id] || [])]
                              curr[idx].experience_level = e.target.value as any
                              handleAnswerChange(q.id, curr)
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="master">Master</option>
                          </select>
                        </div>

                        <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={entry.commercial_terms_verified}
                            onChange={(e) => {
                              const curr = [...(answers[q.id] || [])]
                              curr[idx].commercial_terms_verified = e.target.checked
                              handleAnswerChange(q.id, curr)
                            }}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span>I understand and respect commercial use licensing for this tool.</span>
                        </label>
                      </div>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const curr = [...(answers[q.id] || [])]
                      curr.push({
                        tool_name: "",
                        model_version: "",
                        purpose: "Generative Production",
                        experience_level: "advanced",
                        commercial_terms_verified: true,
                      })
                      handleAnswerChange(q.id, curr)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200/80 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Tool to Matrix
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* REVIEW & CONFIRMATION STEP */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-purple-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-purple-900">
                Transparent Verification Guarantee
              </p>
              <p className="text-purple-800 mt-0.5 leading-relaxed">
                By submitting this questionnaire, your professional profile and campaign specifications are registered in CreatorBridge's intelligent matching registry. All claims are stored transparently and remain editable from your profile settings.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {schema.sections.map((sec, idx) => {
              const secQuestions = sec.questions.filter((q) =>
                visibleQuestionIds.includes(q.id)
              )
              const answeredCount = secQuestions.filter(
                (q) => answers[q.id] !== undefined && answers[q.id] !== ""
              ).length

              return (
                <div
                  key={sec.key}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      {idx + 1}. {sec.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {answeredCount} of {secQuestions.length} questions completed
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentSectionIndex(idx)
                      setIsReviewStep(false)
                    }}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                  >
                    Edit Section
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={handleBack}
          disabled={currentSectionIndex === 0 && !isReviewStep}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {!isReviewStep ? (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-7 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing Profile...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Complete & Submit Onboarding
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
