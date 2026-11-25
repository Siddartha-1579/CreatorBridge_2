import { describe, it } from "node:test"
import assert from "node:assert/strict"

type EligibilityStatus = "ELIGIBLE_MATCH" | "POTENTIAL_MATCH_INFO_MISSING" | "NOT_ELIGIBLE"

interface MockMatchInfo {
  overall_match_score?: number | string
  priority_score?: number
  eligibility_status?: EligibilityStatus
  is_eligible?: boolean
}

interface MockCreator {
  id: string
  handle: string
  reputation_score?: number
}

interface MockCandidateItem {
  creator: MockCreator
  matchInfo?: MockMatchInfo
}

function parseMatchScore(score: unknown): number | null {
  if (typeof score === "number" && !isNaN(score)) return score
  if (typeof score === "string") {
    const parsed = parseFloat(score.replace(/[^0-9.]/g, ""))
    return isNaN(parsed) ? null : parsed
  }
  return null
}

const getTierRank = (match?: MockMatchInfo | null): number => {
  if (!match) return 2
  if (match.eligibility_status === "ELIGIBLE_MATCH" || (match.is_eligible === true && !match.eligibility_status)) {
    return 3
  }
  if (match.eligibility_status === "POTENTIAL_MATCH_INFO_MISSING") {
    return 2
  }
  return 1 // NOT_ELIGIBLE or is_eligible === false
}

function sortCandidates(candidates: MockCandidateItem[]): MockCandidateItem[] {
  return [...candidates].sort((a, b) => {
    const tierA = getTierRank(a.matchInfo)
    const tierB = getTierRank(b.matchInfo)

    if (tierB !== tierA) {
      return tierB - tierA
    }

    const prioA = typeof a.matchInfo?.priority_score === "number" ? a.matchInfo.priority_score : -1
    const prioB = typeof b.matchInfo?.priority_score === "number" ? b.matchInfo.priority_score : -1
    if (prioB !== prioA && prioA !== -1 && prioB !== -1) {
      return prioB - prioA
    }

    const scoreA = parseMatchScore(a.matchInfo?.overall_match_score) ?? -1
    const scoreB = parseMatchScore(b.matchInfo?.overall_match_score) ?? -1
    if (scoreB !== scoreA) {
      return scoreB - scoreA
    }

    const repA = Number(a.creator.reputation_score ?? 0)
    const repB = Number(b.creator.reputation_score ?? 0)
    return repB - repA
  })
}

describe("BrandDiscoverPage Eligibility Tier Preserving Sort", () => {
  it("prioritizes ELIGIBLE_MATCH ahead of higher-scoring NOT_ELIGIBLE candidates", () => {
    const candidateEligible: MockCandidateItem = {
      creator: { id: "c1", handle: "eligible_low_score" },
      matchInfo: {
        overall_match_score: 75.0,
        eligibility_status: "ELIGIBLE_MATCH",
        is_eligible: true,
      },
    }

    const candidateIneligible: MockCandidateItem = {
      creator: { id: "c2", handle: "ineligible_high_score" },
      matchInfo: {
        overall_match_score: 95.0,
        eligibility_status: "NOT_ELIGIBLE",
        is_eligible: false,
      },
    }

    const sorted = sortCandidates([candidateIneligible, candidateEligible])
    assert.equal(sorted[0].creator.handle, "eligible_low_score")
    assert.equal(sorted[1].creator.handle, "ineligible_high_score")
  })

  it("prioritizes POTENTIAL_MATCH_INFO_MISSING ahead of NOT_ELIGIBLE candidates", () => {
    const candidateMissingInfo: MockCandidateItem = {
      creator: { id: "c1", handle: "missing_info" },
      matchInfo: {
        overall_match_score: 65.0,
        eligibility_status: "POTENTIAL_MATCH_INFO_MISSING",
        is_eligible: true,
      },
    }

    const candidateIneligible: MockCandidateItem = {
      creator: { id: "c2", handle: "ineligible" },
      matchInfo: {
        overall_match_score: 88.0,
        eligibility_status: "NOT_ELIGIBLE",
        is_eligible: false,
      },
    }

    const sorted = sortCandidates([candidateIneligible, candidateMissingInfo])
    assert.equal(sorted[0].creator.handle, "missing_info")
    assert.equal(sorted[1].creator.handle, "ineligible")
  })

  it("orders by descending score within the same eligibility tier", () => {
    const c1: MockCandidateItem = {
      creator: { id: "c1", handle: "match_80" },
      matchInfo: { overall_match_score: 80.0, eligibility_status: "ELIGIBLE_MATCH", is_eligible: true },
    }
    const c2: MockCandidateItem = {
      creator: { id: "c2", handle: "match_92" },
      matchInfo: { overall_match_score: 92.0, eligibility_status: "ELIGIBLE_MATCH", is_eligible: true },
    }
    const c3: MockCandidateItem = {
      creator: { id: "c3", handle: "match_87" },
      matchInfo: { overall_match_score: 87.0, eligibility_status: "ELIGIBLE_MATCH", is_eligible: true },
    }

    const sorted = sortCandidates([c1, c2, c3])
    assert.deepEqual(
      sorted.map((c) => c.creator.handle),
      ["match_92", "match_87", "match_80"]
    )
  })

  it("handles string percentage scores and missing scores safely", () => {
    const c1: MockCandidateItem = {
      creator: { id: "c1", handle: "string_pct" },
      matchInfo: { overall_match_score: "85%", eligibility_status: "ELIGIBLE_MATCH", is_eligible: true },
    }
    const c2: MockCandidateItem = {
      creator: { id: "c2", handle: "undefined_score" },
      matchInfo: { overall_match_score: undefined, eligibility_status: "ELIGIBLE_MATCH", is_eligible: true },
    }

    const sorted = sortCandidates([c2, c1])
    assert.equal(sorted[0].creator.handle, "string_pct")
    assert.equal(sorted[1].creator.handle, "undefined_score")
  })
})
