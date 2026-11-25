"""Tests for public statistics endpoint."""

import pytest
import sqlite3
from app.core.db import DB_PATH


def test_public_stats_endpoint(client):
    """Verifies that the /api/v1/stats/public endpoint returns genuine counts and satisfies the contract."""
    response = client.get("/api/v1/stats/public")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "data" in json_data

    data = json_data["data"]
    assert "total_creators" in data
    assert "total_brands" in data
    assert "total_users" in data
    assert "total_published_campaigns" in data
    assert "total_completed_engagements" in data
    assert "total_portfolio_items" in data
    assert "total_submissions" in data
    assert "timestamp" in data

    # Verify counts are non-negative integers
    assert isinstance(data["total_creators"], int) and data["total_creators"] >= 0
    assert isinstance(data["total_brands"], int) and data["total_brands"] >= 0
    assert isinstance(data["total_users"], int) and data["total_users"] >= 0
    assert isinstance(data["total_published_campaigns"], int) and data["total_published_campaigns"] >= 0
    assert isinstance(data["total_completed_engagements"], int) and data["total_completed_engagements"] >= 0
    assert isinstance(data["total_portfolio_items"], int) and data["total_portfolio_items"] >= 0
    assert isinstance(data["total_submissions"], int) and data["total_submissions"] >= 0

    # Ensure no PII is returned
    for key in ["email", "name", "password", "token", "user_id"]:
        assert key not in data

    # Verify demo accounts are excluded by comparing against raw DB count
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    raw_user_count = cursor.fetchone()[0]
    conn.close()

    # The genuine user count must be strictly less than the total raw user count when demo accounts exist
    assert data["total_users"] < raw_user_count
