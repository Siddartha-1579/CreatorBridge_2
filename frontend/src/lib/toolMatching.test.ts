import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  normalizeToolName,
  isToolMatch,
  briefMatchesTool,
  getAvailableToolsForBriefs,
  creatorMatchesTool,
  getAvailableToolsForCreators,
  SUPPORTED_AI_TOOLS,
} from "./toolMatching.ts"

// Simulated campaigns reflecting the actual API response shape
const mockBriefs = [
  {
    id: "b-01",
    title: "Lumina Cellular Radiance Serum Launch",
    campaign_category: "Beauty & Cosmetics",
    platforms: ["Instagram Reels", "TikTok"],
    required_tools: ["ComfyUI", "Midjourney", "Blender", "Runway Gen-3"],
    creator_capabilities: {
      preferred_tools: ["ComfyUI", "Midjourney v6", "ControlNet Depth", "Blender"],
    },
  },
  {
    id: "b-02",
    title: "Terra Apex Technical Storm-Shell Campaign",
    campaign_category: "Outdoor & Technical Gear",
    platforms: ["YouTube", "Instagram Reels", "TikTok"],
    required_tools: ["Runway Gen-3", "Kling AI", "Midjourney v6", "Topaz"],
    creator_capabilities: {
      preferred_tools: ["Runway Gen-3", "Kling AI", "Topaz Video AI"],
    },
  },
  {
    id: "b-03",
    title: "Neo-Couture Autumn/Winter Editorial",
    campaign_category: "Haute Couture & High Fashion",
    platforms: ["Digital Vogue Spread", "Instagram", "High-Res Billboard"],
    required_tools: ["Midjourney", "Flux.1 Pro", "Magnific AI", "Photoshop"],
    creator_capabilities: {
      preferred_tools: ["Midjourney v6.1", "Flux.1 Pro", "Magnific AI"],
    },
  },
  {
    id: "b-04",
    title: "Kissa Ceremonial Matcha Single-Estate Elixir",
    campaign_category: "Food & Beverage",
    platforms: ["TikTok", "Instagram Reels"],
    required_tools: ["ComfyUI", "SDXL", "Blender", "Runway Gen-3"],
    creator_capabilities: {
      preferred_tools: ["ComfyUI", "SDXL", "Blender", "Runway Gen-3"],
    },
  },
  {
    id: "b-05",
    title: "Futuristic Beverage Launch Campaign",
    campaign_category: "Food & Beverage",
    platforms: ["Instagram Reels", "YouTube"],
    required_tools: ["Runway Gen-3", "Midjourney", "ElevenLabs"],
    creator_capabilities: {
      preferred_tools: ["Runway Gen-3", "Midjourney v6", "ElevenLabs", "ComfyUI"],
    },
  },
]

describe("Tool Matching & Normalization Engine", () => {
  it("Requirement 1: Matches each supported tool that has matching campaign data", () => {
    // Kling AI (Campaign 2)
    const klingMatches = mockBriefs.filter((b) => briefMatchesTool(b, "Kling AI"))
    assert.strictEqual(klingMatches.length, 1)
    assert.strictEqual(klingMatches[0].id, "b-02")

    // Runway Gen-3 (Campaigns 1, 2, 4, 5)
    const runwayMatches = mockBriefs.filter((b) => briefMatchesTool(b, "Runway Gen-3"))
    assert.strictEqual(runwayMatches.length, 4)

    // Midjourney (Campaigns 1, 2, 3, 5) - matches both "Midjourney" and "Midjourney v6"
    const mjMatches = mockBriefs.filter((b) => briefMatchesTool(b, "Midjourney"))
    assert.strictEqual(mjMatches.length, 4)

    // ComfyUI (Campaigns 1, 4, 5)
    const comfyMatches = mockBriefs.filter((b) => briefMatchesTool(b, "ComfyUI"))
    assert.strictEqual(comfyMatches.length, 3)

    // Flux.1 Pro (Campaign 3)
    const fluxMatches = mockBriefs.filter((b) => briefMatchesTool(b, "Flux.1 Pro"))
    assert.strictEqual(fluxMatches.length, 1)
    assert.strictEqual(fluxMatches[0].id, "b-03")

    // SDXL (Campaign 4)
    const sdxlMatches = mockBriefs.filter((b) => briefMatchesTool(b, "SDXL"))
    assert.strictEqual(sdxlMatches.length, 1)
    assert.strictEqual(sdxlMatches[0].id, "b-04")

    // Blender (Campaigns 1, 4)
    const blenderMatches = mockBriefs.filter((b) => briefMatchesTool(b, "Blender"))
    assert.strictEqual(blenderMatches.length, 2)

    // Topaz (Campaign 2)
    const topazMatches = mockBriefs.filter((b) => briefMatchesTool(b, "Topaz"))
    assert.strictEqual(topazMatches.length, 1)
    assert.strictEqual(topazMatches[0].id, "b-02")

    // Magnific AI (Campaign 3)
    const magnificMatches = mockBriefs.filter((b) => briefMatchesTool(b, "Magnific AI"))
    assert.strictEqual(magnificMatches.length, 1)

    // Photoshop (Campaign 3)
    const photoshopMatches = mockBriefs.filter((b) => briefMatchesTool(b, "Photoshop"))
    assert.strictEqual(photoshopMatches.length, 1)

    // ElevenLabs (Campaign 5)
    const elevenMatches = mockBriefs.filter((b) => briefMatchesTool(b, "ElevenLabs"))
    assert.strictEqual(elevenMatches.length, 1)
  })

  it("Requirement 2: Correctly returns empty set for a tool with no matching campaigns", () => {
    const sunoMatches = mockBriefs.filter((b) => briefMatchesTool(b, "Suno AI"))
    assert.strictEqual(sunoMatches.length, 0)

    const lumaMatches = mockBriefs.filter((b) => briefMatchesTool(b, "Luma Dream Machine"))
    assert.strictEqual(lumaMatches.length, 0)
  })

  it("Requirement 3: Handles different capitalization, casing, and aliases", () => {
    // Normalization helper
    assert.strictEqual(normalizeToolName("Runway Gen-3 (Alpha)"), "runwaygen3alpha")
    assert.strictEqual(normalizeToolName("Kling AI v1.5!"), "klingaiv15")
    assert.ok(SUPPORTED_AI_TOOLS.includes("Kling AI"))
    assert.ok(SUPPORTED_AI_TOOLS.includes("Runway Gen-3"))

    // lowercase "kling" matches "Kling AI"
    assert.strictEqual(isToolMatch("Kling AI", "kling"), true)
    assert.strictEqual(isToolMatch("kling ai", "KLING"), true)
    assert.strictEqual(isToolMatch("kling", "Kling AI"), true)

    // Midjourney variations
    assert.strictEqual(isToolMatch("Midjourney v6", "midjourney"), true)
    assert.strictEqual(isToolMatch("Midjourney v6.1", "Midjourney"), true)
    assert.strictEqual(isToolMatch("midjourney", "Midjourney v6/v7"), true)

    // SDXL <-> Stable Diffusion
    assert.strictEqual(isToolMatch("SDXL", "Stable Diffusion"), true)
    assert.strictEqual(isToolMatch("Stable Diffusion XL", "SDXL"), true)

    // Runway variations
    assert.strictEqual(isToolMatch("Runway Gen-3", "runway"), true)
    assert.strictEqual(isToolMatch("Runway", "Runway Gen-3 Alpha"), true)

    // Topaz Video AI vs Topaz
    assert.strictEqual(isToolMatch("Topaz Video AI", "topaz"), true)

    // False positives should NOT occur across different tools
    assert.strictEqual(isToolMatch("Midjourney", "Runway Gen-3"), false)
    assert.strictEqual(isToolMatch("Kling AI", "ComfyUI"), false)
    assert.strictEqual(isToolMatch("ElevenLabs", "SDXL"), false)
  })

  it("Requirement 4: Supports switching between different tools repeatedly", () => {
    let currentFilter = "Midjourney"
    let result = mockBriefs.filter((b) => briefMatchesTool(b, currentFilter))
    assert.strictEqual(result.length, 4)

    currentFilter = "Kling AI"
    result = mockBriefs.filter((b) => briefMatchesTool(b, currentFilter))
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].id, "b-02")

    currentFilter = "ComfyUI"
    result = mockBriefs.filter((b) => briefMatchesTool(b, currentFilter))
    assert.strictEqual(result.length, 3)

    currentFilter = "Flux.1 Pro"
    result = mockBriefs.filter((b) => briefMatchesTool(b, currentFilter))
    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].id, "b-03")
  })

  it("Requirement 5: Resetting to All Tools returns all campaigns", () => {
    const result = mockBriefs.filter((b) => briefMatchesTool(b, "ALL"))
    assert.strictEqual(result.length, 5)

    const resultEmptyStr = mockBriefs.filter((b) => briefMatchesTool(b, ""))
    assert.strictEqual(resultEmptyStr.length, 5)
  })

  it("Requirement 6: Combining AI Tools with category and platform filters works correctly", () => {
    // Filter by Tool="ComfyUI" AND Category="Food & Beverage"
    const comfyBeverage = mockBriefs.filter(
      (b) =>
        briefMatchesTool(b, "ComfyUI") &&
        b.campaign_category === "Food & Beverage"
    )
    assert.strictEqual(comfyBeverage.length, 2) // b-04 and b-05

    // Filter by Tool="Runway Gen-3" AND Platform="YouTube"
    const runwayYoutube = mockBriefs.filter(
      (b) =>
        briefMatchesTool(b, "Runway Gen-3") &&
        b.platforms.some((p) => p.toUpperCase().includes("YOUTUBE"))
    )
    assert.strictEqual(runwayYoutube.length, 2) // b-02 and b-05

    // Filter with zero overlap (Tool="Flux.1 Pro" in "Beauty & Cosmetics") -> empty state
    const fluxBeauty = mockBriefs.filter(
      (b) =>
        briefMatchesTool(b, "Flux.1 Pro") &&
        b.campaign_category === "Beauty & Cosmetics"
    )
    assert.strictEqual(fluxBeauty.length, 0)
  })

  it("Requirement 7: Handles missing, null, or empty tool metadata gracefully", () => {
    const briefWithNullTools = {
      id: "b-null",
      required_tools: null,
      creator_capabilities: null,
    }
    const briefWithEmptyTools = {
      id: "b-empty",
      required_tools: [],
      creator_capabilities: { preferred_tools: [] },
    }

    assert.strictEqual(briefMatchesTool(briefWithNullTools, "ALL"), true)
    assert.strictEqual(briefMatchesTool(briefWithNullTools, "Midjourney"), false)
    assert.strictEqual(briefMatchesTool(briefWithEmptyTools, "Midjourney"), false)
  })

  it("Requirement 8: Processes the actual API response shape used by the page", () => {
    // In the real API response, briefs have required_tools as string[]
    // and creator_capabilities as an object containing preferred_tools.
    const realApiBrief = {
      title: "Terra Apex Technical Storm-Shell Campaign",
      required_tools: ["Runway Gen-3", "Kling AI", "Midjourney v6", "Topaz"],
      creator_capabilities: {
        preferred_tools: ["Runway Gen-3", "Kling AI", "Topaz Video AI"],
      },
    }

    assert.strictEqual(briefMatchesTool(realApiBrief, "Kling AI"), true)
    assert.strictEqual(briefMatchesTool(realApiBrief, "Runway Gen-3"), true)
    assert.strictEqual(briefMatchesTool(realApiBrief, "Midjourney"), true)
    assert.strictEqual(briefMatchesTool(realApiBrief, "Topaz"), true)
    assert.strictEqual(briefMatchesTool(realApiBrief, "ComfyUI"), false)
  })

  it("Requirement 9: Generates available tools dropdown containing catalog and brief tools", () => {
    const available = getAvailableToolsForBriefs(mockBriefs)

    assert.strictEqual(available[0], "ALL")
    assert.strictEqual(available.includes("Midjourney"), true)
    assert.strictEqual(available.includes("Runway Gen-3"), true)
    assert.strictEqual(available.includes("Kling AI"), true)
    assert.strictEqual(available.includes("ComfyUI"), true)
    assert.strictEqual(available.includes("Flux.1 Pro"), true)
    assert.strictEqual(available.includes("SDXL"), true)
    assert.strictEqual(available.includes("Blender"), true)
    assert.strictEqual(available.includes("Topaz"), true)
    assert.strictEqual(available.includes("ElevenLabs"), true)
  })
})

// Live creator roster matching actual backend data shape
const mockCreators = [
  {
    id: "c-01",
    full_name: "Alex Rivera",
    handle: "alex_ai_art",
    primary_specialization: "Cinematic Commercials & Video",
    ai_tools: ["Runway Gen-3", "Midjourney", "ElevenLabs", "ComfyUI"],
    skills: ["Cinematics", "Prompt Engineering", "Color Grading", "Post-Processing"],
    hourly_rate_cents: 10000,
    reputation_score: 4.88,
  },
  {
    id: "c-02",
    full_name: "Elena Rostova",
    handle: "elena_rostova",
    primary_specialization: "AI Fashion & Conceptual Photography",
    ai_tools: ["Midjourney v6.1", "Flux.1 Pro", "Magnific AI", "Photoshop Generative Fill"],
    skills: ["Hyperrealistic Fashion", "Virtual Model Consistency", "Editorial Direction", "Prompt Engineering", "Color Theory"],
    hourly_rate_cents: 15000,
    reputation_score: 4.96,
  },
  {
    id: "c-03",
    full_name: "Marcus Vance",
    handle: "marcus_vance",
    primary_specialization: "Cinematic AI Video & Motion Design",
    ai_tools: ["Runway Gen-3 Alpha", "Kling AI 1.5", "Luma Dream Machine", "Topaz Video AI", "Premiere Pro"],
    skills: ["Text-to-Video Camera Moves", "Temporal Consistency", "VFX & Motion Design", "Sound Synchronization", "Color Grading"],
    hourly_rate_cents: 12500,
    reputation_score: 4.92,
  },
  {
    id: "c-04",
    full_name: "Aaliyah Chen",
    handle: "aaliyah_chen",
    primary_specialization: "Hyperrealistic 3D Product & Commercial Brand Worlds",
    ai_tools: ["ComfyUI", "Stable Diffusion XL", "ControlNet Depth", "Blender 3D", "Unreal Engine 5"],
    skills: ["Custom LoRA Training", "Precise CAD Alignment", "Multi-Pass Rendering", "Packaging Visualization", "ComfyUI Node Graphs"],
    hourly_rate_cents: 16000,
    reputation_score: 4.98,
  },
]

describe("Creator Discovery Tool Matching Engine", () => {
  it("Requirement 1: Matching against actual creator API data returns creators who use that tool", () => {
    // Kling AI should match Marcus Vance
    const klingMatches = mockCreators.filter((c) => creatorMatchesTool(c, "Kling AI"))
    assert.strictEqual(klingMatches.length, 1)
    assert.strictEqual(klingMatches[0].handle, "marcus_vance")

    // Flux.1 Pro should match Elena Rostova
    const fluxMatches = mockCreators.filter((c) => creatorMatchesTool(c, "Flux.1 Pro"))
    assert.strictEqual(fluxMatches.length, 1)
    assert.strictEqual(fluxMatches[0].handle, "elena_rostova")

    // Runway Gen-3 matches Alex Rivera and Marcus Vance
    const runwayMatches = mockCreators.filter((c) => creatorMatchesTool(c, "Runway Gen-3"))
    assert.strictEqual(runwayMatches.length, 2)
    assert.deepStrictEqual(runwayMatches.map((c) => c.handle).sort(), ["alex_ai_art", "marcus_vance"])

    // Midjourney matches Alex Rivera and Elena Rostova
    const mjMatches = mockCreators.filter((c) => creatorMatchesTool(c, "Midjourney"))
    assert.strictEqual(mjMatches.length, 2)

    // ComfyUI matches Alex Rivera and Aaliyah Chen
    const comfyMatches = mockCreators.filter((c) => creatorMatchesTool(c, "ComfyUI"))
    assert.strictEqual(comfyMatches.length, 2)
    assert.deepStrictEqual(comfyMatches.map((c) => c.handle).sort(), ["aaliyah_chen", "alex_ai_art"])
  })

  it("Requirement 2: Normalization & aliases match vendor variations and version suffixes", () => {
    // SDXL alias matches Stable Diffusion XL
    const sdxlMatches = mockCreators.filter((c) => creatorMatchesTool(c, "SDXL"))
    assert.strictEqual(sdxlMatches.length, 1)
    assert.strictEqual(sdxlMatches[0].handle, "aaliyah_chen")

    // Stable Diffusion matches Stable Diffusion XL
    const sdMatches = mockCreators.filter((c) => creatorMatchesTool(c, "Stable Diffusion"))
    assert.strictEqual(sdMatches.length, 1)

    // Topaz matches Topaz Video AI
    const topazMatches = mockCreators.filter((c) => creatorMatchesTool(c, "Topaz"))
    assert.strictEqual(topazMatches.length, 1)
    assert.strictEqual(topazMatches[0].handle, "marcus_vance")

    // Blender matches Blender 3D
    const blenderMatches = mockCreators.filter((c) => creatorMatchesTool(c, "Blender"))
    assert.strictEqual(blenderMatches.length, 1)
    assert.strictEqual(blenderMatches[0].handle, "aaliyah_chen")

    // Photoshop matches Photoshop Generative Fill
    const psMatches = mockCreators.filter((c) => creatorMatchesTool(c, "Photoshop"))
    assert.strictEqual(psMatches.length, 1)
    assert.strictEqual(psMatches[0].handle, "elena_rostova")

    // False positives should not occur across different tools
    assert.strictEqual(isToolMatch("Runway Gen-3 Alpha", "ComfyUI"), false)
    assert.strictEqual(isToolMatch("Midjourney v6.1", "Flux.1 Pro"), false)
  })

  it("Requirement 3: Dynamic tool options generation includes catalog and creator tools", () => {
    const available = getAvailableToolsForCreators(mockCreators)

    assert.strictEqual(available[0], "all")
    assert.ok(available.includes("Midjourney"))
    assert.ok(available.includes("Runway Gen-3"))
    assert.ok(available.includes("Kling AI"))
    assert.ok(available.includes("ComfyUI"))
    assert.ok(available.includes("Flux.1 Pro"))
    assert.ok(available.includes("SDXL"))
    assert.ok(available.includes("Topaz"))
    assert.ok(available.includes("Blender"))
    assert.ok(available.includes("Photoshop"))
    assert.ok(available.includes("ControlNet Depth"))
    assert.ok(available.includes("Unreal Engine 5"))
  })

  it("Requirement 4: No-match empty state returns empty array cleanly", () => {
    const sunoMatches = mockCreators.filter((c) => creatorMatchesTool(c, "Suno AI"))
    assert.strictEqual(sunoMatches.length, 0)

    const unknownMatches = mockCreators.filter((c) => creatorMatchesTool(c, "NonExistentToolXYZ"))
    assert.strictEqual(unknownMatches.length, 0)
  })

  it("Requirement 5: Resetting filter to 'all' or empty string restores full roster", () => {
    const resetAll = mockCreators.filter((c) => creatorMatchesTool(c, "all"))
    assert.strictEqual(resetAll.length, 4)

    const resetUpperAll = mockCreators.filter((c) => creatorMatchesTool(c, "ALL"))
    assert.strictEqual(resetUpperAll.length, 4)

    const resetEmpty = mockCreators.filter((c) => creatorMatchesTool(c, ""))
    assert.strictEqual(resetEmpty.length, 4)
  })

  it("Requirement 6: Combining AI Tools with other discovery filters works accurately", () => {
    // ComfyUI + 3D Product Specialization => Aaliyah Chen (1 match)
    const comfy3D = mockCreators.filter(
      (c) =>
        creatorMatchesTool(c, "ComfyUI") &&
        c.primary_specialization.toLowerCase().includes("3d")
    )
    assert.strictEqual(comfy3D.length, 1)
    assert.strictEqual(comfy3D[0].handle, "aaliyah_chen")

    // Midjourney + Max Rate $120/hr (12000 cents) => Alex Rivera (10000 cents) matches, Elena (15000) excluded
    const budgetMj = mockCreators.filter(
      (c) =>
        creatorMatchesTool(c, "Midjourney") &&
        c.hourly_rate_cents <= 12000
    )
    assert.strictEqual(budgetMj.length, 1)
    assert.strictEqual(budgetMj[0].handle, "alex_ai_art")

    // Runway Gen-3 + Min Reputation 4.90 => Marcus Vance (4.92) matches, Alex (4.88) excluded
    const highRepRunway = mockCreators.filter(
      (c) =>
        creatorMatchesTool(c, "Runway Gen-3") &&
        c.reputation_score >= 4.9
    )
    assert.strictEqual(highRepRunway.length, 1)
    assert.strictEqual(highRepRunway[0].handle, "marcus_vance")
  })

  it("Requirement 7: Handles null, undefined, or missing tool metadata safely", () => {
    const nullCreator = { id: "null-c", ai_tools: null, aiTools: null, skills: null }
    const emptyCreator = { id: "empty-c", ai_tools: [], aiTools: [], skills: [] }
    const malformedCreator = { id: "mal-c", ai_tools: [null as any, "  ", 123 as any] }

    assert.strictEqual(creatorMatchesTool(nullCreator, "Midjourney"), false)
    assert.strictEqual(creatorMatchesTool(emptyCreator, "Midjourney"), false)
    assert.strictEqual(creatorMatchesTool(nullCreator, "all"), true)
    assert.strictEqual(creatorMatchesTool(emptyCreator, "all"), true)
    assert.strictEqual(creatorMatchesTool(malformedCreator, "Midjourney"), false)
  })

  it("Requirement 8: Repeated filter switching produces consistent results without state residue", () => {
    let filter = "Kling AI"
    let res = mockCreators.filter((c) => creatorMatchesTool(c, filter))
    assert.strictEqual(res.length, 1)
    assert.strictEqual(res[0].handle, "marcus_vance")

    filter = "Midjourney"
    res = mockCreators.filter((c) => creatorMatchesTool(c, filter))
    assert.strictEqual(res.length, 2)

    filter = "Flux.1 Pro"
    res = mockCreators.filter((c) => creatorMatchesTool(c, filter))
    assert.strictEqual(res.length, 1)
    assert.strictEqual(res[0].handle, "elena_rostova")

    filter = "all"
    res = mockCreators.filter((c) => creatorMatchesTool(c, filter))
    assert.strictEqual(res.length, 4)
  })

  it("Requirement 9: Preserves backward compatibility and regression protection for campaign briefs", () => {
    // Campaign briefs from Issue 02 must continue to match flawlessly
    const briefKling = mockBriefs.filter((b) => briefMatchesTool(b, "Kling AI"))
    assert.strictEqual(briefKling.length, 1)
    assert.strictEqual(briefKling[0].id, "b-02")

    const briefRunway = mockBriefs.filter((b) => briefMatchesTool(b, "Runway Gen-3"))
    assert.strictEqual(briefRunway.length, 4)

    const availableBriefTools = getAvailableToolsForBriefs(mockBriefs)
    assert.strictEqual(availableBriefTools[0], "ALL")
  })
})
