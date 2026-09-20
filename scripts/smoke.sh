#!/usr/bin/env bash
set -euo pipefail

"$(dirname "$0")/wait-for-backstage.sh"
token=$(curl -fsS -H 'Origin: http://localhost:3000' http://localhost:7007/api/auth/guest/refresh | jq -r '.backstageIdentity.token')
for _ in $(seq 1 45); do
  if curl -fsS -H "Authorization: Bearer ${token}" \
    http://localhost:7007/api/catalog/entities/by-name/template/default/production-api >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -fsS -H "Authorization: Bearer ${token}" http://localhost:7007/api/catalog/entities/by-name/template/default/production-api >/dev/null
curl -fsS -H "Authorization: Bearer ${token}" http://localhost:7007/api/catalog/entities/by-name/template/default/ai-service >/dev/null
curl -fsS -H "Authorization: Bearer ${token}" http://localhost:7007/api/scaffolder/v2/actions | jq -e '.[] | select(.id == "platform:publishLocal")' >/dev/null
echo 'Smoke check passed: Backstage, Catalog templates, and local publish action are available.'
