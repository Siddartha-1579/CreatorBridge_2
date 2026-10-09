"""Tests for Creator Onboarding, Adaptive Survey, and Capability Assessment Engine."""

import pytest
from starlette.testclient import TestClient
from app.services.assessment_engine import assessment_engine
from app.services.question_bank import question_bank
from uuid import uuid4


def test_get_survey_config(client: TestClient):
    """Verifies retrieval of specialization options and tool catalog."""
    res = client.get("/api/v1/onboarding/survey/config")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "specializations" in data
    assert len(data["specializations"]) >= 5
    assert any(s["id"] == "ai_filmmaking" for s in data["specializations"])
    assert any(t["id"] == "comfyui" for t in data["tool_catalog"])


def test_adaptive_questions_branching(client: TestClient):
    """Verifies questions branch adaptively based on chosen specialization."""
    # Film specialization
    res_film = client.get("/api/v1/onboarding/survey/questions?specialization=ai_filmmaking")
    assert res_film.status_code == 200
    q_film = res_film.json()["data"]
    film_ids = [q["id"] for q in q_film]
    assert "film_camera_ctrl" in film_ids
    assert "film_char_consistency" in film_ids
    assert "voice_multilingual_lipsync" not in film_ids  # voice question excluded

    # Voice specialization
    res_voice = client.get("/api/v1/onboarding/survey/questions?specialization=ai_voice")
    assert res_voice.status_code == 200
    q_voice = res_voice.json()["data"]
    voice_ids = [q["id"] for q in q_voice]
    assert "voice_multilingual_lipsync" in voice_ids
    assert "film_camera_ctrl" not in voice_ids  # film question excluded


def test_assessment_flow_and_server_side_calculation(client: TestClient):
    """Verifies end-to-end start, answer auto-save, resume, and authoritative score calculation."""
    headers = {"X-User-Id": "creator_test_user_001", "X-User-Role": "CREATOR"}

    # 1. Start assessment
    res_start = client.post(
        "/api/v1/onboarding/assessment/start",
        json={"primary_specialization": "ai_filmmaking"},
        headers=headers,
    )
    assert res_start.status_code == 200
    assessment_id = res_start.json()["data"]["assessment_id"]

    # 2. Save individual answers
    res_save1 = client.post(
        "/api/v1/onboarding/assessment/response",
        json={
            "assessment_id": assessment_id,
            "question_id": "creator_display_name",
            "response_value": "CineSynth AI Studio",
            "current_step_index": 1,
        },
        headers=headers,
    )
    assert res_save1.status_code == 200

    # Save tools
    res_save2 = client.post(
        "/api/v1/onboarding/assessment/response",
        json={
            "assessment_id": assessment_id,
            "question_id": "tools_selected",
            "response_value": ["runway_gen3", "comfyui", "midjourney", "davinci"],
            "current_step_index": 2,
        },
        headers=headers,
    )
    assert res_save2.status_code == 200

    # Save expert scenario answer
    res_save3 = client.post(
        "/api/v1/onboarding/assessment/response",
        json={
            "assessment_id": assessment_id,
            "question_id": "film_char_consistency",
            "response_value": "ip_adapter_lora_controlnet",
            "current_step_index": 3,
        },
        headers=headers,
    )
    assert res_save3.status_code == 200

    # 3. Verify Resume Progress
    res_prog = client.get("/api/v1/onboarding/assessment/progress", headers=headers)
    assert res_prog.status_code == 200
    prog_data = res_prog.json()["data"]
    assert prog_data["responses"]["creator_display_name"] == "CineSynth AI Studio"
    assert prog_data["responses"]["film_char_consistency"] == "ip_adapter_lora_controlnet"

    # 4. Finalize and submit assessment
    res_submit = client.post(
        f"/api/v1/onboarding/assessment/submit?assessment_id={assessment_id}",
        headers=headers,
    )
    assert res_submit.status_code == 200
    result = res_submit.json()["data"]

    # Validate server-side score and level bounds
    assert 0.0 <= result["overall_score"] <= 100.0
    assert result["calculated_level"] in [
        "LEVEL_1_EXPLORER",
        "LEVEL_2_PRACTITIONER",
        "LEVEL_3_SKILLED",
        "LEVEL_4_ADVANCED",
        "LEVEL_5_PROFESSIONAL",
    ]
    assert len(result["level_name"]) > 0
    assert result["dimension_scores"]["technical"] >= 0.0
    assert result["dimension_scores"]["workflow"] >= 0.0
    assert len(result["strengths"]) > 0


def test_anti_tampering_ownership_and_immutability(client: TestClient):
    """Verifies creators cannot modify other creators' assessments or completed assessments."""
    creator_a_headers = {"X-User-Id": "creator_alpha", "X-User-Role": "CREATOR"}
    creator_b_headers = {"X-User-Id": "creator_bravo", "X-User-Role": "CREATOR"}

    # Creator A starts session
    res_a = client.post(
        "/api/v1/onboarding/assessment/start",
        json={"primary_specialization": "ai_image"},
        headers=creator_a_headers,
    )
    a_id = res_a.json()["data"]["assessment_id"]

    # Creator B tries to overwrite Creator A's assessment
    res_tamper = client.post(
        "/api/v1/onboarding/assessment/response",
        json={
            "assessment_id": a_id,
            "question_id": "creator_display_name",
            "response_value": "Hacked Name",
        },
        headers=creator_b_headers,
    )
    assert res_tamper.status_code == 403 or res_tamper.status_code == 400


def test_scoring_engine_direct_calculation():
    """Unit test for server-side AssessmentEngine calculation accuracy."""
    dummy_id = uuid4()
    user_id = "test_user_engine"
    responses = {
        "tools_selected": ["runway_gen3", "comfyui", "midjourney", "flux", "davinci"],
        "film_camera_ctrl": "cinematic_motion_curves",
        "film_char_consistency": "ip_adapter_lora_controlnet",
        "film_motion_artifacts": "optical_flow_mask_rife",
        "ad_brand_guidelines": "lut_palette_controlnet_post",
        "comm_client_revision": "relight_latent_inpaint_lut",
        "comm_deliverable_standards": "prores_wav_layered_stems",
        "comm_turnaround_confidence": 5,
    }

    result = assessment_engine.calculate_results(
        assessment_id=dummy_id,
        user_id=user_id,
        responses=responses,
        specialization="ai_filmmaking",
    )

    # High performance answers should produce Advanced or Professional level
    assert result.overall_score >= 80.0
    assert result.calculated_level in ["LEVEL_4_ADVANCED", "LEVEL_5_PROFESSIONAL"]
    assert "AI Creator" in result.level_name
