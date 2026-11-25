"""Regression tests for CORS headers, brief upserting/publishing with specific IDs, and application authorization."""

import pytest
from uuid import UUID, uuid4
from fastapi.testclient import TestClient
from app.main import app
@pytest.fixture
def lumina_token(client: TestClient):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "lumina@demo.creatorbridge.com", "password": "demo123456"},
    )
    assert res.status_code == 200
    return res.json()["data"]["access_token"]


@pytest.fixture
def terra_token(client: TestClient):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "terra@demo.creatorbridge.com", "password": "demo123456"},
    )
    assert res.status_code == 200
    return res.json()["data"]["access_token"]


def test_cors_headers_on_404_not_found(client: TestClient):
    """Verifies that 404 responses include Access-Control-Allow-Origin for production frontend."""
    headers = {"Origin": "https://creatorbridge2.vercel.app"}
    res = client.get("/api/v1/briefs/00000000-0000-0000-0000-000000009999", headers=headers)
    assert res.status_code == 404
    assert res.headers.get("access-control-allow-origin") == "https://creatorbridge2.vercel.app"
    assert res.headers.get("access-control-allow-credentials") == "true"
    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "NOT_FOUND"


def test_cors_preflight_on_brief_endpoint(client: TestClient):
    """Verifies that preflight OPTIONS on briefs endpoint succeeds with CORS headers."""
    headers = {
        "Origin": "https://creatorbridge2.vercel.app",
        "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": "authorization,content-type",
    }
    res = client.options("/api/v1/briefs/c3e6063a-5bab-4a0c-acb5-09505594026f", headers=headers)
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://creatorbridge2.vercel.app"
    assert "PUT" in res.headers.get("access-control-allow-methods", "")
    assert res.headers.get("access-control-allow-credentials") == "true"


def test_upsert_and_publish_brief_c3e6063a(client: TestClient, lumina_token: str):
    """Verifies that a brief with a client-specified ID (e.g. c3e6063a-...) can be upserted and published by Lumina brand."""
    brief_id = str(uuid4())
    auth_headers = {
        "Authorization": f"Bearer {lumina_token}",
        "Origin": "https://creatorbridge2.vercel.app",
        "Content-Type": "application/json",
    }

    # 16 Canonical Sections payload
    sections = {
        f"section_{i}": f"Detailed content for editorial section {i}"
        for i in range(1, 17)
    }

    payload = {
        "title": "Lumina Amber Radiance Global Campaign",
        "brand_or_product_name": "Lumina Skincare",
        "product_description": "Next-generation cellular hydration and radiance serum.",
        "campaign_idea": "Showcase amber glass aesthetic with macro cellular fluid motion.",
        "executive_summary": "Comprehensive Q4 commercial campaign across social channels.",
        "primary_objective": "Brand awareness",
        "objectives": ["Brand awareness", "High-conversion UGC"],
        "target_audience": "Affluent skincare enthusiasts 22-45",
        "deliverables": [
            {
                "id": "del-1",
                "content_type": "Short-form videos",
                "quantity": 3,
                "placement_or_platform": "Instagram Reels & TikTok",
                "aspect_ratio": "9:16",
                "resolution": "4K (2160p)",
                "duration_seconds": 15,
                "raw_footage_required": False,
                "captions_required": True,
                "creator_on_camera": False,
                "production_notes": "Amber glass lighting and macro texture.",
            }
        ],
        "sections": sections,
        "budget_cents": 350000,
        "status": "DRAFT",
        "is_public": True,
    }

    # PUT (upsert) to specified ID
    res = client.put(f"/api/v1/briefs/{brief_id}", json=payload, headers=auth_headers)
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://creatorbridge2.vercel.app"
    data = res.json()
    assert data["success"] is True
    brief_data = data["data"]
    assert brief_data["id"] == brief_id
    assert brief_data["title"] == "Lumina Amber Radiance Global Campaign"
    assert len(brief_data["sections"]) == 16
    assert brief_data["status"] == "DRAFT"

    # Publish the upserted brief
    pub_res = client.post(f"/api/v1/briefs/{brief_id}/publish", headers=auth_headers)
    assert pub_res.status_code == 200
    assert pub_res.headers.get("access-control-allow-origin") == "https://creatorbridge2.vercel.app"
    pub_data = pub_res.json()
    assert pub_data["success"] is True
    assert pub_data["data"]["status"] == "PUBLISHED"
    assert pub_data["data"]["is_public"] is True

    # Read back to ensure 16 sections are persisted in SQLite
    get_res = client.get(f"/api/v1/briefs/{brief_id}", headers=auth_headers)
    assert get_res.status_code == 200
    retrieved = get_res.json()["data"]
    assert retrieved["id"] == brief_id
    assert retrieved["status"] == "PUBLISHED"
    assert len(retrieved["sections"]) == 16


def test_brief_applications_authorization_and_cors(client: TestClient, lumina_token: str):
    """Verifies applications endpoint authorization and CORS headers on 403 response."""
    lumina_headers = {
        "Authorization": f"Bearer {lumina_token}",
        "Origin": "https://creatorbridge2.vercel.app",
    }

    # Lumina viewing applications for Lumina brief 00000000-0000-0000-0000-000000000041 (allowed)
    res_allowed = client.get("/api/v1/briefs/00000000-0000-0000-0000-000000000041/applications", headers=lumina_headers)
    assert res_allowed.status_code == 200
    assert res_allowed.headers.get("access-control-allow-origin") == "https://creatorbridge2.vercel.app"
    assert res_allowed.json()["success"] is True

    # Lumina attempting to view applications for Terra brief 00000000-0000-0000-0000-000000000042 (forbidden)
    res_forbidden = client.get("/api/v1/briefs/00000000-0000-0000-0000-000000000042/applications", headers=lumina_headers)
    assert res_forbidden.status_code == 403
    assert res_forbidden.headers.get("access-control-allow-origin") == "https://creatorbridge2.vercel.app"
    data = res_forbidden.json()
    assert data["success"] is False
    assert data["error"]["code"] == "FORBIDDEN"
    assert "permission" in data["error"]["message"].lower()


def test_list_my_briefs_isolation(client: TestClient, lumina_token: str, terra_token: str):
    """Verifies that list_my_briefs (/mine) strictly isolates campaigns between brands."""
    lumina_headers = {"Authorization": f"Bearer {lumina_token}"}
    terra_headers = {"Authorization": f"Bearer {terra_token}"}

    lumina_res = client.get("/api/v1/briefs/mine", headers=lumina_headers)
    assert lumina_res.status_code == 200
    lumina_briefs = lumina_res.json()["data"]

    # All briefs in lumina_briefs must belong to Lumina aliases
    lumina_aliases = {"usr_lumina_skincare", "00000000-0000-0000-0000-000000000002", "00000000-0000-0000-0000-000000000010"}
    for b in lumina_briefs:
        assert b["brand_id"] in lumina_aliases

    terra_res = client.get("/api/v1/briefs/mine", headers=terra_headers)
    assert terra_res.status_code == 200
    terra_briefs = terra_res.json()["data"]
    terra_aliases = {"usr_terra_outdoor", "00000000-0000-0000-0000-000000000011"}
    for b in terra_briefs:
        assert b["brand_id"] in terra_aliases
