#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
"${repo_root}/scripts/smoke.sh"
token=$(curl -fsS -H 'Origin: http://localhost:3000' http://localhost:7007/api/auth/guest/refresh | jq -r '.backstageIdentity.token')

create_task() {
  local payload="$1"
  local task_id task_status
  task_id=$(curl -fsS -X POST http://localhost:7007/api/scaffolder/v2/tasks \
    -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' --data "${payload}" | jq -r '.id')
  for _ in $(seq 1 45); do
    task_status=$(curl -fsS -H "Authorization: Bearer ${token}" "http://localhost:7007/api/scaffolder/v2/tasks/${task_id}" | jq -r '.status')
    [[ "${task_status}" == completed ]] && return 0
    [[ "${task_status}" == failed || "${task_status}" == cancelled ]] && break
    sleep 1
  done
  echo "Scaffolder task ${task_id} ended ${task_status}" >&2
  exit 1
}

test -d "${repo_root}/generated/billing-api" || create_task '{"templateRef":"template:default/production-api","values":{"name":"billing-api","owner":"team-checkout","system":"commerce-platform","criticality":"tier-2"}}'
test -d "${repo_root}/generated/recommendation-api" || create_task '{"templateRef":"template:default/ai-service","values":{"name":"recommendation-api","owner":"team-ai","cost_center":"cc-ai-002","data_classification":"confidential"}}'

for _ in $(seq 1 30); do
  status=$(curl -fsS -H "Authorization: Bearer ${token}" http://localhost:7007/api/platform-scorecards/entities/component/default/billing-api | jq -r '.status')
  [[ "${status}" == READY ]] && break
  sleep 1
done
test "${status}" = READY
curl -fsS -H "Authorization: Bearer ${token}" http://localhost:7007/api/platform-scorecards/entities/component/default/recommendation-api | jq -e '.status == "READY"' >/dev/null
echo 'Golden path passed: generated Production API and AI service are registered and scorecard-ready.'
