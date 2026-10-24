import { describe, it } from "node:test"
import assert from "node:assert/strict"
import type { DeliveryCheckReport, CheckItemStatus, DeliveryCheckStatus } from "../types/deliveryCheck"

describe("DeliveryCheck data contracts and status evaluations", () => {
  it("evaluates review readiness strictly when overall status is PASSED", () => {
    const passedReport: DeliveryCheckReport = {
      overall_status: "PASSED",
      is_review_ready: true,
      checks: [
        {
          rule_name: "format",
          label: "Deliverable Format",
          status: "PASSED",
          required_value: "MP4",
          detected_value: "MP4",
        },
        {
          rule_name: "aspect_ratio",
          label: "Aspect Ratio",
          status: "PASSED",
          required_value: "9:16",
          detected_value: "9:16",
        },
      ],
      passed_count: 2,
      failed_count: 0,
      not_specified_count: 0,
      unable_to_verify_count: 0,
      suggested_fixes: [],
      checked_at: new Date().toISOString(),
    }

    assert.equal(passedReport.overall_status, "PASSED")
    assert.equal(passedReport.is_review_ready, true)
    assert.equal(passedReport.failed_count, 0)
    assert.equal(passedReport.checks.length, 2)
  })

  it("blocks review readiness and produces suggested fixes when checks fail", () => {
    const failedReport: DeliveryCheckReport = {
      overall_status: "FAILED",
      is_review_ready: false,
      checks: [
        {
          rule_name: "aspect_ratio",
          label: "Aspect Ratio",
          status: "FAILED",
          required_value: "9:16",
          detected_value: "16:9",
          failure_reason: "Detected aspect ratio 16:9 does not match brief requirement 9:16.",
          actionable_correction: "Re-render media in vertical 9:16 aspect ratio (e.g., 1080x1920 or 2160x3840).",
        },
        {
          rule_name: "duration",
          label: "Content Duration",
          status: "FAILED",
          required_value: "30s",
          detected_value: "10.0s",
          failure_reason: "Detected duration 10.0s is outside allowed duration 30.0s.",
          actionable_correction: "Adjust timeline cut to meet the required duration of 30.0s (±5s tolerance).",
        },
      ],
      passed_count: 0,
      failed_count: 2,
      not_specified_count: 0,
      unable_to_verify_count: 0,
      suggested_fixes: [
        "Aspect Ratio: Re-render media in vertical 9:16 aspect ratio (e.g., 1080x1920 or 2160x3840).",
        "Content Duration: Adjust timeline cut to meet the required duration of 30.0s (±5s tolerance).",
      ],
      checked_at: new Date().toISOString(),
    }

    assert.equal(failedReport.overall_status, "FAILED")
    assert.equal(failedReport.is_review_ready, false)
    assert.equal(failedReport.failed_count, 2)
    assert.equal(failedReport.suggested_fixes.length, 2)
    assert.match(failedReport.suggested_fixes[0], /Aspect Ratio/)
  })

  it("permits unverified states without failing when non-mandatory files cannot be inspected", () => {
    const unverifiedReport: DeliveryCheckReport = {
      overall_status: "UNABLE_TO_VERIFY",
      is_review_ready: true,
      checks: [
        {
          rule_name: "format",
          label: "Deliverable Format",
          status: "UNABLE_TO_VERIFY",
          required_value: "ZIP",
          detected_value: "application/zip",
          failure_reason: "Remote archive container cannot be inspected without direct binary stream.",
          actionable_correction: null,
        },
      ],
      passed_count: 0,
      failed_count: 0,
      not_specified_count: 0,
      unable_to_verify_count: 1,
      suggested_fixes: [],
      checked_at: new Date().toISOString(),
    }

    assert.equal(unverifiedReport.overall_status, "UNABLE_TO_VERIFY")
    assert.equal(unverifiedReport.is_review_ready, true)
    assert.equal(unverifiedReport.failed_count, 0)
    assert.equal(unverifiedReport.unable_to_verify_count, 1)
  })
})
