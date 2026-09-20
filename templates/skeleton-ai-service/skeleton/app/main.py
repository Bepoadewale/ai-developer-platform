from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="${{ values.name }}", version="0.1.0")


class InferenceRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4096)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready")
def readiness() -> dict[str, str]:
    return {"status": "ready"}


@app.post("/v1/infer")
def infer(request: InferenceRequest) -> dict[str, str | int]:
    # Deliberately deterministic fixture behavior: a generated service has an
    # OpenAI-compatible-adjacent request boundary without silently calling a
    # third-party model provider or logging prompt contents.
    return {"model": "local-fixture", "characters": len(request.text), "status": "accepted"}
