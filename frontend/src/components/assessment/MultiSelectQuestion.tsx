import React from "react"
import { CheckSquare, Square, Tag } from "lucide-react"
import type { SurveyQuestion } from "@/types"

interface MultiSelectProps {
  question: SurveyQuestion
  value: string[] | undefined
  onChange: (value: string[]) => void
}

export const MultiSelectQuestion: React.FC<MultiSelectProps> = ({
  question,
  value = [],
  onChange,
}) => {
  const toggleOption = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Select all that apply</span>
        <span className="font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
          {value.length} selected
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label={question.question}>
        {question.options.map((opt) => {
          const isSelected = value.includes(opt.id)
          return (
            <div
              key={opt.id}
              onClick={() => toggleOption(opt.id)}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  toggleOption(opt.id)
                }
              }}
              className={`group flex items-start space-x-3 p-3.5 rounded-2xl border-2 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                isSelected
                  ? "border-purple-600 bg-purple-50/70 shadow-xs text-slate-900"
                  : "border-slate-200/90 bg-white hover:border-purple-300 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isSelected ? (
                  <CheckSquare className="h-4.5 w-4.5 text-purple-600" />
                ) : (
                  <Square className="h-4.5 w-4.5 text-slate-300 group-hover:text-purple-400 transition-colors" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">{opt.label}</span>
                  {opt.tag && (
                    <span className="inline-flex items-center text-[10px] font-medium text-purple-600 bg-purple-100/60 px-1.5 py-0.5 rounded">
                      {opt.tag}
                    </span>
                  )}
                </div>
                {opt.description && (
                  <p className="mt-1 text-xs text-slate-500 leading-snug">{opt.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
