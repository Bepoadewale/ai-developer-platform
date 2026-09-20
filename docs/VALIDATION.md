# Validation

## Local environment

- Date: 2026-09-20
- Host: macOS on Apple Silicon
- Node used by Makefile: v24.21.0
- Docker Engine: 29.0.1 (Docker Desktop)
- Backstage dependencies: repository lockfile (`yarn.lock`)
- No cloud account, external Backstage instance, Kubernetes cluster, or paid API used.

## Clean-Room Validation

Validation was executed on implementation commit `4fddf37c670f4db367a6c8dd1ee713ba6af99442`; the final documentation/CI commit follows it. The starting state for each cycle had no `generated/`, `packages/backend/backstage-data/`, or `.local/` directory and no `ai-developer-platform-*` container.

### Cycle 1

```bash
make clean-local
make bootstrap-local
make smoke
make demo-golden-path
make demo-drift
make demo-failure
make e2e
make verify
make clean-local
```

Observed results:

- Backstage, Catalog templates, and custom local publishing action became ready using bounded polling.
- Live Scaffolder created `billing-api` and `recommendation-api`; both were Catalogued and scorecard `READY` (10/10).
- Generated FastAPI tests: Production API 2 passed; AI Service 1 passed.
- Production API Docker image ran with `--read-only`, `--tmpfs /tmp`, `no-new-privileges`, and dropped capabilities; `/health` and `/ready` both returned success.
- TechDocs built and served `billing-api` `index.html`.
- Drift removal of the readiness annotation produced `BLOCKED` and remediation, then restored the descriptor.
- Invalid template metadata returned HTTP 400 without a generated workspace.
- Playwright: 2 passed, including the rendered entity-page scorecard.
- `make verify`: lint, TypeScript, 4 Jest tests, 2 Python tests, and Ruff passed.
- Cleanup removed project-owned state and named demo containers/images; generated state, SQLite state, and `.local/` were absent afterward.

### Cycle 2

```bash
make bootstrap-local
make smoke
make demo-golden-path
make e2e
make clean-local
```

Observed results:

- A second bootstrap from the cleaned state recreated the local SQLite state and both Scaffolder outputs.
- The golden path again passed generated-service tests, hardened container health/readiness, Catalog reconciliation, TechDocs serving, and a `READY` 10/10 scorecard.
- Playwright: 2 passed.
- Metrics endpoint exposed generated-service, template-publication, and scorecard evaluation metrics.
- Final cleanup again removed only project-owned resources; no generated state, local database, local runtime directory, or named project container remained.

## Hosted CI

GitHub Actions run [`35523774212`](https://github.com/Bepoadewale/ai-developer-platform/actions/runs/35523774212) passed on 2026-09-20. It executed Node 24 dependency installation, lint, TypeScript, the full Jest suite, Python tests, and Ruff.

## Known validation boundary

GitHub publishing, enterprise identity, remote CI evidence as a scorecard input, Kubernetes deployment, external catalog providers, and cloud platform APIs remain unexecuted production adapters. They are not part of this local-first completion claim.
