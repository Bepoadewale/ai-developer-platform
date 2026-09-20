#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
"${repo_root}/scripts/smoke.sh"
token=$(curl -fsS -H 'Origin: http://localhost:3000' http://localhost:7007/api/auth/guest/refresh | jq -r '.backstageIdentity.token')

curl -fsS -H 'Origin: http://localhost:3000' -H "Authorization: Bearer ${token}" \
  'http://localhost:7007/api/techdocs/sync/default/component/billing-api' >/dev/null

for _ in $(seq 1 90); do
  if curl -fsS -H "Authorization: Bearer ${token}" \
    'http://localhost:7007/api/techdocs/static/docs/default/component/billing-api/index.html' >/dev/null 2>&1; then
    echo 'TechDocs built and served for billing-api.'
    exit 0
  fi
  sleep 1
done

echo 'TechDocs did not serve billing-api within 90 seconds.' >&2
exit 1
