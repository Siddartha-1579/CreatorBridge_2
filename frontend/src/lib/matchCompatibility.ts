/**
 * CreatorBridge - Match Compatibility Normalization & Filtering Engine
 *
 * Provides safe, robust parsing, score normalization, boundary checking,
 * and tier classification for creator matching compatibility scores.
 */

export type MatchTier = "high" | "medium" | "low" | null

/**
 * Safely parses and normalizes a match compatibility score.
 * Handles numeric floats, integers, percentage strings (e.g., "88.8%", "75%"),
 * string numbers ("88.8"), and gracefully returns null for null, undefined,
 * NaN, infinite, or non-numeric representations.
 */
export function parseMatchScore(score: unknown): number | null {
  if (score === null || score === undefined) {
    return null
  }

  if (typeof score === "number") {
    return Number.isFinite(score) && !Number.isNaN(score) ? score : null
  }

  if (typeof score === "string") {
    const cleaned = score.replace(/%/g, "").trim()
    if (!cleaned) return null
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) && !Number.isNaN(parsed) ? parsed : null
  }

  return null
}

/**
 * Evaluates whether a creator's match score satisfies the selected minimum threshold.
 *
 * Rules:
 * - minScore <= 0: "All Match Scores" -> always true (inclusive of all roster entries).
 * - minScore > 0: Requires a valid, parseable score >= minScore.
 *   Missing, null, uncomputed, or invalid scores NEVER falsely pass a positive threshold.
 */
export function isMatchCompatible(score: unknown, minScore: number): boolean {
  if (minScore <= 0) {
    return true
  }

  const parsed = parseMatchScore(score)
  if (parsed === null) {
    return false
  }

  return parsed >= minScore
}

/**
 * Returns the UI tier classification for a match score:
 * - "high" (Emerald): >= 85%
 * - "medium" (Purple): >= 70% and < 85%
 * - "low" (Amber): < 70%
 * - null: invalid, null, or uncomputed score
 */
export function getMatchTier(score: unknown): MatchTier {
  const parsed = parseMatchScore(score)
  if (parsed === null) return null
  if (parsed >= 85) return "high"
  if (parsed >= 70) return "medium"
  return "low"
}

/**
 * Formats a match score as a rounded percentage string (e.g., "89% Match"),
 * or returns null if the score is uncomputed or invalid.
 */
export function formatMatchScore(score: unknown): string | null {
  const parsed = parseMatchScore(score)
  if (parsed === null) return null
  return `${Math.round(parsed)}%`
}
