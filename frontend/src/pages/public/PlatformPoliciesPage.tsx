import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Scale, ArrowLeft, ShieldCheck, CheckCircle2, Lock } from "lucide-react"
import { CreatorBridgeLogo } from "@/components/common/CreatorBridgeLogo"
import { policyService } from "@/services/policy.service"
import type { PlatformPolicy, PolicySection } from "@/types"

export const PlatformPoliciesPage: React.FC = () => {
  const [policyDoc, setPolicyDoc] = useState<PlatformPolicy | null>(null)
  const [activeSection, setActiveSection] = useState<string>("trust-score")

  useEffect(() => {
    policyService
      .getCurrentPolicy()
      .then((doc) => {
        if (doc) setPolicyDoc(doc)
      })
      .catch(() => {
        // Fall back gracefully
      })
  }, [])

  const version = policyDoc?.version || "2026.1"
  const status = policyDoc?.status || "ACTIVE"
  const effectiveDate = policyDoc?.effectiveDate || "January 1, 2026"
  const sections: PolicySection[] = policyDoc?.sections || []

  return (
    <div className="min-h-screen bg-[#FFFDFD] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F4E7FF]">
          <CreatorBridgeLogo size="sm" badgeText="Platform Policies" />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B4652] hover:text-[#9A6ADF] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Marketplace</span>
          </Link>
        </div>

        {/* Page Hero */}
        <div className="rounded-3xl border border-[#F4E7FF] bg-white p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
                  CreatorBridge Platform Policies
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                  v{version}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ● Status: {status}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#4B4652] leading-relaxed">
                The authoritative, legally binding governance, operational, and intellectual
                property framework governing all AI artists, creators, commercial brands, and agency
                partners on CreatorBridge.
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[11px] text-[#4B4652]">Effective Date:</span>
              <p className="text-xs font-bold text-[#111111]">{effectiveDate}</p>
            </div>
          </div>
        </div>

        {/* Sections Stream */}
        <div className="space-y-6">
          {sections.map((sec) => (
            <div
              key={sec.id}
              id={sec.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3.5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#9A6ADF]" />
                  {sec.title}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {sec.category}
                </span>
              </div>

              <div className="text-xs font-semibold italic text-[#111111] bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                Summary: {sec.summary}
              </div>

              <p className="text-xs sm:text-sm text-[#4B4652] leading-relaxed whitespace-pre-line">
                {sec.content}
              </p>

              {sec.key_rules && sec.key_rules.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Key Mandatory Stipulations:
                  </p>
                  <ul className="space-y-1.5">
                    {sec.key_rules.map((rule, idx) => (
                      <li key={idx} className="text-xs text-[#4B4652] flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#9A6ADF] flex-shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legal Footer Note */}
        <div className="p-4 rounded-2xl bg-slate-100 text-center text-xs text-slate-500">
          <p>
            Immutable policy reference: cb-platform-policies-{version} • Published & verified by
            CreatorBridge Trust & Safety.
          </p>
        </div>
      </div>
    </div>
  )
}
