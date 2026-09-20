#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
state_dir="${repo_root}/.local"
pid_file="${state_dir}/backstage.pid"
log_file="${state_dir}/backstage.log"

mkdir -p "${state_dir}"
if [[ -f "${pid_file}" ]] && kill -0 "$(cat "${pid_file}")" 2>/dev/null; then
  echo "Backstage is already running (pid $(cat "${pid_file}"))"
  exit 0
fi

node_major=$(node --version | sed -E 's/v([0-9]+).*/\1/')
if [[ "${node_major}" != "22" && "${node_major}" != "24" ]]; then
  echo "Backstage requires Node 22 or 24; found $(node --version)" >&2
  exit 1
fi

cd "${repo_root}"
nohup yarn start >"${log_file}" 2>&1 < /dev/null &
echo $! >"${pid_file}"
echo "Started Backstage (pid $(cat "${pid_file}")); log: ${log_file}"
