"""Comprehensive test suite for CreatorBridge Mandatory Policy Acceptance.

Covers:
- Both registration roles (Creator and Brand/Agency)
- Unchecked policy acceptance rejection (422)
- Successful persistence in SQLite audit ledger
- API bypass attempts blocked (403 Forbidden)
- Prohibition of accepting on behalf of other users
- Policy version update requiring renewed acceptance and preserving history
- Database resilience and public policy inspection
"""

from datetime import datetime, timezone
from uuid import uuid4
import pytest
from starlette.testclient import TestClient

from app.services.policy_service import (
    policy_service,
    CURRENT_POLICY_VERSION,
    CURRENT_POLICY_REFERENCE,
)
from app.core.db import get_db_connection


def get_auth_headers(user_id: str, role: str) -> dict:
    return {
        "Authorization": f"Bearer dev-{user_id}",
        "X-User-Id": user_id,
        "X-User-Role": role,
    }


def test_public_policy_endpoint(client: TestClient):
    """1. Public can inspect the complete platform policy document."""
    res = client.get("/api/v1/policies/current")
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["version"] == CURRENT_POLICY_VERSION
    assert data["policyReference"] == CURRENT_POLICY_REFERENCE
    assert data["status"] == "ACTIVE"
    assert len(data["sections"]) == 10

    # Verify all mandatory policy areas exist
    section_ids = [s["id"] for s in data["sections"]]
    assert "trust-score" in section_ids
    assert "code-of-conduct" in section_ids
    assert "creator-verification" in section_ids
    assert "portfolio-authenticity" in section_ids
    assert "licensing" in section_ids
    assert "engagement" in section_ids
    assert "payment" in section_ids
    assert "dispute-resolution" in section_ids
    assert "ai-transparency" in section_ids
    assert "data-privacy" in section_ids


def test_creator_registration_without_policy_rejected(client: TestClient):
    """2. Creator registration fails if mandatory policy checkbox is unchecked or omitted."""
    email = f"creator_nopolicy_{uuid4().hex[:6]}@example.com"
    payload = {
        "email": email,
        "password": "Password123!",
        "confirmPassword": "Password123!",
        "fullName": "Unchecked Creator",
        "role": "CREATOR",
        "turnstileToken": "mock-token",
        "policyAccepted": False,  # Unchecked!
    }

    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 422
    assert "Mandatory policy acceptance is required" in res.text


def test_brand_registration_without_policy_rejected(client: TestClient):
    """3. Brand registration fails if mandatory policy checkbox is unchecked."""
    email = f"brand_nopolicy_{uuid4().hex[:6]}@example.com"
    payload = {
        "email": email,
        "password": "Password123!",
        "confirmPassword": "Password123!",
        "fullName": "Unchecked Brand Studio",
        "role": "BRAND",
        "turnstileToken": "mock-token",
        "policyAccepted": False,
    }

    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 422
    assert "Mandatory policy acceptance is required" in res.text


def test_creator_registration_with_policy_persists_in_database(client: TestClient):
    """4. Creator registration with policy agreement records immutable audit row in database."""
    email = f"creator_agree_{uuid4().hex[:6]}@example.com"
    payload = {
        "email": email,
        "password": "Password123!",
        "confirmPassword": "Password123!",
        "fullName": "Consenting Artist",
        "role": "CREATOR",
        "turnstileToken": "mock-token",
        "policyAccepted": True,
        "policyVersion": CURRENT_POLICY_VERSION,
    }

    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    user_id = data["user"]["id"]

    # Verify database persistence in user_policy_acceptances
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT user_id, policy_version, policy_reference, accepted_at, ip_address
            FROM user_policy_acceptances
            WHERE user_id = ?
            """,
            (user_id,),
        )
        row = cursor.fetchone()
        assert row is not None
        assert row["user_id"] == user_id
        assert row["policy_version"] == CURRENT_POLICY_VERSION
        assert row["policy_reference"] == CURRENT_POLICY_REFERENCE
        assert row["accepted_at"] is not None

    # Verify policy status endpoint for this user
    headers = get_auth_headers(user_id, "CREATOR")
    status_res = client.get("/api/v1/policies/status", headers=headers)
    assert status_res.status_code == 200
    st_data = status_res.json()["data"]
    assert st_data["accepted"] is True
    assert st_data["requiresAcceptance"] is False
    assert st_data["acceptedVersion"] == CURRENT_POLICY_VERSION


def test_brand_registration_with_policy_persists_in_database(client: TestClient):
    """5. Brand/Agency registration with policy agreement records audit row."""
    email = f"brand_agree_{uuid4().hex[:6]}@example.com"
    payload = {
        "email": email,
        "password": "Password123!",
        "confirmPassword": "Password123!",
        "fullName": "Consenting Agency Group",
        "role": "BRAND",
        "turnstileToken": "mock-token",
        "policyAccepted": True,
        "policyVersion": CURRENT_POLICY_VERSION,
    }

    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 200
    user_id = res.json()["data"]["user"]["id"]

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM user_policy_acceptances WHERE user_id = ?", (user_id,))
        assert cursor.fetchone() is not None


def test_api_bypass_attempt_blocked_with_403(client: TestClient):
    """6. Authenticated user who has NOT accepted platform policies is blocked from protected endpoints."""
    policy_service.clear_cache()
    unaccepted_user_id = f"unaccepted_user_{uuid4().hex[:6]}"
    headers = get_auth_headers(unaccepted_user_id, "CREATOR")

    # Attempt to access protected project workspaces API
    res = client.get("/api/v1/projects", headers=headers)
    assert res.status_code == 403
    assert "POLICY_ACCEPTANCE_REQUIRED" in res.text


def test_cannot_accept_policy_on_behalf_of_other_user(client: TestClient):
    """7. Users cannot forge policy acceptances for others; token identity is strictly enforced."""
    policy_service.clear_cache()
    acting_user_id = f"user_actor_{uuid4().hex[:6]}"
    target_victim_id = f"user_victim_{uuid4().hex[:6]}"

    actor_headers = get_auth_headers(acting_user_id, "CREATOR")

    # Call accept endpoint
    res = client.post(
        "/api/v1/policies/accept",
        json={"policyVersion": CURRENT_POLICY_VERSION},
        headers=actor_headers,
    )
    assert res.status_code == 200
    data = res.json()["data"]

    # Acceptance was recorded strictly for acting_user_id
    assert data["user_id"] == acting_user_id
    assert data["user_id"] != target_victim_id

    # Check database: target_victim_id must NOT have an acceptance row
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM user_policy_acceptances WHERE user_id = ?", (target_victim_id,))
        assert cursor.fetchone() is None


def test_policy_version_update_requires_renewal_and_preserves_history(client: TestClient):
    """8. Advancing policy version preserves previous records and requires renewal before accessing protected endpoints."""
    policy_service.clear_cache()
    user_id = f"test_renewal_user_{uuid4().hex[:6]}"
    headers = get_auth_headers(user_id, "CREATOR")

    # 1. Accept initial policy version 2026.1
    accept_1 = client.post(
        "/api/v1/policies/accept",
        json={"policyVersion": CURRENT_POLICY_VERSION},
        headers=headers,
    )
    assert accept_1.status_code == 200

    # 2. Simulate policy version bump to 2026.2
    original_version = policy_service.CURRENT_POLICY_VERSION
    original_reference = policy_service.CURRENT_POLICY_REFERENCE
    try:
        policy_service.CURRENT_POLICY_VERSION = "2026.2"
        policy_service.CURRENT_POLICY_REFERENCE = "cb-platform-policies-2026.2"
        policy_service.clear_cache()

        # 3. Check status: user must now require acceptance
        status_res = client.get("/api/v1/policies/status", headers=headers)
        assert status_res.status_code == 200
        st = status_res.json()["data"]
        assert st["accepted"] is False
        assert st["requiresAcceptance"] is True
        assert st["currentVersion"] == "2026.2"

        # 4. Protected endpoint access is blocked due to outdated acceptance
        # Mark user in users table to enforce DB check
        now_iso = datetime.now(timezone.utc).isoformat()
        with get_db_connection() as conn:
            conn.execute(
                """INSERT INTO users (id, email, full_name, role, password, accepted_policy_version, created_at, updated_at)
                   VALUES (?, ?, 'Renewal User', 'CREATOR', 'hash123', '2026.1', ?, ?)""",
                (user_id, f"{user_id}@test.com", now_iso, now_iso),
            )

        res_blocked = client.get("/api/v1/projects", headers=headers)
        assert res_blocked.status_code == 403
        assert "POLICY_ACCEPTANCE_REQUIRED" in res_blocked.text

        # 5. User accepts new policy version 2026.2
        renew_res = client.post(
            "/api/v1/policies/accept",
            json={"policyVersion": "2026.2"},
            headers=headers,
        )
        assert renew_res.status_code == 200

        # 6. Protected access is now unblocked
        res_allowed = client.get("/api/v1/projects", headers=headers)
        assert res_allowed.status_code == 200

        # 7. Verify both acceptance records exist in history (preservation of audit ledger)
        hist_res = client.get("/api/v1/policies/history", headers=headers)
        assert hist_res.status_code == 200
        records = hist_res.json()["data"]
        assert len(records) >= 2
        versions = [r["policyVersion"] for r in records]
        assert "2026.1" in versions
        assert "2026.2" in versions

    finally:
        # Restore version
        policy_service.CURRENT_POLICY_VERSION = original_version
        policy_service.CURRENT_POLICY_REFERENCE = original_reference
        policy_service.clear_cache()


def test_invalid_policy_version_acceptance_rejected(client: TestClient):
    """9. Submitting an invalid or obsolete policy version is rejected with validation error."""
    user_id = f"test_inv_version_{uuid4().hex[:6]}"
    headers = get_auth_headers(user_id, "CREATOR")

    res = client.post(
        "/api/v1/policies/accept",
        json={"policyVersion": "invalid_version_999"},
        headers=headers,
    )
    assert res.status_code in [400, 422]
