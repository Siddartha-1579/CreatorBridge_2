"""AI-assisted creative brief generation service."""

import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.core.logging import get_logger
from app.integrations.ai.gateway import ai_gateway
from app.integrations.ai.base import TextGenerationRequest
from app.schemas.brief import (
    AIBriefGenerationRequest,
    AIBriefGenerationResponse,
    DeliverableItem,
    CreativeDirection,
    CreatorCapabilityRequirements,
    CommercialTerms,
    RefineIdeaRequest,
    RefineIdeaResponse,
    SuggestCreativeDirectionsRequest,
    SuggestCreativeDirectionsResponse,
    CreativeDirectionOption,
    RegenerateSectionRequest,
    RegenerateSectionResponse,
)

logger = get_logger("ai.brief_service")


class AIBriefService:
    """Service handling AI generation, prompt synthesis, and structured brief expansion."""

    async def generate_brief(self, request: AIBriefGenerationRequest) -> AIBriefGenerationResponse:
        """
        Transforms a brand's unstructured campaign idea and preferences into
        a comprehensive, actionable creative brief with 16 editable sections.
        """
        try:
            available_providers = ai_gateway.list_available_providers().get("text", [])
            if available_providers:
                result = await self._generate_with_external_provider(request)
                if result:
                    return result
        except Exception as e:
            logger.warning(f"External AI generation bypassed or failed: {e}. Falling back to internal engine.")

        # Fallback: Domain-specific algorithmic creative synthesis engine
        return self._generate_algorithmic_brief(request)

    async def refine_idea(self, request: RefineIdeaRequest) -> RefineIdeaResponse:
        """Refines a brand's initial campaign concept without changing intent."""
        idea = request.campaign_idea.strip()
        brand = request.brand_or_product_name or request.campaign_name or "the brand"
        obj = request.primary_objective or "engagement and growth"
        cat = request.campaign_category or "Creative Campaign"

        # Try external LLM
        try:
            available_providers = ai_gateway.list_available_providers().get("text", [])
            if available_providers:
                prompt = f"""
You are an award-winning Creative Director. Refine the following campaign idea for {brand} ({cat}).
Original Idea: {idea}
Primary Objective: {obj}

Respond with valid JSON only:
{{
  "refined_idea": "Crisp, compelling, high-concept articulation of the campaign idea that keeps original intent",
  "suggested_hooks": ["Hook 1 (visual or narrative opening)", "Hook 2", "Hook 3"],
  "key_angles": ["Angle 1 (marketing psychology angle)", "Angle 2", "Angle 3"]
}}
"""
                resp = await ai_gateway.generate_text(TextGenerationRequest(prompt=prompt, temperature=0.6))
                content = self._clean_json(resp.content)
                parsed = json.loads(content)
                return RefineIdeaResponse(
                    refined_idea=parsed.get("refined_idea", idea),
                    suggested_hooks=parsed.get("suggested_hooks", []),
                    key_angles=parsed.get("key_angles", []),
                )
        except Exception as e:
            logger.info(f"Using algorithmic fallback for idea refinement: {e}")

        # Algorithmic refinement
        refined = (
            f"An immersive, AI-native storytelling campaign for {brand} centered on '{idea}'. "
            f"Crafted to optimize for {obj.lower()}, blending cinematic world-building with relatable audience tension "
            f"to establish undeniable brand affinity."
        )
        hooks = [
            f"Opening with an unexpected sensory pattern interrupt: the world in freeze-frame as {brand} transforms the scene.",
            f"Macro visual contrast: ordinary everyday friction shifting dynamically into effortless ease.",
            f"Direct second-person creator hook: 'What if your routine looked like this?' leading straight into high-octane visuals.",
        ]
        angles = [
            "Problem-Agitate-Solve: spotlight the relatable friction before presenting the breakthrough experience.",
            "Aspirational Identity: frame early adopters of the product as creative trendsetters.",
            "Behind-the-Magic Curiosity: leverage generative visual transitions that spark audience sharing and comments.",
        ]
        return RefineIdeaResponse(refined_idea=refined, suggested_hooks=hooks, key_angles=angles)

    async def suggest_creative_directions(
        self, request: SuggestCreativeDirectionsRequest
    ) -> SuggestCreativeDirectionsResponse:
        """Suggests 3 distinct creative direction presets for the brand to choose or edit."""
        product = request.product_or_service or "the product"
        idea = request.campaign_idea or "campaign concept"

        options = [
            CreativeDirectionOption(
                id="dir_cinematic",
                name="Cinematic Luxury & Photorealism",
                tone="Sophisticated, Editorial, Confident",
                style="35mm Anamorphic Photorealism with Natural Light",
                visual_theme="Volumetric golden-hour rim lighting, deep tonal contrast, tactile surface textures",
                recommended_prompt_hook=f"Ultra-detailed 35mm film still of {product}, cinematic lighting, soft atmospheric dust, hyper-tactile surfaces, Hasselblad 80mm aesthetic",
            ),
            CreativeDirectionOption(
                id="dir_viral_social",
                name="High-Octane Viral Native",
                tone="Snappy, Energetic, Relatable",
                style="Fast-Cut Dynamic Social Motion with Snappy Hooks",
                visual_theme="Punchy saturated palette, kinetic camera pans, snappy text overlays, trendsetting rhythms",
                recommended_prompt_hook=f"Dynamic first-person perspective interacting with {product}, vibrant studio neon accents, smooth kinetic zoom, viral TikTok pacing",
            ),
            CreativeDirectionOption(
                id="dir_surreal_3d",
                name="Surreal Dreamscape & Future Tech",
                tone="Avant-Garde, Visionary, Mesmerizing",
                style="Zero-Gravity 3D Metamorphosis & Particle Simulation",
                visual_theme="Ethereal floating geometries, pearlescent iridescence, dreamlike atmospheric refraction",
                recommended_prompt_hook=f"Surreal artistic render of {product} suspended in zero gravity surrounded by iridescent fluid particles, raytraced glass caustics, Octane 8K render",
            ),
        ]
        return SuggestCreativeDirectionsResponse(options=options)

    async def regenerate_section(self, request: RegenerateSectionRequest) -> RegenerateSectionResponse:
        """Regenerates a single specific section of the 16-section brief while preserving others."""
        sec_id = request.section_id
        data = request.brief_data
        guidance = request.custom_guidance or ""
        title = data.get("title", "Campaign")
        product = data.get("product_or_service", "Product")
        idea = data.get("campaign_idea", "")
        obj = data.get("objectives", ["Awareness"])
        audience = data.get("target_audience", "Creative digital natives")

        # Map to specific section generator
        generator_map = {
            "campaign_overview": lambda: (
                f"This campaign introduces '{product}' through high-impact AI storytelling designed to command cultural attention. "
                f"Building on '{idea}', the narrative bridges authentic user emotion with breathtaking visual execution. "
                f"{f'Guidance applied: {guidance}' if guidance else ''}"
            ),
            "campaign_objectives": lambda: (
                f"1. Generate high-velocity organic reach across target social channels.\n"
                f"2. Drive qualified interest and high-intent traffic for {product}.\n"
                f"3. Establish a distinct, memorable visual aesthetic that sets {title} apart from category conventions.\n"
                f"4. Cultivate creator-led community advocacy through interactive content formats."
            ),
            "target_audience": lambda: (
                f"Primary: {audience}.\n"
                f"Psychographics: Tech-forward innovators and aesthetic-conscious consumers who value authentic creative craft, "
                f"high production values, and concise, respectful messaging. They consume content primarily via mobile short-form video."
            ),
            "campaign_concept": lambda: (
                f"'{idea or 'The Transformative Shift'}': A narrative exploration showing the contrast between ordinary routine and "
                f"elevated performance with {product}. Creators depict real moments enhanced by magical, surreal generative visual layers."
            ),
            "key_messages": lambda: (
                f"• {product} solves everyday friction through modern, seamless design.\n"
                f"• Quality is never compromised: experience premium craft from day one.\n"
                f"• Join a growing global collective redefining how we create and connect."
            ),
            "creative_direction": lambda: (
                f"Tone: Confident, aspirational, and warm.\n"
                f"Visuals: Rich contrast, cinematic depth-of-field, realistic particle physics, and natural studio lighting.\n"
                f"Pacing: Snappy first 3 seconds to secure viewer retention, followed by rhythmic, satisfying editorial cuts."
            ),
            "deliverables_and_specs": lambda: (
                f"• Short-form Video (9:16, 4K, 15-30s): Optimized for TikTok & Instagram Reels with dynamic hooks.\n"
                f"• High-Res Key Visuals (1:1 / 4:5, 4K): Photorealistic studio packshots for digital and social feed.\n"
                f"• Horizontal Master (16:9, 4K): Cinematic hero cut for YouTube and website banner deployment."
            ),
            "creator_eligibility": lambda: (
                f"Eligibility: Level 2+ Verified AI Creators with proven portfolio in photorealistic prompting and video synthesis.\n"
                f"Preferred Tooling: Runway Gen-3, Kling AI, Midjourney v6.1, ComfyUI, ElevenLabs.\n"
                f"Requirements: Demonstrated track record of character/product visual consistency across multiple cuts."
            ),
            "mandatory_requirements": lambda: (
                f"• Display official {product} logo in final 3 seconds and in opening lower third.\n"
                f"• Include mandatory campaign hashtag in video description.\n"
                f"• Clear all audio tracks for commercial digital broadcast rights."
            ),
            "content_restrictions": lambda: (
                f"• Avoid low-resolution generative jitter or plastic-looking skin textures.\n"
                f"• Do not mention or display direct competitor products or marks.\n"
                f"• No misleading performance claims or unverified product guarantees."
            ),
            "timeline_and_milestones": lambda: (
                f"• Day 1-3: Creator submission & moodboard alignment.\n"
                f"• Day 5: First draft work-in-progress render review.\n"
                f"• Day 8: Revision round (color timing, typography adjustments).\n"
                f"• Day 10: Final delivery of high-res master exports and asset handover."
            ),
            "budget_and_compensation": lambda: (
                f"Compensation: Milestone-based payout upon approved deliverable stages.\n"
                f"Initial milestone: 50% upon storyboard & prompt approval; Final milestone: 50% upon clean master acceptance.\n"
                f"Revision rounds included: 2 full passes within agreed scope."
            ),
            "usage_rights_and_licensing": lambda: (
                f"Rights: Full commercial usage rights across global digital channels (Organic Social, Paid Advertising, Web).\n"
                f"Term: 12 months with option for perpetual archive rights.\n"
                f"Exclusivity: Non-exclusive with 30-day category exclusivity on direct competitive endorsements."
            ),
            "submission_requirements": lambda: (
                f"• Deliver master exports in ProRes 422 HQ and high-bitrate H.264 / MP4.\n"
                f"• Provide clean cuts without baked-in subtitles plus separate .SRT caption files.\n"
                f"• Include workflow summary (seed numbers, models used) for archival reproducibility."
            ),
            "success_metrics": lambda: (
                f"• Retention Rate: >45% view-through rate on 15s short-form videos.\n"
                f"• Engagement Benchmark: Minimum 3.5% organic engagement rate across published formats.\n"
                f"• Visual Polish: 100% adherence to approved brand color harmony and typographic guidelines."
            ),
            "call_to_action": lambda: (
                f"Primary CTA: 'Experience {product} today — link in bio to explore the exclusive launch collection.'\n"
                f"Secondary CTA for paid ads: 'Learn More' / 'Shop Now'."
            ),
        }

        func = generator_map.get(sec_id)
        if func:
            content = func()
        else:
            content = f"Custom section content for {sec_id}. Tailored for {product} with emphasis on {title}."

        return RegenerateSectionResponse(section_id=sec_id, regenerated_content=content)

    def _clean_json(self, text: str) -> str:
        """Cleans markdown JSON fences from LLM responses."""
        c = text.strip()
        if c.startswith("```json"):
            c = c[7:]
        if c.startswith("```"):
            c = c[3:]
        if c.endswith("```"):
            c = c[:-3]
        return c.strip()

    async def _generate_with_external_provider(
        self, request: AIBriefGenerationRequest
    ) -> Optional[AIBriefGenerationResponse]:
        """Calls registered LLM provider with structured JSON instruction."""
        prompt = f"""
You are an expert Creative Director and AI Production Architect for an elite brand marketplace.
Transform the following campaign concept into a complete, professional AI Creative Brief with all 16 standard sections:

Campaign Name: {request.campaign_name or 'Untitled'}
Brand / Product: {request.brand_or_product_name or request.product_or_service or 'Brand'}
Description: {request.product_description or 'Not specified'}
Idea: {getattr(request, 'effective_idea', None) or request.campaign_idea or 'Generative brand campaign'}
Primary Objective: {request.primary_objective or (request.objectives[0] if request.objectives else 'Growth')}
Target Audience: {request.target_audience or 'Digital consumers'}
Target Market: {request.target_market or 'Global'}
Category: {request.campaign_category or 'General'}

Return a valid JSON object matching this schema:
{{
  "refined_title": "string",
  "executive_summary": "string",
  "suggested_objectives": ["string"],
  "suggested_deliverables": [
    {{
      "id": "deliv_1",
      "content_type": "Short-form Video",
      "quantity": 1,
      "placement_or_platform": "Instagram Reels",
      "aspect_ratio": "9:16",
      "resolution": "4K",
      "duration_seconds": 15,
      "raw_footage_required": false,
      "captions_required": true,
      "creator_on_camera": false,
      "production_notes": "string"
    }}
  ],
  "suggested_creative_direction": {{
    "tone_and_personality": "string",
    "styles": ["string"],
    "custom_style_notes": "string",
    "color_palette": "string",
    "mood_atmosphere": "string",
    "things_to_include": ["string"],
    "things_to_avoid": ["string"],
    "experimentation_level": "BALANCED"
  }},
  "suggested_capabilities": {{
    "required_capabilities": ["string"],
    "preferred_capabilities": ["string"],
    "flexible_capabilities": ["string"],
    "preferred_tools": ["string"]
  }},
  "suggested_commercial_terms": {{
    "budget_tier": "GROWTH",
    "budget_cents": 250000,
    "currency": "USD",
    "compensation_model": "PAID",
    "payment_model": "MILESTONE",
    "intended_usage": ["PAID_ADS"],
    "commercial_rights_required": true,
    "source_files_required": false,
    "revisions_count": 2,
    "exclusivity_required": false,
    "territory": "Global",
    "usage_duration": "Perpetual"
  }},
  "sections": {{
    "campaign_overview": "string",
    "campaign_objectives": "string",
    "target_audience": "string",
    "campaign_concept": "string",
    "key_messages": "string",
    "creative_direction": "string",
    "deliverables_and_specs": "string",
    "creator_eligibility": "string",
    "mandatory_requirements": "string",
    "content_restrictions": "string",
    "timeline_and_milestones": "string",
    "budget_and_compensation": "string",
    "usage_rights_and_licensing": "string",
    "submission_requirements": "string",
    "success_metrics": "string",
    "call_to_action": "string"
  }},
  "open_questions": ["string"],
  "constraints": ["string"],
  "success_criteria": "string"
}}
"""
        response = await ai_gateway.generate_text(
            TextGenerationRequest(prompt=prompt, temperature=0.7)
        )
        content = self._clean_json(response.content)
        parsed = json.loads(content)

        raw_deliverables = parsed.get("suggested_deliverables", [])
        deliverables = [
            DeliverableItem(**d) if isinstance(d, dict) else d for d in raw_deliverables
        ]
        if not deliverables:
            deliverables = [
                DeliverableItem(
                    id="deliv_1",
                    content_type="Short-form Video",
                    quantity=1,
                    placement_or_platform="Instagram Reels",
                    aspect_ratio="9:16",
                    resolution="4K",
                    duration_seconds=15,
                )
            ]

        cd_data = parsed.get("suggested_creative_direction", {})
        creative_dir = CreativeDirection(**cd_data) if isinstance(cd_data, dict) else CreativeDirection()

        cap_data = parsed.get("suggested_capabilities", {})
        capabilities = CreatorCapabilityRequirements(**cap_data) if isinstance(cap_data, dict) else CreatorCapabilityRequirements()

        comm_data = parsed.get("suggested_commercial_terms", {})
        commercial_terms = CommercialTerms(**comm_data) if isinstance(comm_data, dict) else CommercialTerms()

        sections = parsed.get("sections", {})
        if not isinstance(sections, dict) or len(sections) < 16:
            # Backfill any missing sections from algorithmic generator
            algo = self._build_16_sections(
                title=parsed.get("refined_title", "Campaign Brief"),
                product=request.brand_or_product_name or "Brand Product",
                idea=getattr(request, "effective_idea", None) or request.campaign_idea or "Campaign Concept",
                audience=request.target_audience or "Modern Digital Consumers",
                obj=parsed.get("suggested_objectives", ["Awareness"]),
                deliverables=deliverables,
                budget_cents=commercial_terms.budget_cents or 250000,
            )
            for k, v in algo.items():
                if k not in sections:
                    sections[k] = v

        return AIBriefGenerationResponse(
            refined_title=parsed.get("refined_title", request.campaign_name or "New AI Creative Campaign"),
            executive_summary=parsed.get("executive_summary", ""),
            suggested_objectives=parsed.get("suggested_objectives", request.objectives or ["Brand Awareness"]),
            suggested_deliverables=deliverables,
            suggested_creative_direction=creative_dir,
            suggested_capabilities=capabilities,
            suggested_commercial_terms=commercial_terms,
            suggested_budget_cents=commercial_terms.budget_cents,
            sections=sections,
            open_questions=parsed.get("open_questions", []),
            constraints=parsed.get("constraints", []),
            success_criteria=parsed.get("success_criteria", "Approved asset delivery conforming to creative brief"),
            provider_used=response.model or "external_llm",
        )

    def _generate_algorithmic_brief(
        self, request: AIBriefGenerationRequest
    ) -> AIBriefGenerationResponse:
        """High-fidelity algorithmic synthesis when external LLMs are unavailable."""
        product = request.brand_or_product_name or request.product_or_service or "NextGen Experience"
        category = request.campaign_category or request.template_category or "Creative"
        idea_val = getattr(request, "effective_idea", None) or request.campaign_idea or "Campaign Concept"
        idea = idea_val.strip()
        audience = request.target_audience or "Modern Digital Consumers"

        # 1. Title synthesis
        refined_title = request.campaign_name or f"{product} — {category.title()} Campaign"

        # 2. Executive Summary
        exec_summary = (
            f"Commissioning an AI-native creative specialist to produce an omnichannel asset suite "
            f"for '{product}'. The campaign targets {audience} with a focus on high-fidelity visual storytelling, "
            f"prompt consistency, and authentic brand identity alignment. Core concept: \"{idea}\"."
        )

        # 3. Objectives
        base_objectives = list(request.objectives)
        if request.primary_objective and request.primary_objective not in base_objectives:
            base_objectives.insert(0, request.primary_objective)
        if not base_objectives:
            base_objectives = ["Brand Awareness", "Product Launch", "High CTR Engagement"]

        # 4. Deliverables
        deliverables: List[DeliverableItem] = []
        if request.deliverables:
            deliverables = request.deliverables
        else:
            deliverables = [
                DeliverableItem(
                    id="deliv_001",
                    content_type="Short-form Video",
                    quantity=2,
                    placement_or_platform="Instagram Reels & TikTok",
                    aspect_ratio="9:16",
                    resolution="4K",
                    duration_seconds=15,
                    raw_footage_required=False,
                    captions_required=True,
                    creator_on_camera=False,
                    production_notes="Dynamic pattern-interrupt hook in first 2 seconds, synchronized audio, character continuity.",
                ),
                DeliverableItem(
                    id="deliv_002",
                    content_type="Static Post",
                    quantity=3,
                    placement_or_platform="E-Commerce & Digital Ads",
                    aspect_ratio="1:1",
                    resolution="4K",
                    duration_seconds=None,
                    raw_footage_required=False,
                    captions_required=False,
                    creator_on_camera=False,
                    production_notes="Photorealistic studio packshot staging with consistent contact shadows and crisp materials.",
                ),
                DeliverableItem(
                    id="deliv_003",
                    content_type="YouTube Integration",
                    quantity=1,
                    placement_or_platform="Hero Brand Header / YouTube",
                    aspect_ratio="16:9",
                    resolution="4K",
                    duration_seconds=30,
                    raw_footage_required=True,
                    captions_required=True,
                    creator_on_camera=True,
                    production_notes="Cinematic narrative commercial trailer with ambient neural sound design.",
                ),
            ]

        # 5. Creative Direction
        styles = list(request.styles)
        if not styles:
            styles = ["Photorealistic", "Cinematic", "Editorial"]

        creative_direction = CreativeDirection(
            tone_and_personality="Confident, elevated, and visually magnetic",
            styles=styles,
            custom_style_notes="Volumetric atmospheric lighting, rich tactile textures, crisp optical depth-of-field.",
            color_palette="Warm Golden Light (#F59E0B), Deep Slate (#0F172A), Soft Lavender Accent (#A855F7)",
            mood_atmosphere="Elevated, inspiring, premium, and visually confident",
            visual_references=["Editorial high-fashion cinematography", "Architectural studio lighting"],
            key_product_benefits=f"Flawless craft and seamless utility embodied in {product}",
            mandatory_talking_points=f"Demonstrate how {product} transforms everyday experiences",
            call_to_action=request.desired_cta or "Discover more at the link in bio",
            things_to_include=[
                "High dynamic range contrast",
                "Natural particle dynamics (light flares, subtle reflections)",
                "Clear product focus without uncanny artifacts",
            ],
            things_to_avoid=[
                "Plastic skin shaders",
                "Warped brand typography or logos",
                "Low-res pixelation or motion jitter",
            ],
            competitor_restrictions="Do not feature or mention direct category competitors",
            experimentation_level="BALANCED",
        )

        # 6. Creator Capabilities
        capabilities = CreatorCapabilityRequirements(
            preferred_niches=["AI Filmmaking", "3D Product Visualization", "Motion Design"],
            preferred_platforms=["Instagram", "TikTok", "YouTube"],
            audience_location="Global",
            audience_age_range="18-35",
            preferred_language=request.preferred_language or "English",
            experience_level="LEVEL_2_VERIFIED",
            required_capabilities=[
                "AI Video Synthesis (Runway/Kling)",
                "Consistent Character & Object Conditioning",
                "Photorealistic Prompt Engineering",
            ],
            preferred_capabilities=[
                "ComfyUI Custom Workflows",
                "Audio Synthesis & Voiceover Alignment",
                "Post-Processing & Color Timing",
            ],
            flexible_capabilities=["3D Pre-visualization & Blockout"],
            preferred_tools=["Runway Gen-3", "Midjourney v6.1", "ElevenLabs", "FLUX.1 Pro"],
        )

        # 7. Commercial Terms
        total_items = sum(d.quantity for d in deliverables)
        estimated_budget_cents = max(150000, total_items * 35000)

        commercial_terms = CommercialTerms(
            budget_tier="GROWTH",
            budget_cents=estimated_budget_cents,
            budget_per_deliverable_cents=estimated_budget_cents // max(1, total_items),
            currency="USD",
            compensation_model="PAID",
            payment_model="MILESTONE",
            intended_usage=["PAID_ADS", "ORGANIC_SOCIAL", "WEBSITE"],
            paid_advertising_whitelisting=True,
            organic_usage_duration="Perpetual",
            territory="Global",
            channels=["Instagram", "TikTok", "YouTube", "Brand Website"],
            exclusivity_required=False,
            commercial_rights_required=True,
            source_files_required=True,
            revisions_count=2,
            attribution_required=False,
            ongoing_work_considered=True,
        )

        # 8. Build 16 Sections
        sections = self._build_16_sections(
            title=refined_title,
            product=product,
            idea=idea,
            audience=audience,
            obj=base_objectives,
            deliverables=deliverables,
            budget_cents=estimated_budget_cents,
        )

        # 9. Clarifying Questions & Constraints
        open_questions = [
            f"Will exact 3D models or reference photo batches of '{product}' be provided for IP-Adapter conditioning?",
            "Is there a preferred musical tempo or voice actor demographic for neural audio generation?",
            "Should deliverables be delivered with baked-in subtitles or separate SRT caption tracks?",
        ]

        constraints = [
            "All generated visual assets must clear commercial IP use without trademark conflicts.",
            "Delivery must meet or exceed native 4K 60fps render specifications.",
            "Product label typography must match official vectors with zero generative letter hallucination.",
        ]

        success_criteria = (
            f"Delivery of {total_items} validated creative deliverables meeting approved color palette, "
            f"with character and product geometry consistency verified across all scene cuts."
        )

        return AIBriefGenerationResponse(
            refined_title=refined_title,
            executive_summary=exec_summary,
            suggested_objectives=base_objectives,
            suggested_deliverables=deliverables,
            suggested_creative_direction=creative_direction,
            suggested_capabilities=capabilities,
            suggested_commercial_terms=commercial_terms,
            suggested_budget_cents=estimated_budget_cents,
            sections=sections,
            open_questions=open_questions,
            constraints=constraints,
            success_criteria=success_criteria,
            provider_used="algorithmic_creative_engine",
        )

    def _build_16_sections(
        self,
        title: str,
        product: str,
        idea: str,
        audience: str,
        obj: List[str],
        deliverables: List[DeliverableItem],
        budget_cents: int,
    ) -> Dict[str, str]:
        """Constructs all 16 required brief sections."""
        deliv_summary = "\n".join(
            f"• {d.quantity}x {d.content_type} ({d.aspect_ratio}, {d.resolution or '4K'})"
            f"{f' ~{d.duration_seconds}s' if d.duration_seconds else ''}: {d.production_notes or 'High-quality asset'}"
            for d in deliverables
        )

        return {
            "campaign_overview": (
                f"'{title}' is a premiere AI-driven creative campaign for {product}. "
                f"The campaign is designed to captivate digital audiences, establishing a bold, "
                f"modern aesthetic while demonstrating immediate brand utility through generative visual excellence."
            ),
            "campaign_objectives": (
                f"Key campaign objectives:\n"
                + "\n".join(f"• {o}" for o in obj)
                + f"\nSecondary focus: maximize creator-driven engagement and social shareability."
            ),
            "target_audience": (
                f"Primary Demographic: {audience}.\n"
                f"Aesthetic Preference: Clean, futuristic, high-contrast visual storytelling.\n"
                f"Platform Behavior: Active mobile consumers on Instagram Reels, TikTok, and YouTube."
            ),
            "campaign_concept": (
                f"Core Creative Idea: '{idea}'.\n"
                f"The concept bridges everyday reality with speculative imagination, portraying {product} "
                f"as the catalyst that transforms ordinary experiences into cinematic moments."
            ),
            "key_messages": (
                f"1. {product} delivers unparalleled aesthetic and functional refinement.\n"
                f"2. Built for forward-thinking creators and visionaries.\n"
                f"3. Simplicity, power, and elegance in every interaction."
            ),
            "creative_direction": (
                f"Visual Style: Photorealistic 35mm cinematics, natural volumetric light, rich tactile textures.\n"
                f"Palette: Warm golden accents, deep charcoal slate, soft luminous purples.\n"
                f"Pacing: Snappy 2-second visual hook followed by rhythmic, satisfying editorial flow."
            ),
            "deliverables_and_specs": deliv_summary,
            "creator_eligibility": (
                f"• Verified Level 2+ AI Creators with demonstrated consistency in video/image generation.\n"
                f"• Toolstack proficiency: Midjourney v6, Runway Gen-3, Kling AI, ComfyUI, ElevenLabs.\n"
                f"• Must supply portfolio references exhibiting consistent character and product geometry."
            ),
            "mandatory_requirements": (
                f"• Official {product} logo overlay in intro or outro.\n"
                f"• Clean audio track cleared for commercial digital distribution.\n"
                f"• Inclusion of verified campaign hashtags and direct link-in-bio callout."
            ),
            "content_restrictions": (
                f"• Strict prohibition on warped hands, uncanny valley facial distortion, or jittery artifacts.\n"
                f"• No mentions or visual references to competitor brands.\n"
                f"• Content must remain strictly brand-safe and PG-13."
            ),
            "timeline_and_milestones": (
                f"• Milestone 1 (Day 3): Moodboard, prompt recipe, and initial still frame sign-off.\n"
                f"• Milestone 2 (Day 6): First motion draft submission for feedback.\n"
                f"• Milestone 3 (Day 9): Final revision round and audio sync.\n"
                f"• Milestone 4 (Day 11): Final 4K master asset delivery."
            ),
            "budget_and_compensation": (
                f"Proposed Budget: ${budget_cents / 100:,.2f} USD.\n"
                f"Payment Structure: 50% milestone escrow upon moodboard approval; 50% upon final master acceptance.\n"
                f"Revision Allowance: 2 complete revision rounds within defined project scope."
            ),
            "usage_rights_and_licensing": (
                f"Licensing Scope: Perpetual organic digital usage worldwide.\n"
                f"Paid Advertising: 6-month paid social whitelisting and digital media distribution rights.\n"
                f"Source Files: Prompt workflows and clean video exports provided for brand archive."
            ),
            "submission_requirements": (
                f"• High-bitrate MP4 (H.264 / H.265) and ProRes 422 master files.\n"
                f"• Separate SRT subtitle files for all spoken dialog.\n"
                f"• Clean raw cuts without burned-in text overlays alongside final subtitled cuts."
            ),
            "success_metrics": (
                f"• >50% video completion rate on vertical formats.\n"
                f"• Above-benchmark CTR on paid media ad variants.\n"
                f"• Brand consistency: 100% adherence to palette, lighting, and packaging guidelines."
            ),
            "call_to_action": (
                f"Primary CTA: 'Transform your creative workflow — link in bio to experience {product}.'\n"
                f"Paid Ad Action: 'Learn More' / 'Shop the Collection'."
            ),
        }


ai_brief_service = AIBriefService()
