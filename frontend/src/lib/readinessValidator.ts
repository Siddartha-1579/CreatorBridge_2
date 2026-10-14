import type { SystemReadinessReport } from "@/types"

/**
 * Runtime validator for SystemReadinessReport.
 * Verifies that the unwrapped payload matches expected platform readiness structure.
 */
export function isValidReadinessReport(data: unknown): data is SystemReadinessReport {
  if (!data || typeof data !== "object") {
    return false
  }

  const candidate = data as Record<string, unknown>

  return (
    typeof candidate.system_status === "string" &&
    typeof candidate.total_integrations === "number" &&
    Array.isArray(candidate.integrations) &&
    typeof candidate.configured_count === "number" &&
    typeof candidate.mock_count === "number" &&
    typeof candidate.missing_count === "number"
  )
}

/**
 * Extracts and unwrap readiness report payload whether delivered
 * as directly unwrapped SystemReadinessReport or wrapped in a data envelope.
 */
export function extractReadinessPayload(res: unknown): unknown {
  if (res && typeof res === "object" && "data" in res && !("system_status" in res)) {
    return (res as { data: unknown }).data
  }
  return res
}
