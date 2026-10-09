"""Unit tests for the 7-Factor Central Intelligent Creator Matching Engine."""

import pytest
import anyio
from app.services.matching_service import MatchingService
from app.schemas.match import MatchCriteria, MatchEngineWeights


def test_matching_engine_weights_sum_to_one():
    """Verifies that all 7 matching engine weights sum exactly to 100% (1.0)."""
    weights = MatchEngineWeights()
    total = (
        weights.skills_and_portfolio
        + weights.niche_and_category
        + weights.format_and_platform
        + weights.target_audience
        + weights.budget_compatibility
        + weights.timeline_and_availability
        + weights.preferences_and_values
    )
    assert abs(total - 1.0) < 1e-6
    assert weights.skills_and_portfolio == 0.30
    assert weights.niche_and_category == 0.20
    assert weights.format_and_platform == 0.15
    assert weights.target_audience == 0.10
    assert weights.budget_compatibility == 0.10
    assert weights.timeline_and_availability == 0.10
    assert weights.preferences_and_values == 0.05


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

        # Verify descending sort order
        scores = [r.overall_match_score for r in results]
        assert scores == sorted(scores, reverse=True)

        # Check top candidate breakdown
        top = results[0]
        assert 0.0 <= top.overall_match_score <= 100.0
        assert len(top.factors) == 7

        # Verify all 7 factor names exist
        factor_names = [f.factor_name for f in top.factors]
        assert "Skills & Portfolio Match" in factor_names
        assert "Niche & Category Relevance" in factor_names
        assert "Format & Platform Expertise" in factor_names
        assert "Target Audience Alignment" in factor_names
        assert "Budget Compatibility" in factor_names
        assert "Timeline & Availability" in factor_names
        assert "Preferences & Creative Values" in factor_names

        # Verify human-readable summary explanation
        assert len(top.summary_explanation) > 10

    anyio.run(run)


def test_creator_recommendations_workflow():
    """Tests that creator recommendations return ranked opportunities."""
    async def run():
        service = MatchingService()
        recs = await service.get_recommended_briefs_for_creator("test-user-id")
        assert len(recs) > 0
        first_rec = recs[0]
        assert first_rec.overall_match_score > 0
        assert len(first_rec.brief_title) > 0
        assert len(first_rec.factors) > 0

    anyio.run(run)
