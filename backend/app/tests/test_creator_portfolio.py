"""Unit and integration tests for Creator Profile, AI Portfolio, Completeness, and Verification Signals."""

import asyncio
from uuid import UUID

import pytest
from starlette.testclient import TestClient
from app.core.errors import ValidationException
from app.schemas.creator import CreatorLevel, VerificationType, VerificationStatus
from app.services.portfolio_service import PortfolioService


def get_auth_headers(user_id: str = "creator-user-001", role: str = "CREATOR") -> dict:
    return {
        "Authorization": f"Bearer dev-{user_id}",
        "X-User-Id": user_id,
        "X-User-Role": role,
    }


class InMemoryStorage:
    def __init__(self):
        self.uploads = []

    async def upload_file(self, bucket: str, path: str, content: bytes, content_type: str) -> str:
        self.uploads.append((bucket, path, content, content_type))
        return f"{bucket}/{path}"

    async def get_public_url(self, bucket: str, path: str) -> str:
        return f"https://storage.example.test/{bucket}/{path}"


def test_portfolio_upload_stores_a_valid_mp4():
    storage = InMemoryStorage()
    service = PortfolioService(storage=storage)
    content = b"\x00\x00\x00\x18ftypisom" + b"\x00" * 16

    upload = asyncio.run(
        service.validate_and_process_upload(
            filename="portfolio reel.mp4",
            content=content,
            content_type="video/mp4",
            creator_id=UUID("00000000-0000-0000-0000-000000000001"),
        )
    )

    assert upload.media_type == "VIDEO"
    assert upload.public_url.startswith("https://storage.example.test/portfolios/creators/")
    assert storage.uploads[0][0] == "portfolios"
    assert storage.uploads[0][2] == content
    assert storage.uploads[0][3] == "video/mp4"


def test_portfolio_upload_rejects_mismatched_media_bytes():
    service = PortfolioService(storage=InMemoryStorage())

    with pytest.raises(ValidationException, match="do not match"):
        asyncio.run(
            service.validate_and_process_upload(
                filename="not-a-video.mp4",
                content=b"not a video",
                content_type="video/mp4",
                creator_id=UUID("00000000-0000-0000-0000-000000000001"),
            )
        )


def test_get_my_profile_and_completeness(client: TestClient):
    headers = get_auth_headers("creator-test-alpha", "CREATOR")

    # 1. Fetch current creator profile
    resp = client.get("/api/v1/creators/me", headers=headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["user_id"] == "creator-test-alpha"
    assert data["level"] == CreatorLevel.EXPLORER.value

    # 2. Check profile completeness calculation
    comp_resp = client.get("/api/v1/creators/me/completeness", headers=headers)
    assert comp_resp.status_code == 200
    comp_data = comp_resp.json()["data"]
    assert "percentage" in comp_data
    assert "items" in comp_data
    assert len(comp_data["items"]) == 10
    assert any(item["key"] == "headline" for item in comp_data["items"])
    assert any(item["key"] == "portfolio_project" for item in comp_data["items"])


def test_update_profile_protected_fields(client: TestClient):
    headers = get_auth_headers("creator-test-beta", "CREATOR")

    # Attempt to update profile AND inject forged protected fields
    update_payload = {
        "headline": "Lead AI Director & Cinematographer",
        "bio": "Experienced generative director producing high-fidelity advertising with Stable Diffusion and Runway.",
        "primary_specialization": "Photorealistic Video",
        "skills": ["Prompt Design", "Video Consistency", "Editing"],
        "ai_tools": ["Midjourney", "Runway Gen-3", "ComfyUI"],
        "preferred_formats": ["16:9 4K", "9:16 Vertical Reel"],
        "target_niches": ["Automotive", "Fashion & Luxury"],
        # Malicious fields that must be ignored
        "level": "STUDIO_PARTNER",
        "reputation_score": 5.0,
        "is_verified": True,
    }

    resp = client.patch("/api/v1/creators/me", json=update_payload, headers=headers)
    assert resp.status_code == 200
    updated_data = resp.json()["data"]

    # Valid fields updated
    assert updated_data["headline"] == "Lead AI Director & Cinematographer"
    assert len(updated_data["skills"]) == 3
    assert len(updated_data["ai_tools"]) == 3
    # Server-protected fields remain authentic
    assert updated_data["level"] == CreatorLevel.EXPLORER.value
    assert updated_data["reputation_score"] == 0.00
    assert updated_data["is_verified"] is False
    # Completeness increased dynamically
    assert updated_data["profile_completeness_pct"] > 30


def test_portfolio_project_lifecycle(client: TestClient):
    headers = get_auth_headers("creator-portfolio-owner", "CREATOR")

    # 1. Create a portfolio project
    project_payload = {
        "title": "Neon Cyberpunk Brand Teaser",
        "description": "Commercial showcase highlighting prompt consistency across 12 distinct shots.",
        "category": "AI Video",
        "content_type": "Teaser Trailer",
        "media_type": "VIDEO",
        "media_url": "https://assets.creatorbridge.com/videos/neon_teaser.mp4",
        "thumbnail_url": "https://assets.creatorbridge.com/thumbs/neon_teaser.jpg",
        "tools": ["Runway Gen-3", "ElevenLabs", "ComfyUI"],
        "models": ["Gen-3 Alpha", "SDXL Turbo"],
        "skills": ["Cinematography", "Sound Design"],
        "workflow_summary": "Generated base storyboard in Midjourney, motion generated in Runway Gen-3, audio composed in ElevenLabs.",
        "workflow_stages": [
            {"stage_name": "Storyboard", "description": "Keyframes generation", "tools_used": ["Midjourney"]},
            {"stage_name": "Motion", "description": "Prompt motion synthesis", "tools_used": ["Runway Gen-3"]}
        ],
        "aspect_ratio": "16:9",
        "resolution": "4K",
        "duration_seconds": 25,
        "commercial_use_status": "COMMERCIAL_READY",
        "ai_generation_type": "AI_GENERATED",
        "visibility": "PUBLIC",
        "is_featured": True,
    }

    create_resp = client.post("/api/v1/portfolios", json=project_payload, headers=headers)
    assert create_resp.status_code == 200
    project = create_resp.json()["data"]
    project_id = project["id"]
    assert project["title"] == "Neon Cyberpunk Brand Teaser"
    assert project["media_type"] == "VIDEO"
    assert len(project["workflow_stages"]) == 2

    # 2. Get the project by ID
    get_resp = client.get(f"/api/v1/portfolios/{project_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["id"] == project_id

    # 3. Update the project
    patch_resp = client.patch(
        f"/api/v1/portfolios/{project_id}",
        json={"title": "Updated Cyberpunk Brand Teaser", "aspect_ratio": "9:16"},
        headers=headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["title"] == "Updated Cyberpunk Brand Teaser"
    assert patch_resp.json()["data"]["aspect_ratio"] == "9:16"

    # 4. Toggle visibility
    vis_resp = client.post(
        f"/api/v1/portfolios/{project_id}/visibility?visibility=PRIVATE",
        headers=headers,
    )
    assert vis_resp.status_code == 200
    assert vis_resp.json()["data"]["visibility"] == "PRIVATE"

    # 5. Delete project
    del_resp = client.delete(f"/api/v1/portfolios/{project_id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["data"] is True


def test_private_portfolio_projects_are_only_available_to_the_owner(client: TestClient):
    owner_headers = get_auth_headers("creator-private-owner", "CREATOR")
    create_response = client.post(
        "/api/v1/portfolios",
        json={
            "title": "Private campaign cut",
            "category": "AI Video",
            "content_type": "Campaign Video",
            "media_type": "VIDEO",
            "media_url": "https://media.example.test/private-campaign.mp4",
            "tools": [],
            "aspect_ratio": "16:9",
            "resolution": "1080p",
            "commercial_use_status": "COMMERCIAL_READY",
            "ai_generation_type": "AI_GENERATED",
            "visibility": "PRIVATE",
        },
        headers=owner_headers,
    )
    assert create_response.status_code == 200
    project_id = create_response.json()["data"]["id"]
    creator_id = create_response.json()["data"]["creator_id"]

    public_list = client.get(f"/api/v1/portfolios?creator_id={creator_id}&public_only=true")
    assert public_list.status_code == 200
    assert all(project["id"] != project_id for project in public_list.json()["data"])

    assert client.get(f"/api/v1/portfolios/{project_id}").status_code == 404
    assert client.get(
        f"/api/v1/portfolios/{project_id}",
        headers=get_auth_headers("creator-private-viewer", "CREATOR"),
    ).status_code == 404

    owner_response = client.get(f"/api/v1/portfolios/{project_id}", headers=owner_headers)
    assert owner_response.status_code == 200
    assert owner_response.json()["data"]["visibility"] == "PRIVATE"

    private_list_without_auth = client.get(f"/api/v1/portfolios?creator_id={creator_id}&public_only=false")
    assert private_list_without_auth.status_code == 401

    delete_response = client.delete(f"/api/v1/portfolios/{project_id}", headers=owner_headers)
    assert delete_response.status_code == 200


def test_verification_claims_and_badges(client: TestClient):
    headers = get_auth_headers("creator-verified-user", "CREATOR")

    # 1. Fetch current badges
    badge_resp = client.get("/api/v1/creators/me/verifications", headers=headers)
    assert badge_resp.status_code == 200
    badges = badge_resp.json()["data"]
    assert len(badges) == 6
    assert any(b["type"] == VerificationType.EMAIL_VERIFIED.value for b in badges)
    assert any(b["type"] == VerificationType.TOOL_VERIFIED.value for b in badges)

    # 2. Submit verification claim
    claim_payload = {
        "verification_type": "EMAIL_VERIFIED",
        "notes": "Verified corporate email domain via auth challenge",
    }
    claim_resp = client.post("/api/v1/creators/me/verifications", json=claim_payload, headers=headers)
    assert claim_resp.status_code == 200
    claim_data = claim_resp.json()["data"]
    assert claim_data["verification_type"] == "EMAIL_VERIFIED"
    assert claim_data["status"] == VerificationStatus.VERIFIED.value


def test_public_creator_profile_details(client: TestClient):
    # Public unauthenticated request to seeded foundational creator
    resp = client.get("/api/v1/creators/00000000-0000-0000-0000-000000000001")
    assert resp.status_code == 200
    data = resp.json()["data"]

    assert data["handle"] == "alex_ai_art"
    assert data["full_name"] == "Alex Rivera"
    assert data["level"] == CreatorLevel.AI_MASTER.value
    assert "verification_badges" in data
    assert len(data["verification_badges"]) == 6
    assert "trust_signals" in data
    assert len(data["trust_signals"]) > 0
    assert "dimension_scores" in data
    assert data["portfolio_count"] >= 1

    # Also test query by handle
    handle_resp = client.get("/api/v1/creators/alex_ai_art")
    assert handle_resp.status_code == 200
    assert handle_resp.json()["data"]["id"] == data["id"]


def test_marcus_vance_portfolio_videos_serve_mp4_and_correct_durations(client: TestClient):
    marcus_id = "00000000-0000-0000-0000-000000000022"
    resp = client.get(f"/api/v1/portfolios?creator_id={marcus_id}&public_only=true")
    assert resp.status_code == 200
    projects = resp.json()["data"]

    # Marcus Vance has 2 video projects
    assert len(projects) >= 2
    video_projects = [p for p in projects if p["media_type"] == "VIDEO"]
    assert len(video_projects) >= 2

    # Check Kinetic Trails project (30s)
    kinetic = next((p for p in video_projects if "Kinetic Trails" in p["title"]), None)
    assert kinetic is not None
    assert kinetic["media_url"].endswith(".mp4")
    assert not kinetic["media_url"].endswith(".svg")
    assert kinetic["duration_seconds"] == 30

    # Check Temporal Flux project (15s)
    temporal = next((p for p in video_projects if "Temporal Flux" in p["title"]), None)
    assert temporal is not None
    assert temporal["media_url"].endswith(".mp4")
    assert not temporal["media_url"].endswith(".svg")
    assert temporal["duration_seconds"] == 15

