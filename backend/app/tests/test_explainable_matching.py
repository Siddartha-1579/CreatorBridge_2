"""Comprehensive test suite for Round 2 Feature 3.1: Real, Explainable Creator Matching.

Covers all 13 test and quality requirements:
  1. Exact content and specialization matches.
  2. Partial and conflicting skills/tool matches.
  3. Similar and dissimilar portfolio evidence.
  4. Mandatory licensing requirements satisfied, unmet, and unknown.
  5. Budget and deadline compatibility, including missing data.
  6. Missing verification records.
  7. Empty creator pools and empty portfolios.
  8. No eligible candidates.
  9. Stable ranking for identical inputs.
  10. Score normalization and weight calculations.
  11. Authorization and data isolation between brands.
  12. Ensuring explanation matches actual scoring evidence.
  13. Ensuring no mock or fabricated data returned by production matching endpoints.
"""

import pytest
import anyio
from uuid import uuid4, UUID
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.matching_service import MatchingService
from app.schemas.match import (
    MatchCriteria,
    MatchEngineWeights,
    EligibilityStatus,
    RequirementState,
)
from app.schemas.creator import (
    CreatorProfileResponse,
    CreatorLevel,
    VerificationRecordResponse,
    VerificationType,
    VerificationStatus,
)
from app.schemas.portfolio import (
    PortfolioProjectResponse,
    CommercialUseStatus,
    AssetType,
    AIGenerationType,
    ProjectVisibility,
)
from app.schemas.brief import (
    CampaignBriefResponse,
    BriefStatus,
    DeliverableItem,
    CreatorCapabilityRequirements,
    CommercialTerms,
)


def _make_creator(
    id_str: str,
    handle: str,
    primary_spec: str = "Cinematic AI Video",
    tools: list = None,
    skills: list = None,
    hourly_rate_cents: int = 5000,
    is_verified: bool = True,
    availability: str = "AVAILABLE",
) -> CreatorProfileResponse:
    now = datetime.now(timezone.utc)
    return CreatorProfileResponse(
        id=UUID(id_str),
        user_id=f"usr_{handle}",
        full_name=handle.replace("_", " ").title(),
        handle=handle,
        primary_specialization=primary_spec,
        secondary_specializations=["Commercial Visuals"],
        target_niches=["Fashion", "Luxury", "Beauty"],
        content_types=["Short-form Video", "Cinematic"],
        preferred_formats=["9:16", "16:9"],
        skills=skills or ["Prompt Engineering", "Color Grading"],
        ai_tools=tools or ["Runway Gen-3", "Midjourney v6"],
        hourly_rate_cents=hourly_rate_cents,
        is_verified=is_verified,
        assessment_completed=True,
        reputation_score=4.9,
        profile_completeness_pct=95,
        metadata={"availability": availability},
        created_at=now,
        updated_at=now,
    )


def _make_portfolio_project(
    proj_id_str: str,
    creator_id_str: str,
    title: str,
    tools: list = None,
    aspect_ratio: str = "9:16",
    commercial_status: CommercialUseStatus = CommercialUseStatus.COMMERCIAL_READY,
    is_verified: bool = True,
) -> PortfolioProjectResponse:
    now = datetime.now(timezone.utc)
    used_tools = tools if tools is not None else ["Runway Gen-3", "Midjourney v6"]
    used_models = [used_tools[0]] if used_tools else []
    return PortfolioProjectResponse(
        id=UUID(proj_id_str),
        creator_id=UUID(creator_id_str),
        title=title,
        media_type=AssetType.VIDEO,
        media_url=f"https://storage.creatorbridge.io/{proj_id_str}.mp4",
        category="Commercial Video",
        content_type="Short-form Video",
        tools=used_tools,
        models=used_models,
        skills=["Cinematics", "Lighting"],
        aspect_ratio=aspect_ratio,
        commercial_use_status=commercial_status,
        ai_generation_type=AIGenerationType.AI_GENERATED,
        visibility=ProjectVisibility.PUBLIC,
        verification_status="VERIFIED" if is_verified else "UNVERIFIED",
        created_at=now,
        updated_at=now,
    )


# -----------------------------------------------------------------------------
# 1. Exact content and specialization matches
# -----------------------------------------------------------------------------
def test_exact_content_and_specialization_match():
    async def run():
        c_id = "00000000-0000-0000-0000-000000000001"
        creator = _make_creator(c_id, "fashion_director", primary_spec="Luxury Fashion & Cyberpunk Video")
        proj = _make_portfolio_project("10000000-0000-0000-0000-000000000001", c_id, "Gucci AI Fashion Film")

        mock_creator_repo = MagicMock()
        mock_creator_repo.list_all = AsyncMock(return_value=[creator])
        mock_portfolio_repo = MagicMock()
        mock_portfolio_repo.list_public_by_creator = AsyncMock(return_value=[proj])

        service = MatchingService(creator_repo=mock_creator_repo, portfolio_repo=mock_portfolio_repo)
        criteria = MatchCriteria(
            brief_id="general",
            target_niches=["Fashion", "Luxury"],
            target_platforms=["TikTok", "Instagram Reels"],
        )
        results = await service.compute_matches_for_brief(criteria)
        assert len(results) == 1
        res = results[0]

        content_factor = next(f for f in res.factors if f.factor_name == "Content Fit")
        assert content_factor.score >= 80.0
        assert "Fashion" in res.factors[0].explanation or any("Fashion" in ev for ev in res.factors[0].evidence)
        assert res.eligibility_status == EligibilityStatus.ELIGIBLE_MATCH

    anyio.run(run)


# -----------------------------------------------------------------------------
# 2. Partial and conflicting skills/tool matches
# -----------------------------------------------------------------------------
def test_partial_and_conflicting_tool_matches():
    async def run():
        c_id = "00000000-0000-0000-0000-000000000002"
        # Creator has Runway Gen-3 and Midjourney, but lacks Kling and ComfyUI
        creator = _make_creator(c_id, "partial_tool_artist", tools=["Runway Gen-3", "Midjourney v6"])

        mock_creator_repo = MagicMock()
        mock_creator_repo.list_all = AsyncMock(return_value=[creator])
        mock_portfolio_repo = MagicMock()
        mock_portfolio_repo.list_public_by_creator = AsyncMock(return_value=[])

        service = MatchingService(creator_repo=mock_creator_repo, portfolio_repo=mock_portfolio_repo)

        # Brief with mandatory Kling tool
        criteria = MatchCriteria(
            brief_id="general",
            required_tools=["Kling", "Runway Gen-3"],  # Kling is missing
        )
        results = await service.compute_matches_for_brief(criteria)
        assert len(results) == 1
        res = results[0]

        # Missing mandatory tool must mark creator NOT_ELIGIBLE
        assert res.is_eligible is False
        assert res.eligibility_status == EligibilityStatus.NOT_ELIGIBLE
        assert any("Kling" in u for u in res.unmet_requirements)

        # Skills & tools score should be penalized severely (< 35)
        tools_factor = next(f for f in res.factors if f.factor_name == "Skills and AI Tools/Models")
        assert tools_factor.score <= 35.0

    anyio.run(run)


# -----------------------------------------------------------------------------
# 3. Similar and dissimilar portfolio evidence
# -----------------------------------------------------------------------------
def test_similar_vs_dissimilar_portfolio_evidence():
    async def run():
        c1_id = "00000000-0000-0000-0000-000000000003"
        c2_id = "00000000-0000-0000-0000-000000000004"
        c1 = _make_creator(c1_id, "perfect_portfolio", tools=["Runway Gen-3"])
        c2 = _make_creator(c2_id, "unrelated_portfolio", tools=["Runway Gen-3"])

        # Creator 1 has matching 9:16 Runway projects
        proj_matching = _make_portfolio_project("10000000-0000-0000-0000-000000000003", c1_id, "Runway Vertical Commercial", tools=["Runway Gen-3"], aspect_ratio="9:16")
        # Creator 2 has unrelated aspect ratio and tools
        proj_unrelated = _make_portfolio_project("10000000-0000-0000-0000-000000000004", c2_id, "Audio Podcast Clip", tools=["Audacity"], aspect_ratio="1:1")

        mock_creator_repo = MagicMock()
        mock_creator_repo.list_all = AsyncMock(return_value=[c1, c2])
        mock_portfolio_repo = MagicMock()
        mock_portfolio_repo.list_public_by_creator = AsyncMock(side_effect=lambda cid: [proj_matching] if str(cid) == c1_id else [proj_unrelated])

        service = MatchingService(creator_repo=mock_creator_repo, portfolio_repo=mock_portfolio_repo)
        criteria = MatchCriteria(
            brief_id="general",
            required_tools=["Runway Gen-3"],
            target_platforms=["TikTok"],
        )
        results = await service.compute_matches_for_brief(criteria)
        assert len(results) == 2

        score_c1_port = next(f.score for f in results[0].factors if f.factor_name == "Portfolio Evidence")
        score_c2_port = next(f.score for f in results[1].factors if f.factor_name == "Portfolio Evidence")

        assert score_c1_port > score_c2_port
        assert len(results[0].portfolio_evidence) > 0
        assert results[0].portfolio_evidence[0].title == "Runway Vertical Commercial"

    anyio.run(run)


# -----------------------------------------------------------------------------
# 4. Mandatory licensing requirements: satisfied, unmet, and unknown
# -----------------------------------------------------------------------------
def test_mandatory_licensing_requirements_tri_state():
    async def run():
        # Creator A: Satisfied commercial rights
        ca_id = "00000000-0000-0000-0000-000000000005"
        ca = _make_creator(ca_id, "licensed_creator")
        proj_a = _make_portfolio_project("10000000-0000-0000-0000-000000000005", ca_id, "Commercial Video", commercial_status=CommercialUseStatus.COMMERCIAL_READY)

        # Creator B: Unmet commercial rights (strictly personal use)
        cb_id = "00000000-0000-0000-0000-000000000006"
        cb = _make_creator(cb_id, "personal_only_creator", is_verified=False)
        proj_b = _make_portfolio_project("10000000-0000-0000-0000-000000000006", cb_id, "Fan Art Film", commercial_status=CommercialUseStatus.PERSONAL_PROJECT, is_verified=False)

        # Creator C: Unknown commercial rights (no declared status or no portfolio)
        cc_id = "00000000-0000-0000-0000-000000000007"
        cc = _make_creator(cc_id, "unknown_licensing_creator", is_verified=False)
        proj_c = _make_portfolio_project("10000000-0000-0000-0000-000000000007", cc_id, "Undocumented Work", commercial_status=CommercialUseStatus.UNKNOWN, is_verified=False)

        mock_creator_repo = MagicMock()
        mock_creator_repo.list_all = AsyncMock(return_value=[ca, cb, cc])
        mock_portfolio_repo = MagicMock()
        mock_portfolio_repo.list_public_by_creator = AsyncMock(
            side_effect=lambda cid: [proj_a] if str(cid) == ca_id else ([proj_b] if str(cid) == cb_id else [proj_c])
        )

        service = MatchingService(creator_repo=mock_creator_repo, portfolio_repo=mock_portfolio_repo)
        criteria = MatchCriteria(
            brief_id="general",
            require_commercial_rights=True,
        )
        results = await service.compute_matches_for_brief(criteria)
        res_map = {r.creator_handle: r for r in results}

        # Creator A: Satisfied
        assert res_map["licensed_creator"].eligibility_status == EligibilityStatus.ELIGIBLE_MATCH
        assert res_map["licensed_creator"].commercial_rights_cleared is True
        score_a = next(f.score for f in res_map["licensed_creator"].factors if f.factor_name == "Commercial-Use Fit & Licensing")
        assert score_a >= 90.0

        # Creator B: Unmet -> Must NOT be eligible
        assert res_map["personal_only_creator"].is_eligible is False
        assert res_map["personal_only_creator"].eligibility_status == EligibilityStatus.NOT_ELIGIBLE
        assert any("commercial" in u.lower() for u in res_map["personal_only_creator"].unmet_requirements)

        # Creator C: Unknown -> Must NOT assume compatibility, labeled info missing
        assert res_map["unknown_licensing_creator"].eligibility_status == EligibilityStatus.POTENTIAL_MATCH_INFO_MISSING
        score_c = next(f.score for f in res_map["unknown_licensing_creator"].factors if f.factor_name == "Commercial-Use Fit & Licensing")
        assert score_c == 35.0  # Does not award unearned points

    anyio.run(run)


# -----------------------------------------------------------------------------
# 5. Budget and deadline compatibility, including missing data
# -----------------------------------------------------------------------------
def test_budget_and_deadline_compatibility():
    async def run():
        # High-cost creator
        c1_id = "00000000-0000-0000-0000-000000000008"
        c1 = _make_creator(c1_id, "expensive_creator", hourly_rate_cents=50000, availability="AVAILABLE")

        # Affordable creator
        c2_id = "00000000-0000-0000-0000-000000000009"
        c2 = _make_creator(c2_id, "affordable_creator", hourly_rate_cents=3000, availability="AVAILABLE")

        # Creator with missing rate
        c3_id = "00000000-0000-0000-0000-000000000010"
        c3 = _make_creator(c3_id, "missing_rate_creator", hourly_rate_cents=None, availability="AVAILABLE")

        # Unavailable creator
        c4_id = "00000000-0000-0000-0000-000000000011"
        c4 = _make_creator(c4_id, "unavailable_creator", hourly_rate_cents=3000, availability="UNAVAILABLE")

        mock_creator_repo = MagicMock()
        mock_creator_repo.list_all = AsyncMock(return_value=[c1, c2, c3, c4])
        mock_portfolio_repo = MagicMock()
        mock_portfolio_repo.list_public_by_creator = AsyncMock(return_value=[])

        service = MatchingService(creator_repo=mock_creator_repo, portfolio_repo=mock_portfolio_repo)
        criteria = MatchCriteria(
            brief_id="general",
            max_budget_cents=50000,  # 50,000 cents ceiling
        )
        results = await service.compute_matches_for_brief(criteria)
        res_map = {r.creator_handle: r for r in results}

        # c2 fits budget comfortably
        c2_feas = next(f.score for f in res_map["affordable_creator"].factors if f.factor_name == "Practical Feasibility")
        # c1 substantially exceeds budget
        c1_feas = next(f.score for f in res_map["expensive_creator"].factors if f.factor_name == "Practical Feasibility")
        assert c2_feas > c1_feas

        # c3 has unknown budget compatibility
        assert any("Budget" in unk for unk in res_map["missing_rate_creator"].unknown_information)

        # c4 is unavailable
        c4_feas = next(f.score for f in res_map["unavailable_creator"].factors if f.factor_name == "Practical Feasibility")
        assert c4_feas < c2_feas

    anyio.run(run)


# -----------------------------------------------------------------------------
# 6. Missing verification records
# -----------------------------------------------------------------------------
def test_missing_verification_records_audit():
    async def run():
        c_id = "00000000-0000-0000-0000-000000000012"
        creator = _make_creator(c_id, "unverified_creator", is_verified=False)

        mock_creator_repo = MagicMock()
        mock_creator_repo.list_all = AsyncMock(return_value=[creator])
        mock_portfolio_repo = MagicMock()
        mock_portfolio_repo.list_public_by_creator = AsyncMock(return_value=[])
        mock_verif_repo = MagicMock()
        mock_verif_repo.list_by_creator = AsyncMock(return_value=[])  # Zero verification records

        service = MatchingService(
            creator_repo=mock_creator_repo,
            portfolio_repo=mock_portfolio_repo,
            verification_repo=mock_verif_repo,
        )
        criteria = MatchCriteria(brief_id="general")
        results = await service.compute_matches_for_brief(criteria)
        assert len(results) == 1
        res = results[0]

        trust_factor = next(f for f in res.factors if f.factor_name == "Trust and Verification")
        assert trust_factor.score < 50.0  # Missing all badges
        assert any("verification" in unk.lower() for unk in res.unknown_information)

    anyio.run(run)


# -----------------------------------------------------------------------------
# 7. Empty creator pools and empty portfolios
# -----------------------------------------------------------------------------
def test_empty_creator_pools_and_empty_portfolios():
    async def run():
        mock_creator_repo = MagicMock()
        mock_creator_repo.list_all = AsyncMock(return_value=[])  # Empty DB

        service = MatchingService(creator_repo=mock_creator_repo)
        criteria = MatchCriteria(brief_id="general")
        results = await service.compute_matches_for_brief(criteria)

        # Must return empty list, NOT fake mock creators
        assert results == []

        # Test empty portfolio handling
        c_id = "00000000-0000-0000-0000-000000000013"
        c = _make_creator(c_id, "empty_portfolio_creator")
        mock_creator_repo.list_all = AsyncMock(return_value=[c])
        mock_portfolio_repo = MagicMock()
        mock_portfolio_repo.list_public_by_creator = AsyncMock(return_value=[])  # Empty portfolio

        service2 = MatchingService(creator_repo=mock_creator_repo, portfolio_repo=mock_portfolio_repo)
        results2 = await service2.compute_matches_for_brief(criteria)
        assert len(results2) == 1
        port_factor = next(f for f in results2[0].factors if f.factor_name == "Portfolio Evidence")
        assert port_factor.score == 0.0
        assert "No public portfolio projects" in port_factor.explanation
        assert results2[0].portfolio_evidence == []

    anyio.run(run)


# -----------------------------------------------------------------------------
# 8. No eligible candidates
# -----------------------------------------------------------------------------
def test_no_eligible_candidates_segregation():
    async def run():
        c_id = "00000000-0000-0000-0000-000000000014"
        c = _make_creator(c_id, "ineligible_creator", tools=["Photoshop"])

        mock_creator_repo = MagicMock()
        mock_creator_repo.list_all = AsyncMock(return_value=[c])
        mock_portfolio_repo = MagicMock()
        mock_portfolio_repo.list_public_by_creator = AsyncMock(return_value=[])

        service = MatchingService(creator_repo=mock_creator_repo, portfolio_repo=mock_portfolio_repo)
        # Require an advanced AI tool that creator does not possess
        criteria = MatchCriteria(
            brief_id="general",
            required_tools=["Runway Gen-3", "Flux-Pro"],
        )
        results = await service.compute_matches_for_brief(criteria)
        assert len(results) == 1
        # Ineligible creator must be clearly marked
        assert results[0].is_eligible is False
        assert results[0].eligibility_status == EligibilityStatus.NOT_ELIGIBLE
        assert "Ineligible" in results[0].summary_explanation

    anyio.run(run)


# -----------------------------------------------------------------------------
# 9. Stable ranking for identical inputs
# -----------------------------------------------------------------------------
def test_stable_ranking_for_identical_inputs():
    async def run():
        c1 = _make_creator("00000000-0000-0000-0000-000000000015", "creator_alpha", tools=["Runway Gen-3"])
        c2 = _make_creator("00000000-0000-0000-0000-000000000016", "creator_beta", tools=["Midjourney v6"])

        mock_creator_repo = MagicMock()
        mock_creator_repo.list_all = AsyncMock(return_value=[c1, c2])
        mock_portfolio_repo = MagicMock()
        mock_portfolio_repo.list_public_by_creator = AsyncMock(return_value=[])

        service = MatchingService(creator_repo=mock_creator_repo, portfolio_repo=mock_portfolio_repo)
        criteria = MatchCriteria(brief_id="general", required_tools=["Runway Gen-3"])

        run_1 = await service.compute_matches_for_brief(criteria)
        run_2 = await service.compute_matches_for_brief(criteria)

        assert [r.creator_id for r in run_1] == [r.creator_id for r in run_2]
        assert [r.overall_match_score for r in run_1] == [r.overall_match_score for r in run_2]

    anyio.run(run)


# -----------------------------------------------------------------------------
# 10. Score normalization and weight calculations
# -----------------------------------------------------------------------------
def test_score_normalization_and_weight_composite():
    async def run():
        c_id = "00000000-0000-0000-0000-000000000017"
        c = _make_creator(c_id, "score_test_creator")
        proj = _make_portfolio_project("10000000-0000-0000-0000-000000000017", c_id, "Sample Work")

        mock_creator_repo = MagicMock()
        mock_creator_repo.list_all = AsyncMock(return_value=[c])
        mock_portfolio_repo = MagicMock()
        mock_portfolio_repo.list_public_by_creator = AsyncMock(return_value=[proj])

        service = MatchingService(creator_repo=mock_creator_repo, portfolio_repo=mock_portfolio_repo)
        criteria = MatchCriteria(brief_id="general")
        results = await service.compute_matches_for_brief(criteria)
        res = results[0]

        # Verify weights sum to 1.0
        weights_sum = sum(f.weight for f in res.factors)
        assert abs(weights_sum - 1.0) < 1e-6

        # Verify composite calculation formula
        expected_overall = round(sum(f.weight * f.score for f in res.factors), 1)
        assert abs(res.overall_match_score - expected_overall) < 0.2
        assert 0.0 <= res.overall_match_score <= 100.0

    anyio.run(run)


# -----------------------------------------------------------------------------
# 11. Authorization and data isolation between brands
# -----------------------------------------------------------------------------
def test_brand_authorization_and_data_isolation():
    client = TestClient(app)

    # 1. Non-existent brief returns 404
    fake_brief_id = str(uuid4())
    headers_a = {
        "Authorization": "Bearer dev-usr_brand_alpha",
        "X-User-Role": "BRAND",
        "X-User-Id": "usr_brand_alpha",
    }
    headers_b = {
        "Authorization": "Bearer dev-usr_brand_beta",
        "X-User-Role": "BRAND",
        "X-User-Id": "usr_brand_beta",
    }
    headers_creator = {
        "Authorization": "Bearer dev-usr_creator_elena",
        "X-User-Role": "CREATOR",
        "X-User-Id": "usr_creator_elena",
    }

    # GET /briefs/{id} 404 and 422
    res_404 = client.get(f"/api/v1/matches/briefs/{fake_brief_id}", headers=headers_a)
    assert res_404.status_code == 404

    res_422 = client.get("/api/v1/matches/briefs/not-a-uuid", headers=headers_a)
    assert res_422.status_code == 422

    # POST /compute 404 and 422
    res_comp_404 = client.post("/api/v1/matches/compute", json={"brief_id": fake_brief_id})
    assert res_comp_404.status_code == 404

    res_comp_422 = client.post("/api/v1/matches/compute", json={"brief_id": "not-a-valid-uuid"})
    assert res_comp_422.status_code == 422

    # Insert a temporary draft private brief owned by Brand Alpha
    draft_id = str(uuid4())
    now = datetime.now(timezone.utc)
    from app.core.db import get_db_connection
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO campaign_briefs (
                id, brand_id, title, status, is_public, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (draft_id, "usr_brand_alpha", "Alpha Secret Draft Brief", "DRAFT", 0, now.isoformat(), now.isoformat())
        )
        conn.commit()

    try:
        # A. Unauthenticated request against another brand's draft brief -> 403 Forbidden
        res_unauth = client.post("/api/v1/matches/compute", json={"brief_id": draft_id})
        assert res_unauth.status_code == 403
        assert "permission" in res_unauth.text.lower()
        # Verify no private brief title or details leaked
        assert "Secret" not in res_unauth.text

        # B. Creator-role request against a private draft brief -> 403 Forbidden
        res_creator = client.post("/api/v1/matches/compute", json={"brief_id": draft_id}, headers=headers_creator)
        assert res_creator.status_code == 403

        # C. Brand B requesting Brand A's draft brief -> 403 Forbidden
        res_brand_b = client.post("/api/v1/matches/compute", json={"brief_id": draft_id}, headers=headers_b)
        assert res_brand_b.status_code == 403

        # D. Authorized owner (Brand Alpha) requesting their own draft brief -> 200 OK
        res_owner = client.post("/api/v1/matches/compute", json={"brief_id": draft_id}, headers=headers_a)
        assert res_owner.status_code == 200
        assert res_owner.json()["success"] is True

        # E. Allowed access to a published, public brief
        # Foundational brief 00000000-0000-0000-0000-000000000004 is PUBLISHED and public
        pub_brief_id = "00000000-0000-0000-0000-000000000004"
        res_pub_unauth = client.post("/api/v1/matches/compute", json={"brief_id": pub_brief_id})
        assert res_pub_unauth.status_code == 200
        assert res_pub_unauth.json()["success"] is True

        res_pub_creator = client.post("/api/v1/matches/compute", json={"brief_id": pub_brief_id}, headers=headers_creator)
        assert res_pub_creator.status_code == 200

        # F. Existing general matching behavior
        res_gen = client.post("/api/v1/matches/compute", json={"brief_id": "general", "required_tools": ["Runway Gen-3"]})
        assert res_gen.status_code == 200
        assert res_gen.json()["success"] is True

        res_gen_case = client.post("/api/v1/matches/compute", json={"brief_id": "GENERAL"})
        assert res_gen_case.status_code == 200

        # Omitting required brief_id returns 422
        res_missing_id = client.post("/api/v1/matches/compute", json={"required_tools": ["Midjourney"]})
        assert res_missing_id.status_code == 422

    finally:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM campaign_briefs WHERE id = ?", (draft_id,))
            conn.commit()


# -----------------------------------------------------------------------------
# 12. Ensuring explanation matches actual scoring evidence
# -----------------------------------------------------------------------------
def test_explanation_matches_actual_scoring_evidence():
    async def run():
        c_id = "00000000-0000-0000-0000-000000000018"
        creator = _make_creator(c_id, "evidence_creator", primary_spec="Cinematic Sci-Fi", tools=["Runway Gen-3"])
        proj = _make_portfolio_project("10000000-0000-0000-0000-000000000018", c_id, "Sci-Fi Starship Commercial")

        mock_creator_repo = MagicMock()
        mock_creator_repo.list_all = AsyncMock(return_value=[creator])
        mock_portfolio_repo = MagicMock()
        mock_portfolio_repo.list_public_by_creator = AsyncMock(return_value=[proj])

        service = MatchingService(creator_repo=mock_creator_repo, portfolio_repo=mock_portfolio_repo)
        criteria = MatchCriteria(brief_id="general", required_tools=["Runway Gen-3"])
        results = await service.compute_matches_for_brief(criteria)
        res = results[0]

        # Factors must explicitly cite the evidence
        assert any("Runway" in f.explanation or "Runway" in "".join(f.evidence) for f in res.factors)
        assert res.portfolio_evidence[0].title == "Sci-Fi Starship Commercial"
        assert res.score_meaning == "Calculated match score based on available evidence, not a probability of success or delivery guarantee."
        assert res.relative_rank_explanation is not None

    anyio.run(run)


# -----------------------------------------------------------------------------
# 13. Ensuring no mock or fabricated data returned by production endpoint
# -----------------------------------------------------------------------------
def test_production_endpoint_returns_real_data_or_honest_empty():
    client = TestClient(app)

    # Compute matches for an actual criteria request
    res = client.post(
        "/api/v1/matches/compute",
        json={
            "brief_id": "general",
            "required_tools": ["Runway Gen-3"],
            "target_niches": ["Fashion"],
            "limit": 5,
        },
    )
    assert res.status_code == 200
    data = res.json().get("data", [])

    # If creators exist in DB, verify they contain valid non-mock fields
    if data:
        first = data[0]
        assert "overall_match_score" in first
        assert "factors" in first
        assert len(first["factors"]) == 6
        assert first["score_meaning"] == "Calculated match score based on available evidence, not a probability of success or delivery guarantee."
        assert first["eligibility_status"] in ["ELIGIBLE_MATCH", "POTENTIAL_MATCH_INFO_MISSING", "NOT_ELIGIBLE"]
    else:
        # If no creators, response message must honestly reflect absence
        assert "No suitable creators" in res.json().get("message", "")


# -----------------------------------------------------------------------------
# 14. Identity verification decoupled from commercial licensing
# -----------------------------------------------------------------------------
def test_identity_verified_creator_without_licensing_remains_unknown():
    """Proves an identity-verified creator without licensing evidence remains UNKNOWN and cannot satisfy mandatory commercial rights."""
    async def run():
        c_id = "00000000-0000-0000-0000-000000000021"
        creator = _make_creator(c_id, "id_verified_no_license", is_verified=True)

        mock_creator_repo = MagicMock()
        mock_creator_repo.list_all = AsyncMock(return_value=[creator])
        mock_portfolio_repo = MagicMock()
        mock_portfolio_repo.list_public_by_creator = AsyncMock(return_value=[])

        service = MatchingService(creator_repo=mock_creator_repo, portfolio_repo=mock_portfolio_repo)
        criteria = MatchCriteria(brief_id="general", require_commercial_rights=True)
        results = await service.compute_matches_for_brief(criteria)
        res = results[0]

        # Must NOT clear commercial rights
        assert res.commercial_rights_cleared is False
        assert res.commercial_status == "UNKNOWN"
        # Score must be 35.0 baseline, not 95.0
        f4 = next(f for f in res.factors if f.factor_name == "Commercial-Use Fit & Licensing")
        assert f4.score == 35.0
        # Must NOT be labeled ELIGIBLE_MATCH
        assert res.eligibility_status == EligibilityStatus.POTENTIAL_MATCH_INFO_MISSING
        assert any("Commercial licensing unverified" in u for u in res.unknown_information)

    anyio.run(run)


def test_identity_verified_creator_with_personal_work_ineligible():
    """Proves an identity-verified creator with personal-use-only work does not receive commercial clearance and is NOT_ELIGIBLE."""
    async def run():
        c_id = "00000000-0000-0000-0000-000000000022"
        creator = _make_creator(c_id, "id_verified_personal_only", is_verified=True)
        proj = _make_portfolio_project(
            "10000000-0000-0000-0000-000000000022",
            c_id,
            "Personal Non-Commercial Fan Art",
            commercial_status=CommercialUseStatus.PERSONAL_PROJECT,
            is_verified=True,
        )

        mock_creator_repo = MagicMock()
        mock_creator_repo.list_all = AsyncMock(return_value=[creator])
        mock_portfolio_repo = MagicMock()
        mock_portfolio_repo.list_public_by_creator = AsyncMock(return_value=[proj])

        service = MatchingService(creator_repo=mock_creator_repo, portfolio_repo=mock_portfolio_repo)
        criteria = MatchCriteria(brief_id="general", require_commercial_rights=True)
        results = await service.compute_matches_for_brief(criteria)
        res = results[0]

        assert res.commercial_rights_cleared is False
        assert res.commercial_status == "PERSONAL_PROJECT"
        assert res.is_eligible is False
        assert res.eligibility_status == EligibilityStatus.NOT_ELIGIBLE
        f4 = next(f for f in res.factors if f.factor_name == "Commercial-Use Fit & Licensing")
        assert f4.score == 15.0

    anyio.run(run)


def test_unverified_commercial_claim_does_not_grant_clearance():
    """Proves an unverified COMMERCIAL_READY claim alone does not grant commercial rights clearance."""
    async def run():
        c_id = "00000000-0000-0000-0000-000000000023"
        creator = _make_creator(c_id, "unverified_commercial_claimant", is_verified=False)
        # Project has commercial status COMMERCIAL_READY, but is_verified is False
        proj = _make_portfolio_project(
            "10000000-0000-0000-0000-000000000023",
            c_id,
            "Self-Reported Commercial Clip",
            commercial_status=CommercialUseStatus.COMMERCIAL_READY,
            is_verified=False,
        )

        mock_creator_repo = MagicMock()
        mock_creator_repo.list_all = AsyncMock(return_value=[creator])
        mock_portfolio_repo = MagicMock()
        mock_portfolio_repo.list_public_by_creator = AsyncMock(return_value=[proj])

        service = MatchingService(creator_repo=mock_creator_repo, portfolio_repo=mock_portfolio_repo)
        criteria = MatchCriteria(brief_id="general", require_commercial_rights=True)
        results = await service.compute_matches_for_brief(criteria)
        res = results[0]

        assert res.commercial_rights_cleared is False
        assert res.commercial_status == "UNKNOWN"
        f4 = next(f for f in res.factors if f.factor_name == "Commercial-Use Fit & Licensing")
        assert f4.score == 35.0
        assert res.eligibility_status == EligibilityStatus.POTENTIAL_MATCH_INFO_MISSING
        assert any("Self-reported commercial readiness" in u for u in res.unknown_information)

    anyio.run(run)


def test_non_commercial_brief_permits_unknown_licensing():
    """Proves that a non-commercial brief permits an otherwise eligible creator without penalizing eligibility."""
    async def run():
        c_id = "00000000-0000-0000-0000-000000000024"
        creator = _make_creator(c_id, "creative_noncommercial_artist", tools=["Runway Gen-3"])
        proj = _make_portfolio_project(
            "10000000-0000-0000-0000-000000000024",
            c_id,
            "Artistic Visual Experiment",
            tools=["Runway Gen-3"],
            commercial_status=CommercialUseStatus.UNKNOWN,
            is_verified=False,
        )

        mock_creator_repo = MagicMock()
        mock_creator_repo.list_all = AsyncMock(return_value=[creator])
        mock_portfolio_repo = MagicMock()
        mock_portfolio_repo.list_public_by_creator = AsyncMock(return_value=[proj])

        service = MatchingService(creator_repo=mock_creator_repo, portfolio_repo=mock_portfolio_repo)
        criteria = MatchCriteria(
            brief_id="general",
            required_tools=["Runway Gen-3"],
            require_commercial_rights=False,  # Non-commercial brief
        )
        results = await service.compute_matches_for_brief(criteria)
        res = results[0]

        assert res.is_eligible is True
        assert res.eligibility_status == EligibilityStatus.ELIGIBLE_MATCH

    anyio.run(run)

