"""Extensible Question Bank for Creator Capability Assessments.

Contains structured, real-world scenario questions and scoring models.
Supports dynamic specialization branching, difficulty levels, and skill dimensions.
"""

from typing import List, Dict, Any, Optional
from app.schemas.assessment import (
    SurveyQuestion,
    QuestionType,
    QuestionDifficulty,
    SkillDimension,
    QuestionOption,
    SpecializationOption,
)

# 1. SPECIALIZATIONS CATALOG
SPECIALIZATIONS: List[SpecializationOption] = [
    SpecializationOption(
        id="ai_filmmaking",
        name="AI Filmmaking & Cinema",
        description="Cinematic storytelling, multi-scene continuity, camera directing, and narrative film production.",
        icon="Clapperboard",
        popular_tools=["Runway Gen-3", "Kling 1.5", "Midjourney", "ComfyUI", "DaVinci Resolve"],
        primary_dimensions=["cinematography", "consistency", "storytelling", "workflow"],
    ),
    SpecializationOption(
        id="ai_video",
        name="AI Video Generation",
        description="High-motion generative video, commercials, b-roll, visual effects, and music videos.",
        icon="Video",
        popular_tools=["Runway Gen-3", "Luma Dream Machine", "Kling", "Pika 2.0", "Premiere Pro"],
        primary_dimensions=["camera_control", "motion_coherence", "technical", "post_production"],
    ),
    SpecializationOption(
        id="ai_image",
        name="AI Image Generation & Concept Art",
        description="Photorealistic imagery, concept art, editorial visual design, and hyper-detailed key visuals.",
        icon="Image",
        popular_tools=["Midjourney v6", "Flux.1", "ComfyUI", "Stable Diffusion XL", "Photoshop"],
        primary_dimensions=["prompting", "composition", "lighting", "upscaling"],
    ),
    SpecializationOption(
        id="ai_animation",
        name="AI Animation & Motion Design",
        description="Temporal frame-by-frame animation, 2D/3D hybrid motion, anime style, and animated graphics.",
        icon="Film",
        popular_tools=["AnimateDiff", "ComfyUI", "After Effects", "Blender", "Kling"],
        primary_dimensions=["temporal_coherence", "motion_curves", "compositing", "workflow"],
    ),
    SpecializationOption(
        id="ai_advertising",
        name="AI Commercials & Brand Advertising",
        description="Conversion-focused brand commercials, product hero ads, social campaign assets, and brand storytelling.",
        icon="Megaphone",
        popular_tools=["Midjourney", "Runway Gen-3", "ElevenLabs", "Flux", "After Effects"],
        primary_dimensions=["commercial_readiness", "brand_consistency", "multimodal", "problem_solving"],
    ),
    SpecializationOption(
        id="ai_voice",
        name="AI Voice & Audio Production",
        description="Voice synthesis, synthetic audio direction, emotion acting, multilingual lip-sync, and sound design.",
        icon="Mic",
        popular_tools=["ElevenLabs", "Suno v3.5", "Udio", "Audition", "Wav2Lip"],
        primary_dimensions=["voice_direction", "emotion", "audio_engineering", "timing"],
    ),
]

# 2. EXTENSIBLE TOOLS CATALOG
TOOL_CATALOG: List[Dict[str, Any]] = [
    {"id": "runway_gen3", "name": "Runway Gen-3 Alpha", "category": "AI Video", "badge": "Video"},
    {"id": "kling", "name": "Kling 1.5", "category": "AI Video", "badge": "Video"},
    {"id": "luma", "name": "Luma Dream Machine", "category": "AI Video", "badge": "Video"},
    {"id": "midjourney", "name": "Midjourney v6/v7", "category": "AI Image", "badge": "Image"},
    {"id": "flux", "name": "Flux.1 (Dev/Schnell)", "category": "AI Image", "badge": "Image"},
    {"id": "comfyui", "name": "ComfyUI Node Graph", "category": "Workflow / Control", "badge": "Nodes"},
    {"id": "sdxl", "name": "Stable Diffusion XL", "category": "AI Image", "badge": "Open Weights"},
    {"id": "elevenlabs", "name": "ElevenLabs", "category": "AI Voice & Audio", "badge": "Voice"},
    {"id": "suno", "name": "Suno AI v3.5/v4", "category": "AI Voice & Audio", "badge": "Music"},
    {"id": "davinci", "name": "DaVinci Resolve / Studio", "category": "Post-Production", "badge": "Grading"},
    {"id": "premiere", "name": "Adobe Premiere / After Effects", "category": "Post-Production", "badge": "Editing"},
    {"id": "blender", "name": "Blender 3D / Unreal Engine", "category": "3D & Virtual Production", "badge": "3D"},
    {"id": "claude_gpt", "name": "Claude 3.5 Sonnet / GPT-4o", "category": "LLM & Creative Direction", "badge": "LLM"},
]

EXPERIENCE_OPTIONS = [
    "Less than 3 months (Exploring)",
    "3 – 6 months (Practicing)",
    "6 – 12 months (Active Production)",
    "1 – 2 years (Experienced Generative Artist)",
    "2+ years (Early Pioneer & Daily Professional)",
]

# 3. QUESTION DEFINITIONS BANK
# Scoring Rules Map: Maps question_id -> { "correct": [...], "weights": { "dim": weight, ... }, "values": {...} }
QUESTION_SCORING_RULES: Dict[str, Dict[str, Any]] = {
    # Specialization specific: Film
    "film_camera_ctrl": {
        "correct": ["cinematic_motion_curves"],
        "partial": {"camera_prompting": 0.6, "seed_variation": 0.2},
        "dimension": "TECHNICAL",
        "weight": 3,
    },
    "film_char_consistency": {
        "correct": ["ip_adapter_lora_controlnet"],
        "partial": {"reference_image_inpaint": 0.7, "exact_seed_locking": 0.3},
        "dimension": "WORKFLOW",
        "weight": 5,
    },
    "film_motion_artifacts": {
        "correct": ["optical_flow_mask_rife"],
        "partial": {"motion_brush_limit": 0.6, "lower_motion_bucket": 0.5},
        "dimension": "PROBLEM_SOLVING",
        "weight": 4,
    },
    "film_workflow_order": {
        "correct_order": ["concept_storyboard", "keyframe_anchor", "img_to_video", "interpolation_upscale", "grade_master"],
        "dimension": "WORKFLOW",
        "weight": 5,
    },
    # Specialization specific: Image
    "img_composition_control": {
        "correct": ["controlnet_multicondition"],
        "partial": {"regional_prompting": 0.7, "inpaint_canvas": 0.5},
        "dimension": "TECHNICAL",
        "weight": 4,
    },
    "img_consistency_lora": {
        "correct": ["custom_lora_freeze_mask"],
        "partial": {"tile_control_high_weight": 0.7, "strict_negative_weighting": 0.3},
        "dimension": "PROBLEM_SOLVING",
        "weight": 5,
    },
    "img_upscaling_commercial": {
        "correct": ["tile_latent_denoise"],
        "partial": {"topaz_gigapixel": 0.7, "standard_bicubic": 0.1},
        "dimension": "COMMERCIAL",
        "weight": 4,
    },
    # Specialization specific: Animation
    "anim_temporal_coherence": {
        "correct": ["animatediff_context_blend"],
        "partial": {"ebsynth_keyframe_hybrid": 0.8, "high_fps_interpolation": 0.4},
        "dimension": "TECHNICAL",
        "weight": 5,
    },
    "anim_hybrid_pipeline": {
        "correct": ["3d_animatic_depth_canny"],
        "partial": {"video_to_video_low_denoise": 0.6, "rotoscope_ai": 0.5},
        "dimension": "WORKFLOW",
        "weight": 4,
    },
    # Specialization specific: Voice & Audio
    "voice_emotion_direction": {
        "correct": ["ssml_voice_modulation"],
        "partial": {"multiple_take_selection": 0.6, "pacing_punctuation": 0.5},
        "dimension": "CREATIVE",
        "weight": 4,
    },
    "voice_multilingual_lipsync": {
        "correct": ["wav2lip_timing_phoneme"],
        "partial": {"post_cut_retime": 0.6, "stretch_audio": 0.2},
        "dimension": "PROBLEM_SOLVING",
        "weight": 5,
    },
    # Advertising & Commercial
    "ad_brand_guidelines": {
        "correct": ["lut_palette_controlnet_post"],
        "partial": {"strict_prompt_weighting": 0.5, "photoshop_recolor": 0.6},
        "dimension": "COMMERCIAL",
        "weight": 5,
    },
    "comm_client_revision": {
        "correct": ["relight_latent_inpaint_lut"],
        "partial": {"re_render_complete_scene": 0.4, "brightness_curve_overlay": 0.3},
        "dimension": "PROBLEM_SOLVING",
        "weight": 4,
    },
    "comm_deliverable_standards": {
        "correct": ["prores_wav_layered_stems"],
        "partial": {"h265_hq_mp4": 0.6, "standard_youtube_mp4": 0.3},
        "dimension": "COMMERCIAL",
        "weight": 4,
    },
}

QUESTION_BANK_DEFINITIONS: List[Dict[str, Any]] = [
    # -------------------------------------------------------------
    # STAGE 1: CREATOR BASICS & IDENTITY
    # -------------------------------------------------------------
    {
        "id": "creator_display_name",
        "niche": "common",
        "category": "basics",
        "difficulty": QuestionDifficulty.FOUNDATION,
        "type": QuestionType.SHORT_TEXT,
        "question": "What is your creator or studio brand name?",
        "placeholder": "e.g. Apex Synapse Studio / Maya Lin",
        "weight": 1,
        "skill_dimension": SkillDimension.CREATIVE,
        "required": True,
    },
    {
        "id": "self_reported_experience",
        "niche": "common",
        "category": "basics",
        "difficulty": QuestionDifficulty.FOUNDATION,
        "type": QuestionType.SINGLE_CHOICE,
        "question": "How long have you been actively creating generative AI content?",
        "options": [
            {"id": "exp_under_3mo", "label": "Less than 3 months", "description": "Exploring models and foundational prompt craft."},
            {"id": "exp_3_to_6mo", "label": "3 – 6 months", "description": "Building regular workflows and personal experiments."},
            {"id": "exp_6_to_12mo", "label": "6 – 12 months", "description": "Handling client briefs and multi-tool pipelines."},
            {"id": "exp_1_to_2yr", "label": "1 – 2 years", "description": "Established generative artist with consistent client delivery."},
            {"id": "exp_2yr_plus", "label": "2+ years", "description": "Pioneering commercial AI production across image, video, and audio."},
        ],
        "weight": 1,
        "skill_dimension": SkillDimension.COMMERCIAL,
        "required": True,
    },

    # -------------------------------------------------------------
    # STAGE 2: SPECIALIZATION SELECTION
    # -------------------------------------------------------------
    {
        "id": "primary_specialization",
        "niche": "common",
        "category": "specialization",
        "difficulty": QuestionDifficulty.FOUNDATION,
        "type": QuestionType.SINGLE_CHOICE,
        "question": "What is your primary AI creative specialization?",
        "options": [
            {"id": "ai_filmmaking", "label": "AI Filmmaking & Cinema", "description": "Narrative pacing, multi-scene continuity, camera directing."},
            {"id": "ai_video", "label": "AI Video Generation", "description": "High-impact visual effects, b-roll, motion commercials."},
            {"id": "ai_image", "label": "AI Image & Concept Art", "description": "Photoreal key visuals, hyper-detailed composition, packaging."},
            {"id": "ai_animation", "label": "AI Animation & Motion Design", "description": "Stylized motion, frame-to-frame coherence, animated assets."},
            {"id": "ai_advertising", "label": "Commercials & Brand Ads", "description": "Targeted marketing campaigns, product hero visuals, social media."},
            {"id": "ai_voice", "label": "AI Voice & Audio Production", "description": "Voice acting, sound design, music synthesis, multilingual lip-sync."},
        ],
        "weight": 1,
        "skill_dimension": SkillDimension.CREATIVE,
        "required": True,
    },
    {
        "id": "secondary_specializations",
        "niche": "common",
        "category": "specialization",
        "difficulty": QuestionDifficulty.FOUNDATION,
        "type": QuestionType.MULTIPLE_SELECT,
        "question": "Select secondary creative disciplines you actively work in (optional):",
        "options": [
            {"id": "ai_filmmaking", "label": "AI Filmmaking"},
            {"id": "ai_video", "label": "AI Video Generation"},
            {"id": "ai_image", "label": "AI Image & Concept Art"},
            {"id": "ai_animation", "label": "AI Animation"},
            {"id": "ai_advertising", "label": "Brand Advertising"},
            {"id": "ai_voice", "label": "AI Voice & Audio"},
            {"id": "generative_art", "label": "Generative Art & Shaders"},
            {"id": "ai_storytelling", "label": "Creative Scriptwriting & Storyboards"},
        ],
        "weight": 1,
        "skill_dimension": SkillDimension.CREATIVE,
        "required": False,
    },

    # -------------------------------------------------------------
    # STAGE 3: TOOLS CATALOG SELECTION
    # -------------------------------------------------------------
    {
        "id": "tools_selected",
        "niche": "common",
        "category": "tools",
        "difficulty": QuestionDifficulty.INTERMEDIATE,
        "type": QuestionType.MULTIPLE_SELECT,
        "question": "Which generative and production tools do you regularly deploy in your client work?",
        "options": [
            {"id": "runway_gen3", "label": "Runway Gen-3 Alpha", "tag": "Video"},
            {"id": "kling", "label": "Kling 1.5", "tag": "Video"},
            {"id": "luma", "label": "Luma Dream Machine", "tag": "Video"},
            {"id": "midjourney", "label": "Midjourney v6/v7", "tag": "Image"},
            {"id": "flux", "label": "Flux.1 (Dev/Schnell)", "tag": "Image"},
            {"id": "comfyui", "label": "ComfyUI Node Graph", "tag": "Pipeline"},
            {"id": "sdxl", "label": "Stable Diffusion XL", "tag": "Local"},
            {"id": "elevenlabs", "label": "ElevenLabs", "tag": "Audio"},
            {"id": "suno", "label": "Suno AI v3.5/v4", "tag": "Music"},
            {"id": "davinci", "label": "DaVinci Resolve Studio", "tag": "Color/Edit"},
            {"id": "premiere", "label": "Adobe Premiere / After Effects", "tag": "VFX"},
            {"id": "blender", "label": "Blender 3D / Unreal Engine", "tag": "3D"},
            {"id": "claude_gpt", "label": "Claude 3.5 Sonnet / GPT-4o", "tag": "LLM"},
        ],
        "weight": 3,
        "skill_dimension": SkillDimension.TECHNICAL,
        "required": True,
    },

    # -------------------------------------------------------------
    # STAGE 4: ADAPTIVE QUESTIONS (BRANCHED BY SPECIALIZATION)
    # -------------------------------------------------------------

    # === BRANCH: AI FILMMAKING & AI VIDEO ===
    {
        "id": "film_camera_ctrl",
        "niche": "ai_filmmaking",
        "category": "cinematography",
        "difficulty": QuestionDifficulty.INTERMEDIATE,
        "type": QuestionType.SINGLE_CHOICE,
        "question": "When directing a dynamic cinematic tracking shot in AI video generators, which technique yields the most natural lens perspective?",
        "scenario": "You need a cinematic dolly zoom ('Vertigo effect') moving in on an actor while the background expands smoothly without tearing or face warping.",
        "options": [
            {
                "id": "cinematic_motion_curves",
                "label": "Combine precise camera path motion parameters with dual keyframes and motion brush anchor on subject",
                "description": "Isolates subject plane while modulating camera focal distance vector.",
            },
            {
                "id": "camera_prompting",
                "label": "Rely entirely on heavy prompt tokens like 'extreme dolly zoom 35mm mastershot'",
                "description": "Standard prompt injection without keyframe guidance.",
            },
            {
                "id": "seed_variation",
                "label": "Generate 50 random variations with maximum motion intensity until one looks right",
                "description": "Brute-force iteration approach.",
            },
            {
                "id": "post_zoom_scale",
                "label": "Shoot static image and apply 2D scale keyframes in video editing software",
                "description": "2D transformation without true generative perspective shift.",
            },
        ],
        "branch_condition": {"specializations": ["ai_filmmaking", "ai_video"]},
        "weight": 4,
        "skill_dimension": SkillDimension.TECHNICAL,
        "required": True,
    },
    {
        "id": "film_char_consistency",
        "niche": "ai_filmmaking",
        "category": "consistency",
        "difficulty": QuestionDifficulty.ADVANCED,
        "type": QuestionType.SCENARIO,
        "question": "How do you maintain strict actor and wardrobe consistency across 5 distinct narrative scenes (daylight, rain, night interior)?",
        "scenario": "A luxury brand requires the same lead actor in an identical embroidered jacket across 5 narrative scenes. Standard text-to-video prompts cause the face to morph and jacket embroidery to disappear across cuts.",
        "options": [
            {
                "id": "ip_adapter_lora_controlnet",
                "label": "Train a custom character/wardrobe LoRA, deploy IP-Adapter with FaceID embedding, and lock compositional reference frames",
                "description": "Ensures biometric and texture anchors survive dynamic lighting and angle variations.",
            },
            {
                "id": "reference_image_inpaint",
                "label": "Use image-to-video with one single reference photo and hope prompt changes don't distort features",
                "description": "Moderate consistency but prone to lighting mismatch.",
            },
            {
                "id": "exact_seed_locking",
                "label": "Keep the exact same seed number across all scenes while modifying prompt text",
                "description": "Seeds produce chaotic drift when prompts change significantly.",
            },
            {
                "id": "post_face_swap_only",
                "label": "Generate random actors and use basic 2D face-swap tools in post-production",
                "description": "Lacks volumetric depth, lighting integration, and wardrobe consistency.",
            },
        ],
        "branch_condition": {"specializations": ["ai_filmmaking", "ai_video", "ai_advertising"]},
        "weight": 5,
        "skill_dimension": SkillDimension.WORKFLOW,
        "required": True,
    },
    {
        "id": "film_motion_artifacts",
        "niche": "ai_filmmaking",
        "category": "workflow",
        "difficulty": QuestionDifficulty.ADVANCED,
        "type": QuestionType.SINGLE_CHOICE,
        "question": "When an AI video shot displays severe micro-jitter, limb duplication, or temporal ghosting, what is the best remediation pipeline?",
        "options": [
            {
                "id": "optical_flow_mask_rife",
                "label": "Lower motion bucket scale, mask motion zones, and apply optical flow AI interpolation (RIFE/Topaz) in post",
                "description": "Controls model entropy during generation, then reconstructs smooth intermediate vectors.",
            },
            {
                "id": "motion_brush_limit",
                "label": "Double the motion speed slider so artifacts pass by faster",
                "description": "Exacerbates generative artifacts and causes severe tearing.",
            },
            {
                "id": "upscale_sharpen_filter",
                "label": "Apply a heavy sharpening filter to mask motion blur",
                "description": "Accentuates digital noise without addressing temporal incoherence.",
            },
            {
                "id": "lower_fps_export",
                "label": "Export at 12 frames per second to emulate stop-motion animation",
                "description": "Changes creative aesthetic rather than solving artifact fidelity.",
            },
        ],
        "branch_condition": {"specializations": ["ai_filmmaking", "ai_video"]},
        "weight": 4,
        "skill_dimension": SkillDimension.PROBLEM_SOLVING,
        "required": True,
    },
    {
        "id": "film_workflow_order",
        "niche": "ai_filmmaking",
        "category": "workflow",
        "difficulty": QuestionDifficulty.ADVANCED,
        "type": QuestionType.WORKFLOW_ORDERING,
        "question": "Arrange the following 5 production phases in the industry-standard order for commercial AI cinematic creation:",
        "options": [
            {"id": "concept_storyboard", "label": "1. Creative concept formulation & AI storyboard keyframing"},
            {"id": "keyframe_anchor", "label": "2. High-res master character/environment anchor generation"},
            {"id": "img_to_video", "label": "3. Image-to-Video generation with camera motion parameters"},
            {"id": "interpolation_upscale", "label": "4. Temporal interpolation, frame stabilization & 4K upscaling"},
            {"id": "grade_master", "label": "5. Color grading (LUT/ACES), sound stem mix & deliverable packaging"},
        ],
        "branch_condition": {"specializations": ["ai_filmmaking", "ai_video"]},
        "weight": 5,
        "skill_dimension": SkillDimension.WORKFLOW,
        "required": True,
    },

    # === BRANCH: AI IMAGE GENERATION & CONCEPT ART ===
    {
        "id": "img_composition_control",
        "niche": "ai_image",
        "category": "composition",
        "difficulty": QuestionDifficulty.INTERMEDIATE,
        "type": QuestionType.SINGLE_CHOICE,
        "question": "How do you achieve exact multi-subject placement without subject bleeding or prompt confusion in complex commercial visual scenes?",
        "scenario": "A hero image requires a model on the left in yellow silk and a vintage green sports car on the right against a brutalist concrete building.",
        "options": [
            {
                "id": "controlnet_multicondition",
                "label": "Utilize multi-condition ControlNet (OpenPose + Canny/Depth) or regional prompt masking canvas",
                "description": "Isolates latents by spatial bounding boxes, preventing attribute leakage across subjects.",
            },
            {
                "id": "regional_prompting",
                "label": "Write a single prompt describing both subjects in a single sentence separated by commas",
                "description": "Prone to color contamination (e.g. yellow car, green dress).",
            },
            {
                "id": "inpaint_canvas",
                "label": "Generate 100 images hoping the AI organically places both items cleanly",
                "description": "Uncontrolled, inefficient brute-force approach.",
            },
            {
                "id": "extreme_cfg_weight",
                "label": "Increase CFG guidance scale above 20 to enforce strict word compliance",
                "description": "Causes severe latent burning, oversaturation, and artifacting.",
            },
        ],
        "branch_condition": {"specializations": ["ai_image", "ai_advertising"]},
        "weight": 4,
        "skill_dimension": SkillDimension.TECHNICAL,
        "required": True,
    },
    {
        "id": "img_consistency_lora",
        "niche": "ai_image",
        "category": "problem_solving",
        "difficulty": QuestionDifficulty.ADVANCED,
        "type": QuestionType.SCENARIO,
        "question": "A luxury cosmetics client needs 10 lifestyle product shots featuring their exact bottle silhouette and embossed logo. The AI model keeps altering the bottle cap geometry and smudging the typography. What is your fix?",
        "scenario": "Client expects 100% industrial design fidelity for commercial campaign launch.",
        "options": [
            {
                "id": "custom_lora_freeze_mask",
                "label": "Train an object LoRA or composite actual 3D product render on background using depth-guided inpainting with protected alpha mask",
                "description": "Preserves genuine industrial geometry and brand trade dress without AI distortion.",
            },
            {
                "id": "tile_control_high_weight",
                "label": "Add words like 'photorealistic authentic bottle typography' to positive prompt",
                "description": "Diffusion models struggle with precise typographic vectors via text prompting alone.",
            },
            {
                "id": "strict_negative_weighting",
                "label": "Put 'distorted cap, blurry letters' in negative prompt and regenerate",
                "description": "Does not enforce accurate geometric blueprint fidelity.",
            },
            {
                "id": "manual_photoshop_redraw",
                "label": "Hand-redraw the bottle over the generated image in Photoshop entirely",
                "description": "Defeats generative lighting and material integration benefits.",
            },
        ],
        "branch_condition": {"specializations": ["ai_image", "ai_advertising"]},
        "weight": 5,
        "skill_dimension": SkillDimension.PROBLEM_SOLVING,
        "required": True,
    },
    {
        "id": "img_upscaling_commercial",
        "niche": "ai_image",
        "category": "commercial",
        "difficulty": QuestionDifficulty.ADVANCED,
        "type": QuestionType.SINGLE_CHOICE,
        "question": "What is the optimal technique for upscaling a 1024x1024 generative image to 8K print resolution without creating synthetic plastic textures?",
        "options": [
            {
                "id": "tile_latent_denoise",
                "label": "Tiled diffusion upscaler with low denoise (0.2-0.35) combined with natural texture noise injection",
                "description": "Synthesizes micro-details while preserving original macro-composition and skin pores.",
            },
            {
                "id": "topaz_gigapixel",
                "label": "Single-pass bicubic interpolation with unsharp mask filter",
                "description": "Creates blurry pixelation without reconstructing high-frequency details.",
            },
            {
                "id": "standard_bicubic",
                "label": "Standard AI upscaler set to 100% face-recovery strength",
                "description": "Often creates uncanny waxy plastic skin and alien eye artifacts.",
            },
            {
                "id": "high_denoise_rerender",
                "label": "Re-render the entire image with denoise set to 0.8 at 8K resolution",
                "description": "Completely changes the original composition and lighting.",
            },
        ],
        "branch_condition": {"specializations": ["ai_image", "ai_advertising"]},
        "weight": 4,
        "skill_dimension": SkillDimension.COMMERCIAL,
        "required": True,
    },

    # === BRANCH: AI ANIMATION & MOTION DESIGN ===
    {
        "id": "anim_temporal_coherence",
        "niche": "ai_animation",
        "category": "workflow",
        "difficulty": QuestionDifficulty.ADVANCED,
        "type": QuestionType.SINGLE_CHOICE,
        "question": "How do you eliminate inter-frame flicker in stylized AI character animation sequences?",
        "scenario": "An animated music video sequence has beautiful painterly frames, but during playback at 24fps the lineart vibrates intensely between frames.",
        "options": [
            {
                "id": "animatediff_context_blend",
                "label": "Apply AnimateDiff motion modules with overlapping context windows and optical-flow temporal deflickering (e.g. EBsynth or Deflicker AI)",
                "description": "Synchronizes latent transitions across time steps.",
            },
            {
                "id": "ebsynth_keyframe_hybrid",
                "label": "Simply lower frame rate to 8fps and add heavy motion blur",
                "description": "Hides problem rather than providing clean animation continuity.",
            },
            {
                "id": "high_fps_interpolation",
                "label": "Increase CFG scale to lock prompts tighter per frame",
                "description": "Increases per-frame variance and intensifies flickering.",
            },
            {
                "id": "manual_frame_export",
                "label": "Export frames as JPEG with maximum compression",
                "description": "Introduces compression artifacts without fixing temporal jitter.",
            },
        ],
        "branch_condition": {"specializations": ["ai_animation"]},
        "weight": 5,
        "skill_dimension": SkillDimension.TECHNICAL,
        "required": True,
    },
    {
        "id": "anim_hybrid_pipeline",
        "niche": "ai_animation",
        "category": "workflow",
        "difficulty": QuestionDifficulty.ADVANCED,
        "type": QuestionType.SCENARIO,
        "question": "Which hybrid workflow provides the highest precision for animated commercial characters interacting with real 3D camera sweeps?",
        "scenario": "Client wants an anime-style pilot character to execute an acrobatic flip inside a complex geometric hangar while camera orbits 360 degrees.",
        "options": [
            {
                "id": "3d_animatic_depth_canny",
                "label": "Block rough motion in 3D (Blender/Unreal), pass depth & lineart maps through ControlNet, and composite neural textures",
                "description": "Guarantees mathematically exact spatial perspective while retaining stylized generative aesthetics.",
            },
            {
                "id": "video_to_video_low_denoise",
                "label": "Type 'acrobatic 360 camera flip' in a pure text-to-video generator repeatedly",
                "description": "Impossible to reliably direct exact camera trajectory and choreography.",
            },
            {
                "id": "rotoscope_ai",
                "label": "Generate static drawings and apply morphing mesh warps in 2D",
                "description": "Lacks true 3D foreshortening and lighting responsiveness.",
            },
            {
                "id": "ai_upscale_only",
                "label": "Draw entire sequence by hand frame-by-frame and use AI only for upscaling",
                "description": "Traditional 2D pipeline without generative velocity.",
            },
        ],
        "branch_condition": {"specializations": ["ai_animation"]},
        "weight": 4,
        "skill_dimension": SkillDimension.WORKFLOW,
        "required": True,
    },

    # === BRANCH: AI VOICE & AUDIO PRODUCTION ===
    {
        "id": "voice_emotion_direction",
        "niche": "ai_voice",
        "category": "voice_direction",
        "difficulty": QuestionDifficulty.INTERMEDIATE,
        "type": QuestionType.SINGLE_CHOICE,
        "question": "How do you direct subtle emotional transitions (e.g. from whisper to urgent conviction) in AI voice models without synthetic robotic clipping?",
        "options": [
            {
                "id": "ssml_voice_modulation",
                "label": "Segment vocal lines by emotional beat, modulate stability/clarity sliders per beat, and utilize punctuation & SSML prosody pacing",
                "description": "Prevents voice model flattening by tailoring generation parameters to narrative arc.",
            },
            {
                "id": "multiple_take_selection",
                "label": "Paste entire script in one continuous block with default voice settings",
                "description": "Produces monotone delivery across emotional shifts.",
            },
            {
                "id": "pacing_punctuation",
                "label": "Pitch-shift the audio in DAW after generation by 4 semitones",
                "description": "Distorts voice timbre into unnatural robotic artifacts.",
            },
            {
                "id": "compression_boost",
                "label": "Apply a hard brickwall limiter to normalize volume levels",
                "description": "Addresses volume only, not emotional inflection or performance.",
            },
        ],
        "branch_condition": {"specializations": ["ai_voice"]},
        "weight": 4,
        "skill_dimension": SkillDimension.CREATIVE,
        "required": True,
    },
    {
        "id": "voice_multilingual_lipsync",
        "niche": "ai_voice",
        "category": "problem_solving",
        "difficulty": QuestionDifficulty.ADVANCED,
        "type": QuestionType.SCENARIO,
        "question": "You are localizing a 30-second CEO keynote video from English into Spanish and Japanese. The translated Spanish audio is 25% longer than the video cut. How do you synchronize mouth shapes and timing naturally?",
        "options": [
            {
                "id": "wav2lip_timing_phoneme",
                "label": "Adjust translation syllable count for timing match, generate synchronized vocal track, and re-synthesize video facial phonemes (LivePortrait/Wav2Lip)",
                "description": "Industry-standard localization preserving natural speech rate and visual lip cadence.",
            },
            {
                "id": "post_cut_retime",
                "label": "Speed up the Spanish voiceover by 130% so it squeezes into the original duration",
                "description": "Results in unnaturally rapid, unintelligible dialogue.",
            },
            {
                "id": "stretch_audio",
                "label": "Freeze video frames on the CEO's face to wait for speech to finish",
                "description": "Creates awkward frozen visual pauses in commercial broadcast.",
            },
            {
                "id": "subtitles_only",
                "label": "Mute video and display text subtitles instead",
                "description": "Fails the dubbing and lip-sync deliverable brief.",
            },
        ],
        "branch_condition": {"specializations": ["ai_voice"]},
        "weight": 5,
        "skill_dimension": SkillDimension.PROBLEM_SOLVING,
        "required": True,
    },

    # -------------------------------------------------------------
    # STAGE 5: COMMERCIAL READINESS & CLIENT WORKFLOW (COMMON TO ALL)
    # -------------------------------------------------------------
    {
        "id": "ad_brand_guidelines",
        "niche": "common",
        "category": "commercial",
        "difficulty": QuestionDifficulty.INTERMEDIATE,
        "type": QuestionType.SCENARIO,
        "question": "A global brand gives you strict brand guidelines: primary color #6366F1, clean minimalist tone, zero dark/moody shadows. Raw AI video generations keep returning dark cyberpunk aesthetics. How do you enforce compliance?",
        "options": [
            {
                "id": "lut_palette_controlnet_post",
                "label": "Use color-palette guidance in initial latents, negative prompt dark/cyberpunk styles, and apply a bespoke brand Color LUT in grading",
                "description": "Binds generation to brand color space at both generative and grading stages.",
            },
            {
                "id": "strict_prompt_weighting",
                "label": "Add 'purple brand #6366F1' into prompt and hope the model interprets hex colors",
                "description": "Diffusion models do not accurately calculate exact RGB/Hex color coordinates.",
            },
            {
                "id": "photoshop_recolor",
                "label": "Submit the cyberpunk video and advise client that AI has an artistic mind of its own",
                "description": "Unacceptable for professional enterprise client engagements.",
            },
            {
                "id": "grayscale_recolor",
                "label": "Generate in black and white and tint with a solid color wash",
                "description": "Destroys lighting depth and realism.",
            },
        ],
        "weight": 5,
        "skill_dimension": SkillDimension.COMMERCIAL,
        "required": True,
    },
    {
        "id": "comm_client_revision",
        "niche": "common",
        "category": "problem_solving",
        "difficulty": QuestionDifficulty.ADVANCED,
        "type": QuestionType.SCENARIO,
        "question": "A brand client requests an emergency lighting revision 3 hours before a live broadcast: change golden hour sunlight to an overcast moody morning without changing the approved actor's performance or blocking. What is your fastest reliable workflow?",
        "options": [
            {
                "id": "relight_latent_inpaint_lut",
                "label": "Deploy IC-Light or Depth-guided relighting workflow with overcast HDRI map, preserving motion mask & grade in timeline",
                "description": "Relights underlying textures while preserving locked acting choreography.",
            },
            {
                "id": "re_render_complete_scene",
                "label": "Rerun the entire video from scratch with 'overcast' prompt and deliver whatever comes out",
                "description": "Breaks approved blocking and actor performance.",
            },
            {
                "id": "brightness_curve_overlay",
                "label": "Drop brightness slider in editing app to 50%",
                "description": "Produces muddy grey shadows without authentic sky ambient changes.",
            },
            {
                "id": "refuse_request",
                "label": "Tell the client generative AI cannot do revisions under any circumstances",
                "description": "Fails professional agency SLA expectations.",
            },
        ],
        "weight": 4,
        "skill_dimension": SkillDimension.PROBLEM_SOLVING,
        "required": True,
    },
    {
        "id": "comm_deliverable_standards",
        "niche": "common",
        "category": "commercial",
        "difficulty": QuestionDifficulty.INTERMEDIATE,
        "type": QuestionType.SINGLE_CHOICE,
        "question": "What standard deliverable package should an agency expect when commissioning an AI commercial video campaign?",
        "options": [
            {
                "id": "prores_wav_layered_stems",
                "label": "Master Apple ProRes 422HQ (or 4444), uncompressed 24-bit 48kHz WAV audio stems, clean textless plate, and 9:16 vertical crop",
                "description": "Professional commercial broadcast standard ready for agency finishing and ad networks.",
            },
            {
                "id": "h265_hq_mp4",
                "label": "Single compressed H.264 MP4 file at 720p with hardcoded subtitles",
                "description": "Insufficient bitrate and flexibility for agency post-production.",
            },
            {
                "id": "standard_youtube_mp4",
                "label": "Direct download link from the AI generator's web interface",
                "description": "Uncurated raw artifact lacking mastering, audio sync, or grading.",
            },
            {
                "id": "screenshot_sequence",
                "label": "A series of PNG screenshots from the video",
                "description": "Not a valid video deliverable.",
            },
        ],
        "weight": 4,
        "skill_dimension": SkillDimension.COMMERCIAL,
        "required": True,
    },
    {
        "id": "comm_turnaround_confidence",
        "niche": "common",
        "category": "confidence",
        "difficulty": QuestionDifficulty.FOUNDATION,
        "type": QuestionType.CONFIDENCE_SCALE,
        "question": "On a scale of 1 to 5, how confident are you in delivering an end-to-end commercial AI brief (concept, visual generation, audio, color grade, delivery) within 4 business days?",
        "min_rating": 1,
        "max_rating": 5,
        "weight": 2,
        "skill_dimension": SkillDimension.WORKFLOW,
        "required": True,
    },
]


class QuestionBankService:
    """Provides filtered, specialization-adaptive question subsets."""

    @staticmethod
    def get_specializations() -> List[SpecializationOption]:
        return SPECIALIZATIONS

    @staticmethod
    def get_tool_catalog() -> List[Dict[str, Any]]:
        return TOOL_CATALOG

    @staticmethod
    def get_experience_options() -> List[str]:
        return EXPERIENCE_OPTIONS

    @staticmethod
    def get_adaptive_questions(
        primary_specialization: Optional[str] = None,
        include_common: bool = True,
    ) -> List[SurveyQuestion]:
        """
        Dynamically filters question bank based on creator's chosen specialization.
        Always includes foundation, basics, tools, and commercial readiness questions,
        while adapting technical scenario questions to the specific niche.
        """
        filtered_questions: List[SurveyQuestion] = []

        for q_def in QUESTION_BANK_DEFINITIONS:
            branch = q_def.get("branch_condition")

            # Check branch condition
            if branch and "specializations" in branch:
                if not primary_specialization:
                    # If not specified yet, show general or skip until chosen
                    continue
                if primary_specialization not in branch["specializations"]:
                    continue

            # Check niche match
            if q_def["niche"] != "common" and primary_specialization and q_def["niche"] != primary_specialization:
                # If question is explicitly locked to another niche
                branch_specs = branch.get("specializations", []) if branch else []
                if primary_specialization not in branch_specs:
                    continue

            options = [QuestionOption(**opt) for opt in q_def.get("options", [])]
            question = SurveyQuestion(
                id=q_def["id"],
                niche=q_def["niche"],
                category=q_def["category"],
                difficulty=q_def["difficulty"],
                type=q_def["type"],
                question=q_def["question"],
                scenario=q_def.get("scenario"),
                options=options,
                weight=q_def.get("weight", 1),
                skill_dimension=q_def["skill_dimension"],
                branch_condition=q_def.get("branch_condition"),
                placeholder=q_def.get("placeholder"),
                min_rating=q_def.get("min_rating"),
                max_rating=q_def.get("max_rating"),
                required=q_def.get("required", True),
            )
            filtered_questions.append(question)

        return filtered_questions


question_bank = QuestionBankService()
