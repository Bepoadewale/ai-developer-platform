#!/usr/bin/env bash
set -euo pipefail

"$(dirname "$0")/wait-for-backstage.sh"
token=$(curl -fsS -H 'Origin: http://localhost:3000' http://localhost:7007/api/auth/guest/refresh | jq -r '.backstageIdentity.token')
curl -fsS -H "Authorization: Bearer ${token}" http://localhost:7007/api/catalog/entities >/dev/null
curl -fsS -H "Authorization: Bearer ${token}" http://localhost:7007/api/scaffolder/v2/actions | jq -e '.[] | select(.id == "platform:publishLocal")' >/dev/null
echo 'Smoke check passed: Backstage, Catalog, and local publish action are available.'
