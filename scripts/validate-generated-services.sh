#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
venv="${repo_root}/.local/generated-service-venv"

test -d "${repo_root}/generated/billing-api"
test -d "${repo_root}/generated/recommendation-api"

if [[ ! -x "${venv}/bin/python" ]]; then
  python3 -m venv "${venv}"
fi
"${venv}/bin/python" -m pip install --quiet --upgrade pip
"${venv}/bin/python" -m pip install --quiet fastapi 'uvicorn[standard]' httpx pytest

(cd "${repo_root}/generated/billing-api" && "${venv}/bin/python" -m pytest -q)
(cd "${repo_root}/generated/recommendation-api" && "${venv}/bin/python" -m pytest -q)

image="ai-developer-platform/billing-api:local"
container="ai-developer-platform-billing-api"
port=18080
docker build --quiet -t "${image}" "${repo_root}/generated/billing-api"
docker rm -f "${container}" >/dev/null 2>&1 || true
docker run -d --name "${container}" --read-only --tmpfs /tmp --security-opt no-new-privileges --cap-drop ALL -p "${port}:8000" "${image}" >/dev/null
cleanup() {
  docker rm -f "${container}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for _ in $(seq 1 30); do
  if curl -fsS "http://localhost:${port}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -fsS "http://localhost:${port}/health" | jq -e '.status == "ok"' >/dev/null
curl -fsS "http://localhost:${port}/ready" | jq -e '.status == "ready"' >/dev/null
echo 'Generated services passed tests; Production API container passed /health and /ready with hardened runtime options.'
