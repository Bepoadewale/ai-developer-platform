#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
descriptor="${repo_root}/generated/billing-api/catalog-info.yaml"
if [[ ! -f "${descriptor}" ]]; then
  "${repo_root}/scripts/demo-golden-path.sh"
else
  "${repo_root}/scripts/smoke.sh"
fi
backup=$(mktemp)
cp "${descriptor}" "${backup}"
trap 'cp "${backup}" "${descriptor}"; rm -f "${backup}"' EXIT
sed -i.bak '/platform\.example\/health-readiness:/d' "${descriptor}"
rm -f "${descriptor}.bak"
token=$(curl -fsS -H 'Origin: http://localhost:3000' http://localhost:7007/api/auth/guest/refresh | jq -r '.backstageIdentity.token')
for _ in $(seq 1 30); do
  status=$(curl -fsS -H "Authorization: Bearer ${token}" http://localhost:7007/api/platform-scorecards/entities/component/default/billing-api | jq -r '.status')
  [[ "${status}" == BLOCKED ]] && break
  sleep 1
done
test "${status}" = BLOCKED
curl -fsS -H "Authorization: Bearer ${token}" http://localhost:7007/api/platform-scorecards/entities/component/default/billing-api | jq -e '.checks[] | select(.id == "health-contract" and .status == "FAIL")' >/dev/null
cp "${backup}" "${descriptor}"
echo 'Drift demo passed: missing readiness metadata blocked the scorecard and the descriptor was restored.'
