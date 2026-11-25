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
    category: "Identity",
    summary:
      "Two-factor identity verification, portfolio provenance review, and objective criteria for advancing from Level 1 to Verified Pro.",
    content:
      "To safeguard commercial clients, CreatorBridge requires multi-stage identity verification. Level 1 (Registered) creators must verify an authentic email address and provide proof of professional creative accounts. Level 2 (Verified Specialist) requires successful delivery of verified commercial milestones, minimum 90% profile completeness, and clean trust history. Level 3 (Master Studio) requires comprehensive identity document verification, minimum 20 verified commercial deliveries, and sustained 95+ Trust Score. Badges are revoked automatically upon substantiated policy breaches.",
    key_rules: [
      "Tier progression requires verified milestone completions and authentic identity validation.",
      "All claimed social, model registry, and portfolio links are cryptographically or manually audited.",
      "Trust score below 75 automatically freezes verification tier advancement.",
    ],
  },
  {
    id: "portfolio-authenticity",
    title: "4. Portfolio Authenticity, Attribution & Provenance Policy",
    category: "Integrity",
    summary:
      "Strict prohibition of stolen, scraped, or misrepresented artwork; complete disclosure of AI toolchains and generation parameters.",
    content:
      "Creators may only publish assets they personally generated, directed, or edited. Misattributing other creators' generative prompts, outputs, or commercial commissions constitutes severe plagiarism. All portfolio showcase items must declare primary generative foundation models (e.g. Midjourney, Runway, Kling, Flux), commercial licensing tiers, and workflow methodology. CreatorBridge utilizes digital provenance hashing and reverse visual indexing to detect stolen or duplicate media.",
    key_rules: [
      "Only showcase work personally created, prompted, or engineered by the account holder.",
      "Generative models, commercial licenses, and production workflows must be accurately declared.",
      "Plagiarized or deceptive portfolio uploads trigger immediate Severe Demerits (-30 points).",
    ],
  },
  {
    id: "licensing-ip",
    title: "5. Commercial Licensing & Intellectual Property Handover",
    category: "IP Law",
    summary:
      "Clear, enforceable transfer of commercial usage rights, full brand buyout upon milestone release, and creator moral rights protections.",
    content:
      "Upon final release of milestone escrow funds by the brand sponsor, the creator grants an irrevocable, worldwide, exclusive (or declared non-exclusive) commercial license to the commissioning brand, in accordance with the campaign brief. The creator warrants that deliverables do not infringe upon any third-party copyrights, trademarks, or publicity rights. Creators retain moral rights to display watermarked or portfolio-approved snippets for non-commercial promotional purposes, unless covered by a signed Non-Disclosure Agreement (NDA).",
    key_rules: [
      "Escrow fund release executes immediate transfer of agreed commercial rights to the brand.",
      "Creators warrant generative toolchains possess commercial enterprise or pro redistribution rights.",
      "Strict adherence to campaign NDA and brand pre-release secrecy clauses.",
    ],
  },
  {
    id: "fair-engagement",
    title: "6. Fair Engagement & Anti-Circumvention Policy",
    category: "Compliance",
    summary:
      "Protection of platform matchmaking, prohibition of off-platform fee avoidance, and honest bidding conduct.",
    content:
      "Clients and creators introduced through CreatorBridge agree to conduct all associated project contracts, milestone deliverables, and payments through the platform for a minimum period of 12 months following initial introduction. Bypassing escrow to avoid service fees, soliciting off-platform wire transfers, or utilizing alternative communication channels to evade disputes is strictly prohibited and results in permanent ban and liquidated damages.",
    key_rules: [
      "No off-platform fee evasion, side payments, or unapproved payment routing.",
      "12-month platform exclusivity applies to newly introduced brand-creator relationships.",
      "Violations incur permanent account termination and forfeiture of pending balances.",
    ],
  },
  {
    id: "milestone-escrow",
    title: "7. Milestone Escrow & Payment Protection Guarantee",
    category: "Finance",
    summary:
      "100% upfront brand funding in secure escrow, milestone validation releases, and creator compensation safeguards.",
    content:
      "All commercial campaigns and bespoke commissions must be 100% pre-funded into CreatorBridge escrow before creators are authorized to begin deliverable generation. Escrow funds are released incrementally upon brand inspection and approval of scheduled milestone assets. If a brand fails to review a submitted milestone within 7 calendar days without raising a dispute, funds are released automatically to the creator. Platform fees are deducted transparently at payout.",
    key_rules: [
      "Zero un-escrowed work: Brands must fund milestones prior to creative execution.",
      "Brands possess 7 calendar days to approve deliverables or request standard revisions.",
      "Automatic escrow disbursement occurs if review deadline expires without formal revision request.",
    ],
  },
  {
    id: "dispute-resolution",
    title: "8. Dispute Resolution & Impartial Arbitration Policy",
    category: "Arbitration",
    summary:
      "Structured three-stage resolution process: bilateral mediation, evidence inspection, and binding platform arbitration.",
    content:
      "Disputes arising from creative divergence, non-delivery, or objective specification failure follow a structured procedure: Stage 1: 48-hour collaborative mutual resolution. Stage 2: Platform Mediation with formal prompt, revision history, and timestamp inspection. Stage 3: Binding Final Arbitration conducted by neutral CreatorBridge creative adjudicators. Escrow funds remain safely frozen until formal dispute closure.",
    key_rules: [
      "Structured 3-stage dispute protocol ensuring fair evaluation of all parties.",
      "Arbitrators review brief acceptance criteria, revision count, and prompt records.",
      "Arbitration decisions are final and execute appropriate proportional escrow split.",
    ],
  },
  {
    id: "ai-transparency",
    title: "9. AI Model Transparency & Synthetic Media Disclosures",
    category: "AI Ethics",
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-dialog-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#181524] rounded-3xl border border-purple-100 dark:border-[#2D2447] shadow-2xl flex flex-col overflow-hidden transition-colors duration-200">
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-purple-100/80 dark:border-[#2D2447] bg-gradient-to-r from-purple-50/70 via-white to-purple-50/40 dark:from-[#231C35] dark:via-[#181524] dark:to-[#231C35] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-600/10 dark:bg-[#9A6ADF]/20 border border-purple-200 dark:border-[#3E325D] flex items-center justify-center text-[#9A6ADF] dark:text-[#B78AF7]">
              <Scale className="h-5 w-5 text-[#9A6ADF] dark:text-[#B78AF7]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="policy-dialog-title"
                  className="text-base sm:text-lg font-bold text-[#111111] dark:text-[#F5F3F8]"
                >
                  CreatorBridge Platform Policies
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-[#231C35] text-purple-700 dark:text-[#B78AF7] border border-purple-200 dark:border-[#3E325D]">
                  Version {version}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                  ● Status: {status}
                </span>
              </div>
              <p className="text-xs text-[#4B4652] dark:text-[#C7C3D4] mt-0.5">
                Effective {effectiveDate} • Legally Binding Governance & Commercial Terms
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-200 dark:border-[#3E325D] text-slate-400 dark:text-[#C7C3D4] hover:text-slate-700 dark:hover:text-[#F5F3F8] hover:bg-slate-100 dark:hover:bg-[#231C35] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close policies modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-100 dark:border-[#2D2447] bg-slate-50/60 dark:bg-[#0F0D15]/60 overflow-x-auto flex items-center gap-1.5 scrollbar-thin flex-shrink-0">
          {sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => scrollToSection(sec.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeSectionId === sec.id
                  ? "bg-[#9A6ADF] text-white shadow-xs"
                  : "bg-white dark:bg-[#181524] border border-slate-200/80 dark:border-[#2D2447] text-slate-600 dark:text-[#C7C3D4] hover:bg-purple-50 dark:hover:bg-[#231C35] hover:text-purple-700 dark:hover:text-[#B78AF7]"
              }`}
            >
              {sec.title.split(". ")[1] || sec.title}
            </button>
          ))}
        </div>

        {/* Scrollable Policy Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[#4B4652] dark:text-[#C7C3D4] leading-relaxed dark:bg-[#0F0D15]/40">
          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-[#231C35]/60 border border-purple-200/80 dark:border-[#3E325D] text-xs text-purple-900 dark:text-[#C7C3D4] flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-[#B78AF7] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#111111] dark:text-[#F5F3F8]">Authoritative Governance Notice</p>
              <p className="mt-0.5 text-purple-800 dark:text-[#C7C3D4] leading-normal">
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
              className="p-5 rounded-2xl border border-slate-200/80 dark:border-[#2D2447] bg-white dark:bg-[#181524] hover:border-purple-200 dark:hover:border-[#3E325D] transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#111111] dark:text-[#F5F3F8] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#9A6ADF] dark:bg-[#B78AF7]" />
                  {sec.title}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-[#231C35] text-slate-600 dark:text-[#C7C3D4]">
                  {sec.category}
                </span>
              </div>

              <p className="text-xs text-[#111111] dark:text-[#F5F3F8] font-semibold italic bg-slate-50 dark:bg-[#231C35]/50 p-2.5 rounded-xl border border-slate-100 dark:border-[#2D2447]">
                Summary: {sec.summary}
              </p>

              <p className="text-xs text-[#4B4652] dark:text-[#C7C3D4] leading-relaxed whitespace-pre-line">
                {sec.content}
              </p>

              {sec.key_rules && sec.key_rules.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-[#2D2447]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-[#F5F3F8] mb-1.5">
                    Mandatory Operational Rules:
                  </p>
                  <ul className="space-y-1">
                    {sec.key_rules.map((rule, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-600 dark:text-[#C7C3D4] flex items-start gap-2"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 dark:text-[#B78AF7] flex-shrink-0 mt-0.5" />
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
        <div className="px-6 py-4 border-t border-slate-100 dark:border-[#2D2447] bg-slate-50 dark:bg-[#181524] flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#A9A3B8]">
            <Lock className="h-3.5 w-3.5 text-purple-600 dark:text-[#B78AF7]" />
            <span>Immutable audit reference: cb-platform-policies-{version}</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-[#3E325D] text-slate-700 dark:text-[#C7C3D4] hover:bg-slate-100 dark:hover:bg-[#231C35] transition-colors cursor-pointer"
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
