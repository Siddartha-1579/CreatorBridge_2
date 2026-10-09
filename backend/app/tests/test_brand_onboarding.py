"""Unit and integration tests for Brand Onboarding, Adaptive Survey, RBAC Separation, and Preferences."""

import pytest
from starlette.testclient import TestClient
from app.schemas.brand import BrandVerificationStatus, BrandVerificationCategory


def get_auth_headers(user_id: str, role: str) -> dict:
    return {
        "Authorization": f"Bearer dev-{user_id}",
        "X-User-Id": user_id,
        "X-User-Role": role,
    }


def test_get_my_brand_profile_and_overview(client: TestClient):
    headers = get_auth_headers("brand-test-alpha", "BRAND")

    # 1. Fetch current brand profile
    resp = client.get("/api/v1/brands/me", headers=headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["user_id"] == "brand-test-alpha"
    assert data["organization_type"] == "Consumer Brand"
    assert data["onboarding_completed"] is False

    # 2. Check unified overview
    ov_resp = client.get("/api/v1/brands/me/overview", headers=headers)
    assert ov_resp.status_code == 200
    ov_data = ov_resp.json()["data"]
    assert "profile" in ov_data
    assert "completeness" in ov_data
    assert "verification_badges" in ov_data
    assert len(ov_data["verification_badges"]) == 4


def test_strict_role_based_data_separation(client: TestClient):
    creator_headers = get_auth_headers("creator-intruder", "CREATOR")
    brand_headers = get_auth_headers("brand-intruder", "BRAND")

    # 1. Creator MUST NOT access brand-only routes
    res1 = client.get("/api/v1/brands/me", headers=creator_headers)
    assert res1.status_code == 403

    res2 = client.get("/api/v1/brands/me/overview", headers=creator_headers)
    assert res2.status_code == 403

    res3 = client.get("/api/v1/brands/onboarding/session", headers=creator_headers)
    assert res3.status_code == 403

    # 2. Brand MUST NOT access creator private routes
    res4 = client.get("/api/v1/creators/me", headers=brand_headers)
    assert res4.status_code == 403

    res5 = client.post(
        "/api/v1/portfolios",
        json={"title": "Unauthorized Asset", "media_url": "https://test.com"},
        headers=brand_headers,
    )
    assert res5.status_code == 403


def test_brand_onboarding_adaptive_survey_flow(client: TestClient):
    headers = get_auth_headers("brand-survey-user", "BRAND")

    # 1. Fetch survey options catalog
    cat_resp = client.get("/api/v1/brands/onboarding/catalog")
    assert cat_resp.status_code == 200
    catalog = cat_resp.json()["data"]
    assert "organization_types" in catalog
    assert "content_requirements" in catalog
    assert len(catalog["organization_types"]) >= 10

    # 2. Test adaptive question branches
    adaptive_payload = {
        "organization_type": "Creative Agency",
        "content_requirements": ["AI filmmaking & narrative trailers", "Social media content & static carousels"],
    }
    adapt_resp = client.post("/api/v1/brands/onboarding/adaptive", json=adaptive_payload, headers=headers)
    assert adapt_resp.status_code == 200
    branches = adapt_resp.json()["data"]
    branch_ids = [b["id"] for b in branches]
    assert "agency_structure" in branch_ids
    assert "filmmaking_specs" in branch_ids
    assert "social_cadence" in branch_ids

    # 3. Save survey progress (Step 2)
    save_payload = {
        "current_step": 2,
        "responses": {
            "company_name": "Lumina Studios",
            "organization_type": "Creative Agency",
            "primary_industry": "Entertainment & Streaming",
        },
    }
    save_resp = client.post("/api/v1/brands/onboarding/save", json=save_payload, headers=headers)
    assert save_resp.status_code == 200
    assert save_resp.json()["data"]["current_step"] == 2

    # 4. Resume survey session
    resume_resp = client.get("/api/v1/brands/onboarding/session", headers=headers)
    assert resume_resp.status_code == 200
    assert resume_resp.json()["data"]["current_step"] == 2
    assert resume_resp.json()["data"]["responses"]["company_name"] == "Lumina Studios"

    # 5. Complete onboarding
    complete_payload = {
        "company_name": "Lumina Creative Group",
        "organization_type": "Creative Agency",
        "primary_industry": "Entertainment & Streaming",
        "contact_name": "Marcus Vance",
        "website": "https://luminacreative.example.com",
        "description": "Full-service generative media agency crafting brand campaigns.",
        "team_size": "20-50",
        "location": "London & Mumbai",
        "intended_uses": ["Producing advertising campaigns", "Developing AI-generated videos"],
        "content_requirements": ["Short-form videos (Reels/TikTok/Shorts)", "Product advertisements & commercial spots"],
        "target_niches": ["Entertainment & Streaming", "Fashion & Apparel"],
        "preferred_formats": ["16:9 landscape (Commercial / Web)", "9:16 vertical (Mobile First)"],
        "creative_styles": ["Cinematic & High-Dynamic", "Photorealistic & Hyper-real"],
        "budget_range": "₹50,000–₹1,00,000",
        "engagement_type": "Campaign",
    }
    complete_resp = client.post("/api/v1/brands/onboarding/complete", json=complete_payload, headers=headers)
    assert complete_resp.status_code == 200
    ov = complete_resp.json()["data"]
    assert ov["profile"]["company_name"] == "Lumina Creative Group"
    assert ov["profile"]["onboarding_completed"] is True
    assert ov["profile"]["profile_completeness_pct"] >= 70
    assert ov["preferences"] is not None
    assert len(ov["preferences"]["intended_uses"]) == 2


def test_brand_profile_update_and_protected_fields(client: TestClient):
    headers = get_auth_headers("brand-profile-updater", "BRAND")

    # Update profile and attempt to forge verification_status
    patch_payload = {
        "company_name": "Apex Worldwide",
        "contact_name": "Elena Rostova",
        "description": "Premium luxury fashion and fragrance brand commissioning cinematic AI visuals.",
        "location": "Paris, France",
        # Forged fields that must be ignored
        "verification_status": "VERIFIED",
    }

    patch_resp = client.patch("/api/v1/brands/me", json=patch_payload, headers=headers)
    assert patch_resp.status_code == 200
    data = patch_resp.json()["data"]
    assert data["company_name"] == "Apex Worldwide"
    assert data["contact_name"] == "Elena Rostova"
    # Verification status remains untampered
    assert data["verification_status"] == BrandVerificationStatus.NOT_STARTED.value


def test_brand_verification_claims(client: TestClient):
    headers = get_auth_headers("brand-verification-tester", "BRAND")

    # 1. Fetch initial badges
    badge_resp = client.get("/api/v1/brands/me/verifications", headers=headers)
    assert badge_resp.status_code == 200
    badges = badge_resp.json()["data"]
    assert len(badges) == 4

    # 2. Submit verification claim
    claim_payload = {
        "verification_type": "DOMAIN_VERIFIED",
        "target_identifier": "apexworldwide.example.com",
        "notes": "Configured DNS TXT record for verification",
    }
    claim_resp = client.post("/api/v1/brands/me/verifications", json=claim_payload, headers=headers)
    assert claim_resp.status_code == 200
    claim_data = claim_resp.json()["data"]
    assert claim_data["verification_type"] == "DOMAIN_VERIFIED"
    assert claim_data["status"] == "PENDING"
