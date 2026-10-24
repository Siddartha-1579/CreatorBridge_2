import React, { useState, useEffect } from "react"
import {
  X,
  ShieldCheck,
  FileText,
  Scale,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  HandCoins,
  Award,
  Users,
} from "lucide-react"
import { policyService } from "@/services/policy.service"
import type { PlatformPolicy, PolicySection } from "@/types"

interface PlatformPoliciesModalProps {
  isOpen: boolean
  onClose: () => void
  onAcceptAndClose?: () => void
  isAlreadyAccepted?: boolean
}

// Fallback static sections in case network request fails
const FALLBACK_SECTIONS: PolicySection[] = [
  {
    id: "trust-score",
    title: "1. Trust Score & Demerit Reliability System Policy",
    category: "Governance",
    summary:
      "Mathematical, objective reliability scoring based on verified operational conduct, with strict demerit schedules and zero pay-to-win influence.",
    content:
      "CreatorBridge enforces a standardized, tamper-evident Trust Score (0–100) for all registered creators and brands. Trust Scores begin at 100 points and decay exclusively based on confirmed operational incidents: Minor Demerits (-5 points; e.g. missed check-ins), Moderate Demerits (-15 points; e.g. unexcused deadline delays exceeding 72 hours), Severe Demerits (-30 points; e.g. delivering non-compliant or plagiarized assets), and Critical Demerits (-50 points; e.g. fraudulent transactions or severe code of conduct breaches). Active demerits recover on a strict 90-day rolling timeline. In accordance with platform integrity rules, achievement points, priority boosts, and commercial transaction volumes can NEVER alter, offset, or clear demerits or manipulate Trust Scores.",
    key_rules: [
      "Trust scores start at 100 and decrease strictly through verified demerit incidents.",
      "Penalty deductions: Minor (-5), Moderate (-15), Severe (-30), Critical (-50).",
      "Demerits undergo automatic rolling decay after 90 days of compliant operations.",
      "Achievement points, boost spending, and subscriptions can never alter platform Trust Scores.",
    ],
  },
  {
    id: "code-of-conduct",
    title: "2. Platform Code of Conduct & Professional Ethics",
    category: "Ethics",
    summary:
      "Mandatory standards of professional communication, mutual respect, anti-harassment, and zero-tolerance extortion policies.",
    content:
      "All participants on CreatorBridge—including prompt engineers, video editors, creative directors, brand executives, and agencies—must conduct themselves with highest integrity and professional courtesy. CreatorBridge maintains zero tolerance for harassment, discrimination, hate speech, intimidation, extortion, or fraudulent misrepresentation. Communication must remain professional, respectful, and on-platform during active escrow milestones. Attempts to extort reviews, coerce deliverable scope beyond contractual agreements, or retaliate against good-faith feedback will result in immediate account suspension and forfeiture of escrow funds.",
    key_rules: [
      "Zero tolerance for harassment, hate speech, intimidation, or discriminatory conduct.",
      "All campaign and project communications must occur transparently through platform channels.",
      "Coercion or extortion regarding reviews, escrow release, or out-of-scope work is strictly prohibited.",
      "Violations result in immediate demerits, account suspension, or permanent termination.",
    ],
  },
  {
    id: "creator-verification",
    title: "3. Creator Verification & Tier Advancement Standards",
    category: "Verification",
    summary:
      "Criteria for authentic identity verification, generative skill assessment, and multi-tier creator level progression.",
    content:
      "Creators may advance through structured marketplace tiers (AI Explorer, AI Practitioner, AI Specialist, AI Master) based on verified completions, proven technical capabilities, and workflow evaluations. Verification requires identity confirmation, authentic portfolio validation, and successful completion of technical workflow assessments. Verification badges certify demonstrated toolchain mastery (e.g. Midjourney, Runway, ComfyUI) and maintain platform commercial standards.",
    key_rules: [
      "Verification requires verified identity and authenticated generative workflow demonstrations.",
      "Creator levels advance through completed milestones, peer review, and rubric assessments.",
      "Badges are revoked if submitted deliverables fail authenticity audits.",
    ],
  },
  {
    id: "portfolio-authenticity",
    title: "4. Portfolio Authenticity & Generative Provenance Policy",
    category: "Authenticity",
    summary:
      "Strict prohibition of portfolio theft, asset misrepresentation, and mandatory disclosure of generative models and toolchains.",
    content:
      "Creators must only publish portfolio items, showreels, and project deliverables that represent their own direct creative direction, prompt engineering, and generative workflow orchestration. Misrepresenting stock assets, third-party artwork, or other creators' generative outputs as one's own is considered a Critical Demerit (-50 points) and cause for immediate permanent ban. Creators must accurately declare the generative tools (e.g. Runway Gen-3, Midjourney v6, Stable Diffusion, Kling AI, Luma Dream Machine) and workflow stages utilized in every uploaded portfolio item.",
    key_rules: [
      "Only genuine works engineered or directed by the creator may be uploaded to portfolios.",
      "Claiming another artist's or studio's media is considered intellectual fraud.",
      "Workflow tools, prompts, and generative models must be accurately logged and disclosed.",
    ],
  },
  {
    id: "licensing",
    title: "5. Commercial Licensing & Intellectual Property Assignment",
    category: "Legal",
    summary:
      "Clear transfer of commercial rights upon milestone escrow release, creator moral rights, and brand ownership of bespoke deliverables.",
    content:
      "Upon full release of milestone funds from escrow, the creator grants the brand client an exclusive, worldwide, perpetual, royalty-free commercial license (or full intellectual property assignment as stipulated in the campaign brief) for all final accepted deliverables. The creator retains moral rights and the non-exclusive right to showcase accepted media in personal portfolios and showreels, unless a formal Non-Disclosure Agreement (NDA) is executed prior to engagement. Pre-existing model weights, custom LoRAs, and proprietary workflow scripts remain the intellectual property of their respective originators.",
    key_rules: [
      "Commercial rights transfer to brand client upon full milestone payment release.",
      "Creators retain moral rights and personal portfolio showcase rights unless under NDA.",
      "Proprietary workflow scripts, custom model nodes, and LoRAs remain creator IP unless explicitly bought out.",
    ],
  },
  {
    id: "engagement",
    title: "6. Client Engagement & Project Workspaces Policy",
    category: "Operations",
    summary:
      "Contractual milestones, structured review windows, deadline adherence, and operational obligations.",
    content:
      "All project workspace collaborations are governed by agreed briefs, milestone schedules, and deliverable specifications. Both parties must adhere to the platform review window: Brands have seven (7) business days from submission to approve deliverables or request revisions based on the established creative brief. Creators must acknowledge client revision requests within forty-eight (48) hours. Revision requests must align with the original brief scope; out-of-scope requests require an amended milestone and supplemental budget agreement.",
    key_rules: [
      "Engagements operate under formal project milestones and due dates.",
      "Brands have 7 business days to inspect deliverables or provide constructive revision feedback.",
      "Revisions must remain within original brief parameters.",
      "Unexcused failure to respond within 48 hours constitutes an operational delay.",
    ],
  },
  {
    id: "payment",
    title: "7. Milestone Payments & Escrow Architecture",
    category: "Finance",
    summary:
      "Mandatory on-platform escrow funding, secure release mechanisms, and strict prohibition of off-platform transactions.",
    content:
      "To ensure payment security and mutual accountability, all commercial engagements must be funded into CreatorBridge escrow prior to project work initiation. Funds are held securely and released to the creator upon formal client approval of milestone deliverables or binding arbitration resolution. Conducting, soliciting, or attempting to divert payments off-platform constitutes fee evasion and results in immediate permanent termination of all involved accounts, forfeiture of platform protections, and reporting to relevant legal authorities.",
    key_rules: [
      "All project milestones must be fully funded into escrow before work begins.",
      "Escrow funds release automatically upon brand approval or binding dispute resolution.",
      "Off-platform payments or solicitation are strictly prohibited and result in permanent ban.",
      "Chargebacks without prior platform dispute mediation violate platform terms.",
    ],
  },
  {
    id: "dispute-resolution",
    title: "8. Structured Dispute Resolution & Binding Mediation Policy",
    category: "Dispute Resolution",
    summary:
      "Three-tiered progressive dispute process: Direct Dialogue, Platform Mediation, and Evidence-Based Binding Arbitration.",
    content:
      "Disputes arising from deliverable quality, brief non-compliance, or timeline defaults follow a mandatory three-tier resolution hierarchy: Tier 1 (Direct Dialogue): 48-hour formal negotiation between brand and creator within the Project Workspace; Tier 2 (Platform Mediation): A CreatorBridge resolution specialist facilitates structured compromise within five (5) business days; Tier 3 (Binding Arbitration): CreatorBridge Trust & Safety conducts an evidence-based audit of workspace communications, submitted files, and brief compliance rubrics, issuing a final, binding determination regarding escrow fund apportionment. Determinations are final.",
    key_rules: [
      "Tier 1: Mandatory 48-hour direct discussion period.",
      "Tier 2: CreatorBridge specialist mediation (5 business days).",
      "Tier 3: Final binding arbitration based on workspace audit records and deliverable evidence.",
      "Escrow funds are disbursed in strict accordance with the arbitration determination.",
    ],
  },
  {
    id: "ai-transparency",
    title: "9. AI Model Transparency & Commercial Declaration Policy",
    category: "AI Standards",
    summary:
      "Mandatory disclosure of generative models, synthetic media declaration, and compliance with FTC synthetic advertising guidelines.",
    content:
      "In compliance with commercial advertising standards and FTC synthetic disclosure guidelines, creators must accurately declare synthetic media assets. Deliverables created for commercial brand distribution must include metadata specifying AI generation toolchains. Creators must ensure they hold appropriate commercial licensing for any third-party foundation models, generative platforms, or plugins used in production. Deliberate misrepresentation of synthetic assets as traditional live-action or physical photography without disclosure violates CreatorBridge standards.",
    key_rules: [
      "All generative AI tools and workflows must be accurately declared in project metadata.",
      "Commercial brand assets must comply with synthetic media and FTC advertising disclosure rules.",
      "Creators must possess commercial tier licenses for all employed AI generators.",
    ],
  },
  {
    id: "data-privacy",
    title: "10. Data Privacy, Asset Confidentiality & Security Policy",
    category: "Privacy",
    summary:
      "GDPR/CCPA compliance, strict protection of proprietary brand assets and creative prompts, and zero unauthorized data harvesting.",
    content:
      "CreatorBridge adheres to stringent global data protection laws (GDPR, CCPA, SOC2 principles). Brand pre-release assets, confidential product briefings, and proprietary creative prompts shared within private project workspaces are strictly confidential. Neither CreatorBridge nor registered creators may utilize client confidential materials for public distribution, foundation model training, or third-party scraping without explicit written authorization. User account data, audit records, and transaction logs are encrypted in transit and at rest.",
    key_rules: [
      "Full compliance with GDPR, CCPA, and commercial confidentiality standards.",
      "Client proprietary assets and unreleased campaign briefs are strictly confidential.",
      "No unauthorized scraping, public exposure, or foundation model training on client assets.",
      "All platform communications and policy audit trails are securely encrypted.",
    ],
  },
]

export const PlatformPoliciesModal: React.FC<PlatformPoliciesModalProps> = ({
  isOpen,
  onClose,
  onAcceptAndClose,
  isAlreadyAccepted = false,
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>("trust-score")
  const [policyDoc, setPolicyDoc] = useState<PlatformPolicy | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    if (isOpen && !policyDoc) {
      setIsLoading(true)
      policyService
        .getCurrentPolicy()
        .then((doc) => {
          if (doc && doc.sections && doc.sections.length > 0) {
            setPolicyDoc(doc)
          }
        })
        .catch(() => {
          // Fall back gracefully to bundled static policy documentation
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isOpen, policyDoc])

  if (!isOpen) return null

  const sections = policyDoc?.sections || FALLBACK_SECTIONS
  const version = policyDoc?.version || "2026.1"
  const status = policyDoc?.status || "ACTIVE"
  const effectiveDate = policyDoc?.effectiveDate || "January 1, 2026"

  const scrollToSection = (id: string) => {
    setActiveSectionId(id)
    const el = document.getElementById(`policy-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-dialog-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl border border-purple-100 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-purple-100/80 bg-gradient-to-r from-purple-50/70 via-white to-purple-50/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-600/10 border border-purple-200 flex items-center justify-center text-[#9A6ADF]">
              <Scale className="h-5 w-5 text-[#9A6ADF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="policy-dialog-title"
                  className="text-base sm:text-lg font-bold text-[#111111]"
                >
                  CreatorBridge Platform Policies
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 border border-purple-200">
                  Version {version}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ● Status: {status}
                </span>
              </div>
              <p className="text-xs text-[#4B4652] mt-0.5">
                Effective {effectiveDate} • Legally Binding Governance & Commercial Terms
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close policies modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50/60 overflow-x-auto flex items-center gap-1.5 scrollbar-thin flex-shrink-0">
          {sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => scrollToSection(sec.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeSectionId === sec.id
                  ? "bg-[#9A6ADF] text-white shadow-xs"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:bg-purple-50 hover:text-purple-700"
              }`}
            >
              {sec.title.split(". ")[1] || sec.title}
            </button>
          ))}
        </div>

        {/* Scrollable Policy Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[#4B4652] leading-relaxed">
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 text-xs text-purple-900 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Authoritative Governance Notice</p>
              <p className="mt-0.5 text-purple-800 leading-normal">
                These terms govern all transactions, communications, verification tiers, portfolio
                showcases, and dispute arbitrations across CreatorBridge. By checking the policy
                agreement box, you confirm your acceptance of all 10 platform policies detailed below.
              </p>
            </div>
          </div>

          {sections.map((sec) => (
            <section
              key={sec.id}
              id={`policy-${sec.id}`}
              className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-purple-200 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#9A6ADF]" />
                  {sec.title}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {sec.category}
                </span>
              </div>

              <p className="text-xs text-[#111111] font-semibold italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                Summary: {sec.summary}
              </p>

              <p className="text-xs text-[#4B4652] leading-relaxed whitespace-pre-line">
                {sec.content}
              </p>

              {sec.key_rules && sec.key_rules.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Mandatory Operational Rules:
                  </p>
                  <ul className="space-y-1">
                    {sec.key_rules.map((rule, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-600 flex items-start gap-2"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5 text-purple-600" />
            <span>Immutable audit reference: cb-platform-policies-{version}</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close & Return to Registration
            </button>

            {onAcceptAndClose && !isAlreadyAccepted && (
              <button
                type="button"
                onClick={onAcceptAndClose}
                className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-xl bg-[#9A6ADF] hover:bg-[#8552D4] text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Agree & Accept Policies</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
