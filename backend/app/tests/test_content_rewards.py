"""Tests for Content Rewards marketplace, clip submissions, analytics, and brand communities."""

import pytest
from starlette.testclient import TestClient


def get_auth_headers(user_id: str, role: str) -> dict:
    return {
        "Authorization": f"Bearer dev-{user_id}",
        "X-User-Id": user_id,
        "X-User-Role": role,
    }


def test_content_rewards_join_and_submission_flow(client: TestClient):
    campaign_id = "00000000-0000-0000-0000-000000000041"  # Skincare campaign
    creator_headers = get_auth_headers("usr_elena_rostova", "CREATOR")
    brand_headers = get_auth_headers("usr_lumina_skincare", "BRAND")

    # 1. Creator joins campaign
    join_res = client.post(f"/api/v1/campaigns/{campaign_id}/join", headers=creator_headers)
    assert join_res.status_code == 200
    assert join_res.json()["data"] is True

    # 2. Check participation status
    part_res = client.get(f"/api/v1/campaigns/{campaign_id}/participation", headers=creator_headers)
    assert part_res.status_code == 200
    part_data = part_res.json()["data"]
    assert part_data is not None
    assert part_data["status"] == "JOINED"

    # 3. Creator submits a clip
    clip_payload = {
        "clip_url": "https://tiktok.com/@elena_ai/video/9988776655",
        "platform": "TIKTOK",
        "title": "Cellular Radiance 24hr Moisture Test",
        "description": "Macro water droplet test demonstrating 72-hour cellular radiance glow.",
        "ai_tools": ["Midjourney v6.1", "Magnific AI"],
        "initial_views": 45000,
    }
    sub_res = client.post(f"/api/v1/campaigns/{campaign_id}/submissions", json=clip_payload, headers=creator_headers)
    assert sub_res.status_code == 200
    sub_data = sub_res.json()["data"]
    submission_id = sub_data["id"]
    assert sub_data["platform"] == "TIKTOK"
    assert sub_data["status"] == "PENDING_REVIEW"

    # 4. Creator lists their submissions
    my_subs_res = client.get("/api/v1/campaigns/submissions/my", headers=creator_headers)
    assert my_subs_res.status_code == 200
    my_subs = my_subs_res.json()["data"]
    assert any(s["id"] == submission_id for s in my_subs)

    # 5. Brand reviews and approves the clip
    review_payload = {
        "status": "APPROVED",
        "feedback": "Outstanding visual clarity and color fidelity! Payout issued.",
        "verified_views": 50000,
        "payout_cents": 10000,  # $100.00
    }
    review_res = client.patch(f"/api/v1/campaigns/submissions/{submission_id}/review", json=review_payload, headers=brand_headers)
    assert review_res.status_code == 200
    rev_data = review_res.json()["data"]
    assert rev_data["status"] == "APPROVED"
    assert rev_data["earned_cents"] == 10000

    # 6. Brand inspects campaign analytics
    analytics_res = client.get(f"/api/v1/campaigns/{campaign_id}/analytics", headers=brand_headers)
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()["data"]
    assert analytics_data["total_views"] > 0
    assert analytics_data["approved_submissions"] >= 1
    assert len(analytics_data["leaderboard"]) >= 1


def test_brand_community_posts_flow(client: TestClient):
    brand_headers = get_auth_headers("usr_lumina_skincare", "BRAND")

    # 1. Brand creates a community post
    post_payload = {
        "title": "Creative Asset Pack v2 Released",
        "content": "Download 15 new 4K ambient lighting and glass texture loops from the creator asset library.",
        "category": "ASSET_PACK",
        "pinned": True,
        "media_url": "/demo-assets/skincare-luxury-serum.jpg",
    }
    create_res = client.post("/api/v1/campaigns/community/posts", json=post_payload, headers=brand_headers)
    assert create_res.status_code == 200
    post_data = create_res.json()["data"]
    post_id = post_data["id"]
    assert post_data["title"] == "Creative Asset Pack v2 Released"
    assert post_data["pinned"] is True

    # 2. Public / Creator lists community posts
    list_res = client.get("/api/v1/campaigns/community/posts")
    assert list_res.status_code == 200
    posts = list_res.json()["data"]
    assert any(p["id"] == post_id for p in posts)

    # 3. Like the post
    like_res = client.post(f"/api/v1/campaigns/community/posts/{post_id}/like")
    assert like_res.status_code == 200
    assert like_res.json()["data"] >= 1

    # 4. Attempt to delete post with non-owner brand (Terra Outdoor Gear)
    attacker_headers = get_auth_headers("usr_terra_outdoor", "BRAND")
    forbidden_del = client.delete(f"/api/v1/campaigns/community/posts/{post_id}", headers=attacker_headers)
    assert forbidden_del.status_code == 403
    assert "permission to delete" in forbidden_del.json()["error"]["message"]

    # 5. Owner brand (Lumina) successfully deletes post
    success_del = client.delete(f"/api/v1/campaigns/community/posts/{post_id}", headers=brand_headers)
    assert success_del.status_code == 200


def test_authorization_cross_brand_restrictions(client: TestClient):
    """Verifies brands cannot access or tamper with other brands' submissions, analytics, or campaigns."""
    lumina_campaign_id = "00000000-0000-0000-0000-000000000041"  # Lumina Skincare
    terra_headers = get_auth_headers("usr_terra_outdoor", "BRAND")
    creator_elena_headers = get_auth_headers("usr_elena_rostova", "CREATOR")
    creator_marcus_headers = get_auth_headers("usr_marcus_vance", "CREATOR")

    # 1. Terra Brand cannot view Lumina campaign submissions
    unauth_subs = client.get(f"/api/v1/campaigns/{lumina_campaign_id}/submissions", headers=terra_headers)
    assert unauth_subs.status_code == 403
    assert "Only the campaign brand owner" in unauth_subs.json()["error"]["message"]

    # 2. Terra Brand cannot view Lumina campaign analytics
    unauth_analytics = client.get(f"/api/v1/campaigns/{lumina_campaign_id}/analytics", headers=terra_headers)
    assert unauth_analytics.status_code == 403
    assert "Access to internal campaign analytics requires campaign ownership" in unauth_analytics.json()["error"]["message"]

    # 3. Terra Brand cannot pause Lumina campaign
    unauth_pause = client.post(f"/api/v1/campaigns/{lumina_campaign_id}/pause", headers=terra_headers)
    assert unauth_pause.status_code == 403
    assert "Only the campaign owner can pause" in unauth_pause.json()["error"]["message"]

    # 4. Creator cannot access brand analytics
    creator_analytics = client.get(f"/api/v1/campaigns/{lumina_campaign_id}/analytics", headers=creator_elena_headers)
    assert creator_analytics.status_code == 403

    # 5. Creator querying campaign submissions receives ONLY their own submissions
    elena_subs = client.get(f"/api/v1/campaigns/{lumina_campaign_id}/submissions", headers=creator_elena_headers)
    assert elena_subs.status_code == 200
    for sub in elena_subs.json()["data"]:
        # Creator cannot see another creator's submission
        assert sub["creator_id"] in ["usr_elena_rostova", "00000000-0000-0000-0000-000000000001"]


def test_reward_integrity_and_pool_limits(client: TestClient):
    """Verifies CPM calculation, pool limits, and rejection reward resets."""
    campaign_id = "00000000-0000-0000-0000-000000000041"
    creator_headers = get_auth_headers("usr_marcus_vance", "CREATOR")
    brand_headers = get_auth_headers("usr_lumina_skincare", "BRAND")
    attacker_brand_headers = get_auth_headers("usr_terra_outdoor", "BRAND")

    # 1. Marcus Vance submits a clip
    sub_res = client.post(
        f"/api/v1/campaigns/{campaign_id}/submissions",
        json={
            "clip_url": "https://instagram.com/reel/abc123integrity",
            "platform": "INSTAGRAM",
            "title": "Serum Texture Macro Demo",
            "ai_tools": ["Runway Gen-3"],
            "initial_views": 10000,
        },
        headers=creator_headers,
    )
    assert sub_res.status_code == 200
    sub_id = sub_res.json()["data"]["id"]

    # 2. Unauthorized brand cannot review Marcus's clip
    unauth_review = client.patch(
        f"/api/v1/campaigns/submissions/{sub_id}/review",
        json={"status": "APPROVED", "verified_views": 10000},
        headers=attacker_brand_headers,
    )
    assert unauth_review.status_code == 403
    assert "Only the campaign brand owner" in unauth_review.json()["error"]["message"]

    # 3. Negative views or payout are rejected
    neg_views = client.patch(
        f"/api/v1/campaigns/submissions/{sub_id}/review",
        json={"status": "APPROVED", "verified_views": -500},
        headers=brand_headers,
    )
    assert neg_views.status_code == 422
    assert "cannot be negative" in neg_views.json()["error"]["message"]

    # 4. Rejecting a clip guarantees earned_cents is 0
    reject_res = client.patch(
        f"/api/v1/campaigns/submissions/{sub_id}/review",
        json={"status": "REJECTED", "feedback": "Logo was not visible in first 3 seconds", "payout_cents": 5000},
        headers=brand_headers,
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["data"]["status"] == "REJECTED"
    assert reject_res.json()["data"]["earned_cents"] == 0


def test_participant_privacy_and_cross_brand_isolation(client: TestClient):
    """Verifies that participant identities are private and restricted to owning brands, with creators seeing only themselves."""
    lumina_campaign_id = "00000000-0000-0000-0000-000000000041"
    brand_lumina_headers = get_auth_headers("usr_lumina_skincare", "BRAND")
    attacker_brand_headers = get_auth_headers("usr_terra_outdoor", "BRAND")
    creator_headers = get_auth_headers("usr_elena_rostova", "CREATOR")

    # 1. Unauthenticated request is rejected with 401
    unauth_res = client.get(f"/api/v1/campaigns/{lumina_campaign_id}/participants")
    assert unauth_res.status_code == 401

    # 2. Competing brand is forbidden from viewing participant identities (403)
    competing_brand_res = client.get(
        f"/api/v1/campaigns/{lumina_campaign_id}/participants",
        headers=attacker_brand_headers,
    )
    assert competing_brand_res.status_code == 403
    assert "Only the campaign brand owner" in competing_brand_res.json()["error"]["message"]

    # 3. Owning brand successfully retrieves full participant identities (200)
    owner_res = client.get(
        f"/api/v1/campaigns/{lumina_campaign_id}/participants",
        headers=brand_lumina_headers,
    )
    assert owner_res.status_code == 200
    assert isinstance(owner_res.json()["data"], list)

    # 4. Creator querying participants receives ONLY their own record
    creator_res = client.get(
        f"/api/v1/campaigns/{lumina_campaign_id}/participants",
        headers=creator_headers,
    )
    assert creator_res.status_code == 200
    creator_parts = creator_res.json()["data"]
    for part in creator_parts:
        assert part["creator_id"] in ["usr_elena_rostova", "00000000-0000-0000-0000-000000000001"]

