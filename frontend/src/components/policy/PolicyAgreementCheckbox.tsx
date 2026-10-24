import React from "react"
import { ShieldAlert } from "lucide-react"

interface PolicyAgreementCheckboxProps {
  id?: string
  checked: boolean
  onChange: (checked: boolean) => void
  onOpenPolicies: () => void
  hasError?: boolean
  errorMessage?: string | null
  policyVersion?: string
}

export const PolicyAgreementCheckbox: React.FC<PolicyAgreementCheckboxProps> = ({
  id = "cb-policy-agreement",
  checked,
  onChange,
  onOpenPolicies,
  hasError = false,
  errorMessage,
  policyVersion = "2026.1",
}) => {
  return (
    <div className="space-y-1.5 pt-2">
      <div
        className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
          hasError && !checked
            ? "border-rose-300 bg-rose-50/60 ring-1 ring-rose-200"
            : checked
            ? "border-purple-300 bg-purple-50/40"
            : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
        }`}
      >
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-checked={checked}
          aria-required="true"
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#9A6ADF] focus:ring-[#9A6ADF] focus:ring-offset-0 cursor-pointer accent-[#9A6ADF] flex-shrink-0"
        />

        <label
          htmlFor={id}
          className="text-xs leading-relaxed text-[#4B4652] select-none cursor-pointer"
        >
          <span>I have read and agree to the </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onOpenPolicies()
            }}
            className="font-bold text-[#9A6ADF] hover:text-[#8552D4] underline decoration-1 underline-offset-2 hover:decoration-2 transition-colors cursor-pointer inline-block"
            aria-label="Read complete CreatorBridge Platform Policies in modal"
          >
            CreatorBridge Platform Policies
          </button>
          <span>
            , including the Trust Score, Code of Conduct, Creator Verification,
            Portfolio Authenticity, Licensing, Engagement, Payment, Dispute
            Resolution, AI Transparency, and Data Privacy policies.
          </span>
          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700">
            v{policyVersion}
          </span>
        </label>
      </div>

      {hasError && !checked && (
        <div className="flex items-center gap-1.5 px-2 text-[11px] font-medium text-rose-600">
          <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            {errorMessage ||
              "You must agree to the CreatorBridge Platform Policies to continue."}
          </span>
        </div>
      )}
    </div>
  )
}
