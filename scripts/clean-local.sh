#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
pid_file="${repo_root}/.local/backstage.pid"

stop_backstage_tree() {
  local pid="$1" parent command
  command=$(ps -p "${pid}" -o command= 2>/dev/null || true)
  [[ "${command}" == *"${repo_root}"* ]] || return 0

  # The listener is a Backstage child process. Walk to its yarn-start parent,
  # but only from a listener conclusively associated with this repository.
  while true; do
    parent=$(ps -p "${pid}" -o ppid= 2>/dev/null | tr -d ' ' || true)
    [[ -n "${parent}" && "${parent}" != "1" ]] || break
    command=$(ps -p "${parent}" -o command= 2>/dev/null || true)
    [[ "${command}" == *"yarn start"* || "${command}" == *"backstage-cli repo start"* ]] || break
    pid="${parent}"
  done
  kill "${pid}" 2>/dev/null || true
  for _ in $(seq 1 20); do
    kill -0 "${pid}" 2>/dev/null || return 0
    sleep 1
  done
  kill -9 "${pid}" 2>/dev/null || true
}

if [[ -f "${pid_file}" ]]; then
  pid=$(cat "${pid_file}")
  stop_backstage_tree "${pid}"
fi
# A previous interactive `yarn start` may predate the PID file. Stop only
# listeners whose command line names this repository; never touch other ports.
for port in 3000 7007; do
  while IFS= read -r pid; do
    [[ -n "${pid}" ]] && stop_backstage_tree "${pid}"
  done < <(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)
done
docker rm -f ai-developer-platform-orders-api ai-developer-platform-billing-api >/dev/null 2>&1 || true
docker image rm ai-developer-platform/orders-api:local ai-developer-platform/billing-api:local >/dev/null 2>&1 || true
rm -rf "${repo_root}/generated" "${repo_root}/packages/backend/backstage-data" "${repo_root}/.local"
if curl -fsS http://localhost:7007/api/catalog/entities >/dev/null 2>&1; then
  echo 'Backstage still responds after cleanup; refusing to report a clean Project state.' >&2
  exit 1
fi
echo 'Removed only ai-developer-platform local state, generated services, and named demo containers/images.'
