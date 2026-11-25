import React, { useState } from "react"
import { Scale, ShieldCheck, CheckCircle2 } from "lucide-react"
import { PolicyAgreementCheckbox } from "@/components/policy/PolicyAgreementCheckbox"
import { PlatformPoliciesModal } from "@/components/policy/PlatformPoliciesModal"
import { policyService } from "@/services/policy.service"
import type { User } from "@/types"

interface PolicyRenewalGateProps {
  user: User
  onAccepted: () => void
}

export const PolicyRenewalGate: React.FC<PolicyRenewalGateProps> = ({
  user,
  onAccepted,
}) => {
  const [checked, setChecked] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAccept = async () => {
    if (!checked) {
      setError("You must check the agreement box to accept the platform policies.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await policyService.acceptPolicy("2026.1")
      // Update local storage user profile
      const stored = localStorage.getItem("creatorbridge_user")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          parsed.policyAccepted = true
          parsed.acceptedPolicyVersion = "2026.1"
          localStorage.setItem("creatorbridge_user", JSON.stringify(parsed))
        } catch {
          // ignore parse errors
        }
      }
      onAccepted()
    } catch (err: any) {
      setError(err?.message || "Failed to record policy acceptance. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-[#181524] rounded-3xl border border-purple-200 dark:border-[#2D2447] shadow-2xl p-6 sm:p-8 space-y-6 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-purple-100 dark:bg-[#9A6ADF]/20 border border-purple-200 dark:border-[#3E325D] flex items-center justify-center text-[#9A6ADF] dark:text-[#B78AF7]">
            <Scale className="h-6 w-6 text-[#9A6ADF] dark:text-[#B78AF7]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#111111] dark:text-[#F5F3F8]">
                Platform Policy Update Required
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-[#231C35] text-purple-700 dark:text-[#B78AF7] border border-purple-200 dark:border-[#3E325D]">
                v2026.1
              </span>
            </div>
            <p className="text-xs text-[#4B4652] dark:text-[#C7C3D4]">
              Legally binding compliance update for all marketplace participants
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#4B4652] dark:text-[#C7C3D4] leading-relaxed">
          Hello <strong>{user.fullName || user.email}</strong>, CreatorBridge has updated its
          Platform Policies (v2026.1). To continue using your dashboard, project workspaces, and
          creator tools, you must read and accept the updated governance framework.
        </p>

        <PolicyAgreementCheckbox
          id="renewal-policy-agreement"
          checked={checked}
          onChange={(c) => {
            setChecked(c)
            if (c) setError(null)
          }}
          onOpenPolicies={() => setShowModal(true)}
          hasError={Boolean(error)}
          errorMessage={error}
          policyVersion="2026.1"
        />

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={!checked || isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-[#9A6ADF] hover:bg-[#8552D4] text-white font-bold text-xs shadow-md shadow-[#9A6ADF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Recording Acceptance...</span>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Accept & Continue to Dashboard</span>
              </>
            )}
          </button>
        </div>
      </div>

      <PlatformPoliciesModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAcceptAndClose={() => {
          setChecked(true)
          setShowModal(false)
        }}
      />
    </div>
  )
}
