"""Error handling tests."""


def test_not_found_error_structure(client):
    response = client.get("/api/v1/creators/00000000-0000-0000-0000-000000009999")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"
    assert "message" in data["error"]
