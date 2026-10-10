import React, { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { briefsService } from "@/services/briefs.service"
import { intelligenceService } from "@/services/intelligence.service"
import type {
  CampaignBriefCreate,
  DeliverableItem,
  BriefAIMetadata,
  BriefValidationResult,
  CreativeDirectionOption,
  BriefClarificationResponse,
} from "@/types"
import {
  BrandBriefInspirationCarousel,
  type BriefTemplate,
} from "@/components/brand/BrandBriefInspirationCarousel"
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Plus,
  Trash2,
  Eye,
  Send,
  Loader2,
  Check,
  Info,
  Copy,
  RefreshCw,
  Edit3,
  X,
  Sparkle,
} from "lucide-react"

// Campaign Objectives options
const CAMPAIGN_OBJECTIVES = [
  "Brand awareness",
  "Product launch",
  "Engagement",
  "Website traffic",
  "Lead generation",
  "Sales or conversions",
  "App installs",
  "Community growth",
]

// Deliverable Content Types
const DELIVERABLE_TYPES = [
  "Short-form videos",
  "Long-form videos",
  "Instagram Reels",
  "TikTok videos",
  "YouTube Shorts",
  "YouTube integrations",
  "Static posts",
  "Carousels",
  "Stories",
  "Product photography",
  "UGC advertisements",
  "Other custom deliverables",
]

// Aspect Ratio Options
const ASPECT_RATIOS = ["9:16", "16:9", "1:1", "4:5", "Custom"]

// Resolution Options
const RESOLUTION_OPTIONS = ["4K (2160p)", "1080p FHD", "8K Ultra-Res", "Original Source"]

// Tone and Style options
const TONE_OPTIONS = [
  "Confident & Elevated",
  "Vibrant & Energetic",
  "Sophisticated & Editorial",
  "Casual & Relatable UGC",
  "Humorous & Playful",
  "Avant-Garde & Visionary",
  "Warm & Emotive",
]

const STYLE_OPTIONS = [
  "Photorealistic 35mm",
  "Cinematic Anamorphic",
  "Surreal 3D Metamorphosis",
  "Minimalist Luxury",
  "Fast-Cut Mobile Native",
  "Anime & Stylized CG",
  "Analog Film Grain & Retro",
]

// Compensation Models
const COMPENSATION_MODELS = [
  { id: "PAID", label: "Paid Collaboration", desc: "Guaranteed cash milestone payout" },
  { id: "GIFTING", label: "Product Gifting", desc: "Complimentary premium merchandise" },
  { id: "HYBRID", label: "Hybrid (Cash + Gifting)", desc: "Product package plus creative fee" },
]

// The 16 canonical sections of the AI Brief
const BRIEF_SECTION_METADATA: { id: string; title: string; hint: string }[] = [
  { id: "campaign_overview", title: "1. Campaign Overview", hint: "Executive vision and strategic scope" },
  { id: "campaign_objectives", title: "2. Campaign Objectives", hint: "Core marketing targets and goals" },
  { id: "target_audience", title: "3. Target Audience", hint: "Demographic and psychographic profile" },
  { id: "campaign_concept", title: "4. Campaign Concept", hint: "Creative narrative hook and metaphor" },
  { id: "key_messages", title: "5. Key Messages", hint: "Primary value propositions and takeaways" },
  { id: "creative_direction", title: "6. Creative Direction", hint: "Visual style, palette, and camera motion" },
  { id: "deliverables_and_specs", title: "7. Deliverables & Specifications", hint: "Itemized asset counts and aspect ratios" },
  { id: "creator_eligibility", title: "8. Creator Eligibility & Preferences", hint: "Required tools and verified creator levels" },
  { id: "mandatory_requirements", title: "9. Mandatory Requirements", hint: "Non-negotiable brand guidelines and elements" },
  { id: "content_restrictions", title: "10. Content Restrictions", hint: "What creators must avoid and exclusions" },
  { id: "timeline_and_milestones", title: "11. Timeline & Milestones", hint: "Review dates and delivery schedule" },
  { id: "budget_and_compensation", title: "12. Budget & Proposed Compensation", hint: "Fee breakdown and proposed terms" },
  { id: "usage_rights_and_licensing", title: "13. Usage Rights & Licensing", hint: "Commercial duration and territory" },
  { id: "submission_requirements", title: "14. Submission Requirements", hint: "Deliverable formats and file exports" },
  { id: "success_metrics", title: "15. Success Metrics", hint: "KPIs and quality benchmarks" },
  { id: "call_to_action", title: "16. Call to Action", hint: "Audience viewer action and destination" },
]

export const BrandBriefBuilderPage: React.FC = () => {
  const { briefId } = useParams<{ briefId?: string }>()
  const navigate = useNavigate()
  const { user: _user } = useAuth()

  // Wizard state: 1 to 5
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [draftStatus, setDraftStatus] = useState<"SAVED" | "SAVING" | "ERROR">("SAVED")
  const [savedBriefId, setSavedBriefId] = useState<string | null>(briefId || null)
  const [showInspirationCarousel, setShowInspirationCarousel] = useState<boolean>(false)
  const [showCreatorPreview, setShowCreatorPreview] = useState<boolean>(false)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  // Loading indicators
  const [isRefiningIdea, setIsRefiningIdea] = useState<boolean>(false)
  const [isSuggestingDirections, setIsSuggestingDirections] = useState<boolean>(false)
  const [isGeneratingFullBrief, setIsGeneratingFullBrief] = useState<boolean>(false)
  const [regeneratingSectionId, setRegeneratingSectionId] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState<boolean>(false)

  // AI Brief Clarification and Inspection States
  const [isClarifyingBrief, setIsClarifyingBrief] = useState<boolean>(false)
  const [clarificationResult, setClarificationResult] = useState<BriefClarificationResponse | null>(null)
  const [isClarificationDrawerOpen, setIsClarificationDrawerOpen] = useState<boolean>(false)

  // Status and error messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Step 1: Campaign Idea
  const [title, setTitle] = useState<string>("")
  const [brandOrProductName, setBrandOrProductName] = useState<string>("")
  const [productDescription, setProductDescription] = useState<string>("")
  const [campaignIdea, setCampaignIdea] = useState<string>("")
  const [primaryObjective, setPrimaryObjective] = useState<string>("Brand awareness")
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>(["Brand awareness"])
  const [targetAudience, setTargetAudience] = useState<string>("")
  const [targetMarket, setTargetMarket] = useState<string>("Global")
  const [preferredLanguage, setPreferredLanguage] = useState<string>("English")
  const [campaignCategory, setCampaignCategory] = useState<string>("AI Filmmaking & Social")

  // Idea refinement suggestions
  const [ideaHooks, setIdeaHooks] = useState<string[]>([])
  const [ideaAngles, setIdeaAngles] = useState<string[]>([])

  // Step 2: Deliverables
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([
    {
      id: "deliv_1",
      content_type: "Instagram Reels",
      quantity: 2,
      placement_or_platform: "Instagram Reels & TikTok",
      aspect_ratio: "9:16",
      resolution: "4K (2160p)",
      duration_seconds: 15,
      raw_footage_required: false,
      captions_required: true,
      creator_on_camera: false,
      production_notes: "High-energy pattern interrupt hook in first 2 seconds with synchronized audio.",
    },
    {
      id: "deliv_2",
      content_type: "Static posts",
      quantity: 3,
      placement_or_platform: "Instagram & Digital Display",
      aspect_ratio: "1:1",
      resolution: "4K (2160p)",
      duration_seconds: undefined,
      raw_footage_required: false,
      captions_required: false,
      creator_on_camera: false,
      production_notes: "Photorealistic lifestyle product renders with clean studio contact shadows.",
    },
  ])

  // Step 3: Creative Direction
  const [toneAndPersonality, setToneAndPersonality] = useState<string>("Confident & Elevated")
  const [creativeStyle, setCreativeStyle] = useState<string>("Photorealistic 35mm")
  const [coreMessage, setCoreMessage] = useState<string>("")
  const [keyProductBenefits, setKeyProductBenefits] = useState<string>("")
  const [mandatoryTalkingPoints, setMandatoryTalkingPoints] = useState<string>("")
  const [callToAction, setCallToAction] = useState<string>("Discover more at link in bio")
  const [requiredHashtags, setRequiredHashtags] = useState<string>("#AICreators #NextGenProduct")
  const [brandGuidelines, setBrandGuidelines] = useState<string>("")
  const [referenceLinks, setReferenceLinks] = useState<string>("")
  const [thingsToAvoid, setThingsToAvoid] = useState<string>("Plastic skin shaders, warped logos, jittery motion artifacts")
  const [competitorRestrictions, setCompetitorRestrictions] = useState<string>("Do not mention or display direct category competitors")
  const [suggestedDirections, setSuggestedDirections] = useState<CreativeDirectionOption[]>([])

  // Step 4: Creator & Commercial Requirements
  const [preferredNiches, setPreferredNiches] = useState<string[]>(["AI Filmmakers", "Motion Designers", "3D Artists"])
  const [preferredPlatforms, setPreferredPlatforms] = useState<string[]>(["Instagram", "TikTok", "YouTube"])
  const [audienceLocation, setAudienceLocation] = useState<string>("Global")
  const [audienceAgeRange, setAudienceAgeRange] = useState<string>("18-34")
  const [creatorLanguage, setCreatorLanguage] = useState<string>("English")
  const [audienceSizeRange, setAudienceSizeRange] = useState<string>("10k - 100k+ followers")
  const [creatorLevel, setCreatorLevel] = useState<string>("LEVEL_2_VERIFIED")
  const [totalBudgetUSD, setTotalBudgetUSD] = useState<number>(2500)
  const [budgetPerDeliverableUSD, setBudgetPerDeliverableUSD] = useState<number>(500)
  const [compensationModel, setCompensationModel] = useState<string>("PAID")
  const [startDate, setStartDate] = useState<string>("")
  const [applicationDeadline, setApplicationDeadline] = useState<string>("")
  const [contentDeliveryDeadline, setContentDeliveryDeadline] = useState<string>("")
  const [publishingWindow, setPublishingWindow] = useState<string>("Within 7 days of final approval")
  const [revisionsCount, setRevisionsCount] = useState<number>(2)
  const [paidWhitelisting, setPaidWhitelisting] = useState<boolean>(true)
  const [organicDuration, setOrganicDuration] = useState<string>("Perpetual")
  const [territory, setTerritory] = useState<string>("Global")
  const [exclusivityRequired, setExclusivityRequired] = useState<boolean>(false)
  const [exclusivityDuration, setExclusivityDuration] = useState<string>("30 days post-campaign")

  // Step 5: 16-Section Brief State
  const [briefSections, setBriefSections] = useState<Record<string, string>>({})
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [sectionEditText, setSectionEditText] = useState<string>("")
  const [executiveSummary, setExecutiveSummary] = useState<string>("")
  const [aiMetadata, setAiMetadata] = useState<BriefAIMetadata>({
    ai_generated: false,
    open_questions: [],
    constraints: [],
    success_criteria: "",
  })

  // Debounced Autosave ref
  const autosaveTimerRef = useRef<any>(null)
  const isInitialMount = useRef<boolean>(true)

  // Load existing draft if editing
  useEffect(() => {
    async function loadDraft() {
      if (!briefId) return
      try {
        const b = await briefsService.getBrief(briefId)
        setSavedBriefId(b.id)
        setTitle(b.title || "")
        setBrandOrProductName(b.brand_or_product_name || b.product_or_service || "")
        setProductDescription(b.product_description || "")
        setCampaignIdea(b.campaign_idea || "")
        setExecutiveSummary(b.executive_summary || "")
        setPrimaryObjective(b.primary_objective || (b.objectives?.[0] || "Brand awareness"))
        setSelectedObjectives(b.objectives || ["Brand awareness"])
        setTargetAudience(b.target_audience || "")
        setTargetMarket(b.target_market || "Global")
        setPreferredLanguage(b.preferred_language || "English")
        setCampaignCategory(b.campaign_category || "AI Filmmaking & Social")
        if (b.deliverables && b.deliverables.length > 0) {
          setDeliverables(b.deliverables)
        }
        if (b.creative_direction) {
          setToneAndPersonality(b.creative_direction.tone_and_personality || "Confident & Elevated")
          setCreativeStyle(b.creative_direction.styles?.[0] || "Photorealistic 35mm")
          setKeyProductBenefits(b.creative_direction.key_product_benefits || "")
          setMandatoryTalkingPoints(b.creative_direction.mandatory_talking_points || "")
          setCallToAction(b.creative_direction.call_to_action || "Discover more at link in bio")
          setRequiredHashtags(b.creative_direction.required_hashtags_or_mentions || "#AICreators")
          setBrandGuidelines(b.creative_direction.brand_guidelines || "")
          setThingsToAvoid(b.creative_direction.things_to_avoid?.join(", ") || "")
          setCompetitorRestrictions(b.creative_direction.competitor_restrictions || "")
        }
        if (b.commercial_terms) {
          if (b.commercial_terms.budget_cents) {
            setTotalBudgetUSD(Math.round(b.commercial_terms.budget_cents / 100))
          }
          if (b.commercial_terms.budget_per_deliverable_cents) {
            setBudgetPerDeliverableUSD(Math.round(b.commercial_terms.budget_per_deliverable_cents / 100))
          }
          setCompensationModel(b.commercial_terms.compensation_model || "PAID")
          setPaidWhitelisting(b.commercial_terms.paid_advertising_whitelisting ?? true)
          setOrganicDuration(b.commercial_terms.organic_usage_duration || "Perpetual")
          setTerritory(b.commercial_terms.territory || "Global")
          setExclusivityRequired(b.commercial_terms.exclusivity_required ?? false)
          setRevisionsCount(b.commercial_terms.revisions_count ?? 2)
          setPublishingWindow(b.commercial_terms.publishing_window || "Within 7 days of final approval")
        }
        if (b.sections && Object.keys(b.sections).length > 0) {
          setBriefSections(b.sections)
        }
        if (b.ai_metadata) {
          setAiMetadata(b.ai_metadata)
        }
      } catch (err) {
        console.error("Failed to load draft brief:", err)
      }
    }
    loadDraft()
  }, [briefId])

  // Build brief payload
  const buildPayload = useCallback((statusOverride?: "DRAFT" | "READY_TO_PUBLISH" | "PUBLISHED"): CampaignBriefCreate => {
    return {
      title: title.trim() || (brandOrProductName ? `${brandOrProductName} Campaign Brief` : "Untitled Creative Brief"),
      brand_or_product_name: brandOrProductName,
      product_or_service: brandOrProductName,
      product_description: productDescription,
      campaign_idea: campaignIdea,
      executive_summary: executiveSummary || briefSections.campaign_overview || campaignIdea,
      description: executiveSummary || campaignIdea || "Campaign Brief",
      primary_objective: primaryObjective,
      objectives: selectedObjectives,
      target_audience: targetAudience,
      target_market: targetMarket,
      preferred_language: preferredLanguage,
      campaign_category: campaignCategory,
      primary_message: coreMessage,
      desired_cta: callToAction,
      platforms: preferredPlatforms,
      deliverables,
      creative_direction: {
        tone_and_personality: toneAndPersonality,
        styles: [creativeStyle],
        custom_style_notes: brandGuidelines,
        key_product_benefits: keyProductBenefits,
        mandatory_talking_points: mandatoryTalkingPoints,
        call_to_action: callToAction,
        required_hashtags_or_mentions: requiredHashtags,
        brand_guidelines: brandGuidelines,
        things_to_avoid: thingsToAvoid ? thingsToAvoid.split(",").map((s) => s.trim()) : [],
        competitor_restrictions: competitorRestrictions,
      },
      creator_capabilities: {
        preferred_niches: preferredNiches,
        preferred_platforms: preferredPlatforms,
        audience_location: audienceLocation,
        audience_age_range: audienceAgeRange,
        preferred_language: creatorLanguage,
        audience_size_range: audienceSizeRange,
        experience_level: creatorLevel,
        required_capabilities: ["Photorealistic Prompt Engineering", "Consistent Character/Object Conditioning"],
        preferred_capabilities: ["High-Res Upscaling", "Neural Audio Mastering"],
        flexible_capabilities: [],
        preferred_tools: ["Runway Gen-3", "Midjourney v6.1", "ElevenLabs", "ComfyUI"],
      },
      commercial_terms: {
        budget_tier: "GROWTH",
        budget_cents: totalBudgetUSD * 100,
        budget_per_deliverable_cents: budgetPerDeliverableUSD * 100,
        currency: "USD",
        compensation_model: compensationModel,
        payment_model: "MILESTONE",
        intended_usage: ["PAID_ADS", "ORGANIC_SOCIAL"],
        paid_advertising_whitelisting: paidWhitelisting,
        organic_usage_duration: organicDuration,
        territory,
        exclusivity_required: exclusivityRequired,
        exclusivity_duration: exclusivityDuration,
        commercial_rights_required: true,
        source_files_required: false,
        revisions_count: revisionsCount,
        publishing_window: publishingWindow,
        attribution_required: false,
        ongoing_work_considered: true,
      },
      sections: briefSections,
      budget_cents: totalBudgetUSD * 100,
      start_date: startDate ? new Date(startDate).toISOString() : undefined,
      deadline: contentDeliveryDeadline ? new Date(contentDeliveryDeadline).toISOString() : undefined,
      required_tools: ["Runway Gen-3", "Midjourney v6.1"],
      ai_metadata: aiMetadata,
      is_public: statusOverride === "PUBLISHED",
      status: statusOverride || "DRAFT",
    }
  }, [
    title,
    brandOrProductName,
    productDescription,
    campaignIdea,
    executiveSummary,
    primaryObjective,
    selectedObjectives,
    targetAudience,
    targetMarket,
    preferredLanguage,
    campaignCategory,
    coreMessage,
    callToAction,
    preferredPlatforms,
    deliverables,
    toneAndPersonality,
    creativeStyle,
    brandGuidelines,
    keyProductBenefits,
    mandatoryTalkingPoints,
    requiredHashtags,
    thingsToAvoid,
    competitorRestrictions,
    preferredNiches,
    audienceLocation,
    audienceAgeRange,
    creatorLanguage,
    audienceSizeRange,
    creatorLevel,
    totalBudgetUSD,
    budgetPerDeliverableUSD,
    compensationModel,
    paidWhitelisting,
    organicDuration,
    territory,
    exclusivityRequired,
    exclusivityDuration,
    revisionsCount,
    publishingWindow,
    briefSections,
    startDate,
    contentDeliveryDeadline,
    aiMetadata,
  ])

  // Explicit Save Draft action
  const handleSaveDraft = useCallback(async () => {
    setDraftStatus("SAVING")
    setErrorMessage(null)
    try {
      const payload = buildPayload("DRAFT")
      if (savedBriefId) {
        const updated = await briefsService.updateBrief(savedBriefId, payload)
        setSavedBriefId(updated.id)
      } else {
        const created = await briefsService.createBrief(payload)
        setSavedBriefId(created.id)
      }
      setDraftStatus("SAVED")
      setStatusMessage("Draft saved successfully.")
      setTimeout(() => setStatusMessage(null), 3000)
    } catch (err: any) {
      console.error("Draft save failed:", err)
      setDraftStatus("ERROR")
      setErrorMessage(err.message || "Unable to save draft.")
    }
  }, [buildPayload, savedBriefId])

  // Debounced Autosave (triggers 2.5s after field edits, skipping initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    // Only autosave if user has entered at least a title, brand name, or idea
    if (!title && !brandOrProductName && !campaignIdea) return

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)

    autosaveTimerRef.current = setTimeout(async () => {
      setDraftStatus("SAVING")
      try {
        const payload = buildPayload("DRAFT")
        if (savedBriefId) {
          const updated = await briefsService.updateBrief(savedBriefId, payload)
          setSavedBriefId(updated.id)
        } else {
          const created = await briefsService.createBrief(payload)
          setSavedBriefId(created.id)
        }
        setDraftStatus("SAVED")
      } catch (err) {
        console.warn("Autosave encounter:", err)
        setDraftStatus("ERROR")
      }
    }, 2500)

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
  }, [buildPayload, savedBriefId, title, brandOrProductName, campaignIdea, deliverables, briefSections])

  // AI Refine Idea Action (Step 1)
  const handleRefineIdea = async () => {
    if (!campaignIdea.trim()) {
      alert("Please provide an initial campaign idea or concept note first.")
      return
    }
    setIsRefiningIdea(true)
    setErrorMessage(null)
    try {
      const res = await briefsService.refineIdea({
        campaign_name: title,
        brand_or_product_name: brandOrProductName,
        product_description: productDescription,
        campaign_idea: campaignIdea,
        primary_objective: primaryObjective,
        campaign_category: campaignCategory,
      })
      setCampaignIdea(res.refined_idea)
      setIdeaHooks(res.suggested_hooks || [])
      setIdeaAngles(res.key_angles || [])
      setStatusMessage("✨ Idea refined with high-impact creative hooks!")
      setTimeout(() => setStatusMessage(null), 4000)
    } catch (err: any) {
      console.error("Failed to refine idea:", err)
      setErrorMessage(err.message || "AI idea refinement was unable to complete.")
    } finally {
      setIsRefiningIdea(false)
    }
  }

  // AI Suggest Directions Action (Step 3)
  const handleSuggestDirections = async () => {
    setIsSuggestingDirections(true)
    setErrorMessage(null)
    try {
      const res = await briefsService.suggestCreativeDirections({
        campaign_idea: campaignIdea || "Launch campaign",
        product_or_service: brandOrProductName || "Featured Product",
        primary_objective: primaryObjective,
        campaign_category: campaignCategory,
      })
      setSuggestedDirections(res.options || [])
    } catch (err: any) {
      console.error("Failed to suggest directions:", err)
      setErrorMessage(err.message || "Unable to suggest creative directions.")
    } finally {
      setIsSuggestingDirections(false)
    }
  }

  // Apply chosen creative direction option
  const applyDirectionOption = (opt: CreativeDirectionOption) => {
    setCreativeStyle(opt.style)
    setToneAndPersonality(opt.tone)
    setBrandGuidelines((prev) => (prev ? `${prev}\n\nVisual Theme: ${opt.visual_theme}` : `Visual Theme: ${opt.visual_theme}`))
    setStatusMessage(`Applied direction: ${opt.name}`)
    setTimeout(() => setStatusMessage(null), 3000)
  }

  // Generate Full 16-Section Brief (Step 5)
  const handleGenerateFullBrief = async () => {
    if (!campaignIdea.trim() && !brandOrProductName.trim()) {
      alert("Please define your campaign idea or product in Step 1 first.")
      setCurrentStep(1)
      return
    }
    setIsGeneratingFullBrief(true)
    setErrorMessage(null)
    try {
      const res = await briefsService.generateWithAI({
        campaign_name: title,
        campaign_idea: campaignIdea,
        template_category: campaignCategory,
        primary_objective: primaryObjective,
        objectives: selectedObjectives,
        brand_or_product_name: brandOrProductName,
        product_description: productDescription,
        target_audience: targetAudience,
        target_market: targetMarket,
        preferred_language: preferredLanguage,
        campaign_category: campaignCategory,
        primary_message: coreMessage,
        desired_cta: callToAction,
        platforms: preferredPlatforms,
        deliverables,
        styles: [creativeStyle],
      })

      if (!title || title === "Untitled Creative Brief") {
        setTitle(res.refined_title)
      }
      setExecutiveSummary(res.executive_summary)
      if (res.sections && Object.keys(res.sections).length > 0) {
        setBriefSections(res.sections)
      }
      setAiMetadata({
        ai_generated: true,
        open_questions: res.open_questions || [],
        constraints: res.constraints || [],
        success_criteria: res.success_criteria || "",
        provider_used: res.provider_used,
        generated_at: new Date().toISOString(),
      })
      setStatusMessage("✨ 16-section creative brief synthesized successfully!")
      setTimeout(() => setStatusMessage(null), 4000)
    } catch (err: any) {
      console.error("Full brief generation failed:", err)
      setErrorMessage(err.message || "Failed to generate brief with AI. You can continue writing manually.")
    } finally {
      setIsGeneratingFullBrief(false)
    }
  }

  // AI Brief Clarification & Contradiction Inspection (Safe mode: strictly no auto-publishing)
  const handleClarifyBriefWithAI = async () => {
    setIsClarifyingBrief(true)
    setErrorMessage(null)
    try {
      const draftPayload = {
        title,
        brand_or_product_name: brandOrProductName,
        product_description: productDescription,
        campaign_idea: campaignIdea,
        primary_objective: primaryObjective,
        objectives: selectedObjectives,
        target_audience: targetAudience,
        deliverables,
        total_budget_usd: totalBudgetUSD,
        budget_per_deliverable_usd: budgetPerDeliverableUSD,
        start_date: startDate,
        application_deadline: applicationDeadline,
        content_delivery_deadline: contentDeliveryDeadline,
        creative_direction: {
          tone_and_personality: toneAndPersonality,
          creative_style: creativeStyle,
          core_message: coreMessage,
          key_product_benefits: keyProductBenefits,
          mandatory_talking_points: mandatoryTalkingPoints,
          call_to_action: callToAction,
          brand_guidelines: brandGuidelines,
          things_to_avoid: thingsToAvoid,
        },
        creator_requirements: {
          preferred_niches: preferredNiches,
          preferred_platforms: preferredPlatforms,
          creator_level: creatorLevel,
        },
      }

      const res = await intelligenceService.clarifyBrief({ brief_draft: draftPayload })
      setClarificationResult(res)
      setIsClarificationDrawerOpen(true)
      setStatusMessage("✨ AI Brief Inspection complete! Review suggested refinements and contradictions.")
      setTimeout(() => setStatusMessage(null), 4000)
    } catch (err: any) {
      console.error("Failed to clarify brief:", err)
      setErrorMessage(err.message || "Failed to run AI brief inspection.")
    } finally {
      setIsClarifyingBrief(false)
    }
  }

  const handleApplyRefinements = () => {
    if (!clarificationResult?.suggested_refinements) return
    const ref = clarificationResult.suggested_refinements
    if (ref.title && (!title || title === "Untitled Creative Brief")) setTitle(ref.title)
    if (ref.core_message && !coreMessage) setCoreMessage(ref.core_message)
    if (ref.key_product_benefits && !keyProductBenefits) setKeyProductBenefits(ref.key_product_benefits)
    if (ref.call_to_action && !callToAction) setCallToAction(ref.call_to_action)
    if (ref.brand_guidelines && !brandGuidelines) setBrandGuidelines(ref.brand_guidelines)
    if (ref.things_to_avoid && !thingsToAvoid) setThingsToAvoid(ref.things_to_avoid)
    setStatusMessage("✨ Applied AI suggested refinements to your brief!")
    setIsClarificationDrawerOpen(false)
    setTimeout(() => setStatusMessage(null), 3000)
  }

  // Regenerate Single Section
  const handleRegenerateSection = async (sectionId: string) => {
    setRegeneratingSectionId(sectionId)
    setErrorMessage(null)
    try {
      const res = await briefsService.regenerateSection({
        section_id: sectionId,
        brief_data: {
          title,
          product_or_service: brandOrProductName,
          campaign_idea: campaignIdea,
          objectives: selectedObjectives,
          target_audience: targetAudience,
        },
        current_content: briefSections[sectionId],
      })
      setBriefSections((prev) => ({
        ...prev,
        [sectionId]: res.regenerated_content,
      }))
      setStatusMessage(`Regenerated Section: ${sectionId}`)
      setTimeout(() => setStatusMessage(null), 2500)
    } catch (err: any) {
      console.error("Failed to regenerate section:", err)
      setErrorMessage(err.message || "Section regeneration failed.")
    } finally {
      setRegeneratingSectionId(null)
    }
  }

  // Save Inline Edit for Section
  const handleSaveSectionEdit = (sectionId: string) => {
    setBriefSections((prev) => ({
      ...prev,
      [sectionId]: sectionEditText,
    }))
    setEditingSectionId(null)
  }

  // Copy Section Text to Clipboard
  const handleCopySection = (sectionId: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(sectionId)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  // Deliverables Editor Handlers
  const handleAddDeliverable = () => {
    const newId = `deliv_${Date.now()}`
    setDeliverables([
      ...deliverables,
      {
        id: newId,
        content_type: "Short-form videos",
        quantity: 1,
        placement_or_platform: "Instagram Reels & TikTok",
        aspect_ratio: "9:16",
        resolution: "4K (2160p)",
        duration_seconds: 15,
        raw_footage_required: false,
        captions_required: true,
        creator_on_camera: false,
        production_notes: "",
      },
    ])
  }

  const handleUpdateDeliverable = (id: string, updates: Partial<DeliverableItem>) => {
    setDeliverables(deliverables.map((d) => (d.id === id ? { ...d, ...updates } : d)))
  }

  const handleRemoveDeliverable = (id: string) => {
    if (deliverables.length <= 1) {
      alert("A campaign brief requires at least one deliverable.")
      return
    }
    setDeliverables(deliverables.filter((d) => d.id !== id))
  }

  // Template selection from Apple Cards Carousel
  const handleSelectTemplate = (template: BriefTemplate) => {
    setTitle(template.defaultTitle)
    setCampaignIdea(template.defaultDescription)
    setCampaignCategory(template.category)
    setCreativeStyle(template.visualStyle)
    if (template.defaultBudgetUSD) setTotalBudgetUSD(template.defaultBudgetUSD)
    setShowInspirationCarousel(false)
    setStatusMessage(`Loaded inspiration template: ${template.title}`)
    setTimeout(() => setStatusMessage(null), 3500)
  }

  // Validation Result
  const validationResult: BriefValidationResult = (() => {
    const blocking: string[] = []
    const warnings: string[] = []

    if (!title.trim() || title.trim() === "Untitled Creative Brief") {
      blocking.push("A clear campaign name or title is required.")
    }
    if (!campaignIdea.trim() && !productDescription.trim() && !executiveSummary.trim()) {
      blocking.push("A campaign idea or product description is required.")
    }
    if (deliverables.length === 0) {
      blocking.push("At least one deliverable must be specified.")
    }
    deliverables.forEach((d, idx) => {
      if (d.quantity < 1) {
        blocking.push(`Deliverable #${idx + 1} has an invalid quantity (${d.quantity}).`)
      }
    })
    if (totalBudgetUSD <= 0) {
      blocking.push("Total campaign budget must be greater than zero.")
    }
    if (contentDeliveryDeadline && startDate && new Date(contentDeliveryDeadline) < new Date(startDate)) {
      blocking.push("Delivery deadline cannot precede the campaign start date.")
    }

    if (!targetAudience.trim()) {
      warnings.push("Defining a target audience improves creator visual targeting.")
    }
    if (Object.keys(briefSections).length === 0) {
      warnings.push("Generating the full 16-section brief with AI ensures clarity for creators.")
    }

    const can_publish = blocking.length === 0
    return {
      is_valid: can_publish,
      can_publish,
      blocking_errors: blocking,
      warnings,
    }
  })()

  // Publish Action
  const handlePublish = async () => {
    if (!validationResult.can_publish) {
      alert(`Cannot publish brief due to missing requirements:\n\n• ${validationResult.blocking_errors.join("\n• ")}`)
      return
    }

    setIsPublishing(true)
    setErrorMessage(null)
    try {
      let activeId = savedBriefId
      const payload = buildPayload("PUBLISHED")

      if (!activeId) {
        const created = await briefsService.createBrief(payload)
        activeId = created.id
        setSavedBriefId(activeId)
      } else {
        await briefsService.updateBrief(activeId, payload)
      }

      await briefsService.publishBrief(activeId)
      navigate("/brand/briefs", { state: { publishedSuccess: true } })
    } catch (err: any) {
      console.error("Publishing failed:", err)
      setErrorMessage(err.message || "Failed to publish brief to marketplace.")
    } finally {
      setIsPublishing(false)
    }
  }

  // Navigation helpers
  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 text-slate-900">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-purple-100/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center space-x-3">
            <Link
              to="/brand/briefs"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              title="Return to Campaigns"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Create a Campaign</h1>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                  Step {currentStep} of 5
                </span>
              </div>
              <p className="hidden text-xs text-slate-500 sm:block">
                Turn your next big idea into a creator-ready brief.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Draft Saving State Indicator */}
            <div className="flex items-center space-x-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs">
              {draftStatus === "SAVING" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
                  <span className="font-medium text-slate-600">Saving...</span>
                </>
              ) : draftStatus === "SAVED" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-medium text-slate-600">Saved</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  <span className="font-medium text-slate-600">Unable to Save</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleClarifyBriefWithAI}
              disabled={isClarifyingBrief}
              className="hidden items-center space-x-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 disabled:opacity-50 sm:inline-flex"
              title="Inspect brief for missing details and timeline contradictions"
            >
              <Sparkles className={`h-3.5 w-3.5 ${isClarifyingBrief ? "animate-spin text-purple-600" : "text-purple-600"}`} />
              <span>{isClarifyingBrief ? "Inspecting..." : "AI Clarify Brief"}</span>
            </button>

            <button
              onClick={handleSaveDraft}
              className="hidden items-center space-x-1.5 rounded-lg border border-purple-200 bg-purple-50/60 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 sm:inline-flex"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Draft</span>
            </button>

            {currentStep === 5 ? (
              <button
                onClick={handlePublish}
                disabled={isPublishing || !validationResult.can_publish}
                className="inline-flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Publish Campaign</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="inline-flex items-center space-x-1.5 rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* Multi-Step Tabs Bar */}
        <div className="mx-auto flex max-w-6xl items-center justify-between overflow-x-auto px-4 py-2 sm:px-6">
          {[
            { step: 1, label: "Campaign Idea" },
            { step: 2, label: "Deliverables" },
            { step: 3, label: "Creative Direction" },
            { step: 4, label: "Creator & Terms" },
            { step: 5, label: "AI Brief Review" },
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => setCurrentStep(item.step)}
              className={`flex items-center space-x-2 border-b-2 px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                currentStep === item.step
                  ? "border-purple-600 font-bold text-purple-700"
                  : currentStep > item.step
                  ? "border-transparent text-emerald-600 hover:text-emerald-700"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  currentStep === item.step
                    ? "bg-purple-600 text-white"
                    : currentStep > item.step
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {currentStep > item.step ? "✓" : item.step}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Notification Banners */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        {statusMessage && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage(null)}>
              <X className="h-3.5 w-3.5 text-emerald-600" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span className="font-medium">{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)}>
              <X className="h-3.5 w-3.5 text-rose-600" />
            </button>
          </div>
        )}
      </div>

      {/* Main Form Body */}
      <main className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        {/* STEP 1: CAMPAIGN IDEA */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Apple Cards Carousel Banner */}
            <div className="overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6 shadow-sm">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="rounded-full bg-purple-600 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                      Inspiration Templates
                    </span>
                    <span className="text-xs text-purple-700">Example templates • Non-published</span>
                  </div>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    Explore high-performing campaign blueprints
                  </h2>
                  <p className="mt-1 text-xs text-slate-600">
                    Browse interactive Apple Cards Carousel examples to quickly populate campaign scopes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInspirationCarousel(!showInspirationCarousel)}
                  className="inline-flex items-center space-x-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{showInspirationCarousel ? "Hide Carousel" : "Browse Inspiration Cards"}</span>
                </button>
              </div>

              {showInspirationCarousel && (
                <div className="mt-6 border-t border-purple-200/60 pt-4">
                  <BrandBriefInspirationCarousel onSelectTemplate={handleSelectTemplate} />
                </div>
              )}
            </div>

            {/* Campaign Idea Form Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 1 — Campaign Idea</h2>
                <p className="text-xs text-slate-500">
                  Describe your campaign vision, brand essence, and primary business objectives.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Campaign Name <span className="text-purple-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Lumina Aura 2026 Global Reveal"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Brand or Product Name <span className="text-purple-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={brandOrProductName}
                    onChange={(e) => setBrandOrProductName(e.target.value)}
                    placeholder="e.g. Lumina Wearables"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Product or Service Description
                  </label>
                  <textarea
                    rows={2}
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Briefly describe what makes this product or service unique, its core features, and its aesthetic appeal..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Campaign Idea or Initial Concept <span className="text-purple-600">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleRefineIdea}
                      disabled={isRefiningIdea || !campaignIdea.trim()}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-purple-700 hover:text-purple-800 disabled:opacity-40"
                    >
                      {isRefiningIdea ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Refining Idea...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>✨ Refine Idea with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={campaignIdea}
                    onChange={(e) => setCampaignIdea(e.target.value)}
                    placeholder="Describe what you want to achieve, creative metaphors, target feeling, storyline, or aesthetic hooks..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                  />

                  {/* Refined Idea Hooks & Angles */}
                  {(ideaHooks.length > 0 || ideaAngles.length > 0) && (
                    <div className="mt-3 rounded-xl border border-purple-100 bg-purple-50/50 p-4">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-purple-800">
                        <Sparkle className="h-3.5 w-3.5 text-purple-600" />
                        <span>AI Creative Suggestions</span>
                      </div>
                      {ideaHooks.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <span className="text-[11px] font-semibold text-slate-500">Suggested Visual Hooks:</span>
                          {ideaHooks.map((h, i) => (
                            <p key={i} className="text-xs text-slate-700">
                              • {h}
                            </p>
                          ))}
                        </div>
                      )}
                      {ideaAngles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <span className="text-[11px] font-semibold text-slate-500">Marketing Psychology Angles:</span>
                          {ideaAngles.map((a, i) => (
                            <p key={i} className="text-xs text-slate-700">
                              • {a}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Primary Campaign Objective
                  </label>
                  <select
                    value={primaryObjective}
                    onChange={(e) => {
                      setPrimaryObjective(e.target.value)
                      if (!selectedObjectives.includes(e.target.value)) {
                        setSelectedObjectives([...selectedObjectives, e.target.value])
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                  >
                    {CAMPAIGN_OBJECTIVES.map((obj) => (
                      <option key={obj} value={obj}>
                        {obj}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Campaign Category or Industry
                  </label>
                  <input
                    type="text"
                    value={campaignCategory}
                    onChange={(e) => setCampaignCategory(e.target.value)}
                    placeholder="e.g. AI Filmmaking & Social Ads"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Tech-forward creators and design enthusiasts aged 20-35"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Target Market / Location
                  </label>
                  <input
                    type="text"
                    value={targetMarket}
                    onChange={(e) => setTargetMarket(e.target.value)}
                    placeholder="e.g. North America, Western Europe, Global"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center space-x-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700"
                >
                  <span>Next: Configure Deliverables</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: DELIVERABLES */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Step 2 — Deliverables</h2>
                  <p className="text-xs text-slate-500">
                    Specify the exact assets you need creators to produce with independent quantities and aspect ratios.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddDeliverable}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-100"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Deliverable</span>
                </button>
              </div>

              {/* Deliverable Rows */}
              <div className="space-y-4">
                {deliverables.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 transition hover:border-purple-200"
                  >
                    <div className="mb-4 flex items-center justify-between border-b border-slate-200/60 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900">Deliverable #{index + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(item.id)}
                        className="text-slate-400 hover:text-rose-600"
                        title="Remove deliverable"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                          Content Type / Platform
                        </label>
                        <select
                          value={item.content_type}
                          onChange={(e) => handleUpdateDeliverable(item.id, { content_type: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                        >
                          {DELIVERABLE_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateDeliverable(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                          Aspect Ratio
                        </label>
                        <select
                          value={item.aspect_ratio}
                          onChange={(e) => handleUpdateDeliverable(item.id, { aspect_ratio: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                        >
                          {ASPECT_RATIOS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                          Resolution / Format
                        </label>
                        <select
                          value={item.resolution || "4K (2160p)"}
                          onChange={(e) => handleUpdateDeliverable(item.id, { resolution: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                        >
                          {RESOLUTION_OPTIONS.map((res) => (
                            <option key={res} value={res}>
                              {res}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                          Duration (seconds)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 15 or leave blank"
                          value={item.duration_seconds || ""}
                          onChange={(e) =>
                            handleUpdateDeliverable(item.id, {
                              duration_seconds: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                          Production Notes & Specific Instructions
                        </label>
                        <input
                          type="text"
                          value={item.production_notes || ""}
                          onChange={(e) => handleUpdateDeliverable(item.id, { production_notes: e.target.value })}
                          placeholder="e.g. Include brand packaging hook in first 2 seconds, synchronized audio..."
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Boolean Toggles */}
                    <div className="mt-4 flex flex-wrap items-center gap-6 border-t border-slate-200/60 pt-3 text-xs">
                      <label className="inline-flex cursor-pointer items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={item.raw_footage_required || false}
                          onChange={(e) => handleUpdateDeliverable(item.id, { raw_footage_required: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-slate-700">Raw generations/source files required</span>
                      </label>

                      <label className="inline-flex cursor-pointer items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={item.captions_required !== false}
                          onChange={(e) => handleUpdateDeliverable(item.id, { captions_required: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-slate-700">Subtitles / Captions required</span>
                      </label>

                      <label className="inline-flex cursor-pointer items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={item.creator_on_camera || false}
                          onChange={(e) => handleUpdateDeliverable(item.id, { creator_on_camera: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-slate-700">Creator on-camera appearance required</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="mt-8 flex justify-between border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center space-x-2 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back: Campaign Idea</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center space-x-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700"
                >
                  <span>Next: Creative Direction</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: CREATIVE DIRECTION */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Step 3 — Creative Direction</h2>
                  <p className="text-xs text-slate-500">
                    Define the desired tone, personality, aesthetic style, mandatory points, and exclusions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSuggestDirections}
                  disabled={isSuggestingDirections}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 disabled:opacity-50"
                >
                  {isSuggestingDirections ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Suggesting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>✨ Let AI suggest creative directions</span>
                    </>
                  )}
                </button>
              </div>

              {/* AI Direction Presets */}
              {suggestedDirections.length > 0 && (
                <div className="mb-6 rounded-2xl border border-purple-100 bg-purple-50/40 p-5">
                  <div className="mb-3 flex items-center space-x-2 text-xs font-bold text-purple-800">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span>Select an AI-Suggested Creative Direction Preset:</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {suggestedDirections.map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => applyDirectionOption(opt)}
                        className="cursor-pointer rounded-xl border border-purple-200 bg-white p-4 shadow-sm transition hover:border-purple-400 hover:shadow-md"
                      >
                        <h4 className="text-xs font-bold text-slate-900">{opt.name}</h4>
                        <p className="mt-1 text-[11px] font-medium text-purple-700">{opt.tone}</p>
                        <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">{opt.visual_theme}</p>
                        <span className="mt-3 inline-block rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                          Click to apply
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Desired Tone & Personality
                  </label>
                  <select
                    value={toneAndPersonality}
                    onChange={(e) => setToneAndPersonality(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  >
                    {TONE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Creative Visual Style
                  </label>
                  <select
                    value={creativeStyle}
                    onChange={(e) => setCreativeStyle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  >
                    {STYLE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Core Message
                  </label>
                  <input
                    type="text"
                    value={coreMessage}
                    onChange={(e) => setCoreMessage(e.target.value)}
                    placeholder="e.g. Precision design meets effortless generative productivity."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Key Product Benefits
                  </label>
                  <textarea
                    rows={2}
                    value={keyProductBenefits}
                    onChange={(e) => setKeyProductBenefits(e.target.value)}
                    placeholder="e.g. 10x faster generation, photorealistic studio lighting, zero render latency..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Mandatory Talking Points
                  </label>
                  <textarea
                    rows={2}
                    value={mandatoryTalkingPoints}
                    onChange={(e) => setMandatoryTalkingPoints(e.target.value)}
                    placeholder="e.g. Must mention the 2026 feature update and show real-time UI..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Call to Action (CTA)
                  </label>
                  <input
                    type="text"
                    value={callToAction}
                    onChange={(e) => setCallToAction(e.target.value)}
                    placeholder="e.g. Try it today at link in bio"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Required Hashtags or Mentions
                  </label>
                  <input
                    type="text"
                    value={requiredHashtags}
                    onChange={(e) => setRequiredHashtags(e.target.value)}
                    placeholder="e.g. #AICreators @OfficialBrand"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Brand Guidelines & Visual Mood References
                  </label>
                  <textarea
                    rows={2}
                    value={brandGuidelines}
                    onChange={(e) => setBrandGuidelines(e.target.value)}
                    placeholder="Paste guidelines, color codes (#F59E0B, #A855F7), or design rules..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Reference Links & Moodboard URLs
                  </label>
                  <input
                    type="text"
                    value={referenceLinks}
                    onChange={(e) => setReferenceLinks(e.target.value)}
                    placeholder="e.g. https://pinterest.com/board/mood, https://vimeo.com/video..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Things Creators Must Avoid
                  </label>
                  <input
                    type="text"
                    value={thingsToAvoid}
                    onChange={(e) => setThingsToAvoid(e.target.value)}
                    placeholder="e.g. Plastic skin, distorted hands, jittery camera motion"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Competitor / Category Restrictions
                  </label>
                  <input
                    type="text"
                    value={competitorRestrictions}
                    onChange={(e) => setCompetitorRestrictions(e.target.value)}
                    placeholder="e.g. Do not show or mention direct competing software"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="mt-8 flex justify-between border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center space-x-2 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back: Deliverables</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center space-x-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700"
                >
                  <span>Next: Creator & Commercial Terms</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: CREATOR & COMMERCIAL REQUIREMENTS */}
        {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 4 — Creator & Commercial Requirements</h2>
                <p className="text-xs text-slate-500">
                  Set creator qualifications, budgets, proposed compensation, and usage licensing terms.
                </p>
                <div className="mt-2.5 flex items-center space-x-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
                  <Info className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    Note: Proposed terms are presented as proposed campaign terms until mutually confirmed with creators.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Total Campaign Budget (USD) <span className="text-purple-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-slate-400">$</span>
                    <input
                      type="number"
                      min={100}
                      step={50}
                      value={totalBudgetUSD}
                      onChange={(e) => setTotalBudgetUSD(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full rounded-xl border border-slate-200 pl-8 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Budget per Deliverable (USD, Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-slate-400">$</span>
                    <input
                      type="number"
                      min={50}
                      value={budgetPerDeliverableUSD}
                      onChange={(e) => setBudgetPerDeliverableUSD(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full rounded-xl border border-slate-200 pl-8 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Compensation Model
                  </label>
                  <select
                    value={compensationModel}
                    onChange={(e) => setCompensationModel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  >
                    {COMPENSATION_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} ({m.desc})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Minimum Creator Verification Level
                  </label>
                  <select
                    value={creatorLevel}
                    onChange={(e) => setCreatorLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="LEVEL_1_VERIFIED">Level 1 — Verified Portfolio</option>
                    <option value="LEVEL_2_VERIFIED">Level 2 — Advanced AI Production (Recommended)</option>
                    <option value="LEVEL_3_MASTER">Level 3 — Master Director</option>
                    <option value="LEVEL_4_LEGEND">Level 4 — Elite Studio Legend</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    value={applicationDeadline}
                    onChange={(e) => setApplicationDeadline(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Campaign Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Content Delivery Deadline
                  </label>
                  <input
                    type="date"
                    value={contentDeliveryDeadline}
                    onChange={(e) => setContentDeliveryDeadline(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Preferred Creator Niches
                  </label>
                  <input
                    type="text"
                    value={preferredNiches.join(", ")}
                    onChange={(e) => setPreferredNiches(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                    placeholder="e.g. AI Filmmakers, Motion Designers, 3D Artists"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Preferred Creator Platforms
                  </label>
                  <input
                    type="text"
                    value={preferredPlatforms.join(", ")}
                    onChange={(e) => setPreferredPlatforms(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                    placeholder="e.g. Instagram, TikTok, YouTube"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Audience Demographics Location
                  </label>
                  <input
                    type="text"
                    value={audienceLocation}
                    onChange={(e) => setAudienceLocation(e.target.value)}
                    placeholder="e.g. Global, US & Canada, Europe"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Audience Age Range
                  </label>
                  <input
                    type="text"
                    value={audienceAgeRange}
                    onChange={(e) => setAudienceAgeRange(e.target.value)}
                    placeholder="e.g. 18-34, 25-45"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Preferred Creator Language
                  </label>
                  <input
                    type="text"
                    value={creatorLanguage}
                    onChange={(e) => setCreatorLanguage(e.target.value)}
                    placeholder="e.g. English, Spanish, Multilingual"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Audience Size / Reach Target
                  </label>
                  <input
                    type="text"
                    value={audienceSizeRange}
                    onChange={(e) => setAudienceSizeRange(e.target.value)}
                    placeholder="e.g. 10k - 100k+ followers"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Included Revision Rounds
                  </label>
                  <select
                    value={revisionsCount}
                    onChange={(e) => setRevisionsCount(parseInt(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  >
                    <option value={1}>1 revision pass</option>
                    <option value={2}>2 revision passes (Standard)</option>
                    <option value={3}>3 revision passes</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Organic Usage Duration
                  </label>
                  <select
                    value={organicDuration}
                    onChange={(e) => setOrganicDuration(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                    <option value="Perpetual">Perpetual (Indefinite)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs">
                    <label className="inline-flex cursor-pointer items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={paidWhitelisting}
                        onChange={(e) => setPaidWhitelisting(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-semibold text-slate-700">
                        Paid Advertising / Creator Whitelisting permissions included
                      </span>
                    </label>

                    <label className="inline-flex cursor-pointer items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={exclusivityRequired}
                        onChange={(e) => setExclusivityRequired(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-semibold text-slate-700">Category Exclusivity required</span>
                    </label>

                    {exclusivityRequired && (
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">Duration:</span>
                        <input
                          type="text"
                          value={exclusivityDuration}
                          onChange={(e) => setExclusivityDuration(e.target.value)}
                          placeholder="e.g. 30 days post-campaign"
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="mt-8 flex justify-between border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center space-x-2 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back: Creative Direction</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(5)
                    // Auto-trigger full brief generation if sections are empty
                    if (Object.keys(briefSections).length === 0) {
                      handleGenerateFullBrief()
                    }
                  }}
                  className="inline-flex items-center space-x-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700"
                >
                  <span>Review AI-Generated Brief</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 5: AI-GENERATED BRIEF REVIEW (16 SECTIONS) */}
        {currentStep === 5 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Action Bar */}
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 via-white to-indigo-50 p-6 shadow-sm md:flex-row md:items-center">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="rounded-full bg-purple-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase">
                    AI Brief Workspace
                  </span>
                  <span className="text-xs text-purple-700">16 Structured Editorial Sections</span>
                </div>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{title || "Campaign Creative Brief"}</h2>
                <p className="text-xs text-slate-600">
                  Every section is independently editable and regenerable. Click any section to customize.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateFullBrief}
                  disabled={isGeneratingFullBrief}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-purple-300 bg-white px-3.5 py-2 text-xs font-semibold text-purple-700 shadow-sm transition hover:bg-purple-50 disabled:opacity-50"
                >
                  {isGeneratingFullBrief ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
                      <span>Generating Full Brief...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 text-purple-600" />
                      <span>Regenerate Entire Brief</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreatorPreview(!showCreatorPreview)}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-600" />
                  <span>{showCreatorPreview ? "Show Full Workspace" : "Preview Creator View"}</span>
                </button>
              </div>
            </div>

            {/* Validation Feedback Banner */}
            {!validationResult.can_publish && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                <div className="flex items-center space-x-2 font-bold text-amber-900">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Publication Requirements Remaining:</span>
                </div>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  {validationResult.blocking_errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Creator-Facing Preview Modal View */}
            {showCreatorPreview ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                      Creator Perspective Preview
                    </span>
                    <span className="text-xs text-slate-500">Internal notes & private budgets hidden</span>
                  </div>
                  <button
                    onClick={() => setShowCreatorPreview(false)}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-800"
                  >
                    Back to Section Editor
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                    <p className="mt-1 text-sm text-slate-600">{briefSections.campaign_overview}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Objectives</h4>
                      <p className="mt-1 text-xs text-slate-700 whitespace-pre-line">
                        {briefSections.campaign_objectives}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Creative Style</h4>
                      <p className="mt-1 text-xs text-slate-700 whitespace-pre-line">
                        {briefSections.creative_direction}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Required Deliverables</h4>
                    <p className="mt-1 text-xs text-slate-700 whitespace-pre-line">
                      {briefSections.deliverables_and_specs}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mandatory & Restrictions</h4>
                    <p className="mt-1 text-xs text-slate-700 whitespace-pre-line">
                      {briefSections.mandatory_requirements}
                      {"\n\nRestrictions:\n"}
                      {briefSections.content_restrictions}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* The 16 Editorial Brief Section Cards */
              <div className="space-y-4">
                {BRIEF_SECTION_METADATA.map((meta) => {
                  const content = briefSections[meta.id] || ""
                  const isEditing = editingSectionId === meta.id
                  const isRegenerating = regeneratingSectionId === meta.id

                  return (
                    <div
                      key={meta.id}
                      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-purple-200"
                    >
                      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{meta.title}</h3>
                          <p className="text-[11px] text-slate-400">{meta.hint}</p>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {/* Copy Section Button */}
                          <button
                            type="button"
                            onClick={() => handleCopySection(meta.id, content)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            title="Copy section"
                          >
                            {copiedSection === meta.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {/* Regenerate Section Button */}
                          <button
                            type="button"
                            disabled={isRegenerating}
                            onClick={() => handleRegenerateSection(meta.id)}
                            className="rounded-lg p-1.5 text-purple-600 transition hover:bg-purple-50 hover:text-purple-700 disabled:opacity-40"
                            title="Regenerate this section with AI"
                          >
                            {isRegenerating ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {/* Edit Section Toggle */}
                          {!isEditing ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSectionId(meta.id)
                                setSectionEditText(content)
                              }}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              title="Edit section"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingSectionId(null)}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600"
                              title="Cancel editing"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Content or Edit Box */}
                      {isEditing ? (
                        <div className="space-y-3">
                          <textarea
                            rows={4}
                            value={sectionEditText}
                            onChange={(e) => setSectionEditText(e.target.value)}
                            className="w-full rounded-xl border border-purple-200 bg-white p-3 text-xs text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => setEditingSectionId(null)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveSectionEdit(meta.id)}
                              className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
                            >
                              Save Section
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                          {content || (
                            <span className="italic text-slate-400">
                              Click "Regenerate" or click edit icon to add specifications for this section.
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center space-x-2 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back: Creator & Terms</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleClarifyBriefWithAI}
                  disabled={isClarifyingBrief}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                  title="Inspect brief for missing details and timeline contradictions"
                >
                  <Sparkles className={`h-4 w-4 ${isClarifyingBrief ? "animate-spin text-purple-600" : "text-purple-600"}`} />
                  <span>{isClarifyingBrief ? "Inspecting Brief..." : "AI Clarify Brief"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing || !validationResult.can_publish}
                  className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md transition hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Publish Campaign to Marketplace</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* AI Brief Clarification & Inspection Drawer */}
      {isClarificationDrawerOpen && clarificationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-purple-100 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    AI Campaign Brief Clarification & Review
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${clarificationResult.is_ai_powered ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"}`}>
                      {clarificationResult.is_ai_powered ? "AI-Powered Audit" : "Deterministic Engine"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Draft preserved safely • Strict guardrail: No automated publishing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsClarificationDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Contradictions & Conflicts */}
              {clarificationResult.contradictions && clarificationResult.contradictions.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Timeline & Parameter Contradictions ({clarificationResult.contradictions.length})
                  </h4>
                  {clarificationResult.contradictions.map((contra, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-rose-800">
                        <span>{contra.title}</span>
                        <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 font-extrabold">
                          {contra.severity}
                        </span>
                      </div>
                      <p className="text-rose-800 leading-relaxed">{contra.description}</p>
                      <div className="pt-1 flex items-start gap-1 font-medium text-rose-950">
                        <Lightbulb className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span>Recommended: {contra.recommended_resolution}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Missing Details */}
              {clarificationResult.missing_details && clarificationResult.missing_details.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Missing Campaign Specifications ({clarificationResult.missing_details.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {clarificationResult.missing_details.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900">{item.field_name}</span>
                          <p className="text-slate-600 text-[11px] leading-relaxed">{item.reason}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                          item.importance === "required"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {item.importance}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clarification Questions */}
              {clarificationResult.clarification_questions && clarificationResult.clarification_questions.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Recommended Clarifications for Creators
                  </h4>
                  <div className="space-y-2">
                    {clarificationResult.clarification_questions.map((q) => (
                      <div key={q.id} className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 text-xs space-y-1">
                        <span className="font-bold text-purple-900 block">{q.question}</span>
                        <p className="text-purple-700 text-[11px]">{q.why_asking}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Refinements Preview */}
              {clarificationResult.suggested_refinements && Object.keys(clarificationResult.suggested_refinements).length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Suggested Brief Refinements
                  </h4>
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-2">
                    {Object.entries(clarificationResult.suggested_refinements).map(([k, v]) => (
                      <div key={k} className="text-slate-700">
                        <span className="font-bold text-emerald-900 capitalize block mb-0.5">
                          {k.replace(/_/g, " ")}:
                        </span>
                        <p className="bg-white p-2.5 rounded-lg border border-emerald-100 text-slate-800 text-[11px] leading-relaxed">
                          {typeof v === "object" ? JSON.stringify(v) : String(v)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-purple-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsClarificationDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close & Keep Draft
              </button>
              {clarificationResult.suggested_refinements && Object.keys(clarificationResult.suggested_refinements).length > 0 && (
                <button
                  type="button"
                  onClick={handleApplyRefinements}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Apply Suggested Refinements to Draft
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default BrandBriefBuilderPage
