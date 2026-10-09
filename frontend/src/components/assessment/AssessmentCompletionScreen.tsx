import React from "react"
import { useNavigate } from "react-router-dom"
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Target,
  Zap,
  Info,
  Layers,
  Wand2,
} from "lucide-react"
import type { AssessmentResult } from "@/types"

interface CompletionScreenProps {
  result: AssessmentResult
}

export const AssessmentCompletionScreen: React.FC<CompletionScreenProps> = ({ result }) => {
  const navigate = useNavigate()

  const dimensions = [
    { label: "Technical Mastery", value: result.technical_score, color: "bg-indigo-600" },
    { label: "Creative Vision", value: result.creative_score, color: "bg-purple-600" },
    { label: "Production Workflow", value: result.workflow_score, color: "bg-fuchsia-600" },
    { label: "Problem Solving", value: result.problem_solving_score, color: "bg-violet-600" },
    { label: "Commercial Readiness", value: result.commercial_readiness_score, color: "bg-emerald-600" },
  ]

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 sm:px-6 animate-in fade-in duration-300">
      {/* Top Banner / Celebration */}
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-400 text-white shadow-xl shadow-purple-600/25 mb-4">
          <Trophy className="h-8 w-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Assessment Complete!
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          Your creative capability has been calibrated across 5 core dimensions based on evidence from your responses.
        </p>

        {/* Explicit No Fake Verification Pill */}
        <div className="mt-4 inline-flex items-center space-x-2 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1 text-xs font-semibold text-purple-700">
          <Info className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
          <span>Assessment Completed • Formal Brand Verification is a separate tier milestone</span>
        </div>
      </div>

      {/* Creator Level Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-purple-200/90 bg-gradient-to-b from-white via-purple-50/20 to-white p-6 sm:p-8 shadow-xl shadow-purple-500/5 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-purple-100">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">
              <Zap className="h-4 w-4" />
              <span>Assigned Creator Tier</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {result.level_name}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Evidence-based ranking calibrated to commercial brief complexity.
            </p>
          </div>

          <div className="text-left sm:text-right bg-purple-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl w-full sm:w-auto">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overall Score</span>
            <div className="text-3xl sm:text-4xl font-black text-purple-600 tracking-tight">
              {Math.round(result.overall_score)}
              <span className="text-base font-semibold text-slate-400">/100</span>
            </div>
          </div>
        </div>

        {/* 5-Dimension Visual Breakdown */}
        <div className="pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Capability Dimension Breakdown
          </h3>
          <div className="space-y-3.5">
            {dimensions.map((dim) => (
              <div key={dim.label} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">{dim.label}</span>
                  <span className="text-slate-900 font-bold">{Math.round(dim.value)}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${dim.color} transition-all duration-700`}
                    style={{ width: `${dim.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths & Growth Areas Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Top Strengths */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-purple-600 mb-3">
            <TrendingUp className="h-4 w-4" />
            <span>Identified Key Strengths</span>
          </div>
          <ul className="space-y-2">
            {result.strengths.map((str, i) => (
              <li key={i} className="flex items-start space-x-2 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Growth Paths */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            <Target className="h-4 w-4 text-purple-600" />
            <span>Recommended Growth Paths</span>
          </div>
          <ul className="space-y-2">
            {result.growth_areas.map((area, i) => (
              <li key={i} className="flex items-start space-x-2 text-xs text-slate-700 font-medium">
                <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={() => navigate("/creator/dashboard")}
          className="w-full sm:w-auto flex-1 py-4 px-6 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-md shadow-purple-600/20 transition-all flex items-center justify-center space-x-2"
        >
          <span>Enter Creator Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          onClick={() => navigate("/creator/projects")}
          className="w-full sm:w-auto py-4 px-6 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all text-center"
        >
          Explore Open Briefs
        </button>
      </div>
    </div>
  )
}
