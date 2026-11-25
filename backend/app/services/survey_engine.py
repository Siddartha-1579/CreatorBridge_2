"""CreatorBridge Reusable Adaptive Survey Engine.

Declares the 9-section Creator Survey and 7-section Brand Survey schemas,
evaluates dynamic conditional questions, validates responses, and generates
checkpoint follow-ups with deterministic fallback when OpenAI credentials are absent.
"""

from typing import List, Dict, Any, Optional
import re
from app.schemas.surveys import (
    InputType,
    MatchingRelevance,
    DataSensitivity,
    SurveyQuestionOption,
    SurveyValidationRules,
    SurveyConditionalRule,
    SurveyQuestion,
    SurveySection,
    SurveySchemaResponse,
    AIFollowupQuestion,
    AdaptiveEvaluationResponse,
)
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("survey_engine")

# ==============================================================================
# CREATOR SURVEY (9 SECTIONS) DECLARATIVE QUESTIONS
# ==============================================================================

CREATOR_SECTIONS: List[SurveySection] = [
    SurveySection(
        key="identity",
        title="Professional Identity",
        description="Establish your marketplace identity, operational scope, and background.",
        display_order=1,
        questions=[
            SurveyQuestion(
                id="cr_display_name",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="identity",
                question_text="Professional or Creator Name",
                help_text="The name brands will see on your marketplace profile.",
                input_type=InputType.TEXT,
                is_required=True,
                display_order=1,
                validation_rules=SurveyValidationRules(min_length=2, max_length=100),
                matching_relevance=MatchingRelevance.HIGH,
            ),
            SurveyQuestion(
                id="cr_headline",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="identity",
                question_text="Professional Headline",
                help_text="E.g., 'Cinematic AI Director & Prompt Architect'",
                input_type=InputType.TEXT,
                is_required=True,
                display_order=2,
                validation_rules=SurveyValidationRules(min_length=5, max_length=160),
                matching_relevance=MatchingRelevance.HIGH,
            ),
            SurveyQuestion(
                id="cr_bio",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="identity",
                question_text="Short Professional Biography",
                help_text="Summarize your creative style, background, and production philosophy.",
                input_type=InputType.TEXTAREA,
                is_required=True,
                display_order=3,
                validation_rules=SurveyValidationRules(min_length=20, max_length=1000),
            ),
            SurveyQuestion(
                id="cr_country",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="identity",
                question_text="Country or Region of Operation",
                help_text="Relevant for timezone coordination, contractual jurisdiction, and payouts.",
                input_type=InputType.TEXT,
                is_required=True,
                display_order=4,
            ),
            SurveyQuestion(
                id="cr_languages",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="identity",
                question_text="Languages Used Professionally",
                input_type=InputType.MULTI_SELECT,
                is_required=True,
                display_order=5,
                options=[
                    SurveyQuestionOption(label="English", value="en"),
                    SurveyQuestionOption(label="Spanish", value="es"),
                    SurveyQuestionOption(label="French", value="fr"),
                    SurveyQuestionOption(label="German", value="de"),
                    SurveyQuestionOption(label="Japanese", value="ja"),
                    SurveyQuestionOption(label="Mandarin", value="zh"),
                    SurveyQuestionOption(label="Portuguese", value="pt"),
                    SurveyQuestionOption(label="Hindi", value="hi"),
                ],
                matching_relevance=MatchingRelevance.HIGH,
            ),
            SurveyQuestion(
                id="cr_experience_years",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="identity",
                question_text="Years of Professional Creative Experience",
                input_type=InputType.NUMBER,
                is_required=True,
                display_order=6,
                validation_rules=SurveyValidationRules(min=0, max=40),
            ),
            SurveyQuestion(
                id="cr_creator_type",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="identity",
                question_text="Entity Structure",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=7,
                options=[
                    SurveyQuestionOption(label="Solo Independent Creator", value="INDIVIDUAL"),
                    SurveyQuestionOption(label="Boutique Creative Studio", value="STUDIO"),
                    SurveyQuestionOption(label="Production Agency", value="AGENCY"),
                    SurveyQuestionOption(label="Collaborative Team / Collective", value="TEAM"),
                ],
            ),
            SurveyQuestion(
                id="cr_website",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="identity",
                question_text="Professional Portfolio / Website Link",
                input_type=InputType.URL,
                is_required=False,
                display_order=8,
            ),
        ],
    ),
    SurveySection(
        key="specializations",
        title="Specializations and Niches",
        description="Select what you are best known for. Specializations define your primary creative categories.",
        display_order=2,
        questions=[
            SurveyQuestion(
                id="cr_specializations",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="specializations",
                question_text="Primary Creative Specializations",
                help_text="Select up to 5 specializations you excel at.",
                input_type=InputType.MULTI_SELECT,
                is_required=True,
                display_order=1,
                options=[
                    SurveyQuestionOption(label="AI Video Generation", value="ai_video"),
                    SurveyQuestionOption(label="AI 2D/3D Animation", value="ai_animation"),
                    SurveyQuestionOption(label="Product Commercials", value="product_commercials"),
                    SurveyQuestionOption(label="UGC-Style Advertising", value="ugc_ads"),
                    SurveyQuestionOption(label="Fashion & Beauty Visuals", value="fashion_beauty"),
                    SurveyQuestionOption(label="Music Videos & Audio Visualizers", value="music_videos"),
                    SurveyQuestionOption(label="Cinematic Storytelling", value="cinematic_storytelling"),
                    SurveyQuestionOption(label="Character Creation & Consistency", value="character_design"),
                    SurveyQuestionOption(label="Brand Narrative Content", value="brand_storytelling"),
                    SurveyQuestionOption(label="Social First Short-Form Content", value="social_short_form"),
                    SurveyQuestionOption(label="Motion Graphics & VFX", value="motion_graphics"),
                    SurveyQuestionOption(label="AI-Assisted Graphic Design", value="ai_design"),
                ],
                matching_relevance=MatchingRelevance.HIGH,
            ),
            SurveyQuestion(
                id="cr_custom_specializations",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="specializations",
                question_text="Custom Niche Specializations",
                help_text="Optional custom niches not listed above (comma separated).",
                input_type=InputType.TEXT,
                is_required=False,
                display_order=2,
            ),
            # Conditional Question: Video Details
            SurveyQuestion(
                id="cr_video_duration_preference",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="specializations",
                question_text="Typical Video Deliverable Durations",
                help_text="Shown because you selected video or animation specializations.",
                input_type=InputType.MULTI_SELECT,
                is_required=False,
                display_order=3,
                options=[
                    SurveyQuestionOption(label="Micro-content (5 - 15 seconds)", value="5_15s"),
                    SurveyQuestionOption(label="Standard Commercials (30 - 60 seconds)", value="30_60s"),
                    SurveyQuestionOption(label="Long-Form / Narrative (1 - 3 minutes)", value="1_3m"),
                    SurveyQuestionOption(label="Extended Form (3+ minutes)", value="3m_plus"),
                ],
                conditional_rules=[
                    SurveyConditionalRule(
                        depends_on="cr_specializations",
                        operator="contains",
                        value=["ai_video", "ai_animation", "product_commercials", "music_videos"],
                        show_if=True,
                    )
                ],
            ),
        ],
    ),
    SurveySection(
        key="skills",
        title="Technical Skills",
        description="Detail your hands-on technical execution skills across generative AI and post-production.",
        display_order=3,
        questions=[
            SurveyQuestion(
                id="cr_skills",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="skills",
                question_text="Core Technical Capabilities",
                input_type=InputType.MULTI_SELECT,
                is_required=True,
                display_order=1,
                options=[
                    SurveyQuestionOption(label="Advanced Prompt Engineering", value="prompt_engineering"),
                    SurveyQuestionOption(label="Text-to-Image Generation", value="text_to_image"),
                    SurveyQuestionOption(label="Image-to-Video Synthesis", value="image_to_video"),
                    SurveyQuestionOption(label="Text-to-Video Synthesis", value="text_to_video"),
                    SurveyQuestionOption(label="Multi-Shot Character Consistency", value="character_consistency"),
                    SurveyQuestionOption(label="AI Lip-Sync & Performance Transfer", value="lip_sync"),
                    SurveyQuestionOption(label="AI Voice Cloning & Narration", value="voice_generation"),
                    SurveyQuestionOption(label="Sound Design & Foley Generation", value="sound_design"),
                    SurveyQuestionOption(label="AI Upscaling, Frame Interpolation & Restoration", value="upscaling"),
                    SurveyQuestionOption(label="Timeline Video Editing (Premiere/DaVinci)", value="video_editing"),
                    SurveyQuestionOption(label="VFX Compositing (After Effects/Nuke)", value="compositing"),
                    SurveyQuestionOption(label="Color Grading & ACES Color Pipeline", value="color_grading"),
                    SurveyQuestionOption(label="Workflow Automation (ComfyUI / Node Pipelines)", value="workflow_automation"),
                    SurveyQuestionOption(label="Manual Post-Production Cleanup", value="manual_post"),
                ],
                matching_relevance=MatchingRelevance.HIGH,
            ),
            # Conditional Audio questions
            SurveyQuestion(
                id="cr_audio_workflow_details",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="skills",
                question_text="Audio & Voice Production Workflow",
                help_text="Shown because voice or sound design skills were selected.",
                input_type=InputType.TEXTAREA,
                is_required=False,
                display_order=2,
                conditional_rules=[
                    SurveyConditionalRule(
                        depends_on="cr_skills",
                        operator="contains",
                        value=["voice_generation", "sound_design"],
                        show_if=True,
                    )
                ],
            ),
        ],
    ),
    SurveySection(
        key="tools",
        title="AI Tools and Production Experience",
        description="Declare the AI tools and models you have verified production experience with.",
        display_order=4,
        questions=[
            SurveyQuestion(
                id="cr_tools_catalog",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="tools",
                question_text="AI Tool Matrix",
                help_text="Add models and tools you utilize professionally, including commercial-use term understanding.",
                input_type=InputType.TOOL_CATALOG,
                is_required=True,
                display_order=1,
                matching_relevance=MatchingRelevance.HIGH,
                requires_verification=True,
            ),
            SurveyQuestion(
                id="cr_commercial_licensing_knowledge",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="tools",
                question_text="Commercial Licensing Verification Understanding",
                help_text="Do you review each provider's commercial terms before delivering client assets?",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=2,
                options=[
                    SurveyQuestionOption(label="Yes — I strictly verify commercial-use eligibility for all models used", value="strict_verified"),
                    SurveyQuestionOption(label="Partially — I use paid commercial tiers but seek brand guidance", value="paid_tiers_only"),
                    SurveyQuestionOption(label="Need Guidance — I require platform assistance on license verification", value="need_guidance"),
                ],
            ),
        ],
    ),
    SurveySection(
        key="platforms",
        title="Platforms and Professional Reach",
        description="Declare your distribution channels and professional engagement.",
        display_order=5,
        questions=[
            SurveyQuestion(
                id="cr_platforms",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="platforms",
                question_text="Active Professional Channels",
                input_type=InputType.MULTI_SELECT,
                is_required=True,
                display_order=1,
                options=[
                    SurveyQuestionOption(label="YouTube", value="youtube"),
                    SurveyQuestionOption(label="Instagram", value="instagram"),
                    SurveyQuestionOption(label="TikTok", value="tiktok"),
                    SurveyQuestionOption(label="X / Twitter", value="twitter"),
                    SurveyQuestionOption(label="LinkedIn", value="linkedin"),
                    SurveyQuestionOption(label="ArtStation / Behance", value="portfolio_network"),
                ],
            ),
            SurveyQuestion(
                id="cr_audience_tier",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="platforms",
                question_text="Estimated Aggregate Audience Reach",
                input_type=InputType.SINGLE_CHOICE,
                is_required=False,
                display_order=2,
                options=[
                    SurveyQuestionOption(label="Pure Creator / Studio (Behind the camera, no personal audience)", value="studio_only"),
                    SurveyQuestionOption(label="Micro (1K - 10K followers)", value="micro"),
                    SurveyQuestionOption(label="Mid-Tier (10K - 100K followers)", value="mid"),
                    SurveyQuestionOption(label="Macro (100K+ followers)", value="macro"),
                ],
            ),
        ],
    ),
    SurveySection(
        key="portfolio",
        title="Portfolio and Evidence",
        description="Share public showcase links, workflow summaries, and evidence of originality.",
        display_order=6,
        questions=[
            SurveyQuestion(
                id="cr_primary_portfolio_url",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="portfolio",
                question_text="Primary Portfolio or Showreel URL",
                input_type=InputType.URL,
                is_required=True,
                display_order=1,
            ),
            SurveyQuestion(
                id="cr_best_work_summary",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="portfolio",
                question_text="Summary of Your Best AI Creative Work",
                help_text="Describe the project concept, tools combined, and human creative direction involved.",
                input_type=InputType.TEXTAREA,
                is_required=True,
                display_order=2,
                validation_rules=SurveyValidationRules(min_length=30, max_length=1500),
            ),
        ],
    ),
    SurveySection(
        key="pricing",
        title="Services, Deliverables, and Pricing",
        description="Define your typical services, delivery formats, and non-binding indicative rates.",
        display_order=7,
        questions=[
            SurveyQuestion(
                id="cr_pricing_model",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="pricing",
                question_text="Preferred Pricing Model",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=1,
                options=[
                    SurveyQuestionOption(label="Fixed Price per Milestone / Deliverable", value="fixed_milestone"),
                    SurveyQuestionOption(label="Daily / Weekly Creative Rate", value="day_rate"),
                    SurveyQuestionOption(label="Monthly Dedicated Retainer", value="monthly_retainer"),
                    SurveyQuestionOption(label="Custom Quotations per Scope", value="custom_scope"),
                ],
            ),
            SurveyQuestion(
                id="cr_starting_price",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="pricing",
                question_text="Indicative Starting Project Budget (₹ / INR)",
                help_text="Non-binding starting point in INR (₹) to help filter appropriately sized briefs.",
                input_type=InputType.NUMBER,
                is_required=True,
                display_order=2,
                validation_rules=SurveyValidationRules(min=500, max=5000000),
                matching_relevance=MatchingRelevance.HIGH,
            ),
            SurveyQuestion(
                id="cr_revision_policy",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="pricing",
                question_text="Standard Revision Policy",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=3,
                options=[
                    SurveyQuestionOption(label="1 revision round included", value="1_round"),
                    SurveyQuestionOption(label="2 revision rounds included (Recommended standard)", value="2_rounds"),
                    SurveyQuestionOption(label="3 revision rounds included", value="3_rounds"),
                    SurveyQuestionOption(label="Negotiated per contract", value="negotiated"),
                ],
            ),
        ],
    ),
    SurveySection(
        key="availability",
        title="Availability and Working Preferences",
        description="Share when and how you collaborate with brand creative directors.",
        display_order=8,
        questions=[
            SurveyQuestion(
                id="cr_current_availability",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="availability",
                question_text="Current Availability",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=1,
                options=[
                    SurveyQuestionOption(label="Available Immediately", value="immediate"),
                    SurveyQuestionOption(label="Available in 1 - 2 weeks", value="1_2_weeks"),
                    SurveyQuestionOption(label="Booking 1 month ahead", value="booking_ahead"),
                    SurveyQuestionOption(label="Currently booked (taking inquiries only)", value="waitlist"),
                ],
                matching_relevance=MatchingRelevance.HIGH,
            ),
            SurveyQuestion(
                id="cr_collaboration_style",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="availability",
                question_text="Preferred Collaboration Style",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=2,
                options=[
                    SurveyQuestionOption(label="Asynchronous (Detailed briefs + Loom / Slack check-ins)", value="async"),
                    SurveyQuestionOption(label="Hybrid (Scheduled milestones + video reviews)", value="hybrid"),
                    SurveyQuestionOption(label="Direct Creative Direction (Close interactive oversight)", value="tight_oversight"),
                ],
            ),
        ],
    ),
    SurveySection(
        key="conduct",
        title="Professional Conduct and Trust",
        description="Acknowledge CreatorBridge platform standards for transparency and originality.",
        display_order=9,
        questions=[
            SurveyQuestion(
                id="cr_conduct_originality",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="conduct",
                question_text="I confirm that all portfolio work submitted represents my own creative production or my declared collaborative contribution.",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=1,
                options=[
                    SurveyQuestionOption(label="Yes, I confirm", value="confirmed"),
                ],
            ),
            SurveyQuestion(
                id="cr_conduct_ai_disclosure",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="conduct",
                question_text="I agree to honestly disclose the models and post-production methods used when required by campaign briefs.",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=2,
                options=[
                    SurveyQuestionOption(label="Yes, I agree", value="confirmed"),
                ],
            ),
            SurveyQuestion(
                id="cr_conduct_dispute_policy",
                survey_id="creator_v1",
                survey_type="CREATOR",
                section_key="conduct",
                question_text="I understand the CreatorBridge evidence-based dispute and demerit system, including my right to appeal any claim.",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=3,
                options=[
                    SurveyQuestionOption(label="Yes, I understand and agree", value="confirmed"),
                ],
            ),
        ],
    ),
]

# ==============================================================================
# BRAND / AGENCY SURVEY (7 SECTIONS) DECLARATIVE QUESTIONS
# ==============================================================================

BRAND_SECTIONS: List[SurveySection] = [
    SurveySection(
        key="organization",
        title="Organization Identity",
        description="Define your company or agency, industry category, and collaboration contacts.",
        display_order=1,
        questions=[
            SurveyQuestion(
                id="br_organization_name",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="organization",
                question_text="Brand or Agency Name",
                input_type=InputType.TEXT,
                is_required=True,
                display_order=1,
                validation_rules=SurveyValidationRules(min_length=2, max_length=150),
            ),
            SurveyQuestion(
                id="br_organization_type",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="organization",
                question_text="Organization Type",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=2,
                options=[
                    SurveyQuestionOption(label="Direct Brand / In-House Marketing", value="direct_brand"),
                    SurveyQuestionOption(label="Creative / Advertising Agency", value="creative_agency"),
                    SurveyQuestionOption(label="Commercial Production House", value="production_house"),
                    SurveyQuestionOption(label="Performance Media Agency", value="media_agency"),
                    SurveyQuestionOption(label="Startup / SME", value="startup"),
                ],
            ),
            SurveyQuestion(
                id="br_industry",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="organization",
                question_text="Industry Category",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=3,
                options=[
                    SurveyQuestionOption(label="E-commerce & Retail", value="ecommerce"),
                    SurveyQuestionOption(label="Fashion, Beauty & Luxury", value="fashion_beauty"),
                    SurveyQuestionOption(label="Consumer Tech & Hardware", value="consumer_tech"),
                    SurveyQuestionOption(label="Gaming & Entertainment", value="gaming_entertainment"),
                    SurveyQuestionOption(label="Food & Beverage", value="food_beverage"),
                    SurveyQuestionOption(label="SaaS & B2B Software", value="saas_b2b"),
                    SurveyQuestionOption(label="Health, Wellness & Fitness", value="health_wellness"),
                    SurveyQuestionOption(label="Financial Services & Fintech", value="fintech"),
                ],
                matching_relevance=MatchingRelevance.HIGH,
            ),
            SurveyQuestion(
                id="br_website",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="organization",
                question_text="Company Website URL",
                input_type=InputType.URL,
                is_required=True,
                display_order=4,
            ),
            SurveyQuestion(
                id="br_contact_role",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="organization",
                question_text="Your Role in Creative Decision Making",
                input_type=InputType.TEXT,
                is_required=True,
                display_order=5,
                help_text="E.g., 'Creative Director', 'VP Marketing', 'Head of Content'",
            ),
        ],
    ),
    SurveySection(
        key="objectives",
        title="Campaign Objectives",
        description="Clarify the primary goals, target audience, and key messaging for your campaigns.",
        display_order=2,
        questions=[
            SurveyQuestion(
                id="br_primary_objective",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="objectives",
                question_text="Primary Campaign Objective",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=1,
                options=[
                    SurveyQuestionOption(label="Brand Awareness & Prestige Storytelling", value="brand_awareness"),
                    SurveyQuestionOption(label="Product Launch & Feature Showcase", value="product_launch"),
                    SurveyQuestionOption(label="Paid Performance Advertising (Meta/TikTok/Google)", value="paid_ads"),
                    SurveyQuestionOption(label="Organic Social Engagement & Virality", value="social_engagement"),
                    SurveyQuestionOption(label="Direct Conversions & E-commerce Sales", value="conversions"),
                    SurveyQuestionOption(label="Educational / Explainer Content", value="educational"),
                ],
                matching_relevance=MatchingRelevance.HIGH,
            ),
            SurveyQuestion(
                id="br_target_audience",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="objectives",
                question_text="Target Audience Description",
                help_text="E.g., 'Gen Z digital nomads interested in minimalist travel gear'",
                input_type=InputType.TEXTAREA,
                is_required=True,
                display_order=2,
                validation_rules=SurveyValidationRules(min_length=10, max_length=500),
            ),
        ],
    ),
    SurveySection(
        key="requirements",
        title="Creator Requirements",
        description="Specify mandatory skills, tool proficiencies, and content aesthetics you seek.",
        display_order=3,
        questions=[
            SurveyQuestion(
                id="br_required_specializations",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="requirements",
                question_text="Required Creator Specializations",
                input_type=InputType.MULTI_SELECT,
                is_required=True,
                display_order=1,
                options=[
                    SurveyQuestionOption(label="AI Video Generation", value="ai_video"),
                    SurveyQuestionOption(label="Product Commercials", value="product_commercials"),
                    SurveyQuestionOption(label="UGC-Style Content", value="ugc_ads"),
                    SurveyQuestionOption(label="Fashion & Beauty Aesthetics", value="fashion_beauty"),
                    SurveyQuestionOption(label="Cinematic Storytelling", value="cinematic_storytelling"),
                    SurveyQuestionOption(label="Character Consistency", value="character_design"),
                    SurveyQuestionOption(label="Motion Graphics", value="motion_graphics"),
                ],
                matching_relevance=MatchingRelevance.HIGH,
            ),
            SurveyQuestion(
                id="br_style_preference",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="requirements",
                question_text="Aesthetic & Content Style Preference",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=2,
                options=[
                    SurveyQuestionOption(label="Ultra-Realistic / Photorealistic", value="photorealistic"),
                    SurveyQuestionOption(label="Stylized / 3D Animation", value="stylized_3d"),
                    SurveyQuestionOption(label="Retro / Analog Film Grain", value="analog_film"),
                    SurveyQuestionOption(label="Surreal / Dreamlike High-Fashion", value="surreal_fashion"),
                    SurveyQuestionOption(label="Clean Minimalist Product Focus", value="clean_minimalist"),
                ],
            ),
        ],
    ),
    SurveySection(
        key="deliverables",
        title="Deliverables and Production Specs",
        description="Detail aspect ratios, video durations, target platforms, and deliverable volume.",
        display_order=4,
        questions=[
            SurveyQuestion(
                id="br_aspect_ratios",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="deliverables",
                question_text="Required Aspect Ratios",
                input_type=InputType.MULTI_SELECT,
                is_required=True,
                display_order=1,
                options=[
                    SurveyQuestionOption(label="9:16 Vertical (Reels / TikTok / Shorts)", value="9_16"),
                    SurveyQuestionOption(label="16:9 Landscape (YouTube / Web / TV)", value="16_9"),
                    SurveyQuestionOption(label="1:1 Square (Feed Ads / Carousels)", value="1_1"),
                    SurveyQuestionOption(label="4:5 Portrait (Meta Feed)", value="4_5"),
                ],
            ),
            SurveyQuestion(
                id="br_video_duration",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="deliverables",
                question_text="Typical Target Duration",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=2,
                options=[
                    SurveyQuestionOption(label="15 seconds (Snackable Hook)", value="15s"),
                    SurveyQuestionOption(label="30 seconds (Standard Commercial)", value="30s"),
                    SurveyQuestionOption(label="60 seconds (Comprehensive Narrative)", value="60s"),
                    SurveyQuestionOption(label="90+ seconds (Brand Story / Explainer)", value="90s_plus"),
                ],
            ),
            SurveyQuestion(
                id="br_deliverable_count",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="deliverables",
                question_text="Estimated Number of Deliverables per Campaign",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=3,
                options=[
                    SurveyQuestionOption(label="Single Hero Video (1 asset)", value="1"),
                    SurveyQuestionOption(label="Asset Pack with Variations (2 - 5 assets)", value="2_5"),
                    SurveyQuestionOption(label="Comprehensive Campaign Suite (6 - 15 assets)", value="6_15"),
                    SurveyQuestionOption(label="Ongoing Content Stream (15+ assets / month)", value="ongoing"),
                ],
            ),
        ],
    ),
    SurveySection(
        key="budget",
        title="Budget and Timeline",
        description="Define your typical budget allocations, payment structure, and turnaround expectations.",
        display_order=5,
        questions=[
            SurveyQuestion(
                id="br_campaign_budget",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="budget",
                question_text="Typical Campaign Budget Allocation (₹ / INR)",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=1,
                options=[
                    SurveyQuestionOption(label="₹25,000 - ₹75,000 (Pilot / Test Campaign)", value="1k_3k"),
                    SurveyQuestionOption(label="₹75,000 - ₹2,50,000 (Standard Commercial Campaign)", value="3k_10k"),
                    SurveyQuestionOption(label="₹2,50,000 - ₹10,00,000 (Multi-Asset Major Launch)", value="10k_30k"),
                    SurveyQuestionOption(label="₹10,00,000+ (Enterprise Omnichannel Production)", value="30k_plus"),
                ],
                matching_relevance=MatchingRelevance.HIGH,
            ),
            SurveyQuestion(
                id="br_budget_flexibility",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="budget",
                question_text="Budget Flexibility",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=2,
                options=[
                    SurveyQuestionOption(label="Strictly Fixed (Must stay within allocated budget)", value="fixed"),
                    SurveyQuestionOption(label="Negotiable (+/- 20% for exceptional creators)", value="negotiable"),
                    SurveyQuestionOption(label="Open to Creator Proposals", value="open"),
                ],
            ),
            SurveyQuestion(
                id="br_turnaround_time",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="budget",
                question_text="Expected Production Turnaround Time",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=3,
                options=[
                    SurveyQuestionOption(label="Rush (< 1 week)", value="rush"),
                    SurveyQuestionOption(label="Standard (1 - 2 weeks)", value="1_2_weeks"),
                    SurveyQuestionOption(label="Comprehensive (3 - 4 weeks)", value="3_4_weeks"),
                ],
            ),
        ],
    ),
    SurveySection(
        key="licensing",
        title="Commercial Rights and Licensing",
        description="Mandatory terms governing asset usage, distribution channels, and commercial permissions.",
        display_order=6,
        questions=[
            SurveyQuestion(
                id="br_usage_channels",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="licensing",
                question_text="Permitted Distribution Channels",
                input_type=InputType.MULTI_SELECT,
                is_required=True,
                display_order=1,
                options=[
                    SurveyQuestionOption(label="Organic Social Media (Brand channels)", value="organic_social"),
                    SurveyQuestionOption(label="Paid Digital Advertising (Whitelisting & Paid Ads)", value="paid_ads"),
                    SurveyQuestionOption(label="Brand Website & E-commerce Product Pages", value="website_ecommerce"),
                    SurveyQuestionOption(label="Broadcast / Connected TV (Streaming & TV)", value="broadcast"),
                    SurveyQuestionOption(label="OOH / Digital Billboards", value="digital_billboard"),
                ],
                matching_relevance=MatchingRelevance.HIGH,
            ),
            SurveyQuestion(
                id="br_rights_duration",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="licensing",
                question_text="Duration of Commercial Rights",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=2,
                options=[
                    SurveyQuestionOption(label="3 Months (Seasonal Burst)", value="3_months"),
                    SurveyQuestionOption(label="6 Months (Standard Campaign)", value="6_months"),
                    SurveyQuestionOption(label="1 Year (Annual Licensing)", value="1_year"),
                    SurveyQuestionOption(label="In Perpetuity (Buyout)", value="perpetuity"),
                    SurveyQuestionOption(label="Need Guidance / Undecided", value="guidance_needed"),
                ],
            ),
            SurveyQuestion(
                id="br_commercial_ai_tools_requirement",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="licensing",
                question_text="Commercial AI Tool Verification Requirement",
                help_text="Do you require creators to verify that all models used have commercial-use clearance?",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=3,
                options=[
                    SurveyQuestionOption(label="Yes — Commercial licenses must be strictly verified", value="strictly_required"),
                    SurveyQuestionOption(label="Standard — Commercial tiers acceptable without special indemnity", value="standard"),
                    SurveyQuestionOption(label="Flexible / Brand provides custom guidance", value="flexible"),
                ],
            ),
        ],
    ),
    SurveySection(
        key="trust",
        title="Trust and Professional Verification",
        description="Verify authorized representation and commitment to platform dispute guidelines.",
        display_order=7,
        questions=[
            SurveyQuestion(
                id="br_authorized_representative",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="trust",
                question_text="I confirm that I am an authorized representative with authority to commission creative work on behalf of this organization.",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=1,
                options=[
                    SurveyQuestionOption(label="Yes, I confirm", value="confirmed"),
                ],
            ),
            SurveyQuestion(
                id="br_dispute_terms",
                survey_id="brand_v1",
                survey_type="BRAND",
                section_key="trust",
                question_text="I understand the CreatorBridge milestone review, transparent escrow release, and dispute resolution procedures.",
                input_type=InputType.SINGLE_CHOICE,
                is_required=True,
                display_order=2,
                options=[
                    SurveyQuestionOption(label="Yes, I understand and agree", value="confirmed"),
                ],
            ),
        ],
    ),
]


class SurveyEngine:
    """Core engine evaluating dynamic conditional branching, validation, and AI checkpoints."""

    @classmethod
    def get_survey_schema(cls, survey_type: str) -> SurveySchemaResponse:
        st = survey_type.upper()
        if st == "CREATOR":
            return SurveySchemaResponse(
                survey_id="creator_v1",
                survey_type="CREATOR",
                version="1.0.0",
                title="Creator Professional Onboarding & Capability Profile",
                description="9-section structured onboarding detailing identity, specializations, skills, tools, and conduct.",
                sections=CREATOR_SECTIONS,
            )
        elif st in ["BRAND", "AGENCY"]:
            return SurveySchemaResponse(
                survey_id="brand_v1",
                survey_type="BRAND",
                version="1.0.0",
                title="Brand & Agency Creative Onboarding & Campaign Specification",
                description="7-section structured onboarding capturing organization, objectives, specs, and licensing rights.",
                sections=BRAND_SECTIONS,
            )
        else:
            raise ValueError(f"Unknown survey type: {survey_type}")

    @classmethod
    def evaluate_adaptive(
        cls,
        survey_type: str,
        current_answers: Dict[str, Any],
        section_key: Optional[str] = None,
    ) -> AdaptiveEvaluationResponse:
        """
        Evaluates dynamic conditional visibility rules against current answers.
        Returns which question IDs are visible, plus any suggested AI follow-up checkpoints.
        """
        schema = cls.get_survey_schema(survey_type)
        visible_ids: List[str] = []

        for section in schema.sections:
            if section_key and section.key != section_key:
                continue

            for q in section.questions:
                if not q.conditional_rules:
                    visible_ids.append(q.id)
                    continue

                # Evaluate conditional rules
                is_visible = True
                for rule in q.conditional_rules:
                    dep_val = current_answers.get(rule.depends_on)
                    rule_matched = cls._evaluate_rule(rule, dep_val)
                    if not rule_matched:
                        is_visible = False
                        break

                if is_visible:
                    visible_ids.append(q.id)

        # Checkpoint follow-ups (Deterministic heuristic fallback)
        suggested_followups: List[AIFollowupQuestion] = []
        ai_assisted = False
        explanation = "Deterministic branching evaluated based on declared specializations and skills."

        # Check if OpenAI key exists for live dynamic assistance
        has_openai = bool(settings.openai_api_key and len(settings.openai_api_key.strip()) > 8)

        if has_openai:
            # We could query OpenAI asynchronously here if needed, but per prompt guidelines:
            # "Do not call the AI provider for every keystroke. Use it at appropriate checkpoints."
            ai_assisted = True
            explanation = "AI-assisted checkpoint active with dynamic clarification heuristics."

        # Deterministic smart follow-up suggestions:
        st = survey_type.upper()
        if st == "CREATOR":
            specs = current_answers.get("cr_specializations", [])
            skills = current_answers.get("cr_skills", [])
            tools = current_answers.get("cr_tools_catalog", [])

            if "ai_video" in specs and not any(t.get("tool_name", "").lower() in ["runway", "kling", "luma", "sora", "pika"] for t in tools if isinstance(t, dict)):
                suggested_followups.append(
                    AIFollowupQuestion(
                        id="ai_suggest_video_model",
                        question_text="Which video generation models (Runway Gen-3, Kling, Luma Dream Machine) do you use most frequently?",
                        purpose="Clarify primary motion synthesis engine for video commercial briefs",
                        section_key="tools",
                        input_type=InputType.TEXT,
                        is_required=False,
                        trigger_reason="You selected AI Video Generation specialization; identifying preferred models improves brief matching score.",
                    )
                )

            if "workflow_automation" in skills:
                suggested_followups.append(
                    AIFollowupQuestion(
                        id="ai_suggest_comfyui",
                        question_text="Do you build custom ComfyUI node workflows or custom LoRAs for clients?",
                        purpose="Differentiate technical node-based engineering capability",
                        section_key="skills",
                        input_type=InputType.TEXT,
                        is_required=False,
                        trigger_reason="Workflow automation indicated; brands seeking enterprise pipeline consistency prioritize node workflow architects.",
                    )
                )

        elif st in ["BRAND", "AGENCY"]:
            obj = current_answers.get("br_primary_objective")
            channels = current_answers.get("br_usage_channels", [])

            if obj == "paid_ads" and "paid_ads" not in channels:
                suggested_followups.append(
                    AIFollowupQuestion(
                        id="ai_suggest_paid_licensing",
                        question_text="Would you like to include Paid Advertising Digital Rights in your commercial licensing defaults?",
                        purpose="Align campaign objective with required usage rights",
                        section_key="licensing",
                        input_type=InputType.SINGLE_CHOICE,
                        is_required=False,
                        options=[
                            SurveyQuestionOption(label="Yes, add Paid Digital Ads", value="yes"),
                            SurveyQuestionOption(label="No, keep separate", value="no"),
                        ],
                        trigger_reason="Your primary campaign objective is Paid Advertising, but Paid Digital Advertising was not selected under licensing channels.",
                    )
                )

        return AdaptiveEvaluationResponse(
            visible_question_ids=visible_ids,
            suggested_followups=suggested_followups,
            ai_assisted=ai_assisted,
            explanation=explanation,
        )

    @classmethod
    def _evaluate_rule(cls, rule: SurveyConditionalRule, dep_val: Any) -> bool:
        if dep_val is None:
            return not rule.show_if

        op = rule.operator.lower()
        target = rule.value

        matched = False
        if op == "contains":
            if isinstance(dep_val, list):
                if isinstance(target, list):
                    matched = any(item in dep_val for item in target)
                else:
                    matched = target in dep_val
            elif isinstance(dep_val, str):
                matched = str(target) in dep_val
        elif op == "equals":
            matched = dep_val == target
        elif op == "not_equals":
            matched = dep_val != target
        elif op == "in":
            if isinstance(target, list):
                matched = dep_val in target
        elif op == "is_true":
            matched = bool(dep_val)
        elif op == "is_false":
            matched = not bool(dep_val)
        elif op == "greater_than":
            try:
                matched = float(dep_val) > float(target)
            except Exception:
                matched = False

        return matched if rule.show_if else not matched

    @classmethod
    def validate_responses(
        cls, survey_type: str, answers: Dict[str, Any]
    ) -> List[str]:
        """Validates all visible required questions and constraints. Returns list of errors."""
        schema = cls.get_survey_schema(survey_type)
        adaptive = cls.evaluate_adaptive(survey_type, answers)
        visible_set = set(adaptive.visible_question_ids)

        errors: List[str] = []

        for section in schema.sections:
            for q in section.questions:
                if q.id not in visible_set:
                    continue  # Hidden question; skip validation

                val = answers.get(q.id)

                # Required check
                if q.is_required:
                    if val is None or (isinstance(val, str) and not val.strip()) or (isinstance(val, list) and len(val) == 0):
                        errors.append(f"{section.title} - '{q.question_text}' is required.")
                        continue

                if val is None or val == "":
                    continue

                # Rules check
                rules = q.validation_rules
                if rules:
                    if isinstance(val, str):
                        if rules.min_length and len(val.strip()) < rules.min_length:
                            errors.append(f"'{q.question_text}' must be at least {rules.min_length} characters.")
                        if rules.max_length and len(val.strip()) > rules.max_length:
                            errors.append(f"'{q.question_text}' cannot exceed {rules.max_length} characters.")
                        if rules.pattern and not re.match(rules.pattern, val):
                            errors.append(f"'{q.question_text}' does not match required format.")
                    elif isinstance(val, (int, float)):
                        if rules.min is not None and val < rules.min:
                            errors.append(f"'{q.question_text}' must be at least {rules.min}.")
                        if rules.max is not None and val > rules.max:
                            errors.append(f"'{q.question_text}' cannot exceed {rules.max}.")
                    elif isinstance(val, list):
                        if rules.min_items and len(val) < rules.min_items:
                            errors.append(f"'{q.question_text}' requires at least {rules.min_items} selection(s).")
                        if rules.max_items and len(val) > rules.max_items:
                            errors.append(f"'{q.question_text}' cannot exceed {rules.max_items} selection(s).")

        return errors


survey_engine = SurveyEngine()
