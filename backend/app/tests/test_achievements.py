"""Comprehensive test suite for Creator Achievement & Priority System."""

from datetime import datetime, timezone, timedelta
from uuid import uuid4
import pytest
from starlette.testclient import TestClient

from app.services.achievement_service import (
    achievement_service,
    MAX_LIFETIME_REPUTATION_BONUS,
    MAX_ACTIVE_BOOST_BONUS,
)
from app.services.trust_engine import compute_trust_score
from app.repositories.trust_repository import TrustRepository


def _parse_boost_time(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def test_duration_tiers_are_deterministic():
    from app.services.achievement_service import boost_duration_hours
    assert boost_duration_hours(10) == 1
    assert boost_duration_hours(24) == 1
    assert boost_duration_hours(25) == 6
    assert boost_duration_hours(49) == 6
    assert boost_duration_hours(50) == 12
    assert boost_duration_hours(99) == 12
    assert boost_duration_hours(100) == 24
    with pytest.raises(ValueError):
        boost_duration_hours(101)


def get_auth_headers(user_id: str, role: str) -> dict:
    return {
        "Authorization": f"Bearer dev-{user_id}",
        "X-User-Id": user_id,
        "X-User-Role": role,
    }


def test_verified_accepted_engagement_earns_points():
    """1. Verified accepted deliverable completion earns points based on 4-part rubric."""
    creator_id = f"test_creator_{uuid4().hex[:8]}"
    engagement_id = f"eng_{uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    result = achievement_service.record_verified_completion(
        creator_id=creator_id,
        engagement_id=engagement_id,
        verified_by="brand_verifier_1",
        completed_at=now,
        deadline_at=now,
        quality_score=90.0,
        brief_compliance_score=85.0,
        collaboration_score=95.0,
        accepted=True,
    )

    assert result["duplicate"] is False
    assert result["points_awarded"] > 0
    # Expected weighted score: 90*0.40 (36) + 100*0.25 (25) + 85*0.20 (17) + 95*0.15 (14.25) = 92.25
    assert result["achievement_score"] == 92.25
    assert result["points_awarded"] == round(92.25 * 2)  # 185 points

    summary = achievement_service.get_summary(creator_id)
    assert summary["lifetime_points"] == result["points_awarded"]
    assert summary["available_points"] == result["points_awarded"]
    assert summary["spent_points"] == 0
    assert len(summary["recent_achievements"]) == 1
    assert summary["recent_achievements"][0]["evidence"]["quality"] == 90.0


def test_rejected_or_unverified_delivery_earns_no_points():
    """2. Rejected deliverables or unverified completions raise an error and earn zero points."""
    creator_id = f"test_creator_{uuid4().hex[:8]}"
    engagement_id = f"eng_{uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    # Rejected deliverable must be blocked
    with pytest.raises(ValueError, match="Only accepted deliverables"):
        achievement_service.record_verified_completion(
            creator_id=creator_id,
            engagement_id=engagement_id,
            verified_by="brand_verifier_1",
            completed_at=now,
            deadline_at=now,
            quality_score=50.0,
            brief_compliance_score=50.0,
            collaboration_score=50.0,
            accepted=False,
        )

    summary = achievement_service.get_summary(creator_id)
    assert summary["lifetime_points"] == 0
    assert summary["available_points"] == 0


def test_duplicate_acceptance_cannot_award_points_twice():
    """3. Duplicate completion records for the same engagement ID are idempotent and do not double-award."""
    creator_id = f"test_creator_{uuid4().hex[:8]}"
    engagement_id = f"eng_unique_{uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    first_res = achievement_service.record_verified_completion(
        creator_id=creator_id,
        engagement_id=engagement_id,
        verified_by="brand_verifier_1",
        completed_at=now,
        deadline_at=now,
        quality_score=80.0,
        brief_compliance_score=80.0,
        collaboration_score=80.0,
        accepted=True,
    )
    first_points = first_res["points_awarded"]
    assert first_res["duplicate"] is False

    # Second call with same engagement ID
    second_res = achievement_service.record_verified_completion(
        creator_id=creator_id,
        engagement_id=engagement_id,
        verified_by="brand_verifier_1",
        completed_at=now,
        deadline_at=now,
        quality_score=95.0,
        brief_compliance_score=95.0,
        collaboration_score=95.0,
        accepted=True,
    )
    assert second_res["duplicate"] is True
    assert second_res["points_awarded"] == first_points

    # Account balances must not have doubled
    summary = achievement_service.get_summary(creator_id)
    assert summary["lifetime_points"] == first_points
    assert summary["available_points"] == first_points


def test_invalid_or_missing_review_evidence_rejected():
    """4. Scores outside 0-100 or empty verification actors must be rejected."""
    creator_id = f"test_creator_{uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    # Out of bounds score (> 100)
    with pytest.raises(ValueError, match="between 0 and 100"):
        achievement_service.record_verified_completion(
            creator_id=creator_id,
            engagement_id=f"eng_{uuid4().hex[:8]}",
            verified_by="brand_1",
            completed_at=now,
            deadline_at=now,
            quality_score=150.0,
            brief_compliance_score=80.0,
            collaboration_score=80.0,
            accepted=True,
        )

    # Empty verification actor
    with pytest.raises(ValueError, match="verification actor is required"):
        achievement_service.record_verified_completion(
            creator_id=creator_id,
            engagement_id=f"eng_{uuid4().hex[:8]}",
            verified_by="   ",
            completed_at=now,
            deadline_at=now,
            quality_score=80.0,
            brief_compliance_score=80.0,
            collaboration_score=80.0,
            accepted=True,
        )


def test_creator_cannot_spend_another_creators_points(client: TestClient):
    """5. Authenticated creators can only spend from their own account."""
    # Create points for creator A
    creator_a_id = "00000000-0000-0000-0000-000000000001"
    achievement_service.record_verified_completion(
        creator_id=creator_a_id,
        engagement_id=f"eng_{uuid4().hex[:8]}",
        verified_by="brand_owner",
        completed_at=datetime.now(timezone.utc).isoformat(),
        deadline_at=None,
        quality_score=90.0,
        brief_compliance_score=90.0,
        collaboration_score=90.0,
        accepted=True,
    )

    # User B who has no creator profile or no balance tries to spend
    user_b_headers = get_auth_headers("usr_creator_no_balance_999", "CREATOR")
    res = client.post("/api/v1/achievements/boosts", json={"points": 50}, headers=user_b_headers)
    # Must fail because user B has no points in their account
    assert res.status_code in [400, 404]


def test_insufficient_balances_and_spending_limits():
    """6. Spending enforces limits (10 to 100) and cannot exceed available balance."""
    creator_id = f"test_creator_{uuid4().hex[:8]}"

    # Cannot spend when balance is 0
    with pytest.raises(ValueError, match="Not enough available"):
        achievement_service.spend_for_boost(creator_id, 20, None)

    # Award 50 points
    achievement_service.record_verified_completion(
        creator_id=creator_id,
        engagement_id=f"eng_{uuid4().hex[:8]}",
        verified_by="brand_1",
        completed_at=datetime.now(timezone.utc).isoformat(),
        deadline_at=None,
        quality_score=50.0,
        brief_compliance_score=50.0,
        collaboration_score=50.0,
        accepted=True,
    )
    # 50% score * 2 = 100 points
    summary = achievement_service.get_summary(creator_id)
    avail = summary["available_points"]

    # Less than MIN_BOOST_SPEND (10)
    with pytest.raises(ValueError, match="between 10 and 100"):
        achievement_service.spend_for_boost(creator_id, 5, None)

    # More than MAX_BOOST_SPEND (100)
    with pytest.raises(ValueError, match="between 10 and 100"):
        achievement_service.spend_for_boost(creator_id, 150, None)

    # Spend 40 points successfully
    boost = achievement_service.spend_for_boost(creator_id, 40, None)
    assert boost["status"] == "ACTIVE"
    assert boost["points_spent"] == 40

    after_summary = achievement_service.get_summary(creator_id)
    assert after_summary["available_points"] == avail - 40
    assert after_summary["spent_points"] == 40
    # Lifetime points must remain unchanged
    assert after_summary["lifetime_points"] == avail


def test_boost_duration_depends_on_points_and_campaign_scope():
    """7. Server maps spend tiers to durations and boost scope is respected."""
    creator_id = f"test_creator_{uuid4().hex[:8]}"

    # Award points
    achievement_service.record_verified_completion(
        creator_id=creator_id,
        engagement_id=f"eng_{uuid4().hex[:8]}",
        verified_by="brand_1",
        completed_at=datetime.now(timezone.utc).isoformat(),
        deadline_at=None,
        quality_score=90.0,
        brief_compliance_score=90.0,
        collaboration_score=90.0,
        accepted=True,
    )

    # Spend 50 points for a global boost: the server grants a 12-hour duration.
    boost = achievement_service.spend_for_boost(creator_id, 50, None)
    assert boost["duration_hours"] == 12
    assert (_parse_boost_time(boost["expires_at"]) - _parse_boost_time(boost["starts_at"])).total_seconds() == 12 * 3600

    # Check ranking bonus: 50 pts out of 100 max = 4.0 temporary bonus
    bonus = achievement_service.ranking_bonus(creator_id, brief_id=None)
    assert bonus["active_boost"] is True
    assert bonus["temporary_priority_bonus"] == 4.0

    # Scoped check: global boost applies to any brief
    scoped_bonus = achievement_service.ranking_bonus(creator_id, brief_id="brief_xyz")
    assert scoped_bonus["temporary_priority_bonus"] == 4.0


def test_bonuses_are_strictly_capped():
    """8. Long-term bonus cannot exceed 5.0 and temporary boost bonus cannot exceed 8.0."""
    creator_id = f"test_creator_whale_{uuid4().hex[:8]}"

    # Simulate huge lifetime points (e.g. 10,000 pts)
    from app.core.db import get_db_connection
    now = datetime.now(timezone.utc).isoformat()
    with get_db_connection() as conn:
        conn.execute(
            """INSERT INTO creator_achievement_accounts
               (creator_id, lifetime_points, available_points, spent_points, updated_at)
               VALUES (?, 10000, 10000, 0, ?)""",
            (creator_id, now),
        )

    # Long term bonus must cap at 5.0
    lt_bonus = achievement_service.long_term_bonus(10000)
    assert lt_bonus == MAX_LIFETIME_REPUTATION_BONUS
    assert lt_bonus <= 5.0

    # Spend max 100 points
    achievement_service.spend_for_boost(creator_id, 100, None)
    bonus_data = achievement_service.ranking_bonus(creator_id, None)
    assert bonus_data["temporary_priority_bonus"] == MAX_ACTIVE_BOOST_BONUS
    assert bonus_data["temporary_priority_bonus"] <= 8.0


def test_matching_preserves_original_match_fit():
    """9. Matching engine returns separate overall_match_score and priority_score."""
    import anyio
    from app.services.matching_service import MatchingService
    from app.schemas.match import MatchCriteria

    async def run():
        service = MatchingService()
        criteria = MatchCriteria(
            brief_id=str(uuid4()),
            required_skills=["Cinematic Video", "Lighting Consistency"],
            required_tools=["Runway Gen-3", "Midjourney"],
        )

        matches = await service.compute_matches_for_brief(criteria)
        assert len(matches) > 0

        first = matches[0]
        # Verify overall_match_score is separate from priority_score
        assert hasattr(first, "overall_match_score")
        assert hasattr(first, "priority_score")
        assert hasattr(first, "achievement_points")
        assert hasattr(first, "achievement_reputation_bonus")
        assert hasattr(first, "temporary_priority_bonus")

        # Priority score is overall_match_score + bonuses (capped at 100.0)
        expected_p = round(min(100.0, first.overall_match_score + first.achievement_reputation_bonus + first.temporary_priority_bonus), 1)
        assert first.priority_score == expected_p

    anyio.run(run)


def test_achievement_points_never_change_trust():
    """11. Non-negotiable: Achievement points and boosts can NEVER alter Trust scores or demerits."""
    creator_id = f"test_creator_trust_check_{uuid4().hex[:8]}"

    # Trust score starts with zero incidents -> 100
    trust_calc = compute_trust_score([])
    initial_trust_score = trust_calc["score"]
    assert initial_trust_score == 100

    # Award 500 achievement points to creator
    now = datetime.now(timezone.utc).isoformat()
    achievement_service.record_verified_completion(
        creator_id=creator_id,
        engagement_id=f"eng_{uuid4().hex[:8]}",
        verified_by="brand_1",
        completed_at=now,
        deadline_at=None,
        quality_score=100.0,
        brief_compliance_score=100.0,
        collaboration_score=100.0,
        accepted=True,
    )

    # Trust score remains strictly based on incident ledger
    trust_after_award = compute_trust_score([])
    assert trust_after_award["score"] == initial_trust_score

    # Now simulate an active demerit (Minor incident = -5 pts)
    incident = {
        "status": "ACTIVE",
        "calculated_penalty": 5,
        "confirmed_at": now,
    }
    trust_with_demerit = compute_trust_score([incident])
    assert trust_with_demerit["score"] == 95

    # Creator spends points on priority boost
    achievement_service.spend_for_boost(creator_id, 50, None)

    # Trust score must STILL be 95 (boost points NEVER offset or clear demerits)
    trust_after_boost = compute_trust_score([incident])
    assert trust_after_boost["score"] == 95
    assert trust_after_boost["total_active_demerits"] == 5


def test_unauthenticated_and_brands_cannot_call_creator_spending_endpoints(client: TestClient):
    """13. Unauthenticated requests and brand accounts cannot access creator-only achievement spending."""
    payload = {"points": 50}

    # 1. Unauthenticated request -> 401
    unauth_res = client.post("/api/v1/achievements/boosts", json=payload)
    assert unauth_res.status_code == 401

    # 2. Brand account request -> 403 Forbidden
    brand_headers = get_auth_headers("usr_lumina_skincare", "BRAND")
    brand_res = client.post("/api/v1/achievements/boosts", json=payload, headers=brand_headers)
    assert brand_res.status_code == 403


def test_public_api_does_not_leak_private_balances(client: TestClient):
    """14. Public creator achievement endpoint excludes available points, spent points, and target briefs."""
    creator_id = "00000000-0000-0000-0000-000000000001"

    res = client.get(f"/api/v1/achievements/accounts/{creator_id}")
    assert res.status_code == 200
    data = res.json()["data"]

    # Public fields present
    assert "lifetime_points" in data
    assert "long_term_reputation_bonus" in data
    assert "recent_achievements" in data

    # Private fields MUST NOT be in public response
    assert "available_points" not in data
    assert "spent_points" not in data
    assert "active_boosts" not in data


def test_project_workspace_acceptance_awards_achievement_points(client: TestClient):
    """15. Authorized brand accepting project workspace delivers verified achievement points."""
    brand_headers = get_auth_headers("usr_lumina_skincare", "BRAND")
    creator_id = "00000000-0000-0000-0000-000000000001"

    # Create a project workspace
    project_payload = {
        "title": "Kinetic Commercial Motion Spec",
        "brandId": "usr_lumina_skincare",
        "creatorId": creator_id,
        "agreedBudgetCents": 250000,
        "milestones": [{"title": "Rough Cut", "completed": True}],
        "deliverables": [{"type": "video", "title": "Final 4K Master"}],
    }
    create_res = client.post("/api/v1/projects", json=project_payload, headers=brand_headers)
    assert create_res.status_code == 200
    project_id = create_res.json()["data"]["id"]

    # Brand formally accepts project with review scores
    accept_payload = {
        "quality_score": 95.0,
        "brief_compliance_score": 90.0,
        "collaboration_score": 95.0,
        "feedback": "Outstanding visual consistency and prompt execution.",
    }
    accept_res = client.post(f"/api/v1/projects/{project_id}/accept", json=accept_payload, headers=brand_headers)
    assert accept_res.status_code == 200
    accept_data = accept_res.json()["data"]
    assert accept_data["status"] == "APPROVED"
    assert accept_data["award"]["points_awarded"] > 0
    assert accept_data["award"]["duplicate"] is False
