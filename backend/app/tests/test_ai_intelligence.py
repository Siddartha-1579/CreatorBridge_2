"""Comprehensive tests for Phase 2: AI Question Generation, Intelligence Engine & Description Refinement."""

import pytest
from unittest.mock import patch, AsyncMock
from starlette.testclient import TestClient
from app.services.ai_intelligence_service import ai_intelligence_service
from app.services.deterministic_intelligence import deterministic_intelligence
from app.schemas.ai_intelligence import (
    SurveyIntelligenceRequest,
    ProfileImprovementRequest,
    BriefClarificationRequest,
    CompletionStatus,
    IssueSeverity,
    QuestionPriority,
)


def get_auth_headers(user_id: str = "creator-test-01", role: str = "CREATOR") -> dict:
    return {
        "Authorization": f"Bearer dev-{user_id}",
        "X-User-Id": user_id,
        "X-User-Role": role,
    }


# ------------------------------------------------------------------------------
# 1. DETERMINISTIC INTELLIGENCE & CONTRADICTION TESTS
# ------------------------------------------------------------------------------

def test_creator_deterministic_missing_fields_and_completion():
    """Verifies that missing core fields are caught deterministically and completion status is accurate."""
    # Completely empty answers
    status, pct, missing, contradictions, ambiguities, fallback_q = (
        deterministic_intelligence.analyze_creator_survey(
            answers={},
            questions_already_asked=[],
            max_questions=3,
        )
    )
    assert status == CompletionStatus.INCOMPLETE
    assert pct == 0
    assert len(missing) >= 5
    assert any(m.field_id == "cr_display_name" for m in missing)
    assert any(m.field_id == "cr_headline" for m in missing)
    assert len(fallback_q) <= 3


def test_creator_deterministic_contradictions_and_ambiguities():
    """Verifies detection of contradictions (e.g. video specialization without tools, negative rate)."""
    answers = {
        "cr_display_name": "Maya Lin",
        "cr_headline": "asdf",  # Ambiguity: placeholder text
        "cr_bio": "I do AI.",  # Ambiguity: too short
        "cr_country": "Canada",
        "cr_specializations": ["AI Video Production"],
        "cr_tools_catalog": [{"tool_name": "Photoshop", "experience_level": "advanced"}],  # No video tool!
        "cr_weekly_capacity_hours": 0,  # Contradiction: 0 hours
        "cr_minimum_hourly_rate": -50,  # Contradiction: negative rate
    }

    status, pct, missing, contradictions, ambiguities, fallback_q = (
        deterministic_intelligence.analyze_creator_survey(
            answers=answers,
            questions_already_asked=[],
            max_questions=3,
        )
    )

    # Must detect negative rate and zero capacity
    assert any("Zero Capacity" in c.title for c in contradictions)
    assert any("Negative Compensation" in c.title for c in contradictions)
    assert any("Specialization / Toolset Discrepancy" in c.title for c in contradictions)

    # Must detect headline and bio ambiguities
    assert any(a.field_id == "cr_headline" for a in ambiguities)
    assert any(a.field_id == "cr_bio" for a in ambiguities)


def test_brand_deterministic_timeline_and_budget_contradictions():
    """Verifies detection of inverted timeline dates and negative budgets in brand briefs."""
    answers = {
        "br_organization_name": "Acme Brand",
        "br_primary_objective": "Product launch",
        "br_target_audience": "Tech enthusiasts",
        "start_date": "2026-12-01T00:00:00Z",
        "deadline": "2026-10-01T00:00:00Z",  # Inverted: deadline is before start date!
        "budget_cents": -5000,  # Negative budget
        "deliverables": [{"content_type": "Video", "quantity": 0}],  # 0 quantity
    }

    status, pct, missing, contradictions, ambiguities, fallback_q = (
        deterministic_intelligence.analyze_brand_survey_or_brief(
            answers=answers,
            questions_already_asked=[],
            max_questions=3,
        )
    )

    assert any("Inverted Campaign Timeline" in c.title for c in contradictions)
    assert any("Zero or Negative Campaign Budget" in c.title for c in contradictions)
    assert any("Invalid Quantity" in c.title for c in contradictions)
    assert status == CompletionStatus.INCOMPLETE


# ------------------------------------------------------------------------------
# 2. QUESTION GENERATION ENGINE & SCHEMA VALIDATION TESTS
# ------------------------------------------------------------------------------

@pytest.mark.anyio
async def test_question_generation_engine_deduplication():
    """Verifies that questions already asked are never duplicated."""
    request = SurveyIntelligenceRequest(
        survey_type="creator",
        current_answers={"cr_specializations": ["AI Video"]},
        questions_already_asked=["ai_q_video_formats"],
        max_questions=3,
    )
    res = await ai_intelligence_service.evaluate_survey(request)
    assert all(q.id != "ai_q_video_formats" for q in res.questions)
    assert len(res.questions) <= 3


@pytest.mark.anyio
async def test_question_generation_engine_malformed_json_fallback():
    """Verifies that malformed JSON from an LLM does not crash the system and uses fallback."""
    with patch.object(ai_intelligence_service, "is_provider_configured", return_value=True):
        with patch.object(ai_intelligence_service, "_call_openai_chat", AsyncMock(return_value=("NOT VALID JSON {{{{", 10))):
            request = SurveyIntelligenceRequest(
                survey_type="creator",
                current_answers={"cr_display_name": "Test Creator"},
                questions_already_asked=[],
                max_questions=3,
            )
            res = await ai_intelligence_service.evaluate_survey(request)
            assert res.fallback_mode is True
            assert res.is_ai_powered is False
            assert len(res.questions) > 0


@pytest.mark.anyio
async def test_question_generation_engine_provider_timeout():
    """Verifies that network timeouts fall back safely without breaking survey flow."""
    with patch.object(ai_intelligence_service, "is_provider_configured", return_value=True):
        with patch.object(ai_intelligence_service, "_call_openai_chat", AsyncMock(side_effect=TimeoutError("Request timed out"))):
            request = SurveyIntelligenceRequest(
                survey_type="brand",
                current_answers={"br_organization_name": "Nike"},
                questions_already_asked=[],
                max_questions=2,
            )
            res = await ai_intelligence_service.evaluate_survey(request)
            assert res.fallback_mode is True
            assert "temporarily unavailable" in res.reasoning_summary.lower()


# ------------------------------------------------------------------------------
# 3. PROFILE DESCRIPTION IMPROVEMENT TESTS (FACTUAL PRESERVATION)
# ------------------------------------------------------------------------------

@pytest.mark.anyio
async def test_profile_improvement_preserves_facts():
    """Verifies that profile improvement retains user facts and identifies missing suggestions."""
    req = ProfileImprovementRequest(
        original_headline="AI Video Editor",
        original_bio="I make prompt commercials with Runway Gen-3 and Midjourney.",
        skills=["Runway Motion", "Midjourney Keyframing"],
        specializations=["Commercial Video"],
        ai_tools=["Runway Gen-3", "Midjourney"],
    )

    res = await ai_intelligence_service.improve_creator_profile(req)
    assert len(res.improved_bio) >= len(req.original_bio)
    assert res.original_bio == req.original_bio
    assert len(res.missing_info_suggestions) >= 1
    # Check that skills were preserved in facts list
    assert any("Runway" in f for f in res.preserved_facts)


# ------------------------------------------------------------------------------
# 4. BRAND BRIEF CLARIFICATION TESTS (NO AUTO-PUBLISH)
# ------------------------------------------------------------------------------

@pytest.mark.anyio
async def test_brand_brief_clarification_no_auto_publish():
    """Verifies that brief clarification returns suggestions without modifying publication status."""
    draft = {
        "title": "Neon Energy Drink Spec Commercial",
        "campaign_idea": "Fast-paced sci-fi commercial",
        "status": "DRAFT",
        "deliverables": [{"content_type": "video", "quantity": 2, "aspect_ratio": "9:16"}],
        "budget_cents": 250000,
    }

    req = BriefClarificationRequest(brief_draft=draft)
    res = await ai_intelligence_service.clarify_brand_brief(req)
    assert "status" not in res.suggested_refinements or res.suggested_refinements.get("status") != "PUBLISHED"
    assert len(res.clarification_questions) <= 3


# ------------------------------------------------------------------------------
# 5. ENDPOINT INTEGRATION & RBAC TESTS
# ------------------------------------------------------------------------------

def test_survey_evaluate_endpoint(client: TestClient):
    """Verifies POST /api/v1/ai/survey/evaluate runs end-to-end."""
    payload = {
        "survey_type": "creator",
        "current_answers": {
            "cr_display_name": "Elena Rostova",
            "cr_specializations": ["Photorealistic Video"],
        },
        "questions_already_asked": [],
        "max_questions": 3,
    }
    resp = client.post("/api/v1/ai/survey/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "completion_status" in data
    assert "missing_fields" in data
    assert "questions" in data
    assert len(data["questions"]) <= 3


def test_profile_improve_rbac(client: TestClient):
    """Verifies that only creators can access profile improvement endpoint."""
    # Brand role tries to access creator improvement
    brand_headers = get_auth_headers("brand-user-99", "BRAND")
    payload = {
        "original_bio": "This is a bio to improve.",
        "skills": ["Prompting"],
        "specializations": ["Video"],
        "ai_tools": ["Runway"],
    }
    resp = client.post("/api/v1/ai/creator/improve-profile", json=payload, headers=brand_headers)
    assert resp.status_code == 403

    # Creator role succeeds
    creator_headers = get_auth_headers("creator-user-01", "CREATOR")
    resp_ok = client.post("/api/v1/ai/creator/improve-profile", json=payload, headers=creator_headers)
    assert resp_ok.status_code == 200
    assert "improved_bio" in resp_ok.json()["data"]


def test_brief_clarify_rbac(client: TestClient):
    """Verifies that only brands/agencies can access brief clarification endpoint."""
    # Creator role tries to access brand clarification
    creator_headers = get_auth_headers("creator-user-01", "CREATOR")
    payload = {
        "brief_draft": {"title": "Campaign Test", "deliverables": []}
    }
    resp = client.post("/api/v1/ai/brand/clarify-brief", json=payload, headers=creator_headers)
    assert resp.status_code == 403

    # Brand role succeeds
    brand_headers = get_auth_headers("brand-user-99", "BRAND")
    resp_ok = client.post("/api/v1/ai/brand/clarify-brief", json=payload, headers=brand_headers)
    assert resp_ok.status_code == 200
    assert "clarification_questions" in resp_ok.json()["data"]


def test_ai_usage_status_endpoint(client: TestClient):
    """Verifies GET /api/v1/ai/usage-status returns usage tracking and configuration metadata."""
    headers = get_auth_headers("any-user", "CREATOR")
    resp = client.get("/api/v1/ai/usage-status", headers=headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "provider" in data
    assert "model" in data
    assert "is_configured" in data
    assert "max_questions_limit" in data
    assert "total_requests_tracked" in data
