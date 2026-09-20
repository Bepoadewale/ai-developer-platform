from fastapi import FastAPI

app = FastAPI(title="${{ values.name }}", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready")
def readiness() -> dict[str, str]:
    return {"status": "ready"}


@app.get("/v1/metadata")
def metadata() -> dict[str, str]:
    return {
        "service": "${{ values.name }}",
        "criticality": "${{ values.criticality }}",
        "owner": "${{ values.owner }}",
    }
