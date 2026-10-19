import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  parseMatchScore,
  isMatchCompatible,
  getMatchTier,
  formatMatchScore,
} from "./matchCompatibility.ts"
import { creatorMatchesTool } from "./toolMatching.ts"

// Simulated creator dataset based on the production database
const mockCreators = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    full_name: "Alex Rivera",
    handle: "alexrivera_ai",
    primary_specialization: "Photorealistic Cinematic Video & Midjourney v6",
    ai_tools: ["Runway Gen-3", "Midjourney", "ElevenLabs", "ComfyUI"],
    skills: ["Cinematics", "Prompt Engineering", "Color Grading", "Post-Processing"],
    hourly_rate_cents: 25000,
    reputation_score: 4.9,
    visibility: "AVAILABLE",
  },
  {
    id: "00000000-0000-0000-0000-000000000021",
    full_name: "Elena Rostova",
    handle: "elenarostova",
    primary_specialization: "AI Fashion & Conceptual Photography",
    ai_tools: ["Midjourney v6.1", "Flux.1 Pro", "Magnific AI", "Photoshop Generative Fill"],
    skills: ["Hyperrealistic Fashion", "Virtual Model Consistency", "Editorial Direction", "Prompt Engineering"],
    hourly_rate_cents: 20000,
    reputation_score: 4.9,
    visibility: "AVAILABLE",
  },
  {
    id: "00000000-0000-0000-0000-000000000022",
    full_name: "Marcus Vance",
    handle: "marcusvance",
    primary_specialization: "Cinematic AI Video & Motion Design",
    ai_tools: ["Runway Gen-3 Alpha", "Kling AI 1.5", "Luma Dream Machine", "Topaz Video AI", "Premiere Pro"],
    skills: ["Text-to-Video Camera Moves", "Temporal Consistency", "VFX & Motion Design", "Sound Synchronization"],
    hourly_rate_cents: 18000,
    reputation_score: 4.8,
    visibility: "AVAILABLE",
  },
  {
    id: "00000000-0000-0000-0000-000000000023",
    full_name: "Aaliyah Chen",
    handle: "aaliyahchen",
    primary_specialization: "Hyperrealistic 3D Product & Commercial Brand Worlds",
    ai_tools: ["ComfyUI", "Stable Diffusion XL", "ControlNet Depth", "Blender 3D", "Unreal Engine 5"],
    skills: ["Custom LoRA Training", "Precise CAD Alignment", "Multi-Pass Rendering", "Packaging Visualization"],
    hourly_rate_cents: 16000,
    reputation_score: 4.9,
    visibility: "AVAILABLE",
  },
]

describe("Issue 04: Match Compatibility Filtering & Normalization Engine", () => {
  describe("1. parseMatchScore", () => {
    it("parses valid floating point and integer numbers", () => {
      assert.strictEqual(parseMatchScore(88.8), 88.8)
      assert.strictEqual(parseMatchScore(75), 75)
      assert.strictEqual(parseMatchScore(0), 0)
      assert.strictEqual(parseMatchScore(100), 100)
    })

    it("parses percentage-formatted strings safely", () => {
      assert.strictEqual(parseMatchScore("88.8%"), 88.8)
      assert.strictEqual(parseMatchScore("75%"), 75)
      assert.strictEqual(parseMatchScore(" 90 % "), 90)
      assert.strictEqual(parseMatchScore("100%"), 100)
    })

    it("parses numeric strings cleanly", () => {
      assert.strictEqual(parseMatchScore("88.8"), 88.8)
      assert.strictEqual(parseMatchScore("75"), 75)
      assert.strictEqual(parseMatchScore("0"), 0)
    })

    it("returns null for null, undefined, and non-numeric inputs", () => {
      assert.strictEqual(parseMatchScore(null), null)
      assert.strictEqual(parseMatchScore(undefined), null)
      assert.strictEqual(parseMatchScore(""), null)
      assert.strictEqual(parseMatchScore("   "), null)
      assert.strictEqual(parseMatchScore("invalid"), null)
      assert.strictEqual(parseMatchScore("N/A"), null)
      assert.strictEqual(parseMatchScore(NaN), null)
      assert.strictEqual(parseMatchScore(Infinity), null)
      assert.strictEqual(parseMatchScore(-Infinity), null)
    })
  })

  describe("2. isMatchCompatible - Threshold Options", () => {
    it("option 0 (All Match Scores) accepts all creators regardless of score presence or validity", () => {
      assert.strictEqual(isMatchCompatible(95, 0), true)
      assert.strictEqual(isMatchCompatible(88.8, 0), true)
      assert.strictEqual(isMatchCompatible(62.4, 0), true)
      assert.strictEqual(isMatchCompatible(0, 0), true)
      assert.strictEqual(isMatchCompatible(null, 0), true)
      assert.strictEqual(isMatchCompatible(undefined, 0), true)
      assert.strictEqual(isMatchCompatible("N/A", 0), true)
      assert.strictEqual(isMatchCompatible("85%", 0), true)
    })

    it("option 75 (Good Match 75%+) accepts scores >= 75 and rejects lower or missing scores", () => {
      assert.strictEqual(isMatchCompatible(75, 75), true)
      assert.strictEqual(isMatchCompatible(75.0, 75), true)
      assert.strictEqual(isMatchCompatible(75.001, 75), true)
      assert.strictEqual(isMatchCompatible(75.1, 75), true)
      assert.strictEqual(isMatchCompatible(88.8, 75), true)
      assert.strictEqual(isMatchCompatible("88.8%", 75), true)
      assert.strictEqual(isMatchCompatible("75%", 75), true)

      // Strict unrounded comparison: 74.9 and 74.999 must NOT pass threshold 75,
      // even though Math.round(74.9) evaluates to 75.
      assert.strictEqual(isMatchCompatible(74.999, 75), false)
      assert.strictEqual(isMatchCompatible(74.9, 75), false)
      assert.strictEqual(isMatchCompatible(62.4, 75), false)
      assert.strictEqual(isMatchCompatible(45.0, 75), false)

      // Invalid, missing, NaN, and infinite inputs must never pass a positive threshold
      assert.strictEqual(isMatchCompatible(null, 75), false)
      assert.strictEqual(isMatchCompatible(undefined, 75), false)
      assert.strictEqual(isMatchCompatible(NaN, 75), false)
      assert.strictEqual(isMatchCompatible(Infinity, 75), false)
      assert.strictEqual(isMatchCompatible(-Infinity, 75), false)
      assert.strictEqual(isMatchCompatible("", 75), false)
      assert.strictEqual(isMatchCompatible("   ", 75), false)
      assert.strictEqual(isMatchCompatible("NaN", 75), false)
      assert.strictEqual(isMatchCompatible("Infinity", 75), false)
      assert.strictEqual(isMatchCompatible("invalid", 75), false)
    })

    it("option 85 (High Affinity 85%+) accepts scores >= 85 and rejects lower or missing scores", () => {
      assert.strictEqual(isMatchCompatible(85, 85), true)
      assert.strictEqual(isMatchCompatible(88.8, 85), true)
      assert.strictEqual(isMatchCompatible(97.0, 85), true)
      assert.strictEqual(isMatchCompatible("85%", 85), true)
      assert.strictEqual(isMatchCompatible("92.5%", 85), true)

      assert.strictEqual(isMatchCompatible(84.9, 85), false)
      assert.strictEqual(isMatchCompatible(75.0, 85), false)
      assert.strictEqual(isMatchCompatible(62.4, 85), false)
      assert.strictEqual(isMatchCompatible(null, 85), false)
      assert.strictEqual(isMatchCompatible(undefined, 85), false)
    })

    it("option 90 (Top Tier 90%+) accepts scores >= 90 and rejects lower or missing scores", () => {
      assert.strictEqual(isMatchCompatible(90, 90), true)
      assert.strictEqual(isMatchCompatible(92.4, 90), true)
      assert.strictEqual(isMatchCompatible(97.0, 90), true)
      assert.strictEqual(isMatchCompatible("90%", 90), true)
      assert.strictEqual(isMatchCompatible("95.5%", 90), true)

      assert.strictEqual(isMatchCompatible(89.9, 90), false)
      assert.strictEqual(isMatchCompatible(88.8, 90), false)
      assert.strictEqual(isMatchCompatible(85.0, 90), false)
      assert.strictEqual(isMatchCompatible(75.0, 90), false)
      assert.strictEqual(isMatchCompatible(null, 90), false)
      assert.strictEqual(isMatchCompatible(undefined, 90), false)
    })
  })

  describe("3. getMatchTier & formatMatchScore", () => {
    it("correctly classifies score tiers", () => {
      assert.strictEqual(getMatchTier(92.4), "high")
      assert.strictEqual(getMatchTier(85.0), "high")
      assert.strictEqual(getMatchTier("88.8%"), "high")

      assert.strictEqual(getMatchTier(84.9), "medium")
      assert.strictEqual(getMatchTier(70.0), "medium")
      assert.strictEqual(getMatchTier("78.5%"), "medium")

      assert.strictEqual(getMatchTier(69.9), "low")
      assert.strictEqual(getMatchTier(44.0), "low")
      assert.strictEqual(getMatchTier("55%"), "low")

      assert.strictEqual(getMatchTier(null), null)
      assert.strictEqual(getMatchTier(undefined), null)
      assert.strictEqual(getMatchTier("invalid"), null)
    })

    it("formats scores cleanly for display", () => {
      assert.strictEqual(formatMatchScore(88.8), "89%")
      assert.strictEqual(formatMatchScore("75.4%"), "75%")
      assert.strictEqual(formatMatchScore(null), null)
      assert.strictEqual(formatMatchScore("invalid"), null)
    })
  })

  describe("4. Roster Filtering Simulation across All Options", () => {
    // Simulated matches corresponding to global talent benchmark
    const simulatedGlobalMatches = [
      { creator_id: "00000000-0000-0000-0000-000000000001", overall_match_score: 92.4 }, // Alex Rivera (Top Tier)
      { creator_id: "00000000-0000-0000-0000-000000000021", overall_match_score: 86.5 }, // Elena Rostova (High Affinity)
      { creator_id: "00000000-0000-0000-0000-000000000022", overall_match_score: 79.0 }, // Marcus Vance (Good Match)
      { creator_id: "00000000-0000-0000-0000-000000000023", overall_match_score: 65.4 }, // Aaliyah Chen (Specialized 3D)
    ]

    function filterRoster(minScore: number) {
      return mockCreators
        .map((creator) => {
          const matchInfo = simulatedGlobalMatches.find((m) => m.creator_id === creator.id)
          return { creator, matchInfo }
        })
        .filter(({ matchInfo }) => isMatchCompatible(matchInfo?.overall_match_score, minScore))
    }

    it("Option '0' (All Match Scores) returns all 4 creators", () => {
      const result = filterRoster(0)
      assert.strictEqual(result.length, 4)
      assert.deepStrictEqual(
        result.map((r) => r.creator.full_name),
        ["Alex Rivera", "Elena Rostova", "Marcus Vance", "Aaliyah Chen"]
      )
    })

    it("Option '75' (Good Match 75%+) returns 3 creators scoring >= 75%", () => {
      const result = filterRoster(75)
      assert.strictEqual(result.length, 3)
      assert.deepStrictEqual(
        result.map((r) => r.creator.full_name),
        ["Alex Rivera", "Elena Rostova", "Marcus Vance"]
      )
    })

    it("Option '85' (High Affinity 85%+) returns 2 creators scoring >= 85%", () => {
      const result = filterRoster(85)
      assert.strictEqual(result.length, 2)
      assert.deepStrictEqual(
        result.map((r) => r.creator.full_name),
        ["Alex Rivera", "Elena Rostova"]
      )
    })

    it("Option '90' (Top Tier 90%+) returns 1 creator scoring >= 90%", () => {
      const result = filterRoster(90)
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].creator.full_name, "Alex Rivera")
    })
  })

  describe("5. Combination Filters with AI Tools, Styles, and Rates", () => {
    const simulatedMatches = [
      { creator_id: "00000000-0000-0000-0000-000000000001", overall_match_score: 92.4 },
      { creator_id: "00000000-0000-0000-0000-000000000021", overall_match_score: 86.5 },
      { creator_id: "00000000-0000-0000-0000-000000000022", overall_match_score: 79.0 },
      { creator_id: "00000000-0000-0000-0000-000000000023", overall_match_score: 65.4 },
    ]

    function runCombinedFilter(params: {
      minScore?: number
      selectedTool?: string
      selectedStyle?: string
      maxRate?: number
    }) {
      const { minScore = 0, selectedTool = "all", selectedStyle = "all", maxRate = 500 } = params

      return mockCreators
        .map((creator) => {
          const matchInfo = simulatedMatches.find((m) => m.creator_id === creator.id)
          return { creator, matchInfo }
        })
        .filter(({ creator, matchInfo }) => {
          const matchesScore = isMatchCompatible(matchInfo?.overall_match_score, minScore)
          const matchesTool = creatorMatchesTool(creator, selectedTool)
          const spec = (creator.primary_specialization || "").toLowerCase()
          const matchesStyle =
            selectedStyle === "all" || spec.includes(selectedStyle.toLowerCase())
          const rateDollars = creator.hourly_rate_cents ? creator.hourly_rate_cents / 100 : 75
          const matchesRate = rateDollars <= maxRate

          return matchesScore && matchesTool && matchesStyle && matchesRate
        })
    }

    it("combines Match Compatibility (75%+) with Runway toolchain", () => {
      // Alex Rivera (92.4%, Runway) and Marcus Vance (79.0%, Runway) should pass
      const result = runCombinedFilter({ minScore: 75, selectedTool: "Runway" })
      assert.strictEqual(result.length, 2)
      assert.deepStrictEqual(
        result.map((r) => r.creator.full_name),
        ["Alex Rivera", "Marcus Vance"]
      )
    })

    it("combines Match Compatibility (85%+) with Midjourney toolchain", () => {
      // Alex Rivera (92.4%, Midjourney) and Elena Rostova (86.5%, Midjourney v6.1) should pass
      const result = runCombinedFilter({ minScore: 85, selectedTool: "Midjourney" })
      assert.strictEqual(result.length, 2)
      assert.deepStrictEqual(
        result.map((r) => r.creator.full_name),
        ["Alex Rivera", "Elena Rostova"]
      )
    })

    it("combines Match Compatibility (75%+) with Fashion style", () => {
      // Elena Rostova is Fashion & Conceptual with 86.5% -> passes
      const result = runCombinedFilter({ minScore: 75, selectedStyle: "fashion" })
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].creator.full_name, "Elena Rostova")
    })

    it("combines Match Compatibility (75%+) with Hourly rate ceiling ($200/hr)", () => {
      // Alex Rivera ($250/hr) is excluded by rate; Elena ($200/hr) and Marcus ($180/hr) pass
      const result = runCombinedFilter({ minScore: 75, maxRate: 200 })
      assert.strictEqual(result.length, 2)
      assert.deepStrictEqual(
        result.map((r) => r.creator.full_name),
        ["Elena Rostova", "Marcus Vance"]
      )
    })

    it("resets cleanly when switching back to All Match Scores (0)", () => {
      const filtered = runCombinedFilter({ minScore: 90 })
      assert.strictEqual(filtered.length, 1)

      const reset = runCombinedFilter({ minScore: 0 })
      assert.strictEqual(reset.length, 4)
    })
  })

  describe("6. Robust Handling of Missing & Uncomputed Match Info", () => {
    it("handles creators without match records safely without falsifying scores", () => {
      // Creator without any matchInfo (e.g., dynamically added creator or uncomputed status)
      const uncomputedScore = undefined

      assert.strictEqual(isMatchCompatible(uncomputedScore, 0), true)
      assert.strictEqual(isMatchCompatible(uncomputedScore, 75), false)
      assert.strictEqual(isMatchCompatible(uncomputedScore, 85), false)
      assert.strictEqual(isMatchCompatible(uncomputedScore, 90), false)
      assert.strictEqual(getMatchTier(uncomputedScore), null)
      assert.strictEqual(formatMatchScore(uncomputedScore), null)
    })
  })
})
