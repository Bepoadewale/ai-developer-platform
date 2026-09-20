#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
venv="${repo_root}/.local/tools-venv"

if [[ ! -x "${venv}/bin/python" ]]; then
  python3 -m venv "${venv}"
fi
"${venv}/bin/python" -m pip install --quiet --upgrade pip
"${venv}/bin/python" -m pip install --quiet 'pytest>=9.0.3,<10' 'pyyaml>=6,<7' 'ruff>=0.8,<1'
echo 'Installed project-local Python validation tools.'
