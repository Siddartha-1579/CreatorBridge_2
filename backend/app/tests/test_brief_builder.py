"""Tests for AI-powered creative brief builder, drafts, and publication flow."""

import pytest
from starlette.testclient import TestClient


def get_auth_headers(user_id: str, role: str) -> dict:
    return {
        "Authorization": f"Bearer dev-{user_id}",
        "X-User-Id": user_id,
        "X-User-Role": role,
    }


def test_ai_brief_generation_endpoint(client: TestClient):
    """Verifies AI brief synthesis returns 16 editable sections, structured deliverables, and clarifying questions."""
    headers = get_auth_headers("brand-apex-001", "BRAND")
    payload = {
        "campaign_idea": "Launching a high-end luxury mechanical watch made from aerospace titanium",
        "template_category": "Product Launch",
        "product_or_service": "Chronos Aerospace Titanium Watch",
        "target_audience": "Luxury collectors and design enthusiasts",
        "objectives": ["PRODUCT_LAUNCH", "BRAND_AWARENESS"],
        "styles": ["Photorealistic", "Cinematic", "Minimalist"],
    }
    res = client.post("/api/v1/briefs/ai/generate", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]

    assert "refined_title" in data
    assert "executive_summary" in data
    assert len(data["suggested_deliverables"]) >= 2
    assert any(d["aspect_ratio"] == "9:16" for d in data["suggested_deliverables"])
    assert len(data["open_questions"]) >= 1
    assert len(data["constraints"]) >= 1
    assert data["provider_used"] in ["algorithmic_creative_engine", "ai_gateway"]

    # Verify 16 structured sections are generated
    assert "sections" in data
    sections = data["sections"]
    assert len(sections) == 16
    assert "campaign_overview" in sections
    assert "creative_direction" in sections
    assert "deliverables_and_specs" in sections
    assert "usage_rights_and_licensing" in sections


def test_ai_refine_idea_endpoint(client: TestClient):
    """Verifies AI idea refinement returns sharpened concept and suggested hooks."""
    headers = get_auth_headers("brand-apex-001", "BRAND")
    payload = {
        "campaign_name": "Lumina Aura Reveal",
        "brand_or_product_name": "Lumina Wearables",
        "campaign_idea": "A smartwatch that tracks your creative energy and adapts ambient lights in your room",
        "primary_objective": "Brand awareness",
    }
    res = client.post("/api/v1/briefs/ai/refine-idea", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "refined_idea" in data
    assert len(data["suggested_hooks"]) >= 1
    assert len(data["key_angles"]) >= 1


def test_ai_suggest_creative_directions_endpoint(client: TestClient):
    """Verifies AI creative direction suggestion returns 3 selectable options."""
    headers = get_auth_headers("brand-apex-001", "BRAND")
    payload = {
        "campaign_idea": "Zero-sugar sparkling botanical elixir launch",
        "product_or_service": "Botanica Sparkling Elixir",
        "primary_objective": "Product launch",
    }
    res = client.post("/api/v1/briefs/ai/suggest-directions", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]
    options = data["options"]
    assert len(options) == 3
    assert any(opt["id"] == "dir_cinematic" for opt in options)
    assert any(opt["id"] == "dir_viral_social" for opt in options)
    assert any(opt["id"] == "dir_surreal_3d" for opt in options)


def test_ai_regenerate_single_section_endpoint(client: TestClient):
    """Verifies regenerating a single brief section returns updated text for that section."""
    headers = get_auth_headers("brand-apex-001", "BRAND")
    payload = {
        "section_id": "creative_direction",
        "brief_data": {
            "title": "Aura Smartwatch Launch",
            "product_or_service": "Aura Watch",
            "campaign_idea": "Ambient lighting synchronized with biological rhythms",
        },
        "custom_guidance": "Focus on high-contrast cyberpunk lighting",
    }
    res = client.post("/api/v1/briefs/ai/regenerate-section", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["section_id"] == "creative_direction"
    assert len(data["regenerated_content"]) > 20


def test_create_and_update_brief_draft(client: TestClient):
    """Verifies brand can save an initial draft and update it across wizard steps."""
    headers = get_auth_headers("brand-apex-001", "BRAND")

    # Step 1: Create initial draft
    draft_payload = {
        "title": "Minimalist Skincare Social Campaign",
        "description": "5 aesthetic product videos for TikTok",
        "campaign_idea": "Clean vegan skincare launch",
        "status": "DRAFT",
        "deliverables": [
            {
                "content_type": "Short-form videos",
                "quantity": 5,
                "aspect_ratio": "9:16",
                "resolution": "4K",
                "duration_seconds": 15,
                "raw_footage_required": False,
                "captions_required": True,
            }
        ],
    }
    create_res = client.post("/api/v1/briefs", json=draft_payload, headers=headers)
    assert create_res.status_code == 200
    brief = create_res.json()["data"]
    brief_id = brief["id"]
    assert brief["status"] == "DRAFT"

    # Step 2: Partial update of creative direction
    update_payload = {
        "target_audience": "Eco-conscious skincare shoppers aged 20-35",
        "budget_cents": 180000,
        "creative_direction": {
            "styles": ["Editorial", "Natural Light", "Minimalist"],
            "color_palette": "Soft Sage (#9CA986), Cream (#FAF8F5)",
            "experimentation_level": "BALANCED",
        },
        "sections": {
            "campaign_overview": "Custom overview draft edited by user.",
        },
    }
    update_res = client.patch(f"/api/v1/briefs/{brief_id}", json=update_payload, headers=headers)
    assert update_res.status_code == 200
    updated = update_res.json()["data"]
    assert updated["target_audience"] == "Eco-conscious skincare shoppers aged 20-35"
    assert updated["budget_cents"] == 180000
    assert "Editorial" in updated["creative_direction"]["styles"]
    assert updated["sections"]["campaign_overview"] == "Custom overview draft edited by user."


def test_publish_validation_blocks_incomplete_brief(client: TestClient):
    """Verifies publishing is blocked when critical fields like title or deliverables are empty."""
    headers = get_auth_headers("brand-apex-001", "BRAND")

    # Create incomplete draft with no deliverables
    empty_draft = {
        "title": "Untitled Creative Brief",
        "description": "",
        "deliverables": [],
        "status": "DRAFT",
    }
    create_res = client.post("/api/v1/briefs", json=empty_draft, headers=headers)
    brief_id = create_res.json()["data"]["id"]

    # Attempt to publish incomplete brief
    pub_res = client.post(f"/api/v1/briefs/{brief_id}/publish", headers=headers)
    assert pub_res.status_code == 422
    assert "Cannot publish brief due to missing requirements" in pub_res.json()["error"]["message"]


def test_publish_complete_brief_succeeds(client: TestClient):
    """Verifies a fully specified brief transitions successfully to PUBLISHED."""
    headers = get_auth_headers("brand-apex-001", "BRAND")
    complete_brief = {
        "title": "Neon Automotive Spec Commercial",
        "description": "Commercial trailer showcasing our concept EV in dynamic urban nightscapes.",
        "campaign_idea": "Electric vehicle night racing spec commercial",
        "objectives": ["PRODUCT_LAUNCH", "BRAND_AWARENESS"],
        "target_audience": "EV automotive enthusiasts",
        "deliverables": [
            {
                "content_type": "Long-form videos",
                "quantity": 1,
                "aspect_ratio": "16:9",
                "resolution": "4K",
                "duration_seconds": 30,
                "production_notes": "Cinematic volumetric lighting",
            }
        ],
        "budget_cents": 500000,
        "status": "DRAFT",
    }
    create_res = client.post("/api/v1/briefs", json=complete_brief, headers=headers)
    brief_id = create_res.json()["data"]["id"]

    pub_res = client.post(f"/api/v1/briefs/{brief_id}/publish", headers=headers)
    assert pub_res.status_code == 200
    published_brief = pub_res.json()["data"]
    assert published_brief["status"] == "PUBLISHED"
    assert published_brief["is_public"] is True


def test_creator_cannot_access_or_edit_brand_briefs(client: TestClient):
    """Verifies strict RBAC: creators cannot create, edit, or publish brand briefs."""
    creator_headers = get_auth_headers("creator-alex-001", "CREATOR")

    # Creator tries to create a brief
    res = client.post(
        "/api/v1/briefs",
        json={"title": "Unauthorized Brief", "description": "Test"},
        headers=creator_headers,
    )
    assert res.status_code == 403

    # Creator tries to access brand's internal briefs
    res = client.get("/api/v1/briefs/mine", headers=creator_headers)
    assert res.status_code == 403
