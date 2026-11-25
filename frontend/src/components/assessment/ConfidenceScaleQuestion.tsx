import React from "react"
import type { SurveyQuestion } from "@/types"

interface ConfidenceScaleProps {
  question: SurveyQuestion
  value: number | undefined
  onChange: (value: number) => void
}

export const ConfidenceScaleQuestion: React.FC<ConfidenceScaleProps> = ({
  question,
  value,
  onChange,
}) => {
  const min = question.min_rating || 1
  const max = question.max_rating || 5
  const scaleNumbers = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  const descriptions: Record<number, string> = {
    1: "Exploring / Inexperienced with rapid commercial turnarounds",
    2: "Moderate confidence; requires standard buffers and client supervision",
    3: "Competent; consistently hit deadlines with standard tooling",
    4: "Highly confident; seasoned multi-model workflows with fast turnaround",
    5: "Elite production speed; complete end-to-end agency mastery",
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
        <span>Low Confidence ({min})</span>
        <span>High Confidence ({max})</span>
      </div>

      <div className="grid grid-cols-5 gap-3" role="radiogroup" aria-label="Confidence Scale">
        {scaleNumbers.map((num) => {
          const isSelected = value === num
          return (
            <button
              key={num}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(num)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                isSelected
                  ? "border-purple-600 bg-purple-600 text-white shadow-md shadow-purple-600/25 scale-105"
                  : "border-slate-200/90 bg-white hover:border-purple-300 hover:bg-slate-50 text-slate-800"
              }`}
            >
              <span className="text-xl font-extrabold">{num}</span>
            </button>
          )
        })}
      </div>

      {value !== undefined && descriptions[value] && (
        <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3 text-center text-xs font-medium text-purple-900">
          Selected: <span className="font-bold">{value} / {max}</span> — {descriptions[value]}
        </div>
      )}
    </div>
  )
}
