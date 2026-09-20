from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_inference_contract_is_available() -> None:
    response = client.post("/v1/infer", json={"text": "hello"})
    assert response.status_code == 200
    assert response.json()["characters"] == 5
