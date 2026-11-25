import React, { useEffect, useState } from "react"
import { ArrowUp, ArrowDown, GripVertical } from "lucide-react"
import type { SurveyQuestion } from "@/types"

interface WorkflowOrderingProps {
  question: SurveyQuestion
  value: string[] | undefined
  onChange: (value: string[]) => void
}

export const WorkflowOrderingQuestion: React.FC<WorkflowOrderingProps> = ({
  question,
  value,
  onChange,
}) => {
  // Initialize with initial order or existing value
  const [orderedIds, setOrderedIds] = useState<string[]>(() => {
    if (value && value.length === question.options.length) {
      return value
    }
    return question.options.map((o) => o.id)
  })

  useEffect(() => {
    if (!value || value.length === 0) {
      onChange(orderedIds)
    }
  }, [])

  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= orderedIds.length) return

    const newOrder = [...orderedIds]
    const temp = newOrder[index]
    newOrder[index] = newOrder[targetIndex]
    newOrder[targetIndex] = temp

    setOrderedIds(newOrder)
    onChange(newOrder)
  }

  // Map option lookup
  const optionsMap = new Map(question.options.map((o) => [o.id, o]))

  return (
    <div className="w-full space-y-3">
      <div className="text-xs text-slate-500 mb-1">
        Use arrows to arrange steps in standard production sequence (1 = First Step):
      </div>

      <div className="space-y-2.5">
        {orderedIds.map((id, index) => {
          const opt = optionsMap.get(id)
          if (!opt) return null

          return (
            <div
              key={id}
              className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-slate-200/90 bg-white hover:border-purple-300 transition-all shadow-xs"
            >
              <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-100 font-bold text-xs text-purple-700 flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-slate-800 leading-snug">
                  {opt.label}
                </span>
              </div>

              <div className="flex items-center space-x-1 flex-shrink-0 ml-3">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveItem(index, "up")}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-purple-50 hover:text-purple-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
                  aria-label="Move step up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={index === orderedIds.length - 1}
                  onClick={() => moveItem(index, "down")}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-purple-50 hover:text-purple-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
                  aria-label="Move step down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
