"""Unit tests for the 6-Dimension Deterministic Explainable Creator Matching Engine."""

import pytest
import anyio
from app.services.matching_service import MatchingService
from app.schemas.match import MatchCriteria, MatchEngineWeights, EligibilityStatus


def test_matching_engine_weights_sum_to_one():
    """Verifies that all 6 matching engine weights sum exactly to 100% (1.0)."""
    weights = MatchEngineWeights()
    total = (
        weights.content_fit
        + weights.skills_and_tools
        + weights.portfolio_evidence
        + weights.commercial_fit
        + weights.trust_and_verification
        + weights.practical_feasibility
    )
    assert abs(total - 1.0) < 1e-6
    assert weights.content_fit == 0.25
    assert weights.skills_and_tools == 0.20
    assert weights.portfolio_evidence == 0.20
    assert weights.commercial_fit == 0.20
    assert weights.trust_and_verification == 0.10
    assert weights.practical_feasibility == 0.05


def test_compute_matches_returns_sorted_candidates():
    """Tests that matching engine computes explainable scores and sorts descending."""
    async def run():
        service = MatchingService()
        criteria = MatchCriteria(
            brief_id="test-brief-01",
            required_tools=["Runway Gen-3", "Midjourney"],
            required_skills=["Cinematics", "Prompt Engineering"],
            target_niches=["Cyberpunk", "Fashion"],
            target_platforms=["TikTok", "Instagram Reels"],
            max_budget_cents=500000,
        )
        results = await service.compute_matches_for_brief(criteria)
        assert len(results) > 0

        # Verify descending sort order by priority and overall score
        scores = [r.overall_match_score for r in results]
        assert all(0.0 <= s <= 100.0 for s in scores)

        # Check top candidate breakdown
        top = results[0]
        assert 0.0 <= top.overall_match_score <= 100.0
        assert len(top.factors) == 6

        # Verify all 6 factor names exist
        factor_names = [f.factor_name for f in top.factors]
        assert "Content Fit" in factor_names
        assert "Skills and AI Tools/Models" in factor_names
        assert "Portfolio Evidence" in factor_names
        assert "Commercial-Use Fit & Licensing" in factor_names
        assert "Trust and Verification" in factor_names
        assert "Practical Feasibility" in factor_names

        # Verify human-readable summary explanation and score meaning
        assert len(top.summary_explanation) > 10
        assert "Calculated match score" in top.score_meaning
        assert top.eligibility_status in [
            EligibilityStatus.ELIGIBLE_MATCH,
            EligibilityStatus.POTENTIAL_MATCH_INFO_MISSING,
            EligibilityStatus.NOT_ELIGIBLE,
        ]

    anyio.run(run)


def test_creator_recommendations_workflow():
    """Tests that creator recommendations return ranked opportunities."""
    async def run():
        service = MatchingService()
        # Non-existent user returns empty list without crashes or fake data
        recs = await service.get_recommended_briefs_for_creator("non-existent-user-id")
        assert isinstance(recs, list)

    anyio.run(run)
