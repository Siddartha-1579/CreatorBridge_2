"""Health endpoint test."""


def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "environment" in data


def test_readiness_check(client):
    response = client.get("/api/v1/health/readiness")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    report = data["data"]
    assert report["total_integrations"] == 9
    assert len(report["integrations"]) == 9
    
    ids = [item["id"] for item in report["integrations"]]
    expected_ids = [
        "supabase",
        "core_ai",
        "turnstile",
        "image_generation",
        "video_generation",
        "voiceover",
        "transcription",
        "email",
        "payments",
    ]
    for expected_id in expected_ids:
        assert expected_id in ids

    # Security check: verify no unmasked long keys leak
    for item in report["integrations"]:
        masked = item.get("masked_key")
        if masked and masked != "mock-development-key":
            assert "..." in masked or masked == "***"
            assert len(masked) <= 12


def test_readiness_report_frontend_contract(client):
    """
    Verifies that the backend /health/readiness response contract directly satisfies
    the frontend SystemReadinessReport and IntegrationDetail interfaces.
    """
    response = client.get("/api/v1/health/readiness")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    report = data["data"]

    # Contract validation required by frontend isValidReadinessReport
    assert isinstance(report["system_status"], str)
    assert isinstance(report["total_integrations"], int)
    assert isinstance(report["configured_count"], int)
    assert isinstance(report["mock_count"], int)
    assert isinstance(report["missing_count"], int)
    assert isinstance(report["integrations"], list)
    assert report["total_integrations"] == 9
    assert len(report["integrations"]) == 9

    for item in report["integrations"]:
        assert isinstance(item["id"], str)
        assert isinstance(item["name"], str)
        assert isinstance(item["category"], str)
        assert isinstance(item["status"], str)
        assert isinstance(item["is_ready"], bool)
        assert isinstance(item["requires_action"], bool)
        assert isinstance(item["env_keys_checked"], list)
        assert isinstance(item["guidance"], str)
