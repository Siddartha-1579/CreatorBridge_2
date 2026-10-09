"""Pytest configuration and test fixtures using TestClient."""

import pytest
from starlette.testclient import TestClient
from app.main import app


@pytest.fixture(scope="session")
def client():
    """Synchronous test client fixture for FastAPI app."""
    with TestClient(app) as test_client:
        yield test_client
