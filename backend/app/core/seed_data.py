"""Idempotent seeding script for CreatorBridge demo dataset.

Seeds high-quality, rubric-aligned demo data:
1. 2 Demo Brands (Lumina Skincare, Terra Outdoor Gear)
2. 3 AI Creators (Elena Rostova, Marcus Vance, Aaliyah Chen) with complete workflows, tools, and portfolios
3. 4 Full Commercial Campaign Briefs (Skincare, Outdoor, Cyber Fashion, Matcha Beverage)
4. Local SVG demo assets mapped directly from /demo-assets/
"""

import json
import sqlite3
from pathlib import Path
from uuid import UUID
from datetime import datetime, timezone, timedelta
from app.core.logging import get_logger
from app.schemas.creator import CreatorLevel
from app.schemas.brief import BriefStatus
from app.schemas.portfolio import AssetType, CommercialUseStatus, AIGenerationType, ProjectVisibility

logger = get_logger("core.seed_data")

DB_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DB_PATH = DB_DIR / "creatorbridge.db"


def _get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def seed_demo_data():
    """Populates persistent SQLite database with clean, idempotent demo dataset."""
    now = datetime.now(timezone.utc)
    now_str = now.isoformat()
    deadline_str = (now + timedelta(days=21)).isoformat()

    with _get_connection() as conn:
        cursor = conn.cursor()

        # =====================================================================
        # 1. DEMO USERS (Persistent Auth accounts)
        # =====================================================================
        demo_users = [
            ("usr_lumina_skincare", "lumina@demo.creatorbridge.com", "Lumina Skincare", "BRAND", "demo123456", 1, 1, 1),
            ("usr_terra_outdoor", "terra@demo.creatorbridge.com", "Terra Outdoor Gear", "BRAND", "demo123456", 1, 1, 1),
            ("usr_elena_rostova", "elena@demo.creatorbridge.com", "Elena Rostova", "CREATOR", "demo123456", 1, 1, 1),
            ("usr_marcus_vance", "marcus@demo.creatorbridge.com", "Marcus Vance", "CREATOR", "demo123456", 1, 1, 1),
            ("usr_aaliyah_chen", "aaliyah@demo.creatorbridge.com", "Aaliyah Chen", "CREATOR", "demo123456", 1, 1, 1),
        ]

        for u in demo_users:
            cursor.execute(
                """
                INSERT INTO users (id, email, full_name, role, password, is_verified, email_verified, is_onboarded, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    full_name=excluded.full_name,
                    role=excluded.role,
                    is_verified=excluded.is_verified,
                    is_onboarded=excluded.is_onboarded,
                    updated_at=excluded.updated_at
                """,
                (u[0], u[1], u[2], u[3], u[4], u[5], u[6], u[7], now_str, now_str)
            )

        # =====================================================================
        # 2. DEMO BRAND PROFILES
        # =====================================================================
        demo_brands = [
            (
                "00000000-0000-0000-0000-000000000010",
                "usr_lumina_skincare",
                "Lumina Skincare",
                "Consumer Brand",
                "Beauty & Personal Care",
                json.dumps(["Skincare", "Wellness", "Dermatology"]),
                "Helena Vance",
                "helena@luminaskincare.com",
                "https://luminaskincare.com",
                "/demo-assets/lumina-skincare-logo.svg",
                "High-performance cellular radiance formulations utilizing clean biotechnology and sustainable botanical peptides.",
                "Los Angeles & Paris",
                "11-50",
                json.dumps({"instagram": "https://instagram.com/luminaskincare", "linkedin": "https://linkedin.com/company/lumina-skincare"}),
                "https://luminaskincare.com/brand-guidelines.pdf",
                "EMAIL",
                0,
                "VERIFIED",
                1,
                100,
                json.dumps({"is_demo": True, "badge": "DEMO BRAND", "verification_tier": "ENTERPRISE_VERIFIED"}),
            ),
            (
                "00000000-0000-0000-0000-000000000011",
                "usr_terra_outdoor",
                "Terra Outdoor Gear",
                "Consumer Brand",
                "Outdoor, Apparel & Technical Gear",
                json.dumps(["Eco-Technical Gear", "Alpine Equipment", "Sustainability"]),
                "Klaus Thorne",
                "klaus@terraoutdoor.com",
                "https://terraoutdoor.com",
                "/demo-assets/terra-outdoor-logo.svg",
                "Pioneering circular, recycled all-weather performance shells engineered for extreme mountaineering and alpine expeditions.",
                "Boulder, Colorado",
                "51-200",
                json.dumps({"instagram": "https://instagram.com/terraoutdoor", "youtube": "https://youtube.com/terraoutdoor"}),
                "https://terraoutdoor.com/brand-kit.pdf",
                "SLACK",
                0,
                "VERIFIED",
                1,
                95,
                json.dumps({"is_demo": True, "badge": "DEMO BRAND", "verification_tier": "ENTERPRISE_VERIFIED"}),
            ),
        ]

        for b in demo_brands:
            cursor.execute(
                """
                INSERT INTO brand_profiles (
                    id, user_id, company_name, organization_type, primary_industry,
                    secondary_industries, contact_name, business_email, website,
                    logo_url, description, location, team_size, social_links,
                    brand_guidelines_url, preferred_communication, is_agency,
                    verification_status, onboarding_completed, profile_completeness_pct,
                    metadata, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    company_name=excluded.company_name,
                    logo_url=excluded.logo_url,
                    description=excluded.description,
                    verification_status=excluded.verification_status,
                    profile_completeness_pct=excluded.profile_completeness_pct,
                    metadata=excluded.metadata,
                    updated_at=excluded.updated_at
                """,
                (*b, now_str, now_str)
            )

        # =====================================================================
        # 3. DEMO CREATOR PROFILES
        # =====================================================================
        demo_creators = [
            (
                "00000000-0000-0000-0000-000000000021",
                "usr_elena_rostova",
                "Elena Rostova",
                "elena_rostova",
                CreatorLevel.AI_MASTER.value,
                "AI Master",
                "AI Fashion & Conceptual Photography",
                json.dumps(["Hyperrealistic Fashion", "Virtual Model Consistency", "Editorial Direction", "Prompt Engineering", "Color Theory"]),
                json.dumps(["Midjourney v6.1", "Flux.1 Pro", "Magnific AI", "Photoshop Generative Fill"]),
                json.dumps(["Editorial Photography", "High-Fashion Lookbooks", "Concept Art", "Synthetic Campaigns"]),
                json.dumps(["Haute Couture", "Luxury Goods", "Futurism", "Beauty"]),
                json.dumps(["4:5", "1:1", "16:9", "8K"]),
                json.dumps({"instagram": "https://instagram.com/elena.ai.fashion", "twitter": "https://x.com/elenarostova_ai", "behance": "https://behance.net/elenarostova"}),
                15000,
                4.96,
                1,
                1,
                98,
                "Award-winning generative fashion director specializing in high-fidelity virtual couture, bespoke synthetic models, and multi-angle product lighting.",
                "/demo-assets/elena-rostova-avatar.svg",
                json.dumps({
                    "is_demo": True,
                    "badge": "DEMO CREATOR",
                    "headline": "Lead Generative Fashion Art Director",
                    "location": "Milan & London",
                    "completed_projects_count": 28,
                    "verified_tier": "TOP_RATED_PLUS",
                    "availability_status": "AVAILABLE",
                }),
            ),
            (
                "00000000-0000-0000-0000-000000000022",
                "usr_marcus_vance",
                "Marcus Vance",
                "marcus_vance",
                CreatorLevel.PRO_CREATOR.value,
                "AI Pro",
                "Cinematic AI Video & Motion Design",
                json.dumps(["Text-to-Video Camera Moves", "Temporal Consistency", "VFX & Motion Design", "Sound Synchronization", "Color Grading"]),
                json.dumps(["Runway Gen-3 Alpha", "Kling AI 1.5", "Luma Dream Machine", "Topaz Video AI", "Premiere Pro"]),
                json.dumps(["Short-form Video", "Commercial Motion", "Social Hooks", "Dynamic 9:16 Cuts"]),
                json.dumps(["Athletics & Outdoor", "Action Sports", "Sci-Fi", "Automotive"]),
                json.dumps(["9:16", "16:9", "4K 60FPS"]),
                json.dumps({"youtube": "https://youtube.com/@marcusvance_ai", "twitter": "https://x.com/marcusvance_motion"}),
                12500,
                4.92,
                1,
                1,
                94,
                "Motion designer and synthetic cinematographer crafting high-octane brand trailers, dynamic product loops, and social hooks with guaranteed frame continuity.",
                "/demo-assets/marcus-vance-avatar.svg",
                json.dumps({
                    "is_demo": True,
                    "badge": "DEMO CREATOR",
                    "headline": "AI Motion Cinematographer & Hook Specialist",
                    "location": "Toronto, Canada",
                    "completed_projects_count": 19,
                    "verified_tier": "TOP_RATED",
                    "availability_status": "AVAILABLE",
                }),
            ),
            (
                "00000000-0000-0000-0000-000000000023",
                "usr_aaliyah_chen",
                "Aaliyah Chen",
                "aaliyah_chen",
                CreatorLevel.AI_MASTER.value,
                "AI Master",
                "Hyperrealistic 3D Product & Commercial Brand Worlds",
                json.dumps(["Custom LoRA Training", "Precise CAD Alignment", "Multi-Pass Rendering", "Packaging Visualization", "ComfyUI Node Graphs"]),
                json.dumps(["ComfyUI", "Stable Diffusion XL", "ControlNet Depth", "Blender 3D", "Unreal Engine 5"]),
                json.dumps(["E-Commerce 3D Visuals", "Hero Product Staging", "Packaging Renders", "Interactive Brand Worlds"]),
                json.dumps(["Clean Beverages", "Botanical Skincare", "Consumer Tech", "Minimalist Living"]),
                json.dumps(["1:1", "16:9", "3:4", "8K Master"]),
                json.dumps({"instagram": "https://instagram.com/aaliyah.3d.ai", "artstation": "https://artstation.com/aaliyahchen"}),
                16000,
                4.98,
                1,
                1,
                100,
                "Technical artist combining generative AI node workflows (ComfyUI + ControlNet) with exact 3D topology for flawless commercial package staging.",
                "/demo-assets/aaliyah-chen-avatar.svg",
                json.dumps({
                    "is_demo": True,
                    "badge": "DEMO CREATOR",
                    "headline": "Generative 3D Technical Director",
                    "location": "San Francisco, CA",
                    "completed_projects_count": 34,
                    "verified_tier": "MASTER_VERIFIED",
                    "availability_status": "AVAILABLE",
                }),
            ),
        ]

        for c in demo_creators:
            cursor.execute(
                """
                INSERT INTO creator_profiles (
                    id, user_id, full_name, handle, level, level_name,
                    primary_specialization, skills, ai_tools, content_types,
                    target_niches, preferred_formats, social_links,
                    hourly_rate_cents, reputation_score, is_verified,
                    assessment_completed, profile_completeness_pct,
                    bio, avatar_url, metadata, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    full_name=excluded.full_name,
                    avatar_url=excluded.avatar_url,
                    bio=excluded.bio,
                    skills=excluded.skills,
                    ai_tools=excluded.ai_tools,
                    reputation_score=excluded.reputation_score,
                    is_verified=excluded.is_verified,
                    profile_completeness_pct=excluded.profile_completeness_pct,
                    metadata=excluded.metadata,
                    updated_at=excluded.updated_at
                """,
                (*c, now_str, now_str)
            )

        # =====================================================================
        # 4. DEMO PORTFOLIO PROJECTS (Rich multi-modal projects with workflow stages)
        # =====================================================================
        demo_portfolios = [
            # Elena Project 1
            (
                "00000000-0000-0000-0000-000000000031",
                "00000000-0000-0000-0000-000000000021",
                "Cyber Couture 2026 Editorial",
                "Multi-garment synthetic haute couture lookbook with consistent virtual model anatomy and micro-fabric texture fidelity.",
                "AI Fashion",
                "High-Fashion Lookbook",
                AssetType.IMAGE.value,
                "/demo-assets/elena-project-cyber-fashion.svg",
                "/demo-assets/elena-project-cyber-fashion.svg",
                json.dumps(["Midjourney v6.1", "Magnific AI", "Photoshop Generative Fill"]),
                json.dumps(["Midjourney v6.1", "Magnific 4x Precision"]),
                json.dumps(["Hyperrealistic Fashion", "Virtual Model Consistency", "Editorial Lighting"]),
                "Three-step workflow: silhouette exploration with Midjourney, facial alignment via IP-Adapter, 8K micro-texture refinement in Magnific.",
                json.dumps([
                    {"stage_name": "Art Direction & Silhouette Exploration", "description": "Formulated structured prompts for pleated metallic fabrics and architectural sleeves.", "tools_used": ["Midjourney v6.1"]},
                    {"stage_name": "Model Anatomy & Facial Anchoring", "description": "Anchored identity across 8 camera perspectives using reference IP-Adapters.", "tools_used": ["ComfyUI", "ControlNet"]},
                    {"stage_name": "Ultra-Res Upscaling & Texture Pass", "description": "Enhanced fabric weave density and ambient studio reflections for 8K print readiness.", "tools_used": ["Magnific AI"]},
                ]),
                "4:5",
                "8K",
                None,
                CommercialUseStatus.COMMERCIAL_READY.value,
                AIGenerationType.AI_GENERATED.value,
                ProjectVisibility.PUBLIC.value,
                1,
                "VERIFIED",
                "/demo-assets/elena-project-cyber-fashion.svg",
            ),
            # Elena Project 2
            (
                "00000000-0000-0000-0000-000000000032",
                "00000000-0000-0000-0000-000000000021",
                "Ethereal Silk Drapery & Atmospheric Fluidity",
                "Conceptual editorial exploring weightless textile dynamics in zero gravity with studio rim lighting.",
                "AI Fashion",
                "Editorial Photography",
                AssetType.IMAGE.value,
                "/demo-assets/elena-project-ethereal-couture.svg",
                "/demo-assets/elena-project-ethereal-couture.svg",
                json.dumps(["Flux.1 Pro", "ControlNet Canny", "Lightroom"]),
                json.dumps(["Flux.1 Schnell", "Flux.1 Pro"]),
                json.dumps(["Textile Physics", "Soft Rim Lighting", "Studio Staging"]),
                "Flux.1 Pro diffusion passes guided by edge maps for realistic fabric weight and natural tension creases.",
                json.dumps([
                    {"stage_name": "Physics & Fold Previsualization", "description": "Generated structural boundary curves with ControlNet Canny.", "tools_used": ["ControlNet Canny"]},
                    {"stage_name": "Material Synthesis Pass", "description": "Rendered sheer organza translucency and sheen response to direct key lights.", "tools_used": ["Flux.1 Pro"]},
                    {"stage_name": "Color Balancing & Editorial Grading", "description": "Calibrated lavender and champagne tones for clean print and web reproduction.", "tools_used": ["Lightroom AI"]},
                ]),
                "1:1",
                "6K",
                None,
                CommercialUseStatus.COMMERCIAL_READY.value,
                AIGenerationType.AI_GENERATED.value,
                ProjectVisibility.PUBLIC.value,
                1,
                "VERIFIED",
                "/demo-assets/elena-project-ethereal-couture.svg",
            ),
            # Marcus Project 1
            (
                "00000000-0000-0000-0000-000000000033",
                "00000000-0000-0000-0000-000000000022",
                "Kinetic Trails: 4K High-Speed Motion",
                "30-second commercial action motion study featuring fluid particle bursts and dynamic dolly zoom camerawork.",
                "AI Video",
                "Short-form Video",
                AssetType.VIDEO.value,
                "/demo-assets/marcus-project-kinetic-trail.svg",
                "/demo-assets/marcus-project-kinetic-trail.mp4",
                json.dumps(["Runway Gen-3 Alpha", "Topaz Video AI", "Premiere Pro"]),
                json.dumps(["Gen-3 Alpha Turbo", "Topaz Artemis High Quality"]),
                json.dumps(["Camera Motion Tracking", "Frame Interpolation", "Color Grading"]),
                "Camera path orchestration in Runway Gen-3 with custom motion brush parameters, upscaled to pristine 60FPS in Topaz.",
                json.dumps([
                    {"stage_name": "Keyframe Anchor Staging", "description": "Generated motion keyframes with precise vector velocity.", "tools_used": ["Midjourney v6"]},
                    {"stage_name": "Temporal Video Synthesis", "description": "Orchestrated continuous dolly moves and atmospheric particle clouds.", "tools_used": ["Runway Gen-3 Alpha"]},
                    {"stage_name": "60FPS Interpolation & Master Polish", "description": "Eliminated video artifacts and stabilized motion blur.", "tools_used": ["Topaz Video AI"]},
                ]),
                "16:9",
                "4K 60FPS",
                30,
                CommercialUseStatus.COMMERCIAL_READY.value,
                AIGenerationType.AI_GENERATED.value,
                ProjectVisibility.PUBLIC.value,
                1,
                "VERIFIED",
                "/demo-assets/marcus-project-kinetic-trail.mp4",
            ),
            # Marcus Project 2
            (
                "00000000-0000-0000-0000-000000000034",
                "00000000-0000-0000-0000-000000000022",
                "Temporal Flux Vertical Hook (9:16)",
                "Viral-optimized vertical commercial hook designed for social advertising with rapid visual retention transitions.",
                "AI Video",
                "Social Hook 9:16",
                AssetType.VIDEO.value,
                "/demo-assets/marcus-project-temporal-flux.svg",
                "/demo-assets/marcus-project-temporal-flux.mp4",
                json.dumps(["Kling AI 1.5", "Luma Dream Machine", "CapCut Pro"]),
                json.dumps(["Kling 1.5 Pro", "Luma Photon"]),
                json.dumps(["First 3-Second Retention", "Kinetic Typography", "Audio Reactive Cuts"]),
                "Multi-model pipeline combining Kling AI realism with Luma fast camera passes, timed to high-energy audio beats.",
                json.dumps([
                    {"stage_name": "Hook Concept & Pacing Board", "description": "Scripted 3 retention-holding visual beats across the opening 4 seconds.", "tools_used": ["Claude 3.5 Sonnet"]},
                    {"stage_name": "Synthetic Video Generation", "description": "Generated high-velocity zooms and dynamic subject reveals in 9:16.", "tools_used": ["Kling AI 1.5", "Luma Dream Machine"]},
                    {"stage_name": "Audio Mix & Kinetic Typography", "description": "Synced SFX impacts to camera beat drops.", "tools_used": ["Premiere Pro", "CapCut"]},
                ]),
                "9:16",
                "1080x1920",
                15,
                CommercialUseStatus.COMMERCIAL_READY.value,
                AIGenerationType.AI_GENERATED.value,
                ProjectVisibility.PUBLIC.value,
                1,
                "VERIFIED",
                "/demo-assets/marcus-project-temporal-flux.mp4",
            ),
            # Aaliyah Project 1
            (
                "00000000-0000-0000-0000-000000000035",
                "00000000-0000-0000-0000-000000000023",
                "Botanical Elixir 3D Product Staging",
                "Photorealistic cosmetic droplet physics and frosted amber glass refraction for commercial e-commerce advertising.",
                "3D & Visual Worlds",
                "E-Commerce 3D Visuals",
                AssetType.IMAGE.value,
                "/demo-assets/aaliyah-project-botanical-elixir.svg",
                "/demo-assets/aaliyah-project-botanical-elixir.svg",
                json.dumps(["ComfyUI", "Stable Diffusion XL", "ControlNet Depth", "Blender"]),
                json.dumps(["SDXL Base 1.0", "ControlNet Depth v1.1"]),
                json.dumps(["CAD Alignment", "Depth Conditioning", "Refraction Shader Match"]),
                "Hybrid 3D CAD modeling with custom ComfyUI multi-pass depth conditioning for millimeter-accurate package typography.",
                json.dumps([
                    {"stage_name": "3D CAD Mesh & UV Mapping", "description": "Modeled exact bottle silhouette and label coordinate UVs in Blender.", "tools_used": ["Blender 3D"]},
                    {"stage_name": "Depth-Conditioned Generative Pass", "description": "Synthesized ambient botanical foliage around glass refraction geometry.", "tools_used": ["ComfyUI", "ControlNet Depth"]},
                    {"stage_name": "Composite & Typography Lock", "description": "Locked packaging brand vector graphics to prevent AI font degradation.", "tools_used": ["Photoshop"]},
                ]),
                "1:1",
                "8K Master",
                None,
                CommercialUseStatus.COMMERCIAL_READY.value,
                AIGenerationType.AI_GENERATED.value,
                ProjectVisibility.PUBLIC.value,
                1,
                "VERIFIED",
                "/demo-assets/aaliyah-project-botanical-elixir.svg",
            ),
            # Aaliyah Project 2
            (
                "00000000-0000-0000-0000-000000000036",
                "00000000-0000-0000-0000-000000000023",
                "Zen Matcha Can Packaging Visualization",
                "Minimalist ceramic and matte aluminum beverage packaging renders set in a serene Japanese tea room aesthetic.",
                "3D & Visual Worlds",
                "Packaging Visualization",
                AssetType.IMAGE.value,
                "/demo-assets/aaliyah-project-zen-matcha.svg",
                "/demo-assets/aaliyah-project-zen-matcha.svg",
                json.dumps(["Blender 3D", "Stable Diffusion XL", "ControlNet Normal"]),
                json.dumps(["SDXL Refiner", "ControlNet Normal Map"]),
                json.dumps(["Matte Texture Physics", "Architectural Lighting", "Material Rendering"]),
                "Multi-layer rendering balancing natural wood grain shadows with realistic matte tin coating.",
                json.dumps([
                    {"stage_name": "Lighting & Set Composition", "description": "Set up soft morning window light bounce in 3D scene.", "tools_used": ["Blender 3D"]},
                    {"stage_name": "Normal Map Texture Projection", "description": "Projected micro-grain brushed metal finishes onto cylindrical can surface.", "tools_used": ["ComfyUI", "SDXL"]},
                    {"stage_name": "Color Matching Pass", "description": "Matched Pantone 376 C matcha green across all lighting angles.", "tools_used": ["Photoshop"]},
                ]),
                "16:9",
                "4K",
                None,
                CommercialUseStatus.COMMERCIAL_READY.value,
                AIGenerationType.AI_GENERATED.value,
                ProjectVisibility.PUBLIC.value,
                1,
                "VERIFIED",
                "/demo-assets/aaliyah-project-zen-matcha.svg",
            ),
        ]

        for p in demo_portfolios:
            cursor.execute(
                """
                INSERT INTO portfolio_items (
                    id, creator_id, title, description, category, content_type,
                    media_type, thumbnail_url, media_url, tools, models, skills,
                    workflow_summary, workflow_stages, aspect_ratio, resolution,
                    duration_seconds, commercial_use_status, ai_generation_type,
                    visibility, is_featured, verification_status, public_url,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    title=excluded.title,
                    description=excluded.description,
                    thumbnail_url=excluded.thumbnail_url,
                    media_url=excluded.media_url,
                    tools=excluded.tools,
                    models=excluded.models,
                    skills=excluded.skills,
                    workflow_summary=excluded.workflow_summary,
                    workflow_stages=excluded.workflow_stages,
                    verification_status=excluded.verification_status,
                    public_url=excluded.public_url,
                    updated_at=excluded.updated_at
                """,
                (*p, now_str, now_str)
            )

        # =====================================================================
        # 5. DEMO CAMPAIGN BRIEFS (4 Niche-specific, 16-field comprehensive briefs)
        # =====================================================================
        demo_briefs = [
            # Campaign 1: Skincare
            (
                "00000000-0000-0000-0000-000000000041",
                "00000000-0000-0000-0000-000000000010",
                "Lumina Cellular Radiance Serum Launch",
                "Lumina Cellular Radiance Serum",
                "Luxury Anti-Aging Cellular Serum",
                "High-performance peptide formulation delivering 72-hour moisture lock and radiant morning luminescence.",
                "Visualizing inner cellular luminescence through ethereal amber glass reflections and weightless botanical droplet physics.",
                "Comprehensive commercial launch package for the Q4 global launch of Lumina Cellular Radiance Serum. Deliverables span three 9:16 vertical video hooks and five 8K master product photography renders.",
                "Seeking an AI visual artist or 3D generative specialist to create photorealistic commercial assets showcasing product packaging, fluid texture viscosity, and morning radiance ambiance.",
                json.dumps(["PRODUCT_LAUNCH", "BRAND_AWARENESS", "DRIVE_SALES"]),
                "PRODUCT_LAUNCH",
                "Discerning skincare enthusiasts, luxury cosmetics buyers, and eco-luxury advocates aged 24-48",
                "United States, UK, France",
                "English",
                "Beauty & Skincare",
                "Awaken cellular radiance. Backed by clean biotechnology.",
                "Discover Cellular Radiance at luminaskincare.com",
                json.dumps(["Instagram Reels", "TikTok", "Paid Meta Ads", "E-Commerce Master"]),
                json.dumps([
                    {
                        "id": "deliv_skincare_01",
                        "content_type": "Short-form Video",
                        "quantity": 3,
                        "placement_or_platform": "Instagram Reels / TikTok",
                        "aspect_ratio": "9:16",
                        "resolution": "4K",
                        "duration_seconds": 15,
                        "captions_required": True,
                        "production_notes": "Dynamic dropper macro shot showing golden amber viscosity drop and skin absorption.",
                    },
                    {
                        "id": "deliv_skincare_02",
                        "content_type": "Static Master Visual",
                        "quantity": 5,
                        "placement_or_platform": "E-Commerce Master & Web Hero",
                        "aspect_ratio": "1:1",
                        "resolution": "8K",
                        "production_notes": "Hero frosted glass packaging on travertine stone pedestal with warm morning shadows.",
                    },
                ]),
                json.dumps({
                    "tone_and_personality": "Ethereal, luxurious, scientifically sophisticated, clean and serene.",
                    "styles": ["Minimalist Luxury", "Warm Amber Sunlight", "Travertine Stone", "Botanical Macro"],
                    "color_palette": "Soft Champagne, Warm Amber Gold, Travertine Off-White (#FDF8F5), Deep Botanical Rose",
                    "experimentation_level": "BALANCED",
                }),
                json.dumps({
                    "required_capabilities": ["3D Product Rendering", "Glass Refraction Consistency", "High-End Lighting"],
                    "preferred_capabilities": ["Liquid Viscosity Physics", "Macro Detail Rendering"],
                    "preferred_tools": ["ComfyUI", "Midjourney v6", "ControlNet Depth", "Blender"],
                }),
                json.dumps({
                    "budget_tier": "GROWTH",
                    "budget_cents": 350000,
                    "currency": "USD",
                    "payment_model": "MILESTONE",
                    "intended_usage": ["PAID_ADS", "ORGANIC_SOCIAL", "ECOMMERCE"],
                    "commercial_rights_required": True,
                    "source_files_required": True,
                    "revisions_count": 2,
                    "usage_duration": "Perpetual",
                    "territory": "Global",
                }),
                json.dumps({}),
                350000,
                now_str,
                deadline_str,
                json.dumps(["ComfyUI", "Midjourney", "Blender", "Runway Gen-3"]),
                json.dumps({"is_demo": True, "curated_niche": "Skincare"}),
                1,
                BriefStatus.PUBLISHED.value,
                "/demo-assets/skincare-luxury-serum.jpg",
            ),
            # Campaign 2: Outdoor Gear
            (
                "00000000-0000-0000-0000-000000000042",
                "00000000-0000-0000-0000-000000000011",
                "Terra Apex Technical Storm-Shell Campaign",
                "Terra Apex 3L Technical Shell",
                "Extreme Mountaineering All-Weather Jacket",
                "Ultra-breathable 20,000mm waterproof jacket woven entirely from recycled post-consumer alpine textiles.",
                "Testing the threshold of human endurance: cinematic storm simulations illustrating impervious seam seals in extreme blizzard and monsoon conditions.",
                "High-octane commercial motion and still visual campaign for the autumn release of the Apex 3L Storm-Shell jacket. Focus on dynamic water-beading macro shots and high-altitude mountain environments.",
                "Seeking an AI motion director or generative artist to orchestrate high-energy video hooks demonstrating all-weather resilience and sustainable technical innovation.",
                json.dumps(["PRODUCT_LAUNCH", "BRAND_AWARENESS"]),
                "PRODUCT_LAUNCH",
                "Alpine climbers, backcountry hikers, mountaineering guides, and outdoor enthusiasts aged 22-45",
                "North America & Europe",
                "English",
                "Outdoor & Technical Gear",
                "Engineered for the summits. Born from circular textiles.",
                "Explore the Apex Collection at terraoutdoor.com",
                json.dumps(["YouTube", "Instagram Reels", "TikTok", "Digital Billboards"]),
                json.dumps([
                    {
                        "id": "deliv_outdoor_01",
                        "content_type": "Short-form Video",
                        "quantity": 2,
                        "placement_or_platform": "Instagram Reels / YouTube Shorts",
                        "aspect_ratio": "9:16",
                        "resolution": "4K 60FPS",
                        "duration_seconds": 20,
                        "captions_required": True,
                        "production_notes": "Torrential rain and wind tunnel test simulation with macro fabric water repellency.",
                    },
                    {
                        "id": "deliv_outdoor_02",
                        "content_type": "Cinematic Landscape Master",
                        "quantity": 4,
                        "placement_or_platform": "Digital Billboard & Web Hero",
                        "aspect_ratio": "16:9",
                        "resolution": "8K",
                        "production_notes": "Dramatic summit ridge with storm front rolling in; hiker wearing jacket in high contrast.",
                    },
                ]),
                json.dumps({
                    "tone_and_personality": "Rugged, relentless, hyper-technical, authentic, visceral and cinematic.",
                    "styles": ["Dramatic Alpine Lighting", "Cinematic Storm Atmosphere", "Topographic Textures"],
                    "color_palette": "Storm Slate (#2C5364), Glacial Cyan (#38BDF8), Safety Ochre (#F59E0B), Alpine White",
                    "experimentation_level": "HIGHLY_EXPERIMENTAL",
                }),
                json.dumps({
                    "required_capabilities": ["AI Video Generation", "Fluid/Particle Weather Dynamics", "Kinetic Camera Moves"],
                    "preferred_capabilities": ["Sound Design", "Photorealistic Fabric Modeling"],
                    "preferred_tools": ["Runway Gen-3", "Kling AI", "Topaz Video AI"],
                }),
                json.dumps({
                    "budget_tier": "SCALE",
                    "budget_cents": 420000,
                    "currency": "USD",
                    "payment_model": "MILESTONE",
                    "intended_usage": ["PAID_ADS", "ORGANIC_SOCIAL", "DIGITAL_OUT_OF_HOME"],
                    "commercial_rights_required": True,
                    "source_files_required": True,
                    "revisions_count": 3,
                    "usage_duration": "Perpetual",
                    "territory": "Global",
                }),
                json.dumps({}),
                420000,
                now_str,
                deadline_str,
                json.dumps(["Runway Gen-3", "Kling AI", "Midjourney v6", "Topaz"]),
                json.dumps({"is_demo": True, "curated_niche": "Outdoor"}),
                1,
                BriefStatus.PUBLISHED.value,
                "/demo-assets/outdoor-sustainable-gear.jpg",
            ),
            # Campaign 3: Cyber Fashion Editorial
            (
                "00000000-0000-0000-0000-000000000043",
                "00000000-0000-0000-0000-000000000010",
                "Neo-Couture Autumn/Winter Editorial",
                "Aura Atelier Neo-Couture Collection",
                "Synthetic Haute Couture Capsule",
                "Avant-garde capsule collection blending origami structural pleating with chromatic iridescent fibers.",
                "Challenging conventional physical tailoring through generative forms that defy gravity and material constraints.",
                "Seeking an AI fashion visionary to create an 8-look synthetic runway editorial lookbook, highlighting hyper-detailed micro-pleating, dynamic fabric drape, and avant-garde studio rim lighting.",
                "The creator will deliver high-fashion stills ready for digital magazine spreads, architectural billboards, and luxury brand showcases.",
                json.dumps(["BRAND_AWARENESS", "CREATIVE_INNOVATION"]),
                "CREATIVE_INNOVATION",
                "Global fashion editors, avant-garde stylists, digital art collectors, and luxury fashion houses",
                "Paris, Milan, Tokyo, New York",
                "English",
                "Haute Couture & High Fashion",
                "Where mathematics transforms into silk.",
                "Experience the runway at auraatelier.com",
                json.dumps(["Digital Vogue Spread", "Instagram", "High-Res Billboard"]),
                json.dumps([
                    {
                        "id": "deliv_fashion_01",
                        "content_type": "Editorial Lookbook Stills",
                        "quantity": 8,
                        "placement_or_platform": "Editorial Magazine & Billboard",
                        "aspect_ratio": "4:5",
                        "resolution": "8K Master",
                        "production_notes": "Consistent lighting array across 8 distinct architectural garment silhouettes.",
                    },
                ]),
                json.dumps({
                    "tone_and_personality": "Visionary, sculptural, provocative, ultra-refined, and unapologetically bold.",
                    "styles": ["Iridescent Organza", "Origami Architecture", "Moody Neon Runway"],
                    "color_palette": "Ultraviolet (#9A6ADF), Cyber Magenta (#FF52E5), Liquid Chrome, Deep Void (#0A0118)",
                    "experimentation_level": "HIGHLY_EXPERIMENTAL",
                }),
                json.dumps({
                    "required_capabilities": ["High-Fashion Model Consistency", "Complex Textile Simulation", "8K Detail Preservation"],
                    "preferred_capabilities": ["Virtual Garment Draping"],
                    "preferred_tools": ["Midjourney v6.1", "Flux.1 Pro", "Magnific AI"],
                }),
                json.dumps({
                    "budget_tier": "PREMIUM",
                    "budget_cents": 500000,
                    "currency": "USD",
                    "payment_model": "MILESTONE",
                    "intended_usage": ["EDITORIAL", "PAID_ADS", "BRAND_CAMPAIGN"],
                    "commercial_rights_required": True,
                    "source_files_required": True,
                    "revisions_count": 2,
                    "usage_duration": "Perpetual",
                    "territory": "Global",
                }),
                json.dumps({}),
                500000,
                now_str,
                deadline_str,
                json.dumps(["Midjourney", "Flux.1 Pro", "Magnific AI", "Photoshop"]),
                json.dumps({"is_demo": True, "curated_niche": "Fashion"}),
                1,
                BriefStatus.PUBLISHED.value,
                "/demo-assets/fashion-editorial-cyber.jpg",
            ),
            # Campaign 4: Matcha Beverage
            (
                "00000000-0000-0000-0000-000000000044",
                "00000000-0000-0000-0000-000000000010",
                "Kissa Ceremonial Matcha Single-Estate Elixir",
                "Kissa Ceremonial Matcha",
                "Premium Cold-Crafted Matcha Can & Whisk Set",
                "First-harvest ceremonial grade tencha stone-ground in Uji, Kyoto, formulated into ready-to-drink sparkling elixirs.",
                "Honoring ancient Zen tea rituals within contemporary fast-paced wellness lifestyles. Mindful calm meets modern hydration.",
                "Multi-channel marketing asset suite highlighting authentic emerald green froth micro-bubbles, minimalist ceramic packaging, and refreshing summer rituals.",
                "Seeking an AI visualizer with experience in beverage commercial aesthetics, macro foam physics, and clean Scandinavian/Japanese interior staging.",
                json.dumps(["PRODUCT_LAUNCH", "DRIVE_SALES"]),
                "PRODUCT_LAUNCH",
                "Wellness practitioners, mindful professionals, specialty coffee & tea connoisseurs aged 21-42",
                "United States, Japan, Australia",
                "English",
                "Food & Beverage",
                "Savor mindful presence. Ceremonial grade Uji harvest.",
                "Order the summer drop at kissamatcha.com",
                json.dumps(["TikTok", "Instagram Reels", "Web Hero Banner", "In-Store Displays"]),
                json.dumps([
                    {
                        "id": "deliv_matcha_01",
                        "content_type": "Short-form Video",
                        "quantity": 2,
                        "placement_or_platform": "TikTok & Instagram",
                        "aspect_ratio": "9:16",
                        "resolution": "4K",
                        "duration_seconds": 15,
                        "captions_required": True,
                        "production_notes": "Pour shot showing rich emerald swirl and silky micro-foam formation in slow motion.",
                    },
                    {
                        "id": "deliv_matcha_02",
                        "content_type": "E-Commerce Master Visuals",
                        "quantity": 4,
                        "placement_or_platform": "Shopify Store & Amazon Premium",
                        "aspect_ratio": "1:1",
                        "resolution": "6K",
                        "production_notes": "Matte aluminum can on dark charcoal slate next to authentic bamboo chasen whisk.",
                    },
                ]),
                json.dumps({
                    "tone_and_personality": "Calm, grounding, artisanal, minimalist, authentic, and refreshing.",
                    "styles": ["Japanese Wabi-Sabi", "Natural Sunlight", "Dark Slate Plinths", "Macro Foam Bubbles"],
                    "color_palette": "Vibrant Emerald (#84CC16), Deep Forest (#166534), Charcoal Slate (#27272A), Rice Paper Off-White",
                    "experimentation_level": "BALANCED",
                }),
                json.dumps({
                    "required_capabilities": ["Beverage Macro Photography", "Lighting & Liquid Viscosity", "Minimalist Staging"],
                    "preferred_capabilities": ["3D Can Modeling"],
                    "preferred_tools": ["ComfyUI", "SDXL", "Blender", "Runway Gen-3"],
                }),
                json.dumps({
                    "budget_tier": "STARTER",
                    "budget_cents": 280000,
                    "currency": "USD",
                    "payment_model": "MILESTONE",
                    "intended_usage": ["PAID_ADS", "ORGANIC_SOCIAL", "RETAIL_POINT_OF_SALE"],
                    "commercial_rights_required": True,
                    "source_files_required": False,
                    "revisions_count": 2,
                    "usage_duration": "Perpetual",
                    "territory": "Global",
                }),
                json.dumps({}),
                280000,
                now_str,
                deadline_str,
                json.dumps(["ComfyUI", "SDXL", "Blender", "Runway Gen-3"]),
                json.dumps({"is_demo": True, "curated_niche": "Matcha"}),
                1,
                BriefStatus.PUBLISHED.value,
                "/demo-assets/beverage-premium-matcha.jpg",
            ),
        ]

        for brief in demo_briefs:
            cursor.execute(
                """
                INSERT INTO campaign_briefs (
                    id, brand_id, title, brand_or_product_name, product_or_service,
                    product_description, campaign_idea, executive_summary, description,
                    objectives, primary_objective, target_audience, target_market,
                    preferred_language, campaign_category, primary_message, desired_cta,
                    platforms, deliverables, creative_direction, creator_capabilities,
                    commercial_terms, sections, budget_cents, start_date, deadline,
                    required_tools, ai_metadata, is_public, status, cover_image_url,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    title=excluded.title,
                    cover_image_url=excluded.cover_image_url,
                    description=excluded.description,
                    deliverables=excluded.deliverables,
                    budget_cents=excluded.budget_cents,
                    creative_direction=excluded.creative_direction,
                    creator_capabilities=excluded.creator_capabilities,
                    commercial_terms=excluded.commercial_terms,
                    status=excluded.status,
                    updated_at=excluded.updated_at
                """,
                (*brief, now_str, now_str)
            )

        # Update Content Rewards attributes on demo campaigns
        campaign_reward_updates = [
            ("00000000-0000-0000-0000-000000000041", "CPM", 200, 1500000, 420000, 210000, 14),
            ("00000000-0000-0000-0000-000000000042", "CPM", 250, 2000000, 680000, 272000, 18),
            ("00000000-0000-0000-0000-000000000043", "CPM", 180, 1200000, 310000, 172000, 11),
            ("00000000-0000-0000-0000-000000000044", "CPM", 150, 1000000, 240000, 160000, 12),
        ]
        for cid, rtype, cpm, pool, paid, views, parts in campaign_reward_updates:
            cursor.execute(
                """
                UPDATE campaign_briefs
                SET reward_type = ?, cpm_rate_cents = ?, total_pool_cents = ?, paid_pool_cents = ?,
                    views_count = ?, participants_count = ?
                WHERE id = ?
                """,
                (rtype, cpm, pool, paid, views, parts, cid)
            )

        # =====================================================================
        # 6. DEMO CAMPAIGN PARTICIPANTS
        # =====================================================================
        demo_participants = [
            ("part_elena_skincare", "00000000-0000-0000-0000-000000000041", "00000000-0000-0000-0000-000000000021", "JOINED", now_str),
            ("part_elena_cyber", "00000000-0000-0000-0000-000000000043", "00000000-0000-0000-0000-000000000021", "JOINED", now_str),
            ("part_marcus_outdoor", "00000000-0000-0000-0000-000000000042", "00000000-0000-0000-0000-000000000022", "JOINED", now_str),
            ("part_marcus_matcha", "00000000-0000-0000-0000-000000000044", "00000000-0000-0000-0000-000000000022", "JOINED", now_str),
            ("part_aaliyah_skincare", "00000000-0000-0000-0000-000000000041", "00000000-0000-0000-0000-000000000023", "JOINED", now_str),
        ]
        for p in demo_participants:
            cursor.execute(
                """
                INSERT INTO campaign_participants (id, campaign_id, creator_id, status, joined_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(campaign_id, creator_id) DO UPDATE SET status = excluded.status
                """,
                p
            )

        # =====================================================================
        # 7. DEMO CLIP SUBMISSIONS
        # =====================================================================
        demo_submissions = [
            (
                "sub_elena_skincare_01",
                "00000000-0000-0000-0000-000000000041",
                "00000000-0000-0000-0000-000000000021",
                "00000000-0000-0000-0000-000000000010",
                "https://tiktok.com/@elena_ai/video/728192301",
                "TIKTOK",
                "72-Hour Cellular Radiance Morning Routine",
                "High-aesthetic amber glass dropper macro hook with natural morning light and cellular animation.",
                json.dumps(["Midjourney v6.1", "Magnific AI", "CapCut Pro"]),
                95000,
                19000,
                "APPROVED",
                "Flawless lighting and fluid dynamics. Exceptional engagement in the first 3 seconds!",
                now_str,
                now_str,
                now_str,
                now_str,
            ),
            (
                "sub_elena_cyber_01",
                "00000000-0000-0000-0000-000000000043",
                "00000000-0000-0000-0000-000000000021",
                "00000000-0000-0000-0000-000000000010",
                "https://instagram.com/reel/C89xKl29",
                "INSTAGRAM",
                "Neo-Couture Origami Pleats in Fluid Motion",
                "Virtual runway walk showcasing iridescent fabric physics in zero gravity.",
                json.dumps(["Flux.1 Pro", "Magnific 4x", "Premiere Pro"]),
                77000,
                13860,
                "APPROVED",
                "Brilliant fabric drape fidelity. Approved for global paid amplification.",
                now_str,
                now_str,
                now_str,
                now_str,
            ),
            (
                "sub_marcus_outdoor_01",
                "00000000-0000-0000-0000-000000000042",
                "00000000-0000-0000-0000-000000000022",
                "00000000-0000-0000-0000-000000000011",
                "https://tiktok.com/@marcusv/video/718293819",
                "TIKTOK",
                "Simulating 60MPH Alpine Blizzard Water Beading",
                "Cinematic storm simulation with macro droplet repelling and storm wind audio design.",
                json.dumps(["Runway Gen-3", "Topaz Video AI", "Audition"]),
                140000,
                35000,
                "APPROVED",
                "Incredible kinetic pacing and sound design. Top performing clip of the sprint!",
                now_str,
                now_str,
                now_str,
                now_str,
            ),
            (
                "sub_marcus_matcha_01",
                "00000000-0000-0000-0000-000000000044",
                "00000000-0000-0000-0000-000000000022",
                "00000000-0000-0000-0000-000000000010",
                "https://youtube.com/shorts/kL92jF019",
                "YOUTUBE_SHORTS",
                "Slow-Mo Emerald Microfoam Pour Test",
                "Macro slow-motion pour with wabi-sabi tea room background and ASMR audio.",
                json.dumps(["Runway Gen-3 Alpha", "Premiere Pro"]),
                80000,
                12000,
                "APPROVED",
                "Clean sound design and beautiful color grading. Approved!",
                now_str,
                now_str,
                now_str,
                now_str,
            ),
            (
                "sub_aaliyah_skincare_01",
                "00000000-0000-0000-0000-000000000041",
                "00000000-0000-0000-0000-000000000023",
                "00000000-0000-0000-0000-000000000010",
                "https://instagram.com/reel/C91mPo88",
                "INSTAGRAM",
                "Amber Glass Dropper Refraction Macro Pass",
                "Photorealistic glass refraction and droplet physics staged on travertine stone.",
                json.dumps(["Blender 3D", "SDXL", "ControlNet Depth"]),
                38000,
                0,
                "PENDING_REVIEW",
                None,
                now_str,
                None,
                now_str,
                now_str,
            ),
        ]
        for s in demo_submissions:
            cursor.execute(
                """
                INSERT INTO clip_submissions (
                    id, campaign_id, creator_id, brand_id, clip_url, platform,
                    title, description, ai_tools, views_count, earned_cents,
                    status, feedback, submitted_at, reviewed_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    views_count = excluded.views_count,
                    earned_cents = excluded.earned_cents,
                    status = excluded.status,
                    feedback = excluded.feedback,
                    updated_at = excluded.updated_at
                """,
                s
            )

        # =====================================================================
        # 8. DEMO BRAND COMMUNITY POSTS
        # =====================================================================
        demo_posts = [
            (
                "post_lumina_guidelines",
                "00000000-0000-0000-0000-000000000010",
                "Q4 High-Converting Video Hook Formula for TikTok & Reels",
                "When clipping our Cellular Radiance serum, leading with the amber dropper release within the first 1.5 seconds drives a 4.2x higher completion rate. Use trending audio and ensure 9:16 vertical orientation!",
                "GUIDELINES",
                1,
                48,
                "/demo-assets/skincare-luxury-serum.jpg",
                now_str,
                now_str,
            ),
            (
                "post_lumina_winners",
                "00000000-0000-0000-0000-000000000010",
                "October Radiance Clipper Contest Winners Announced!",
                "Huge congratulations to Elena Rostova and our top clippers who generated over 210,000 verified views this week! Over $4,200 has been disbursed to creator balances. Check the leaderboard for full standings.",
                "WINNERS",
                0,
                92,
                None,
                now_str,
                now_str,
            ),
            (
                "post_terra_assets",
                "00000000-0000-0000-0000-000000000011",
                "New 4K Raw Weather Effects Asset Pack Available",
                "We've added 12 new torrential rain overlay loops and wind audio stems to help you build cinematic clips for the Apex 3L Technical Shell. Download from the resources tab!",
                "ASSET_PACK",
                1,
                35,
                "/demo-assets/outdoor-sustainable-gear.jpg",
                now_str,
                now_str,
            ),
            (
                "post_terra_contest",
                "00000000-0000-0000-0000-000000000011",
                "November Alpine Storm 48-Hour Clipping Sprint: $5,000 Bounty",
                "The creator whose clip drives the highest engagement over the next 48 hours gets an additional $1,500 cash bounty on top of the standard $2.50/1K views rate. Submissions close Friday midnight!",
                "CONTEST",
                0,
                114,
                None,
                now_str,
                now_str,
            ),
        ]
        for p in demo_posts:
            cursor.execute(
                """
                INSERT INTO brand_community_posts (
                    id, brand_id, title, content, category, pinned, likes_count, media_url, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    title = excluded.title,
                    content = excluded.content,
                    category = excluded.category,
                    pinned = excluded.pinned,
                    likes_count = excluded.likes_count,
                    updated_at = excluded.updated_at
                """,
                p
            )

        conn.commit()
        logger.info("Successfully seeded demo data: 2 Brands, 3 Creators, 6 Portfolio Projects, 4 Campaign Briefs, 5 Submissions, 4 Community Posts.")


if __name__ == "__main__":
    seed_demo_data()
    print("Demo dataset seeded successfully.")
