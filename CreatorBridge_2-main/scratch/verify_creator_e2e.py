"""Creator Hub End-to-End Verification Test Script.

Tests:
1. Creator registration & token generation.
2. Adaptive Onboarding survey submission and SQLite profile sync.
3. Creator Profile update and retrieval.
4. AI Profile Improvement endpoint.
5. Portfolio showcase asset upload (multipart FormData) and creation.
6. AI Studio generation job and direct save-to-portfolio.
7. Campaign invite & Project workspace collaboration (deliverables & messaging).
8. Public creator profile view.
"""

import sys
import os
import asyncio
from uuid import uuid4
import io

# Add backend to path
sys.path.insert(0, os.path.abspath("backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("=== STARTING CREATOR HUB E2E VERIFICATION ===")

    # 1. Register a test creator
    test_email = f"creator_{uuid4().hex[:6]}@example.com"
    test_password = "SecurePassword123!"
    print(f"\n[Step 1] Registering test creator: {test_email}")
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": test_email,
            "password": test_password,
            "role": "CREATOR",
            "full_name": "Elena Rostova",
        },
    )
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    token = reg_res.json()["data"]["access_token"]
    user_id = reg_res.json()["data"]["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f" -> Registered creator user_id: {user_id}")

    # 2. Complete Adaptive Onboarding Survey
    print("\n[Step 2] Submitting Adaptive Onboarding Survey for Creator")
    survey_answers = {
        "cr_display_name": "Elena Rostova",
        "cr_headline": "Cinematic AI Video Director & Prompt Architect",
        "cr_bio": "Award-winning filmmaker specializing in Runway Gen-3 and Midjourney pipelines for luxury and fashion brands.",
        "cr_country": "United States",
        "cr_languages": ["English", "French"],
        "cr_experience_years": 4,
        "cr_creator_type": "INDIVIDUAL",
        "cr_specializations": ["AI Video Production", "Creative Direction"],
        "cr_skills": ["Prompt Engineering", "Cinematography", "Color Grading"],
        "cr_tools_catalog": [{"tool_name": "Runway Gen-3", "experience_level": "master"}, {"tool_name": "Midjourney", "experience_level": "master"}],
        "cr_commercial_licensing_knowledge": "strict_verified",
        "cr_platforms": ["youtube", "instagram"],
        "cr_primary_portfolio_url": "https://creatorbridge.example.com/elenarostova",
        "cr_best_work_summary": "Cinematic AI video commercial combining Runway Gen-3 dynamic motion and Midjourney v6 art direction.",
        "cr_pricing_model": "fixed_milestone",
        "cr_starting_price": 350,
        "cr_revision_policy": "2_rounds",
        "cr_current_availability": "immediate",
        "cr_collaboration_style": "hybrid",
        "cr_conduct_originality": "confirmed",
        "cr_conduct_ai_disclosure": "confirmed",
        "cr_conduct_dispute_policy": "confirmed",
    }
    survey_res = client.post(
        "/api/v1/surveys/creator/submit",
        headers=headers,
        json={"survey_type": "CREATOR", "answers": survey_answers},
    )
    assert survey_res.status_code == 200, f"Survey submit failed: {survey_res.text}"
    print(" -> Survey submitted successfully")

    # 3. Verify creator profile updated in SQLite
    print("\n[Step 3] Fetching and verifying creator profile from SQLite")
    profile_res = client.get("/api/v1/creators/me", headers=headers)
    assert profile_res.status_code == 200, f"Get profile failed: {profile_res.text}"
    p_data = profile_res.json()["data"]
    assert p_data["full_name"] == "Elena Rostova"
    assert p_data["headline"] == "Cinematic AI Video Director & Prompt Architect"
    assert "Runway Gen-3" in p_data["ai_tools"]
    print(f" -> Profile verified: {p_data['full_name']} | Headline: {p_data['headline']}")

    # 4. AI Profile Improvement
    print("\n[Step 4] Testing AI Profile Improvement endpoint")
    ai_imp_res = client.post(
        "/api/v1/ai/creator/improve-profile",
        headers=headers,
        json={
            "original_headline": p_data["headline"],
            "original_bio": p_data["bio"],
            "skills": p_data["skills"],
            "specializations": [p_data["primary_specialization"]],
            "ai_tools": p_data["ai_tools"],
            "tone": "professional_creative",
        },
    )
    assert ai_imp_res.status_code == 200, f"AI improve profile failed: {ai_imp_res.text}"
    imp_data = ai_imp_res.json()["data"]
    assert imp_data["improved_bio"], "Missing improved bio"
    print(f" -> AI improvement generated successfully: {imp_data['improved_bio'][:80]}...")

    # 5. Multipart Media Asset Upload & Portfolio Project Creation
    print("\n[Step 5] Uploading multipart media asset for portfolio")
    file_bytes = b"\x00" * 1024 # dummy media
    files = {"file": ("showcase.mp4", io.BytesIO(file_bytes), "video/mp4")}
    up_res = client.post("/api/v1/portfolios/upload", headers=headers, files=files)
    assert up_res.status_code == 200, f"Asset upload failed: {up_res.text}"
    uploaded_url = up_res.json()["data"]["public_url"]
    print(f" -> Asset uploaded successfully: {uploaded_url}")

    print(" -> Creating new portfolio showcase project")
    proj_create_res = client.post(
        "/api/v1/portfolios",
        headers=headers,
        json={
            "title": "Aura Hyper-Luxe Cyberpunk Reel",
            "description": "Commercial showcase produced using Runway Gen-3 and ElevenLabs.",
            "category": "AI Video",
            "content_type": "Cinematic Commercial",
            "media_type": "VIDEO",
            "media_url": uploaded_url,
            "thumbnail_url": uploaded_url,
            "tools": ["Runway Gen-3", "Midjourney", "ElevenLabs"],
            "models": ["Gen-3 Alpha"],
            "skills": ["Prompt Engineering", "Cinematography"],
            "aspect_ratio": "16:9",
            "resolution": "4K",
            "duration_seconds": 30,
            "commercial_use_status": "COMMERCIAL_READY",
            "ai_generation_type": "AI_GENERATED",
            "visibility": "PUBLIC",
        },
    )
    assert proj_create_res.status_code == 200, f"Portfolio create failed: {proj_create_res.text}"
    portfolio_item_id = proj_create_res.json()["data"]["id"]
    print(f" -> Portfolio item created: {portfolio_item_id}")

    # 6. AI Studio Generation Job & Save to Portfolio
    print("\n[Step 6] Running AI Studio Generation Job")
    gen_res = client.post(
        "/api/v1/generation/jobs",
        headers=headers,
        json={
            "modality": "IMAGE",
            "prompt": "Futuristic neo-Tokyo architectural pavilion with bioluminescent glass, 8K render",
            "parameters": {"aspect_ratio": "16:9", "style_preset": "Cinematic"},
        },
    )
    assert gen_res.status_code == 200, f"Generation job failed: {gen_res.text}"
    job_id = gen_res.json()["data"]["id"]
    print(f" -> AI generation job completed: {job_id}")

    print(" -> Saving AI Studio generation output directly to portfolio")
    save_job_res = client.post(
        f"/api/v1/generation/jobs/{job_id}/save-portfolio",
        headers=headers,
        json={"title": "Neo-Tokyo Bioluminescent Pavilion"},
    )
    assert save_job_res.status_code == 200, f"Save job to portfolio failed: {save_job_res.text}"
    saved_port_id = save_job_res.json()["data"]["portfolio_item_id"]
    print(f" -> Generation saved to portfolio: {saved_port_id}")

    # 7. Project Workspace Collaboration (Brand invites Creator, Creator collaborates)
    print("\n[Step 7] Testing Project Workspace Collaboration")
    # Brand creates a project workspace inviting creator
    brand_email = f"brand_{uuid4().hex[:6]}@brand.example.com"
    brand_reg = client.post(
        "/api/v1/auth/register",
        json={"email": brand_email, "password": "BrandPassword123!", "role": "BRAND", "full_name": "Apex Brand"},
    )
    assert brand_reg.status_code == 200, f"Brand registration failed: {brand_reg.text}"
    brand_token = brand_reg.json()["data"]["access_token"]
    brand_headers = {"Authorization": f"Bearer {brand_token}"}

    workspace_res = client.post(
        "/api/v1/projects",
        headers=brand_headers,
        json={
            "title": "Aura Luxury Campaign × Elena Rostova",
            "creator_id": p_data["id"],
            "agreed_budget_cents": 350000,
            "due_date": "2026-11-01T00:00:00Z",
            "milestones": [
                {"id": "ms_1", "title": "Moodboard & Concept", "amount_cents": 150000, "status": "FUNDED"},
                {"id": "ms_2", "title": "Final 4K Master Deliverable", "amount_cents": 200000, "status": "PENDING"},
            ],
            "deliverables": [
                {"id": "del_1", "title": "4K Video Master", "status": "PENDING"}
            ],
            "messages": [
                {"id": "m_1", "sender_id": "BRAND", "sender_name": "Apex Brand", "content": "Welcome to the campaign, Elena!"}
            ],
        },
    )
    assert workspace_res.status_code == 200, f"Workspace create failed: {workspace_res.text}"
    workspace_id = workspace_res.json()["data"]["id"]
    print(f" -> Workspace created: {workspace_id}")

    # Creator lists projects and opens workspace
    c_proj_res = client.get("/api/v1/projects", headers=headers)
    assert c_proj_res.status_code == 200, f"Creator list projects failed: {c_proj_res.text}"
    c_projects = c_proj_res.json()["data"]
    assert any(p["id"] == workspace_id for p in c_projects), "Created workspace not found in creator list!"
    print(f" -> Creator listed projects: found workspace {workspace_id}")

    # Creator submits deliverable and sends chat message
    print(" -> Creator submits deliverable and sends chat message in workspace")
    c_update_res = client.patch(
        f"/api/v1/projects/{workspace_id}",
        headers=headers,
        json={
            "status": "REVIEW",
            "deliverables": [
                {
                    "id": "del_1",
                    "title": "4K Video Master",
                    "status": "SUBMITTED",
                    "media_url": uploaded_url,
                    "notes": "Color-graded and mastered in ProRes 422 HQ.",
                }
            ],
            "messages": [
                {"id": "m_1", "sender_id": "BRAND", "sender_name": "Apex Brand", "content": "Welcome to the campaign, Elena!"},
                {"id": "m_2", "sender_id": "CREATOR", "sender_name": "Elena Rostova", "content": "Delivered the final 4K master!"},
            ],
        },
    )
    assert c_update_res.status_code == 200, f"Creator update workspace failed: {c_update_res.text}"
    print(" -> Workspace updated by creator successfully")

    # 8. Public Creator Profile Page view
    print("\n[Step 8] Verifying public creator profile view")
    pub_res = client.get(f"/api/v1/creators/{p_data['id']}")
    assert pub_res.status_code == 200, f"Public profile view failed: {pub_res.text}"
    pub_data = pub_res.json()["data"]
    assert pub_data["full_name"] == "Elena Rostova"
    assert pub_data["portfolio_count"] >= 2, f"Expected at least 2 portfolio items, got {pub_data['portfolio_count']}"
    print(f" -> Public profile view verified: {pub_data['full_name']} with {pub_data['portfolio_count']} showcases")

    print("\n=== ALL CREATOR HUB E2E TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
