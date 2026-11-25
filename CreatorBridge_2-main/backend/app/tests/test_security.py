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
    assert sanitized["email"] == "test@domain.com"


def test_cors_preflight_login_allowed(client: TestClient):
    """Verifies OPTIONS preflight request to /api/v1/auth/login succeeds for Vercel and local origins."""
    # 1. Test production Vercel frontend origin
    headers_vercel = {
        "Origin": "https://creatorbridge2.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
    }
    res_vercel = client.options("/api/v1/auth/login", headers=headers_vercel)
    assert res_vercel.status_code == 200
    assert res_vercel.headers.get("access-control-allow-origin") == "https://creatorbridge2.vercel.app"
    assert "POST" in res_vercel.headers.get("access-control-allow-methods", "")
    assert res_vercel.headers.get("access-control-allow-credentials") == "true"
    allow_headers = res_vercel.headers.get("access-control-allow-headers", "").lower()
    assert "authorization" in allow_headers
    assert "content-type" in allow_headers

    # 2. Test local dev origin
    headers_local = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
    }
    res_local = client.options("/api/v1/auth/login", headers=headers_local)
    assert res_local.status_code == 200
    assert res_local.headers.get("access-control-allow-origin") == "http://localhost:5173"

    # 3. Test disallowed origin
    headers_disallowed = {
        "Origin": "https://malicious-origin.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
    }
    res_disallowed = client.options("/api/v1/auth/login", headers=headers_disallowed)
    assert res_disallowed.status_code == 400
    assert "access-control-allow-origin" not in res_disallowed.headers


def test_brand_judge_login_authoritative_role_and_redirect(client: TestClient):
    """Verifies Lumina Skincare returns authoritative BRAND role and /brand/dashboard redirect."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "lumina@demo.creatorbridge.com", "password": "demo123456"},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["user"]["role"] == "BRAND"
    assert data["redirect_path"] == "/brand/dashboard"
    assert data["redirectPath"] == "/brand/dashboard"
    assert data["access_token"]
    assert data["accessToken"]
    assert data["user"]["fullName"] == "Lumina Skincare"


def test_creator_judge_login_authoritative_role_and_redirect(client: TestClient):
    """Verifies Elena Rostova returns authoritative CREATOR role and /creator/dashboard redirect."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "elena@demo.creatorbridge.com", "password": "demo123456"},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["user"]["role"] == "CREATOR"
    assert data["redirect_path"] == "/creator/dashboard"
    assert data["redirectPath"] == "/creator/dashboard"
    assert data["access_token"]
    assert data["accessToken"]
    assert data["user"]["fullName"] == "Elena Rostova"


def test_portal_mismatch_rejection(client: TestClient):
    """Verifies portal parameter rejects mismatched role logins with clear guidance."""
    # Creator attempting login on brand portal
    res_creator_on_brand = client.post(
        "/api/v1/auth/login",
        json={"email": "elena@demo.creatorbridge.com", "password": "demo123456", "portal": "brand"},
    )
    assert res_creator_on_brand.status_code == 422
    assert "Creator Portal" in res_creator_on_brand.json()["error"]["message"]

    # Brand attempting login on creator portal
    res_brand_on_creator = client.post(
        "/api/v1/auth/login",
        json={"email": "lumina@demo.creatorbridge.com", "password": "demo123456", "portal": "creator"},
    )
    assert res_brand_on_creator.status_code == 422
    assert "Brand Portal" in res_brand_on_creator.json()["error"]["message"]


def test_authenticated_me_endpoint_returns_normalized_profile(client: TestClient):
    """Verifies /auth/me returns authoritative profile with role and computed fullName."""
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "lumina@demo.creatorbridge.com", "password": "demo123456"},
    )
    token = login_res.json()["data"]["access_token"]

    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()["data"]
    assert me_data["role"] == "BRAND"
    assert me_data["email"] == "lumina@demo.creatorbridge.com"



def test_published_campaign_brief_publicly_viewable_without_token(client: TestClient):
    """Verifies published campaign brief is accessible to anonymous users without 401."""
    brief_id = "00000000-0000-0000-0000-000000000004"
    res = client.get(f"/api/v1/briefs/{brief_id}")
    assert res.status_code == 200
    data = res.json()["data"]
    assert str(data["id"]) == brief_id
    assert data["title"]


def test_published_campaign_brief_viewable_with_expired_or_invalid_token(client: TestClient):
    """Verifies that sending an expired or invalid token to public brief does not trigger 401."""
    brief_id = "00000000-0000-0000-0000-000000000004"
    res = client.get(
        f"/api/v1/briefs/{brief_id}",
        headers={"Authorization": "Bearer expired-or-invalid-token-value"}
    )
    assert res.status_code == 200
    assert str(res.json()["data"]["id"]) == brief_id


def test_nonexistent_campaign_returns_404_not_401(client: TestClient):
    """Verifies a missing campaign returns genuine 404, not an authentication error."""
    missing_id = "00000000-0000-0000-0000-999999999999"
    res = client.get(f"/api/v1/briefs/{missing_id}")
    assert res.status_code == 404
    err = res.json()["error"]
    assert err["code"] == "NOT_FOUND"
    assert "not found" in err["message"].lower()


def test_logout_succeeds_even_with_expired_token(client: TestClient):
    """Verifies /auth/logout handles invalid or expired token gracefully without 401."""
    res = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": "Bearer expired-token-123"}
    )
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "logged_out"


def test_protected_endpoint_rejects_missing_and_invalid_token_with_401(client: TestClient):
    """Verifies strictly protected endpoints require a valid token and return 401."""
    # 1. Missing Authorization header
    res_missing = client.get("/api/v1/auth/me")
    assert res_missing.status_code == 401
    assert res_missing.json()["error"]["code"] == "UNAUTHORIZED"

    # 2. Invalid / expired Bearer token
    res_invalid = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer totally-invalid-token"}
    )
    assert res_invalid.status_code == 401
    assert res_invalid.json()["error"]["code"] == "UNAUTHORIZED"


def test_role_mismatch_returns_403_not_401(client: TestClient):
    """Verifies valid token accessing prohibited role endpoint returns 403 Forbidden, not 401."""
    # Elena is a CREATOR
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "elena@demo.creatorbridge.com", "password": "demo123456"},
    )
    creator_token = login_res.json()["data"]["access_token"]

    # Try to access a BRAND-only endpoint: POST /api/v1/briefs
    res = client.post(
        "/api/v1/briefs",
        json={
            "title": "Hacked Brand Brief",
            "campaign_idea": "Malicious attempt",
            "primary_objective": "Test",
            "target_audience": "None",
            "budget_cents": 100000,
        },
        headers={"Authorization": f"Bearer {creator_token}"},
    )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"
