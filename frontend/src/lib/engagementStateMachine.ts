/**
 * Engagement lifecycle state machine helpers, transition guards, and presentation utilities.
 */

import type { EngagementStatus, ProductionProgressStatus } from "@/types"

export const ENGAGEMENT_STATUS_META: Record<
  EngagementStatus,
  {
    label: string
    color: string
    bg: string
    border: string
    description: string
  }
> = {
  SHORTLISTED: {
    label: "Shortlisted",
    color: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-200 dark:border-purple-800",
    description: "Creator has been shortlisted for this campaign brief.",
  },
  INVITED: {
    label: "Invitation Sent",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    description: "Formal engagement invitation dispatched with proposed scope terms.",
  },
  ACCEPTED: {
    label: "Invitation Accepted",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    description: "Creator accepted invitation; ready for mutual scope terms confirmation.",
  },
  DECLINED: {
    label: "Declined",
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
    description: "Creator declined the proposed engagement terms.",
  },
  AWAITING_CONFIRMATION: {
    label: "Awaiting Confirmation",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    description: "Scope terms updated; awaiting final brand/creator confirmation.",
  },
  CONFIRMED: {
    label: "Scope Confirmed",
    color: "text-teal-700 dark:text-teal-300",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    border: "border-teal-200 dark:border-teal-800",
    description: "Scope and commercial terms confirmed. Production ready to start.",
  },
  IN_PRODUCTION: {
    label: "In Production",
    color: "text-indigo-700 dark:text-indigo-300",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-800",
    description: "Creator is actively producing campaign deliverables.",
  },
  SUBMITTED: {
    label: "Deliverable Submitted",
    color: "text-violet-700 dark:text-violet-300",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
    description: "Deliverables submitted and awaiting brand review.",
  },
  CHANGES_REQUESTED: {
    label: "Changes Requested",
    color: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
    description: "Brand requested revisions with feedback provided.",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    description: "Deliverables approved and engagement completed with verified achievements.",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-300 dark:border-slate-700",
    description: "Engagement cancelled prior to completion.",
  },
}

export const PRODUCTION_STATUS_META: Record<
  ProductionProgressStatus,
  { label: string; color: string; bg: string }
> = {
  NOT_STARTED: {
    label: "Not Started",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  BLOCKED: {
    label: "Blocked",
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-50 dark:bg-red-950/40",
  },
}

/**
 * Validates whether a state transition is permitted in the deterministic state machine.
 */
export function canTransitionTo(current: EngagementStatus, next: EngagementStatus): boolean {
  if (current === next) return true

  // Terminal states cannot transition
  if (current === "COMPLETED") return false
  if (current === "CANCELLED" && next !== "SHORTLISTED") return false

  const allowedTransitions: Record<EngagementStatus, EngagementStatus[]> = {
    SHORTLISTED: ["INVITED", "CANCELLED"],
    INVITED: ["ACCEPTED", "DECLINED", "CANCELLED"],
    ACCEPTED: ["CONFIRMED", "AWAITING_CONFIRMATION", "CANCELLED"],
    DECLINED: ["SHORTLISTED", "INVITED"],
    AWAITING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["IN_PRODUCTION", "SUBMITTED", "CANCELLED"],
    IN_PRODUCTION: ["SUBMITTED", "CANCELLED"],
    SUBMITTED: ["CHANGES_REQUESTED", "COMPLETED", "CANCELLED"],
    CHANGES_REQUESTED: ["SUBMITTED", "IN_PRODUCTION", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: ["SHORTLISTED"],
  }

  return (allowedTransitions[current] || []).includes(next)
}

/**
 * Checks whether a creator can submit deliverables for an engagement.
 */
export function canCreatorSubmitDeliverable(status: EngagementStatus): boolean {
  return ["CONFIRMED", "IN_PRODUCTION", "CHANGES_REQUESTED"].includes(status)
}

/**
 * Checks whether a brand can review deliverables for an engagement.
 */
export function canBrandReviewDeliverable(status: EngagementStatus): boolean {
  return status === "SUBMITTED"
}

/**
 * Checks whether an engagement can be cancelled.
 */
export function canCancelEngagement(status: EngagementStatus): boolean {
  return status !== "COMPLETED" && status !== "CANCELLED"
}
