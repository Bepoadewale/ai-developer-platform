#!/usr/bin/env bash
set -euo pipefail

"$(dirname "$0")/smoke.sh"
token=$(curl -fsS -H 'Origin: http://localhost:3000' http://localhost:7007/api/auth/guest/refresh | jq -r '.backstageIdentity.token')
http_status=$(curl -sS -o /tmp/developer-platform-invalid-template.json -w '%{http_code}' \
  -X POST http://localhost:7007/api/scaffolder/v2/tasks \
  -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' \
  --data '{"templateRef":"template:default/production-api","values":{"name":"Invalid_Name","owner":"team-checkout","system":"commerce-platform","criticality":"tier-2"}}')
test "${http_status}" = 400
test ! -e "$(cd "$(dirname "$0")/.." && pwd)/generated/Invalid_Name"
echo 'Failure demo passed: invalid service metadata was rejected before workspace creation.'
