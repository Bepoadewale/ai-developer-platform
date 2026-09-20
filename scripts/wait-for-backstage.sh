#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
for attempt in $(seq 1 90); do
  if curl -fsS -H 'Origin: http://localhost:3000' http://localhost:7007/api/auth/guest/refresh >/dev/null 2>&1; then
    echo "Backstage is ready after ${attempt}s"
    exit 0
  fi
  sleep 1
done

tail -120 "${repo_root}/.local/backstage.log" 2>/dev/null || true
echo 'Backstage did not become ready within 90 seconds.' >&2
exit 1
