import React from "react"
import { CheckCircle2, Circle } from "lucide-react"
import type { SurveyQuestion } from "@/types"

interface SingleChoiceProps {
  question: SurveyQuestion
  value: string | undefined
  onChange: (value: string) => void
}

export const SingleChoiceQuestion: React.FC<SingleChoiceProps> = ({
  question,
  value,
  onChange,
}) => {
  return (
    <div className="space-y-3 w-full" role="radiogroup" aria-labelledby={`q-${question.id}`}>
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
            className={`group relative flex items-start space-x-3.5 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
              isSelected
                ? "border-purple-600 bg-purple-50/70 shadow-sm shadow-purple-500/10 text-slate-900"
                : "border-slate-200/90 bg-white hover:border-purple-300 hover:bg-slate-50/60 text-slate-700"
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
              <div className="text-sm font-semibold tracking-tight text-slate-900">
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
  )
}
