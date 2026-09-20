# Definition of Done

# Portfolio Complete — Local-First Scope Gate

Do not check an item from code, YAML, mocks, or static validation alone. Record its command and evidence in `docs/VALIDATION.md` and `PROJECT_STATUS.md`.

- [x] Current Backstage frontend and backend run locally; Catalog loads meaningful entities and relationships.
- [x] Production Web API appears in `/create`, Scaffolder executes it, and the generated service builds/tests locally.
- [x] AI Service appears in `/create`, Scaffolder executes it, and its generated service builds/tests locally.
- [x] Generated components register in Catalog with visible owner/system/API relationships.
- [x] At least one generated component exposes functioning TechDocs if TechDocs remains a claimed capability.
- [x] Scorecard backend evaluates evidence and the entity UI renders readiness results and remediation.
- [x] A compliant generated service degrades after a required control is removed; remediation explains the result.
- [x] A legacy/noncompliant service produces evidence-based failures; no waiver workflow is claimed.
- [x] Template/catalog/scorecard metrics or audit signals run where claimed.
- [x] A broken template or invalid metadata failure path is executed and reported.
- [x] `make demo`/equivalent reproduces Developer → Backstage → Create → runnable service → Catalog/docs → scorecard.
- [x] Unit, integration, local-E2E, and relevant failure tests pass; required CI is green.
- [x] README and implementation status distinguish executed local behavior from simulated, static-only, and production adapters.

## Maturity Levels

- **FOUNDATION:** architecture and core contracts exist.
- **PARTIALLY VALIDATED:** one or more important integrations have run, but the central story is incomplete.
- **LOCAL END-TO-END VALIDATED:** primary success path runs locally; material failure, security, recovery, or observability evidence remains.
- **PORTFOLIO COMPLETE — LOCAL-FIRST SCOPE:** every gate above has executed evidence. Do not use this label without the suffix unless production/cloud validation exists.

# Clean-Room Reproducibility Gate

`PORTFOLIO COMPLETE — LOCAL-FIRST SCOPE` requires two executed clean-room cycles: clone → install → bootstrap real Backstage/Catalog/Scaffolder → smoke → golden-path demo (runnable, tested service, catalog registration, scorecard) → drift/noncompliance demo → validation → project-scoped cleanup → second clean bootstrap/demo. Planned commands: `make install`, `make bootstrap-local`, `make smoke`, `make demo-golden-path`, `make demo-drift`, `make verify`, `make clean-local`.

- [x] Clean clone/bootstrap has no hidden state; primary and failure demos pass.
- [x] Cleanup removes only this project; it targets only named project resources and local paths.
- [x] Post-cleanup absence and second bootstrap/demo are recorded in `docs/VALIDATION.md`.
