import React from "react"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  FileVideo,
  Layers,
  Maximize2,
  Clock,
  HardDrive,
  FileCheck2,
  RefreshCw,
  X,
} from "lucide-react"
import { DeliveryCheckReport, DeliveryCheckRuleItem } from "../../types/deliveryCheck"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"

interface DeliveryCheckReportModalProps {
  isOpen: boolean
  onClose: () => void
  report: DeliveryCheckReport | null
  submissionTitle?: string
  versionNumber?: number
  onRetryUpload?: () => void
  onRetry?: () => void
  isBrandView?: boolean
}

const RULE_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  file_integrity: FileCheck2,
  format: FileVideo,
  aspect_ratio: Maximize2,
  resolution: Layers,
  duration: Clock,
  required_deliverables: FileCheck2,
  file_size: HardDrive,
}

export const DeliveryCheckReportModal: React.FC<DeliveryCheckReportModalProps> = ({
  isOpen,
  onClose,
  report,
  submissionTitle,
  versionNumber,
  onRetryUpload,
  onRetry,
  isBrandView = false,
}) => {
  if (!isOpen || !report) return null

  const isPassed = report.overall_status === "PASSED"
  const isFailed = report.overall_status === "FAILED"

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface,#FFFFFF)] rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-[var(--color-border,#EADCDF)] text-[var(--color-text,#1D0B10)] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Automated Delivery Check Report
              </h3>
              {versionNumber && (
                <Badge variant="outline" className="text-xs font-semibold">
                  v{versionNumber}
                </Badge>
              )}
            </div>
            {submissionTitle && (
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
                Asset: {submissionTitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Banner */}
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            isPassed
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
              : isFailed
              ? "bg-rose-50/80 border-rose-200 text-rose-950"
              : "bg-amber-50/80 border-amber-200 text-amber-950"
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {isPassed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : isFailed ? (
              <XCircle className="w-5 h-5 text-rose-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold">
              {isPassed
                ? "Delivery Check: Passed"
                : isFailed
                ? "Delivery Check: Correction Required"
                : "Delivery Check: Unable to Verify Completely"}
            </h4>
            <p className="text-xs leading-relaxed opacity-90">
              {isPassed
                ? "All applicable technical requirements from the campaign brief have been verified. The deliverable is approved for brand review."
                : isFailed
                ? isBrandView
                  ? "This deliverable does not satisfy mandatory brief specifications and cannot be reviewed until corrected by the creator."
                  : "One or more technical specifications do not meet the brief requirements. Please review the failed checks below, correct your render, and upload a revision."
                : "The media file could not be completely inspected. Please ensure the file is non-empty and uncorrupted."}
            </p>
          </div>
        </div>

        {/* Counter Summary Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Passed: {report.passed_count}</span>
          </span>
          {report.failed_count > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Failed: {report.failed_count}</span>
            </span>
          )}
          {report.not_specified_count > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
              Not Specified in Brief: {report.not_specified_count}
            </span>
          )}
          {report.unable_to_verify_count > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-medium">
              Unverifiable: {report.unable_to_verify_count}
            </span>
          )}
        </div>

        {/* Actionable Suggested Fixes Box */}
        {report.suggested_fixes && report.suggested_fixes.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-amber-900 space-y-2">
            <h5 className="text-xs font-bold flex items-center gap-1.5 text-amber-950">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Required Actionable Fixes</span>
            </h5>
            <ul className="text-xs space-y-1 list-disc pl-4 text-amber-900">
              {report.suggested_fixes.map((fix, idx) => (
                <li key={idx} className="leading-relaxed">
                  {fix}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Requirement Rules List */}
        <div className="space-y-2.5">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Verification Breakdown Against Campaign Brief
          </h5>
          <div className="space-y-2">
            {report.checks.map((rule: DeliveryCheckRuleItem) => {
              const IconComp = RULE_ICON_MAP[rule.rule_name] || FileCheck2
              const rulePassed = rule.status === "PASSED"
              const ruleFailed = rule.status === "FAILED"
              const ruleNotSpec = rule.status === "NOT_SPECIFIED"

              return (
                <div
                  key={rule.rule_name}
                  className={`p-3 rounded-2xl border transition-all text-xs space-y-2 ${
                    rulePassed
                      ? "bg-slate-50/60 border-slate-200"
                      : ruleFailed
                      ? "bg-rose-50/40 border-rose-200"
                      : "bg-slate-50/30 border-slate-200/80 opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg ${
                          rulePassed
                            ? "bg-emerald-100 text-emerald-700"
                            : ruleFailed
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900">{rule.label}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rulePassed
                          ? "bg-emerald-100 text-emerald-800"
                          : ruleFailed
                          ? "bg-rose-100 text-rose-800"
                          : ruleNotSpec
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {rule.status === "PASSED"
                        ? "PASSED"
                        : rule.status === "FAILED"
                        ? "FAILED"
                        : rule.status === "NOT_SPECIFIED"
                        ? "NOT SPECIFIED"
                        : "UNVERIFIABLE"}
                    </span>
                  </div>

                  {/* Required vs Detected Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-white/80 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">
                        Campaign Requirement:
                      </span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {rule.required_value || "None specified"}
                      </span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">
                        Detected in Asset:
                      </span>
                      <span
                        className={`font-semibold truncate block ${
                          ruleFailed ? "text-rose-700" : "text-slate-800"
                        }`}
                      >
                        {rule.detected_value || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Failure reason and fix */}
                  {ruleFailed && rule.failure_reason && (
                    <div className="p-2 rounded-xl bg-rose-100/60 border border-rose-200 text-[11px] text-rose-900 space-y-1">
                      <p className="font-semibold">{rule.failure_reason}</p>
                      {rule.actionable_correction && (
                        <p className="text-slate-700 font-medium">
                          <span className="font-bold text-rose-800">Suggested Fix: </span>
                          {rule.actionable_correction}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            Validated at {new Date(report.checked_at).toLocaleTimeString()}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
            {isFailed && !isBrandView && onRetryUpload && (
              <Button
                size="sm"
                onClick={onRetryUpload || onRetry}
                className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload Corrected Version</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
