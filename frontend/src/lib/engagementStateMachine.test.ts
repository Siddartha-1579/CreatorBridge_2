import { test } from "node:test"
import assert from "node:assert/strict"
import {
  canTransitionTo,
  canCreatorSubmitDeliverable,
  canBrandReviewDeliverable,
  canCancelEngagement,
  ENGAGEMENT_STATUS_META,
  PRODUCTION_STATUS_META,
} from "./engagementStateMachine.ts"

test("engagementStateMachine: valid stage transitions", () => {
  // Stage A to B
  assert.equal(canTransitionTo("SHORTLISTED", "INVITED"), true)

  // Stage B to response
  assert.equal(canTransitionTo("INVITED", "ACCEPTED"), true)
  assert.equal(canTransitionTo("INVITED", "DECLINED"), true)

  // Stage C: confirmation
  assert.equal(canTransitionTo("ACCEPTED", "CONFIRMED"), true)

  // Stage D: production
  assert.equal(canTransitionTo("CONFIRMED", "IN_PRODUCTION"), true)

  // Stage E: submission and review
  assert.equal(canTransitionTo("IN_PRODUCTION", "SUBMITTED"), true)
  assert.equal(canTransitionTo("SUBMITTED", "CHANGES_REQUESTED"), true)
  assert.equal(canTransitionTo("CHANGES_REQUESTED", "SUBMITTED"), true)
  assert.equal(canTransitionTo("SUBMITTED", "COMPLETED"), true)
})

test("engagementStateMachine: invalid transitions blocked", () => {
  // Cannot jump from shortlisted directly to submitted
  assert.equal(canTransitionTo("SHORTLISTED", "SUBMITTED"), false)

  // Cannot jump from invited directly to completed
  assert.equal(canTransitionTo("INVITED", "COMPLETED"), false)

  // Completed engagement cannot transition to any active state
  assert.equal(canTransitionTo("COMPLETED", "SUBMITTED"), false)
  assert.equal(canTransitionTo("COMPLETED", "IN_PRODUCTION"), false)
  assert.equal(canTransitionTo("COMPLETED", "CANCELLED"), false)
})

test("engagementStateMachine: delivery submission eligibility", () => {
  assert.equal(canCreatorSubmitDeliverable("SHORTLISTED"), false)
  assert.equal(canCreatorSubmitDeliverable("INVITED"), false)
  assert.equal(canCreatorSubmitDeliverable("ACCEPTED"), false)
  assert.equal(canCreatorSubmitDeliverable("CONFIRMED"), true)
  assert.equal(canCreatorSubmitDeliverable("IN_PRODUCTION"), true)
  assert.equal(canCreatorSubmitDeliverable("CHANGES_REQUESTED"), true)
  assert.equal(canCreatorSubmitDeliverable("COMPLETED"), false)
})

test("engagementStateMachine: brand review eligibility", () => {
  assert.equal(canBrandReviewDeliverable("SUBMITTED"), true)
  assert.equal(canBrandReviewDeliverable("IN_PRODUCTION"), false)
  assert.equal(canBrandReviewDeliverable("CONFIRMED"), false)
  assert.equal(canBrandReviewDeliverable("COMPLETED"), false)
})

test("engagementStateMachine: cancellation constraints", () => {
  assert.equal(canCancelEngagement("SHORTLISTED"), true)
  assert.equal(canCancelEngagement("INVITED"), true)
  assert.equal(canCancelEngagement("IN_PRODUCTION"), true)
  assert.equal(canCancelEngagement("SUBMITTED"), true)
  assert.equal(canCancelEngagement("COMPLETED"), false)
  assert.equal(canCancelEngagement("CANCELLED"), false)
})

test("engagementStateMachine: metadata presence", () => {
  const statuses = [
    "SHORTLISTED",
    "INVITED",
    "ACCEPTED",
    "DECLINED",
    "AWAITING_CONFIRMATION",
    "CONFIRMED",
    "IN_PRODUCTION",
    "SUBMITTED",
    "CHANGES_REQUESTED",
    "COMPLETED",
    "CANCELLED",
  ] as const

  for (const st of statuses) {
    assert.ok(ENGAGEMENT_STATUS_META[st], `Missing meta for ${st}`)
    assert.ok(ENGAGEMENT_STATUS_META[st].label)
    assert.ok(ENGAGEMENT_STATUS_META[st].color)
  }

  const prodStatuses = ["NOT_STARTED", "IN_PROGRESS", "BLOCKED"] as const
  for (const pst of prodStatuses) {
    assert.ok(PRODUCTION_STATUS_META[pst], `Missing meta for ${pst}`)
    assert.ok(PRODUCTION_STATUS_META[pst].label)
  }
})
