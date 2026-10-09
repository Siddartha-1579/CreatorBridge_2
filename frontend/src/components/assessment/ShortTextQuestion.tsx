import React from "react"
import type { SurveyQuestion } from "@/types"

interface ShortTextProps {
  question: SurveyQuestion
  value: string | undefined
  onChange: (value: string) => void
}

export const ShortTextQuestion: React.FC<ShortTextProps> = ({
  question,
  value = "",
  onChange,
}) => {
  return (
    <div className="w-full space-y-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder || "Enter your response..."}
        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-xs"
        autoFocus
      />
      <p className="text-[11px] text-slate-400">
        This identity will be registered with your creator capabilities profile.
      </p>
    </div>
  )
}
