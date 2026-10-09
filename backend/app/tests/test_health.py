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

