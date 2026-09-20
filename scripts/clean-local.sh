#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
pid_file="${repo_root}/.local/backstage.pid"
if [[ -f "${pid_file}" ]]; then
  pid=$(cat "${pid_file}")
  if kill -0 "${pid}" 2>/dev/null; then
    command=$(ps -p "${pid}" -o command= || true)
    if [[ "${command}" == *"ai-developer-platform"* ]]; then
      kill "${pid}" || true
    fi
  fi
fi
docker rm -f ai-developer-platform-orders-api >/dev/null 2>&1 || true
docker image rm ai-developer-platform/orders-api:local >/dev/null 2>&1 || true
rm -rf "${repo_root}/generated" "${repo_root}/packages/backend/backstage-data" "${repo_root}/.local"
echo 'Removed only ai-developer-platform local state, generated services, and named demo container/image.'
