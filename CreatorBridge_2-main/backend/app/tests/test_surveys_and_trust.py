"""Comprehensive unit and integration test suite for Adaptive Surveys & Transparent Trust Engine."""

import pytest
from datetime import datetime, timezone, timedelta
from app.services.trust_engine import (
    compute_trust_score,
    calculate_incident_penalty,
    calculate_recovery_points,
    validate_non_discriminatory,
)
from app.schemas.trust import IncidentSeverity, IncidentCategory, IncidentStatus
from app.core.errors import ValidationException


def test_creator_survey_schema_nine_sections(client):
    """Verifies that the Creator Survey schema declares all 9 required sections."""
    response = client.get("/api/v1/surveys/creator/schema")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    schema = data["data"]
    assert schema["survey_type"] == "CREATOR"
    assert len(schema["sections"]) == 9

    expected_keys = [
        "identity",
        "specializations",
        "skills",
        "tools",
        "platforms",
        "portfolio",
        "pricing",
        "availability",
        "conduct",
    ]
    actual_keys = [s["key"] for s in schema["sections"]]
    assert actual_keys == expected_keys


def test_brand_survey_schema_seven_sections(client):
    """Verifies that the Brand Survey schema declares all 7 required sections."""
    response = client.get("/api/v1/surveys/brand/schema")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    schema = data["data"]
    assert schema["survey_type"] == "BRAND"
    assert len(schema["sections"]) == 7

    expected_keys = [
        "organization",
        "objectives",
        "requirements",
        "deliverables",
        "budget",
        "licensing",
        "trust",
    ]
    actual_keys = [s["key"] for s in schema["sections"]]
    assert actual_keys == expected_keys


def test_adaptive_branching_conditional_visibility(client):
    """Tests dynamic conditional questions appearing only when trigger conditions are met."""
    # 1. Without video specialization, video duration question is hidden
    res1 = client.post(
        "/api/v1/surveys/creator/evaluate-adaptive",
        json={"survey_type": "CREATOR", "current_answers": {"cr_specializations": ["ai_design"]}},
    )
    assert res1.status_code == 200
    visible_ids_1 = res1.json()["data"]["visible_question_ids"]
    assert "cr_video_duration_preference" not in visible_ids_1

    # 2. Selecting 'ai_video' specialization reveals video duration question
    res2 = client.post(
        "/api/v1/surveys/creator/evaluate-adaptive",
        json={"survey_type": "CREATOR", "current_answers": {"cr_specializations": ["ai_video"]}},
    )
    assert res2.status_code == 200
    visible_ids_2 = res2.json()["data"]["visible_question_ids"]
    assert "cr_video_duration_preference" in visible_ids_2


def test_trust_initial_score_and_label():
    """Verifies newly eligible accounts initialize at 100 with 'New — insufficient history'."""
    calc = compute_trust_score([])
    assert calc["score"] == 100
    assert calc["status_label"] == "New — insufficient history"
    assert calc["total_active_demerits"] == 0
    assert calc["eligible_recovery_points"] == 0


def test_severity_penalties_and_recurrence_multipliers():
    """Tests the mathematical calculation of severity, multipliers, and the 50 pt cap."""
    # Minor severity (5 points): 1st incident = 5, 2nd incident = 6, 3rd = 8
    b1, m1, p1 = calculate_incident_penalty(IncidentSeverity.MINOR, recurrence_count=1)
    assert b1 == 5 and m1 == 1.0 and p1 == 5

    b2, m2, p2 = calculate_incident_penalty(IncidentSeverity.MINOR, recurrence_count=2)
    assert b2 == 5 and m2 == 1.25 and p2 == 6

    # Moderate severity (15 points): 1st = 15, 2nd = 19, 3rd = 23
    _, _, p_mod1 = calculate_incident_penalty(IncidentSeverity.MODERATE, recurrence_count=1)
    assert p_mod1 == 15
    _, _, p_mod2 = calculate_incident_penalty(IncidentSeverity.MODERATE, recurrence_count=2)
    assert p_mod2 == 19

    # Critical severity (50 points): 50 * 1.5 = 75, but capped at 50
    _, m_crit, p_crit = calculate_incident_penalty(IncidentSeverity.CRITICAL, recurrence_count=3)
    assert m_crit == 1.50
    assert p_crit == 50  # Must be capped at 50


def test_trust_recovery_points_policy():
    """Tests recovery calculation: 5 pts per 90 clean days, max 15/yr, cannot exceed debt."""
    now = datetime.now(timezone.utc)

    # 45 days: 0 recovery points
    date_45d = now - timedelta(days=45)
    rec_45d = calculate_recovery_points(date_45d, active_demerits=30, reference_time=now)
    assert rec_45d == 0

    # 95 days: 5 recovery points
    date_95d = now - timedelta(days=95)
    rec_95d = calculate_recovery_points(date_95d, active_demerits=30, reference_time=now)
    assert rec_95d == 5

    # 190 days: 10 recovery points
    date_190d = now - timedelta(days=190)
    rec_190d = calculate_recovery_points(date_190d, active_demerits=30, reference_time=now)
    assert rec_190d == 10

    # 400 days: Capped at annual limit of 15
    date_400d = now - timedelta(days=400)
    rec_400d = calculate_recovery_points(date_400d, active_demerits=30, reference_time=now)
    assert rec_400d == 15

    # Debt cap: If active demerits is only 5, recovery cannot exceed 5
    rec_debt_capped = calculate_recovery_points(date_400d, active_demerits=5, reference_time=now)
    assert rec_debt_capped == 5


def test_overturned_appeal_reversal():
    """Verifies that an overturned incident restores the score deterministically."""
    incidents = [
        {
            "id": "inc-1",
            "incident_category": "MISREPRESENTATION",
            "severity": "MODERATE",
            "calculated_penalty": 15,
            "status": "ACTIVE",
            "confirmed_at": datetime.now(timezone.utc).isoformat(),
        }
    ]
    # Active: 100 - 15 = 85
    calc_active = compute_trust_score(incidents)
    assert calc_active["score"] == 85
    assert calc_active["total_active_demerits"] == 15

    # Overturned: 100 - 0 = 100
    incidents[0]["status"] = "OVERTURNED"
    calc_overturned = compute_trust_score(incidents)
    assert calc_overturned["score"] == 100
    assert calc_overturned["total_active_demerits"] == 0
    assert calc_overturned["overturned_incidents_count"] == 1


def test_prohibited_criteria_validation():
    """Verifies that discrimination or penalizing protected attributes is strictly blocked."""
    # Valid description
    validate_non_discriminatory("Creator failed to deliver agreed raw footage after receiving payment.")

    # Discriminatory description attempting to penalize religion
    with pytest.raises(ValidationException):
        validate_non_discriminatory("Reported because of their religion and church affiliation.")

    # Discriminatory description attempting to penalize nationality
    with pytest.raises(ValidationException):
        validate_non_discriminatory("Dispute due to their nationality and country of origin.")
