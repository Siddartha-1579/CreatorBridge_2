/**
 * Tool Matching & Normalization Engine for CreatorBridge
 *
 * Normalizes tool names, handles version numbers, synonyms, and variations
 * (e.g. "Kling" <-> "Kling AI", "Midjourney" <-> "Midjourney v6.1", "SDXL" <-> "Stable Diffusion")
 * and matches campaign briefs against selected tool filters.
 */

export interface BriefToolMetadata {
  required_tools?: string[] | null
  creator_capabilities?: {
    preferred_tools?: string[] | null
    required_capabilities?: string[] | null
  } | null
}

export interface CreatorToolMetadata {
  ai_tools?: string[] | null
  aiTools?: string[] | null
  skills?: string[] | null
}

/**
 * Strips punctuation, whitespace, and lowercases for uniform comparison.
 */
export function normalizeToolName(tool: string): string {
  if (!tool || typeof tool !== "string") return ""
  return tool.toLowerCase().replace(/[^a-z0-9]/g, "")
}

/**
 * Synonym clusters for tools that are known by multiple industry names or model tags.
 */
export const TOOL_SYNONYM_GROUPS: string[][] = [
  ["kling", "klingai", "kling15"],
  ["midjourney", "midjourneyv6", "midjourneyv61", "midjourneyv7", "mj"],
  ["runway", "runwaygen3", "runwaygen3alpha", "gen3", "gen3a", "gen3aturbo"],
  ["flux", "flux1", "flux1pro", "flux1dev", "flux1schnell"],
  ["sdxl", "stablediffusion", "stablediffusionxl", "sd"],
  ["comfyui", "comfy", "comfyuinodegraph"],
  ["topaz", "topazvideoai", "topazgigapixel"],
  ["blender", "blender3d", "blender3dunrealengine"],
  ["magnific", "magnificai"],
  ["elevenlabs", "elevenlabsaudio"],
  ["photoshop", "adobephotoshop", "photoshopgenerativefill"],
  ["luma", "lumadreammachine"],
  ["suno", "sunoai"],
  ["controlnet", "controlnetdepth", "controlnetcanny"],
  ["unreal", "unrealengine", "unrealengine5", "ue5"],
  ["premiere", "adobepremiere", "premierepro"],
]

/**
 * Determines whether a tool name from an entity matches a selected filter tool.
 * Handles exact matches, substring containment, version suffixes, and synonym groups.
 */
export function isToolMatch(toolFromEntity: string, filterTool: string): boolean {
  if (!toolFromEntity || !filterTool) return false
  const filterUpper = filterTool.trim().toUpperCase()
  if (filterUpper === "ALL" || filterUpper === "") return true

  const normEntity = normalizeToolName(toolFromEntity)
  const normFilter = normalizeToolName(filterTool)

  if (!normEntity || !normFilter) return false

  // 1. Exact normalized match
  if (normEntity === normFilter) return true

  // 2. Substring match (e.g. "klingai" contains "kling", "midjourneyv6" contains "midjourney")
  if (normEntity.includes(normFilter) || normFilter.includes(normEntity)) {
    return true
  }

  // 3. Synonym cluster match (e.g. "SDXL" matches "Stable Diffusion")
  for (const group of TOOL_SYNONYM_GROUPS) {
    const entityInGroup = group.some((syn) => normEntity.includes(syn) || syn.includes(normEntity))
    const filterInGroup = group.some((syn) => normFilter.includes(syn) || syn.includes(normFilter))
    if (entityInGroup && filterInGroup) {
      return true
    }
  }

  return false
}

/**
 * Checks whether a campaign brief contains the selected tool in either its
 * required_tools or preferred_tools arrays.
 */
export function briefMatchesTool(brief: BriefToolMetadata, selectedTool: string): boolean {
  if (!selectedTool || selectedTool === "ALL") return true

  const tools: string[] = [
    ...(brief.required_tools || []),
    ...(brief.creator_capabilities?.preferred_tools || []),
  ]

  return tools.some((t) => isToolMatch(t, selectedTool))
}

/**
 * Standard supported generative AI tools catalog for CreatorBridge.
 */
export const SUPPORTED_AI_TOOLS = [
  "Midjourney",
  "Runway Gen-3",
  "Kling AI",
  "ComfyUI",
  "ElevenLabs",
  "Flux.1 Pro",
  "SDXL",
  "Blender",
  "Topaz",
  "Magnific AI",
  "Photoshop",
  "Luma Dream Machine",
  "Suno AI",
] as const

/**
 * Extracts and deduplicates available tools across loaded briefs and the supported tool catalog.
 */
export function getAvailableToolsForBriefs(
  briefs: BriefToolMetadata[],
  catalogTools: readonly string[] = SUPPORTED_AI_TOOLS
): string[] {
  const toolSet = new Set<string>()

  // 1. Add catalog tools
  catalogTools.forEach((tool) => toolSet.add(tool))

  // 2. Add any unique tools present in the campaign briefs
  briefs.forEach((b) => {
    const allTools = [
      ...(b.required_tools || []),
      ...(b.creator_capabilities?.preferred_tools || []),
    ]
    allTools.forEach((tool) => {
      if (!tool || typeof tool !== "string") return
      const trimmed = tool.trim()
      if (!trimmed) return

      // If already covered by an existing tool in toolSet, skip
      const alreadyCovered = Array.from(toolSet).some((existing) => isToolMatch(trimmed, existing))
      if (!alreadyCovered) {
        toolSet.add(trimmed)
      }
    })
  })

  return ["ALL", ...Array.from(toolSet)]
}

/**
 * Checks whether a creator profile contains the selected tool in either its
 * ai_tools or aiTools arrays (and optionally skills).
 */
export function creatorMatchesTool(creator: CreatorToolMetadata, selectedTool: string): boolean {
  if (!selectedTool) return true
  const upper = selectedTool.trim().toUpperCase()
  if (upper === "ALL" || upper === "") return true

  const tools: string[] = [
    ...(creator.ai_tools || []),
    ...(creator.aiTools || []),
  ]

  // Primary check: toolchains
  if (tools.some((t) => isToolMatch(t, selectedTool))) {
    return true
  }

  // Secondary fallback: skills (e.g. "ComfyUI Node Graphs")
  if (creator.skills && Array.isArray(creator.skills)) {
    if (creator.skills.some((s) => isToolMatch(s, selectedTool))) {
      return true
    }
  }

  return false
}

/**
 * Extracts and deduplicates available tools across creators and the supported tool catalog.
 */
export function getAvailableToolsForCreators(
  creators: CreatorToolMetadata[],
  catalogTools: readonly string[] = SUPPORTED_AI_TOOLS
): string[] {
  const toolSet = new Set<string>()

  // 1. Add catalog tools
  catalogTools.forEach((tool) => toolSet.add(tool))

  // 2. Add any unique tools present in the creator profiles
  creators.forEach((c) => {
    const allTools = [
      ...(c.ai_tools || []),
      ...(c.aiTools || []),
    ]
    allTools.forEach((tool) => {
      if (!tool || typeof tool !== "string") return
      const trimmed = tool.trim()
      if (!trimmed) return

      // If already covered by an existing tool in toolSet, skip
      const alreadyCovered = Array.from(toolSet).some((existing) => isToolMatch(trimmed, existing))
      if (!alreadyCovered) {
        toolSet.add(trimmed)
      }
    })
  })

  return ["all", ...Array.from(toolSet)]
}
