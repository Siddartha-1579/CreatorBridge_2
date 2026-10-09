import React from "react"
import { Sparkles, CheckCircle2, Circle } from "lucide-react"
import type { SurveyQuestion } from "@/types"

interface ScenarioQuestionProps {
  question: SurveyQuestion
  value: string | undefined
  onChange: (value: string) => void
}

export const ScenarioQuestion: React.FC<ScenarioQuestionProps> = ({
  question,
  value,
  onChange,
}) => {
  return (
    <div className="w-full space-y-5">
      {/* Scenario Callout Banner */}
      {question.scenario && (
        <div className="rounded-2xl border border-purple-200/90 bg-gradient-to-r from-purple-50/90 via-purple-50/40 to-white p-4.5 shadow-xs">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-purple-700 mb-1.5">
            <Sparkles className="h-4 w-4" />
            <span>Production Scenario Context</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            "{question.scenario}"
          </p>
        </div>
      )}

      {/* Decision Options */}
      <div className="space-y-3" role="radiogroup" aria-labelledby={`q-${question.id}`}>
        {question.options.map((opt) => {
          const isSelected = value === opt.id
          return (
            <div
              key={opt.id}
              onClick={() => onChange(opt.id)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onChange(opt.id)
                }
              }}
              className={`group flex items-start space-x-3.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                isSelected
                  ? "border-purple-600 bg-purple-50/80 shadow-sm text-slate-900"
                  : "border-slate-200/90 bg-white hover:border-purple-300 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isSelected ? (
                  <CheckCircle2 className="h-5 w-5 text-purple-600 animate-in zoom-in-75 duration-150" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-300 group-hover:text-purple-400 transition-colors" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold tracking-tight text-slate-900 leading-snug">
                  {opt.label}
                </div>
                {opt.description && (
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {opt.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
