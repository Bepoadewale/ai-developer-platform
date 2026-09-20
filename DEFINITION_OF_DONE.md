# Definition of Done

# Portfolio Complete — Local-First Scope Gate

Do not check an item from code, YAML, mocks, or static validation alone. Record its command and evidence in `docs/VALIDATION.md` and `PROJECT_STATUS.md`.

- [ ] Current Backstage frontend and backend run locally; Catalog loads meaningful entities and relationships.
- [ ] Production Web API appears in `/create`, Scaffolder executes it, and the generated service builds/tests locally.
- [ ] AI Service appears in `/create`, Scaffolder executes it, and its generated service builds/tests locally.
- [ ] Generated components register in Catalog with visible owner/system/API relationships.
- [ ] At least one generated component exposes functioning TechDocs if TechDocs remains a claimed capability.
- [ ] Scorecard backend evaluates evidence and the entity UI renders readiness results and remediation.
- [ ] A compliant generated service degrades after a required control is removed; remediation explains the result.
- [ ] A legacy/noncompliant service produces evidence-based failures; any claimed waiver is scoped and expiry-tested.
- [ ] Template/catalog/scorecard metrics or audit signals run where claimed.
- [ ] A broken template or invalid metadata failure path is executed and reported.
- [ ] `make demo`/equivalent reproduces Developer → Backstage → Create → runnable service → Catalog/docs → scorecard.
- [ ] Unit, integration, local-E2E, and relevant failure tests pass; required CI is green.
- [ ] README and implementation status distinguish executed local behavior from simulated, static-only, and production adapters.

## Maturity Levels

- **FOUNDATION:** architecture and core contracts exist.
- **PARTIALLY VALIDATED:** one or more important integrations have run, but the central story is incomplete.
- **LOCAL END-TO-END VALIDATED:** primary success path runs locally; material failure, security, recovery, or observability evidence remains.
- **PORTFOLIO COMPLETE — LOCAL-FIRST SCOPE:** every gate above has executed evidence. Do not use this label without the suffix unless production/cloud validation exists.
