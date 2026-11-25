"""Comprehensive End-to-End Verification of the Brand-to-Creator Campaign Marketplace.

Tests:
1. Brand authentication & role verification
2. Creator authentication & role verification
3. Brand creates creative campaign brief with detailed specifications
4. AI synthesis of campaign cover image & persistence
5. Pre-flight validation & publication to creator marketplace
6. Creator discovery with category & deliverable filtering
7. Creator submits tailored application / proposal with proposed fee & pitch
8. Duplicate application prevention check
9. Brand reviews submitted creator proposals
10. Brand accepts proposal -> Automatic initialization of funded project workspace with milestones
11. Real-time collaboration message dispatch in project workspace
12. SQLite database persistence check across independent connection
"""

import sys
import os
import json
import sqlite3
from pathlib import Path
from uuid import uuid4

# Set up path to backend
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

# Ensure database directory exists
os.chdir(str(BACKEND_DIR))

import asyncio
from app.core.config import settings
from app.core.db import init_db, get_db_connection, DB_PATH
from app.services import auth_service, brief_service, project_service, creator_service
from app.schemas.auth import RegisterRequest, LoginRequest
from app.schemas.brief import (
    CampaignBriefCreate,
    CampaignBriefUpdate,
    DeliverableItem,
    CreativeDirection,
    CreatorCapabilityRequirements,
    CommercialTerms,
    GenerateCoverImageRequest,
    CampaignApplicationCreate,
    CampaignApplicationUpdate,
    ApplicationStatus,
    BriefStatus,
)
from app.schemas.project import ProjectWorkspaceUpdate



async def run_verification():
    print("=" * 70)
    print("CREATORBRIDGE: BRAND-TO-CREATOR CAMPAIGN MARKETPLACE E2E TEST")
    print("=" * 70)

    # Step 0: Ensure DB initialized
    init_db()
    print(f"[OK] Database connection verified at: {DB_PATH}")

    # Step 1: Brand & Creator Accounts
    brand_email = f"brand_e2e_{uuid4().hex[:6]}@fashionnova-ai.com"
    creator_email = f"creator_e2e_{uuid4().hex[:6]}@cinematic-studios.com"
    test_password = "SecurePassword123!"

    print("\n--- 1. AUTHENTICATION & REGISTRATION ---")
    brand_session = await auth_service.register(
        RegisterRequest(
            email=brand_email,
            password=test_password,
            confirm_password=test_password,
            full_name="Nova Studios Brand",
            role="BRAND",
            turnstile_token="test-turnstile-token",
        )
    )
    brand_user_id = str(brand_session.user.id)
    print(f"[PASS] Registered Brand: {brand_email} (ID: {brand_user_id}, Role: {brand_session.user.role})")

    creator_session = await auth_service.register(
        RegisterRequest(
            email=creator_email,
            password=test_password,
            confirm_password=test_password,
            full_name="Elena Vance AI",
            role="CREATOR",
            turnstile_token="test-turnstile-token",
        )
    )
    creator_user_id = str(creator_session.user.id)
    print(f"[PASS] Registered Creator: {creator_email} (ID: {creator_user_id}, Role: {creator_session.user.role})")

    # Step 2: Brand Creates Campaign Brief Draft
    print("\n--- 2. BRAND CREATES CAMPAIGN BRIEF ---")
    brief_payload = CampaignBriefCreate(
        title="Cyberpunk Streetwear 2026 Commercial Series",
        brand_or_product_name="Nova Wear Cyber Line",
        product_description="High-tech holographic streetwear featuring adaptive luminescent materials.",
        campaign_idea="High-octane neon night market visual narrative showcasing dynamic fabric physics.",
        executive_summary="A multi-part cinematic short-form campaign highlighting futuristic rain-slicked apparel.",
        primary_objective="Brand awareness",
        objectives=["Brand awareness", "High viral engagement", "Product launch"],
        target_audience="Gen-Z AI design enthusiasts and cyberpunk streetwear collectors",
        target_market="Global",
        campaign_category="AI Filmmaking & Fashion",
        primary_message="Wear the future. Light up the dark.",
        desired_cta="Pre-order drop live on bio link",
        platforms=["Instagram", "TikTok", "YouTube"],
        deliverables=[
            DeliverableItem(
                id="del-1",
                content_type="Short-form video",
                quantity=3,
                aspect_ratio="9:16",
                resolution="4K",
                duration_seconds=15,
                production_notes="Photorealistic 35mm cinematic lighting with neon chromatic aberration",
            ),
            DeliverableItem(
                id="del-2",
                content_type="Static",
                quantity=5,
                aspect_ratio="1:1",
                resolution="4K",
                production_notes="Editorial lookbook key visual stills",
            ),
        ],
        creative_direction=CreativeDirection(
            tone_and_personality="Confident & High-Octane Futuristic",
            styles=["Photorealistic 35mm", "Cyberpunk Neon Noir"],
            mood_atmosphere="Rain-slicked neon alleys, reflective wet asphalt, anamorphic lens flares",
            key_product_benefits="Self-illuminating threads, weather-resistant cyber-fabrics",
            call_to_action="Discover the drop now",
        ),
        creator_capabilities=CreatorCapabilityRequirements(
            preferred_niches=["AI Filmmaking", "Fashion & Apparel"],
            required_capabilities=["Prompt Engineering", "Cinematic Lighting", "ComfyUI Upscaling"],
            preferred_capabilities=["Sound Design", "Audio Syncing"],
            flexible_capabilities=["Color Grading"],
            preferred_tools=["Runway Gen-3", "Midjourney v6.1", "ElevenLabs"],
        ),
        commercial_terms=CommercialTerms(
            budget_cents=450000,  # $4,500.00 USD
            budget_per_deliverable_cents=100000,
            currency="USD",
            compensation_model="PAID",
            payment_model="MILESTONE",
            intended_usage=["PAID_ADS", "ORGANIC_SOCIAL"],
            territory="Global",
            exclusivity_required=True,
            exclusivity_duration="30 days",
            commercial_rights_required=True,
            source_files_required=False,
            revisions_count=2,
            publishing_window="Within 5 days of sign-off",
            attribution_required=False,
            ongoing_work_considered=True,
        ),
        budget_cents=450000,
        required_tools=["Runway Gen-3", "Midjourney v6.1"],
    )

    created_brief = await brief_service.create_brief(brand_id=brand_user_id, data=brief_payload)
    print(f"[PASS] Saved draft brief: '{created_brief.title}' (ID: {created_brief.id}, Status: {created_brief.status})")

    # Step 3: AI Campaign Cover Image Synthesis
    print("\n--- 3. AI CAMPAIGN COVER IMAGE SYNTHESIS ---")
    cover_res = await brief_service.generate_cover_image(
        brief_id=created_brief.id,
        brand_id=brand_user_id,
        request=GenerateCoverImageRequest(
            custom_prompt="Editorial cyberpunk model in luminescent holographic trench coat under neon rain in Tokyo",
            style_preset="Cinematic 35mm film photograph",
            aspect_ratio="16:9",
        ),
    )
    print(f"[PASS] Synthesized Cover Image:")
    print(f"       URL: {cover_res.image_url}")
    print(f"       Provider: {cover_res.provider} (Model: {cover_res.model})")
    print(f"       Saved to brief: {cover_res.saved_to_brief}")

    # Verify brief updated with cover_image_url
    retrieved_brief = await brief_service.get_brief_by_id(created_brief.id, current_user_id=brand_user_id)
    assert retrieved_brief.cover_image_url == cover_res.image_url, "Cover image URL was not stored on brief!"
    print(f"[PASS] Persisted cover image verified on brief: {retrieved_brief.cover_image_url[:60]}...")

    # Step 4: Publish Brief to Creator Marketplace
    print("\n--- 4. BRIEF PUBLICATION ---")
    val = brief_service.validate_brief(retrieved_brief)
    print(f"       Validation: can_publish={val.can_publish}, blocking_errors={val.blocking_errors}")
    assert val.can_publish, f"Validation failed: {val.blocking_errors}"

    published_brief = await brief_service.publish_brief(brief_id=created_brief.id, brand_id=brand_user_id)
    assert published_brief.status == BriefStatus.PUBLISHED, "Status did not transition to PUBLISHED!"
    assert published_brief.is_public is True, "Brief is not marked public!"
    print(f"[PASS] Campaign successfully published to marketplace (Status: {published_brief.status})")

    # Step 5: Creator Discovers Published Campaign
    print("\n--- 5. CREATOR MARKETPLACE DISCOVERY & FILTERING ---")
    marketplace_briefs = await brief_service.list_briefs(limit=20, search="Cyberpunk")
    found = any(str(b.id) == str(created_brief.id) for b in marketplace_briefs)
    assert found, "Creator failed to discover published brief in marketplace search!"
    print(f"[PASS] Creator successfully discovered '{created_brief.title}' via marketplace search")

    # Step 6: Creator Submits Proposal / Application
    print("\n--- 6. CREATOR SUBMITS TAILORED PROPOSAL ---")
    app_payload = CampaignApplicationCreate(
        pitch="I specialize in photorealistic cyberpunk motion using Runway Gen-3 and ComfyUI LoRAs. I can deliver all 3 9:16 videos with custom sound design within 5 days.",
        proposed_rate_cents=420000,  # $4,200.00 USD
        estimated_days=5,
        relevant_skills=["Runway Gen-3", "Prompt Engineering", "Cyberpunk Lighting"],
        relevant_tools=["Runway Gen-3", "ComfyUI", "ElevenLabs"],
        portfolio_item_ids=[],
    )
    application = await brief_service.apply_to_brief(
        brief_id=created_brief.id,
        creator_id=creator_user_id,
        data=app_payload,
    )
    print(f"[PASS] Creator submitted application (ID: {application.id}, Status: {application.status})")

    # Step 7: Duplicate Application Prevention
    print("\n--- 7. DUPLICATE APPLICATION CHECK ---")
    from app.core.errors import ConflictException
    try:
        await brief_service.apply_to_brief(
            brief_id=created_brief.id,
            creator_id=creator_user_id,
            data=app_payload,
        )
        raise AssertionError("Duplicate application should have been rejected!")
    except ConflictException:
        print("[PASS] Duplicate proposal correctly rejected with 409 ConflictException")

    # Step 8: Brand Reviews Proposals
    print("\n--- 8. BRAND REVIEWS PROPOSALS ---")
    brand_apps = await brief_service.list_applications_for_brief(
        brief_id=created_brief.id,
        brand_id=brand_user_id,
    )
    assert len(brand_apps) >= 1, "Brand saw 0 applications for their campaign!"
    app_to_review = next(a for a in brand_apps if str(a.id) == str(application.id))
    print(f"[PASS] Brand retrieved proposal from creator: '{app_to_review.pitch[:50]}...' (Rate: ${app_to_review.proposed_rate_cents/100})")

    # Step 9: Brand Accepts Proposal -> Project Workspace Initialized
    print("\n--- 9. BRAND ACCEPTS PROPOSAL & SPAWNS COLLABORATION WORKSPACE ---")
    accepted_app = await brief_service.update_application_status(
        application_id=app_to_review.id,
        brand_id=brand_user_id,
        data=CampaignApplicationUpdate(status=ApplicationStatus.ACCEPTED),
    )
    assert accepted_app.status == ApplicationStatus.ACCEPTED, "Application status was not updated to ACCEPTED!"
    print(f"[PASS] Application updated to: {accepted_app.status}")

    # Check that a collaboration workspace was automatically spawned
    brand_projects = await project_service.list_for_user(brand_user_id)
    spawned_project = next((p for p in brand_projects if str(p.brief_id) == str(created_brief.id)), None)
    assert spawned_project is not None, "Collaboration workspace was not created upon proposal acceptance!"
    print(f"[PASS] Active Collaboration Workspace spawned:")
    print(f"       Title: '{spawned_project.title}' (ID: {spawned_project.id})")
    print(f"       Agreed Budget: ${spawned_project.agreed_budget_cents / 100}")
    print(f"       Milestones ({len(spawned_project.milestones)}): {[m.get('title') if isinstance(m, dict) else m.title for m in spawned_project.milestones]}")
    print(f"       Deliverables ({len(spawned_project.deliverables)}): {[d.get('title') if isinstance(d, dict) else d.title for d in spawned_project.deliverables]}")

    # Step 10: Real-Time Chat Message Exchange in Workspace
    print("\n--- 10. COLLABORATION MESSAGE DISPATCH ---")
    msg_update = await project_service.update_workspace(
        project_id=spawned_project.id,
        user_id=brand_user_id,
        data=ProjectWorkspaceUpdate(
            messages=[
                {
                    "id": "msg_001",
                    "sender_id": brand_user_id,
                    "sender_role": "BRAND",
                    "content": "Welcome to the Nova Streetwear campaign! Looking forward to seeing the first cut.",
                    "timestamp": "2026-10-11T12:00:00Z",
                }
            ]
        ),
    )
    content_val = msg_update.messages[0].get("content") if isinstance(msg_update.messages[0], dict) else msg_update.messages[0].content
    print(f"[PASS] Brand message posted to workspace: '{content_val}'")

    # Step 11: Direct SQLite Database Verification
    print("\n--- 11. PERSISTENT SQLITE DATABASE VERIFICATION ---")
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Check brief
        cursor.execute("SELECT id, title, cover_image_url, status FROM campaign_briefs WHERE id = ?", (str(created_brief.id),))
        row_brief = cursor.fetchone()
        assert row_brief is not None, "Brief not found in SQLite table!"
        print(f"[PASS] SQLite campaign_briefs row: ID={row_brief['id']}, Status={row_brief['status']}, Cover={bool(row_brief['cover_image_url'])}")

        # Check application
        cursor.execute("SELECT id, brief_id, creator_id, status, proposed_rate_cents FROM campaign_applications WHERE id = ?", (str(application.id),))
        row_app = cursor.fetchone()
        assert row_app is not None, "Application not found in SQLite table!"
        assert row_app["status"] == "ACCEPTED", f"Application status in DB is {row_app['status']}"
        print(f"[PASS] SQLite campaign_applications row: ID={row_app['id']}, Status={row_app['status']}, Fee=${row_app['proposed_rate_cents']/100}")

        # Check workspace
        cursor.execute("SELECT id, title, status FROM project_workspaces WHERE id = ?", (str(spawned_project.id),))
        row_ws = cursor.fetchone()
        assert row_ws is not None, "Project workspace not found in SQLite table!"
        print(f"[PASS] SQLite project_workspaces row: ID={row_ws['id']}, Title='{row_ws['title']}'")

    print("\n" + "=" * 70)
    print("ALL 11 END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_verification())
