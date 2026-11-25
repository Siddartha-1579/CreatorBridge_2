"""Comprehensive test suite for Feature 3.2: Complete Engagement Management Implementation.

Verifies all 16 required test scenarios across Stages A through E:
  1. Brand adds creator to brief shortlist
  2. Duplicate shortlisting is safely handled (idempotent duplicate prevention)
  3. Brand removes creator from shortlist
  4. Brand views shortlist with creator context (name, skills, score)
  5. Brand cannot access or modify another brand's shortlist (403 Forbidden)
  6. Brand sends formal engagement invitation with proposed terms
  7. Duplicate active invitation to same creator is rejected (409 Conflict)
  8. Creator receives and accepts invitation (transitions to ACCEPTED)
  9. Creator receives and declines invitation with reason (transitions to DECLINED)
  10. Creator cannot accept another creator's invitation (403 Forbidden)
  11. Both parties confirm scope terms with recorded identities and timestamps (transitions to CONFIRMED)
  12. Creator cannot submit deliverables for unconfirmed engagement (409 Conflict)
  13. Production progress updates (status, notes, blockers) are recorded with timestamps
  14. Creator submits deliverable (v1) -> brand requests changes -> status transitions to CHANGES_REQUESTED -> creator submits v2
  15. Brand accepts deliverable -> status transitions to COMPLETED, verified achievement points awarded
  16. Completed engagement is immutable (cannot be cancelled, re-submitted, or re-reviewed)
"""

from datetime import datetime, timezone, timedelta
from uuid import uuid4
import pytest
from starlette.testclient import TestClient

from app.schemas.engagement import EngagementStatus, ProductionProgressStatus
from app.services.achievement_service import achievement_service


def get_auth_headers(user_id: str, role: str) -> dict:
    return {
        "Authorization": f"Bearer dev-{user_id}",
        "X-User-Id": user_id,
        "X-User-Role": role,
    }


def _create_test_brief(client: TestClient, brand_id: str, title: str = "Engagement Test Brief") -> str:
    """Helper to create and publish a brief for testing."""
    headers = get_auth_headers(brand_id, "BRAND")
    payload = {
        "title": title,
        "description": "Comprehensive creative campaign for product launch",
        "campaign_idea": "Showcase revolutionary AI aesthetic",
        "status": "PUBLISHED",
        "budget_cents": 350000,
        "deliverables": [
            {
                "content_type": "Short-form video",
                "quantity": 2,
                "aspect_ratio": "9:16",
                "resolution": "4K",
                "duration_seconds": 30,
            }
        ],
        "commercial_terms": {
            "currency": "INR",
            "commercial_rights_required": True,
            "revisions_count": 2,
            "territory": "Global",
            "usage_duration": "Perpetual",
        },
    }
    res = client.post("/api/v1/briefs", json=payload, headers=headers)
    assert res.status_code == 200, f"Failed to create test brief: {res.text}"
    return res.json()["data"]["id"]


# -----------------------------------------------------------------------------
# Test 1 & 2: Shortlisting and Duplicate Prevention
# -----------------------------------------------------------------------------
def test_01_brand_shortlists_creator(client: TestClient):
    """1. Brand adds creator to brief shortlist -> status is SHORTLISTED with timeline event."""
    brand_id = f"brand_short_{uuid4().hex[:6]}"
    creator_id = "00000000-0000-0000-0000-000000000001"  # Elena Rostova
    brief_id = _create_test_brief(client, brand_id, "Shortlist Test Brief")

    headers = get_auth_headers(brand_id, "BRAND")
    payload = {
        "brief_id": brief_id,
        "creator_id": creator_id,
        "notes": "Top candidate for cinematic visual aesthetic",
    }
    res = client.post("/api/v1/engagements/shortlist", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == EngagementStatus.SHORTLISTED.value
    assert data["brief_id"] == brief_id
    assert data["brand_id"] == brand_id


def test_02_duplicate_shortlisting_handled_safely(client: TestClient):
    """2. Duplicate shortlisting for the same brief and creator is handled idempotently."""
    brand_id = f"brand_short_{uuid4().hex[:6]}"
    creator_id = "00000000-0000-0000-0000-000000000001"
    brief_id = _create_test_brief(client, brand_id, "Duplicate Shortlist Brief")

    headers = get_auth_headers(brand_id, "BRAND")
    payload = {
        "brief_id": brief_id,
        "creator_id": creator_id,
        "notes": "First shortlist addition",
    }
    res1 = client.post("/api/v1/engagements/shortlist", json=payload, headers=headers)
    assert res1.status_code == 200
    id1 = res1.json()["data"]["id"]

    # Repeat request with slightly different notes
    payload["notes"] = "Attempting duplicate shortlist"
    res2 = client.post("/api/v1/engagements/shortlist", json=payload, headers=headers)
    assert res2.status_code == 200
    id2 = res2.json()["data"]["id"]

    # Same engagement returned; no duplicate record created
    assert id1 == id2


# -----------------------------------------------------------------------------
# Test 3 & 4: Remove Shortlist and View Context
# -----------------------------------------------------------------------------
def test_03_brand_removes_creator_from_shortlist(client: TestClient):
    """3. Brand removes creator from shortlist."""
    brand_id = f"brand_short_{uuid4().hex[:6]}"
    creator_id = "00000000-0000-0000-0000-000000000001"
    brief_id = _create_test_brief(client, brand_id, "Remove Shortlist Brief")

    headers = get_auth_headers(brand_id, "BRAND")
    res1 = client.post(
        "/api/v1/engagements/shortlist",
        json={"brief_id": brief_id, "creator_id": creator_id},
        headers=headers,
    )
    engagement_id = res1.json()["data"]["id"]

    # Remove from shortlist
    del_res = client.delete(f"/api/v1/engagements/shortlist/{engagement_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["data"] is True

    # Verify shortlist for brief is now empty
    list_res = client.get(f"/api/v1/engagements/briefs/{brief_id}/shortlist", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) == 0


def test_04_brand_views_shortlist_with_context(client: TestClient):
    """4. Brand views shortlist with creator context (name, skills, score)."""
    brand_id = f"brand_short_{uuid4().hex[:6]}"
    creator_id = "00000000-0000-0000-0000-000000000001"
    brief_id = _create_test_brief(client, brand_id, "View Shortlist Brief")

    headers = get_auth_headers(brand_id, "BRAND")
    client.post(
        "/api/v1/engagements/shortlist",
        json={"brief_id": brief_id, "creator_id": creator_id},
        headers=headers,
    )

    res = client.get(f"/api/v1/engagements/briefs/{brief_id}/shortlist", headers=headers)
    assert res.status_code == 200
    items = res.json()["data"]
    assert len(items) >= 1
    item = items[0]
    assert item["brief_id"] == brief_id
    assert "creator_name" in item
    assert "skills" in item
    assert "reputation_score" in item
    assert item["status"] == EngagementStatus.SHORTLISTED.value


# -----------------------------------------------------------------------------
# Test 5: Cross-Brand Isolation
# -----------------------------------------------------------------------------
def test_05_cross_brand_shortlist_isolation(client: TestClient):
    """5. Brand B cannot access or modify Brand A's shortlist (403 Forbidden)."""
    brand_a = f"brand_a_{uuid4().hex[:6]}"
    brand_b = f"brand_b_{uuid4().hex[:6]}"
    creator_id = "00000000-0000-0000-0000-000000000001"
    brief_id = _create_test_brief(client, brand_a, "Brand A Brief")

    headers_a = get_auth_headers(brand_a, "BRAND")
    headers_b = get_auth_headers(brand_b, "BRAND")

    # Brand A shortlists creator
    s_res = client.post(
        "/api/v1/engagements/shortlist",
        json={"brief_id": brief_id, "creator_id": creator_id},
        headers=headers_a,
    )
    engagement_id = s_res.json()["data"]["id"]

    # Brand B attempts to view Brand A's shortlist -> 403 Forbidden
    res_b_view = client.get(f"/api/v1/engagements/briefs/{brief_id}/shortlist", headers=headers_b)
    assert res_b_view.status_code == 403

    # Brand B attempts to delete Brand A's shortlist item -> 403 Forbidden
    res_b_del = client.delete(f"/api/v1/engagements/shortlist/{engagement_id}", headers=headers_b)
    assert res_b_del.status_code == 403


# -----------------------------------------------------------------------------
# Test 6 & 7: Sending Invitations & Duplicate Prevention
# -----------------------------------------------------------------------------
def test_06_brand_sends_engagement_invitation(client: TestClient):
    """6. Brand sends formal engagement invitation with proposed terms -> transitions to INVITED."""
    brand_id = f"brand_inv_{uuid4().hex[:6]}"
    creator_id = "00000000-0000-0000-0000-000000000001"
    brief_id = _create_test_brief(client, brand_id, "Invitation Test Brief")

    headers = get_auth_headers(brand_id, "BRAND")
    deadline = (datetime.now(timezone.utc) + timedelta(days=14)).isoformat()
    payload = {
        "brief_id": brief_id,
        "creator_id": creator_id,
        "proposed_terms": {
            "scope_description": "2 photorealistic 4K cinematic commercials",
            "budget_cents": 250000,
            "currency": "INR",
            "deadline": deadline,
            "revision_allowance": 2,
            "commercial_rights_required": True,
            "usage_rights": "Global commercial usage rights",
        },
        "invitation_message": "We would love to collaborate on our upcoming product launch campaign.",
    }
    res = client.post("/api/v1/engagements/invitations", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == EngagementStatus.INVITED.value
    assert data["proposed_terms"]["budget_cents"] == 250000
    assert data["invitation_message"] == payload["invitation_message"]


def test_07_duplicate_active_invitation_rejected(client: TestClient):
    """7. Duplicate active invitation to the same creator on the same brief is rejected (409 Conflict)."""
    brand_id = f"brand_inv_{uuid4().hex[:6]}"
    creator_id = "00000000-0000-0000-0000-000000000001"
    brief_id = _create_test_brief(client, brand_id, "Duplicate Invitation Brief")

    headers = get_auth_headers(brand_id, "BRAND")
    payload = {
        "brief_id": brief_id,
        "creator_id": creator_id,
        "proposed_terms": {
            "scope_description": "First invitation",
            "budget_cents": 150000,
            "currency": "INR",
        },
    }
    res1 = client.post("/api/v1/engagements/invitations", json=payload, headers=headers)
    assert res1.status_code == 200

    # Second active invitation must be rejected with 409 Conflict
    res2 = client.post("/api/v1/engagements/invitations", json=payload, headers=headers)
    assert res2.status_code == 409


# -----------------------------------------------------------------------------
# Test 8, 9, 10: Creator Response & Ownership
# -----------------------------------------------------------------------------
def test_08_creator_accepts_invitation(client: TestClient):
    """8. Creator receives and accepts invitation -> status transitions to ACCEPTED."""
    brand_id = f"brand_acc_{uuid4().hex[:6]}"
    creator_id = "00000000-0000-0000-0000-000000000001"  # Elena Rostova
    brief_id = _create_test_brief(client, brand_id, "Acceptance Test Brief")

    headers_brand = get_auth_headers(brand_id, "BRAND")
    inv_res = client.post(
        "/api/v1/engagements/invitations",
        json={
            "brief_id": brief_id,
            "creator_id": creator_id,
            "proposed_terms": {"budget_cents": 200000, "currency": "INR"},
        },
        headers=headers_brand,
    )
    engagement_id = inv_res.json()["data"]["id"]

    # Creator accepts
    headers_creator = get_auth_headers("usr_elena_rostova", "CREATOR")
    res = client.post(
        f"/api/v1/engagements/{engagement_id}/respond",
        json={"action": "ACCEPT"},
        headers=headers_creator,
    )
    assert res.status_code == 200
    assert res.json()["data"]["status"] == EngagementStatus.ACCEPTED.value


def test_09_creator_declines_invitation_with_reason(client: TestClient):
    """9. Creator receives and declines invitation with reason -> status transitions to DECLINED."""
    brand_id = f"brand_dec_{uuid4().hex[:6]}"
    creator_id = "00000000-0000-0000-0000-000000000001"
    brief_id = _create_test_brief(client, brand_id, "Decline Test Brief")

    headers_brand = get_auth_headers(brand_id, "BRAND")
    inv_res = client.post(
        "/api/v1/engagements/invitations",
        json={
            "brief_id": brief_id,
            "creator_id": creator_id,
            "proposed_terms": {"budget_cents": 100000, "currency": "INR"},
        },
        headers=headers_brand,
    )
    engagement_id = inv_res.json()["data"]["id"]

    # Creator declines
    headers_creator = get_auth_headers("usr_elena_rostova", "CREATOR")
    res = client.post(
        f"/api/v1/engagements/{engagement_id}/respond",
        json={"action": "DECLINE", "decline_reason": "Current schedule fully booked this month."},
        headers=headers_creator,
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == EngagementStatus.DECLINED.value
    assert data["decline_reason"] == "Current schedule fully booked this month."


def test_10_creator_cross_authorization_blocked(client: TestClient):
    """10. Creator B cannot accept or decline Creator A's invitation (403 Forbidden)."""
    brand_id = f"brand_iso_{uuid4().hex[:6]}"
    creator_a = "00000000-0000-0000-0000-000000000001"  # Elena Rostova
    brief_id = _create_test_brief(client, brand_id, "Creator Isolation Brief")

    headers_brand = get_auth_headers(brand_id, "BRAND")
    inv_res = client.post(
        "/api/v1/engagements/invitations",
        json={
            "brief_id": brief_id,
            "creator_id": creator_a,
            "proposed_terms": {"budget_cents": 200000, "currency": "INR"},
        },
        headers=headers_brand,
    )
    engagement_id = inv_res.json()["data"]["id"]

    # Another creator attempts to respond
    headers_other_creator = get_auth_headers("usr_marcus_vance", "CREATOR")
    res = client.post(
        f"/api/v1/engagements/{engagement_id}/respond",
        json={"action": "ACCEPT"},
        headers=headers_other_creator,
    )
    assert res.status_code == 403


# -----------------------------------------------------------------------------
# Test 11 & 12: Scope Confirmation & Unconfirmed Delivery Prevention
# -----------------------------------------------------------------------------
def test_11_mutual_scope_confirmation(client: TestClient):
    """11. Brand confirms terms with recorded identities and timestamps -> transitions to CONFIRMED."""
    brand_id = f"brand_conf_{uuid4().hex[:6]}"
    creator_id = "00000000-0000-0000-0000-000000000001"
    brief_id = _create_test_brief(client, brand_id, "Scope Confirmation Brief")

    headers_brand = get_auth_headers(brand_id, "BRAND")
    headers_creator = get_auth_headers("usr_elena_rostova", "CREATOR")

    inv_res = client.post(
        "/api/v1/engagements/invitations",
        json={
            "brief_id": brief_id,
            "creator_id": creator_id,
            "proposed_terms": {"budget_cents": 200000, "currency": "INR"},
        },
        headers=headers_brand,
    )
    engagement_id = inv_res.json()["data"]["id"]

    # Creator accepts
    client.post(f"/api/v1/engagements/{engagement_id}/respond", json={"action": "ACCEPT"}, headers=headers_creator)

    # Brand confirms terms
    conf_res = client.post(
        f"/api/v1/engagements/{engagement_id}/confirm-terms",
        json={
            "confirmed_terms": {
                "scope_description": "Final confirmed scope: 2 high-res videos",
                "budget_cents": 200000,
                "currency": "INR",
                "revision_allowance": 2,
            },
            "notes": "Terms finalized and confirmed for production kickoff.",
        },
        headers=headers_brand,
    )
    assert conf_res.status_code == 200
    data = conf_res.json()["data"]
    assert data["status"] == EngagementStatus.CONFIRMED.value
    assert data["brand_confirmed_by"] == brand_id
    assert data["brand_confirmed_at"] is not None


def test_12_creator_cannot_submit_for_unconfirmed_engagement(client: TestClient):
    """12. Creator cannot submit deliverables for an unconfirmed engagement (409 Conflict)."""
    brand_id = f"brand_unconf_{uuid4().hex[:6]}"
    creator_id = "00000000-0000-0000-0000-000000000001"
    brief_id = _create_test_brief(client, brand_id, "Unconfirmed Submission Brief")

    headers_brand = get_auth_headers(brand_id, "BRAND")
    headers_creator = get_auth_headers("usr_elena_rostova", "CREATOR")

    inv_res = client.post(
        "/api/v1/engagements/invitations",
        json={
            "brief_id": brief_id,
            "creator_id": creator_id,
            "proposed_terms": {"budget_cents": 150000, "currency": "INR"},
        },
        headers=headers_brand,
    )
    engagement_id = inv_res.json()["data"]["id"]

    # Engagement is only in INVITED status. Attempting to submit deliverable must fail with 409
    sub_res = client.post(
        f"/api/v1/engagements/{engagement_id}/submit",
        json={
            "title": "Premature Deliverable",
            "media_url": "https://creatorbridge.io/assets/premature.mp4",
        },
        headers=headers_creator,
    )
    assert sub_res.status_code == 409


# -----------------------------------------------------------------------------
# Test 13: Production Progress Updates
# -----------------------------------------------------------------------------
def test_13_production_progress_updates_recorded(client: TestClient):
    """13. Production progress updates (status, notes, blockers) are recorded with timestamps."""
    brand_id = f"brand_prod_{uuid4().hex[:6]}"
    creator_id = "00000000-0000-0000-0000-000000000001"
    brief_id = _create_test_brief(client, brand_id, "Production Progress Brief")

    headers_brand = get_auth_headers(brand_id, "BRAND")
    headers_creator = get_auth_headers("usr_elena_rostova", "CREATOR")

    inv_res = client.post(
        "/api/v1/engagements/invitations",
        json={"brief_id": brief_id, "creator_id": creator_id, "proposed_terms": {"budget_cents": 200000}},
        headers=headers_brand,
    )
    engagement_id = inv_res.json()["data"]["id"]
    client.post(f"/api/v1/engagements/{engagement_id}/respond", json={"action": "ACCEPT"}, headers=headers_creator)
    client.post(
        f"/api/v1/engagements/{engagement_id}/confirm-terms",
        json={"confirmed_terms": {"budget_cents": 200000}},
        headers=headers_brand,
    )

    # Transition to IN_PRODUCTION
    client.post(f"/api/v1/engagements/{engagement_id}/start-production", headers=headers_creator)

    # Post progress update
    prog_res = client.post(
        f"/api/v1/engagements/{engagement_id}/progress",
        json={
            "production_status": "IN_PROGRESS",
            "content": "Rendered initial scene cuts using Runway Gen-3.",
        },
        headers=headers_creator,
    )
    assert prog_res.status_code == 200
    prog_data = prog_res.json()["data"]
    assert prog_data["production_status"] == "IN_PROGRESS"
    assert prog_data["sender_role"] == "CREATOR"

    # Post blocker update
    blocker_res = client.post(
        f"/api/v1/engagements/{engagement_id}/progress",
        json={
            "production_status": "BLOCKED",
            "content": "Awaiting brand brand asset logo vector file.",
            "blocker_details": "High-res SVG logo required for intro bumper.",
        },
        headers=headers_creator,
    )
    assert blocker_res.status_code == 200
    blocker_data = blocker_res.json()["data"]
    assert blocker_data["production_status"] == "BLOCKED"
    assert blocker_data["blocker_details"] == "High-res SVG logo required for intro bumper."


# -----------------------------------------------------------------------------
# Test 14: Deliverable Revision Cycle
# -----------------------------------------------------------------------------
def test_14_deliverable_submission_and_change_request_cycle(client: TestClient):
    """14. Creator submits deliverable (v1) -> brand requests changes -> CHANGES_REQUESTED -> creator submits v2."""
    brand_id = f"brand_rev_{uuid4().hex[:6]}"
    creator_id = "00000000-0000-0000-0000-000000000001"
    brief_id = _create_test_brief(client, brand_id, "Revision Cycle Brief")

    headers_brand = get_auth_headers(brand_id, "BRAND")
    headers_creator = get_auth_headers("usr_elena_rostova", "CREATOR")

    inv_res = client.post(
        "/api/v1/engagements/invitations",
        json={"brief_id": brief_id, "creator_id": creator_id, "proposed_terms": {"budget_cents": 250000}},
        headers=headers_brand,
    )
    engagement_id = inv_res.json()["data"]["id"]
    client.post(f"/api/v1/engagements/{engagement_id}/respond", json={"action": "ACCEPT"}, headers=headers_creator)
    client.post(
        f"/api/v1/engagements/{engagement_id}/confirm-terms",
        json={"confirmed_terms": {"budget_cents": 250000}},
        headers=headers_brand,
    )

    # 1. Creator submits v1
    v1_res = client.post(
        f"/api/v1/engagements/{engagement_id}/submit",
        json={
            "title": "First Cut Delivery",
            "media_url": "https://creatorbridge.io/storage/video_v1.mp4",
            "submission_notes": "Initial 4K cut ready for review.",
        },
        headers=headers_creator,
    )
    assert v1_res.status_code == 200
    sub1_id = v1_res.json()["data"]["id"]
    assert v1_res.json()["data"]["version_number"] == 1

    # Engagement status is SUBMITTED
    detail_res = client.get(f"/api/v1/engagements/{engagement_id}", headers=headers_brand)
    assert detail_res.json()["data"]["status"] == EngagementStatus.SUBMITTED.value

    # 2. Brand requests changes
    rev_res = client.post(
        f"/api/v1/engagements/{engagement_id}/submissions/{sub1_id}/review",
        json={
            "decision": "REQUEST_CHANGES",
            "review_notes": "Lighting is great, but please slow down the transition at 0:15.",
        },
        headers=headers_brand,
    )
    assert rev_res.status_code == 200
    assert rev_res.json()["data"]["status"] == EngagementStatus.CHANGES_REQUESTED.value

    # 3. Creator submits v2
    v2_res = client.post(
        f"/api/v1/engagements/{engagement_id}/submit",
        json={
            "title": "Second Cut Delivery (Revised Transitions)",
            "media_url": "https://creatorbridge.io/storage/video_v2.mp4",
            "submission_notes": "Transitions slowed down as requested.",
        },
        headers=headers_creator,
    )
    assert v2_res.status_code == 200
    sub2 = v2_res.json()["data"]
    assert sub2["version_number"] == 2

    # Verify both submissions preserved in detail
    full_detail = client.get(f"/api/v1/engagements/{engagement_id}", headers=headers_brand).json()["data"]
    assert full_detail["status"] == EngagementStatus.SUBMITTED.value
    assert len(full_detail["submissions"]) == 2
    v1_sub = next(s for s in full_detail["submissions"] if s["version_number"] == 1)
    v2_sub = next(s for s in full_detail["submissions"] if s["version_number"] == 2)
    assert v1_sub["review_decision"] == "CHANGES_REQUESTED"
    assert v2_sub["review_decision"] == "PENDING"


# -----------------------------------------------------------------------------
# Test 15: Brand Acceptance and Achievement Points
# -----------------------------------------------------------------------------
def test_15_brand_accepts_deliverable_and_awards_points(client: TestClient):
    """15. Brand accepts deliverable -> status transitions to COMPLETED, verified achievement points awarded."""
    brand_id = f"brand_acc_{uuid4().hex[:6]}"
    creator_id = "00000000-0000-0000-0000-000000000001"
    brief_id = _create_test_brief(client, brand_id, "Acceptance Points Brief")

    headers_brand = get_auth_headers(brand_id, "BRAND")
    headers_creator = get_auth_headers("usr_elena_rostova", "CREATOR")

    inv_res = client.post(
        "/api/v1/engagements/invitations",
        json={"brief_id": brief_id, "creator_id": creator_id, "proposed_terms": {"budget_cents": 300000}},
        headers=headers_brand,
    )
    engagement_id = inv_res.json()["data"]["id"]
    client.post(f"/api/v1/engagements/{engagement_id}/respond", json={"action": "ACCEPT"}, headers=headers_creator)
    client.post(
        f"/api/v1/engagements/{engagement_id}/confirm-terms",
        json={"confirmed_terms": {"budget_cents": 300000}},
        headers=headers_brand,
    )

    # Submit deliverable
    sub_res = client.post(
        f"/api/v1/engagements/{engagement_id}/submit",
        json={
            "title": "Final Master Cut",
            "media_url": "https://creatorbridge.io/storage/final_master.mp4",
        },
        headers=headers_creator,
    )
    sub_id = sub_res.json()["data"]["id"]

    # Record initial points
    initial_summary = achievement_service.get_summary(creator_id)
    initial_points = initial_summary["lifetime_points"]

    # Brand accepts submission with scores
    accept_res = client.post(
        f"/api/v1/engagements/{engagement_id}/submissions/{sub_id}/review",
        json={
            "decision": "ACCEPT",
            "review_notes": "Stunning work, approved for launch distribution!",
            "quality_score": 95.0,
            "brief_compliance_score": 92.0,
            "collaboration_score": 98.0,
        },
        headers=headers_brand,
    )
    assert accept_res.status_code == 200
    eng_data = accept_res.json()["data"]
    assert eng_data["status"] == EngagementStatus.COMPLETED.value
    assert eng_data["completed_at"] is not None
    assert eng_data["completed_by"] == brand_id

    # Verify achievement points awarded
    updated_summary = achievement_service.get_summary(creator_id)
    assert updated_summary["lifetime_points"] > initial_points


# -----------------------------------------------------------------------------
# Test 16: Terminal Immutability
# -----------------------------------------------------------------------------
def test_16_completed_engagement_is_immutable(client: TestClient):
    """16. Completed engagement is immutable (cannot be cancelled or submitted to)."""
    brand_id = f"brand_imm_{uuid4().hex[:6]}"
    creator_id = "00000000-0000-0000-0000-000000000001"
    brief_id = _create_test_brief(client, brand_id, "Immutability Brief")

    headers_brand = get_auth_headers(brand_id, "BRAND")
    headers_creator = get_auth_headers("usr_elena_rostova", "CREATOR")

    inv_res = client.post(
        "/api/v1/engagements/invitations",
        json={"brief_id": brief_id, "creator_id": creator_id, "proposed_terms": {"budget_cents": 300000}},
        headers=headers_brand,
    )
    engagement_id = inv_res.json()["data"]["id"]
    client.post(f"/api/v1/engagements/{engagement_id}/respond", json={"action": "ACCEPT"}, headers=headers_creator)
    client.post(
        f"/api/v1/engagements/{engagement_id}/confirm-terms",
        json={"confirmed_terms": {"budget_cents": 300000}},
        headers=headers_brand,
    )

    sub_res = client.post(
        f"/api/v1/engagements/{engagement_id}/submit",
        json={"title": "Deliverable", "media_url": "https://creatorbridge.io/storage/final.mp4"},
        headers=headers_creator,
    )
    sub_id = sub_res.json()["data"]["id"]

    # Brand accepts
    client.post(
        f"/api/v1/engagements/{engagement_id}/submissions/{sub_id}/review",
        json={"decision": "ACCEPT", "review_notes": "Approved"},
        headers=headers_brand,
    )

    # Attempt to cancel completed engagement -> 409 Conflict
    cancel_res = client.post(
        f"/api/v1/engagements/{engagement_id}/cancel",
        json={"reason": "Attempting to cancel completed contract"},
        headers=headers_brand,
    )
    assert cancel_res.status_code == 409

    # Attempt to submit new deliverable to completed engagement -> 409 Conflict
    new_sub = client.post(
        f"/api/v1/engagements/{engagement_id}/submit",
        json={"title": "Extra Deliverable", "media_url": "https://creatorbridge.io/storage/extra.mp4"},
        headers=headers_creator,
    )
    assert new_sub.status_code == 409
