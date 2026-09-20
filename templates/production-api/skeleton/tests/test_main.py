from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_is_available() -> None:
    assert client.get("/health").json() == {"status": "ok"}


def test_readiness_is_available() -> None:
    assert client.get("/ready").json() == {"status": "ready"}
