#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
curl_args=(--connect-timeout 2 --max-time 5)

token=''
for _ in $(seq 1 30); do
  token=$(curl -fsS "${curl_args[@]}" -H 'Origin: http://localhost:3000' \
    http://localhost:7007/api/auth/guest/refresh 2>/dev/null | jq -r '.backstageIdentity.token // empty' 2>/dev/null || true)
  [[ -n "${token}" ]] && break
  sleep 1
done

if [[ -z "${token}" ]]; then
  echo 'Backstage did not become ready within 30 seconds. Run make bootstrap-local and inspect .local/backstage.log.' >&2
  exit 1
fi

template_state() {
  local name="$1"
  if curl -fsS "${curl_args[@]}" -H "Authorization: Bearer ${token}" \
    "http://localhost:7007/api/catalog/entities/by-name/template/default/${name}" >/dev/null 2>&1; then
    echo available
  else
    echo unavailable
  fi
}

scorecard_state() {
  local name="$1" response
  response=$(curl -sS "${curl_args[@]}" -H "Authorization: Bearer ${token}" \
    "http://localhost:7007/api/platform-scorecards/entities/component/default/${name}" 2>/dev/null || true)
  if [[ -z "${response}" ]] || [[ $(jq -r '.status // empty' <<<"${response}" 2>/dev/null) == "" ]]; then
    echo not-registered
    return
  fi
  jq -r '"\(.status) (\(.passed)/\(.total) controls)"' <<<"${response}"
}

generated_workspaces=0
if [[ -d "${repo_root}/generated" ]]; then
  generated_workspaces=$(find "${repo_root}/generated" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
fi

metrics=$(curl -fsS "${curl_args[@]}" http://localhost:7007/api/platform-metrics/metrics)
catalog_entities=$(awk '$1 == "developer_platform_generated_catalog_entities" { print $2 }' <<<"${metrics}" | tail -1)
catalog_entities=${catalog_entities:-0}

cat <<EOF
AI Developer Platform status
Backstage: ready
Catalog templates: production-api=$(template_state production-api), ai-service=$(template_state ai-service)
Generated workspaces: ${generated_workspaces}
Generated Catalog entities: ${catalog_entities}
Scorecard billing-api: $(scorecard_state billing-api)
Scorecard recommendation-api: $(scorecard_state recommendation-api)
Metrics: http://localhost:7007/api/platform-metrics/metrics
EOF
