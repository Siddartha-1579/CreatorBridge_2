"""Security suite tests for Turnstile verification, rate limiting, RLS principles, and SQL injection defense."""

import pytest
from starlette.testclient import TestClient
from app.core.rate_limit import RateLimiter
from app.services.turnstile_service import TurnstileService
from app.services.audit_service import audit_service
from app.core.errors import ValidationException


def test_security_headers_present(client: TestClient):
    """Verifies critical HTTP security headers are injected on all responses."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "geolocation=()" in response.headers.get("permissions-policy", "")


@pytest.mark.anyio
async def test_turnstile_test_token_verification():
    """Verifies Turnstile service accepts Cloudflare test tokens in debug mode."""
    svc = TurnstileService()
    # Test token should verify successfully in debug mode
    verified = await svc.verify_token("test-turnstile-token")
    assert verified is True

    # Empty token must fail
    with pytest.raises(ValidationException):
        await svc.verify_token("")

    # Mock fail token must fail
    with pytest.raises(ValidationException):
        await svc.verify_token("mock-fail")


def test_rate_limiter_enforcement(client: TestClient):
    """Verifies in-memory rate limiter returns 429 when threshold exceeded."""
    # Register/login endpoint has 10 req/min limit
    client_ip = "192.0.2.42"
    headers = {"CF-Connecting-IP": client_ip}

    # Hit 10 times - all should succeed or return valid status (not 429)
    for _ in range(10):
        res = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "ratelimit_test@example.com", "turnstile_token": "test-turnstile-token"},
            headers=headers,
        )
        assert res.status_code == 200

    # 11th request must trigger 429
    res_exceeded = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "ratelimit_test@example.com", "turnstile_token": "test-turnstile-token"},
        headers=headers,
    )
    assert res_exceeded.status_code == 429
    assert res_exceeded.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    assert "retry_after_seconds" in res_exceeded.json()["error"]["details"]


def test_anti_enumeration_password_reset(client: TestClient):
    """Verifies password reset returns identical success response for real and nonexistent emails."""
    headers = {"CF-Connecting-IP": "198.51.100.1"}

    # Existing user email
    res1 = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "registered_user@example.com", "turnstile_token": "test-turnstile-token"},
        headers=headers,
    )
    assert res1.status_code == 200

    # Completely non-existent email
    res2 = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "completely_unknown_9872@example.com", "turnstile_token": "test-turnstile-token"},
        headers=headers,
    )
    assert res2.status_code == 200

    # Responses must be identical to prevent enumeration
    assert res1.json()["data"]["message"] == res2.json()["data"]["message"]


def test_prevent_admin_self_registration(client: TestClient):
    """Verifies callers cannot self-register as ADMIN."""
    headers = {"CF-Connecting-IP": "203.0.113.50"}
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "hacker@example.com",
            "password": "Password123!",
            "full_name": "Bad Actor",
            "role": "ADMIN",
            "turnstile_token": "test-turnstile-token",
        },
        headers=headers,
    )
    assert res.status_code == 422 or res.status_code == 400
    assert "ADMIN" in res.text or "Admin" in res.text


def test_search_input_sanitization_and_sql_injection(client: TestClient):
    """Verifies malicious SQL strings and null bytes in search queries do not crash or execute."""
    headers = {"CF-Connecting-IP": "203.0.113.60"}

    # SQL injection attempt string
    sql_payload = "'; DROP TABLE users; --"
    res = client.post(
        "/api/v1/search/creators",
        json={"query": sql_payload, "tools": []},
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["success"] is True

    # Null byte attack string should be stripped cleanly or rejected
    res_null = client.post(
        "/api/v1/search/creators",
        json={"query": "test\x00malicious", "tools": []},
        headers=headers,
    )
    assert res_null.status_code == 200


def test_audit_log_redacts_passwords():
    """Verifies audit service redacts sensitive fields like passwords and tokens."""
    raw_meta = {
        "email": "test@domain.com",
        "password": "SuperSecretPassword123!",
        "access_token": "secret-jwt-token",
        "turnstile_secret": "secret-key",
        "safe_field": "valid_value",
    }
    sanitized = audit_service._sanitize_metadata(raw_meta)
    assert sanitized["password"] == "[REDACTED]"
    assert sanitized["access_token"] == "[REDACTED]"
    assert sanitized["turnstile_secret"] == "[REDACTED]"
    assert sanitized["safe_field"] == "valid_value"
    assert sanitized["email"] == "test@domain.com"
