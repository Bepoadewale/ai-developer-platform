# AI Developer Platform — Agent Guide

Mission: use Backstage to make governed software/AI service golden paths discoverable, executable and continuously assessed by evidence-based scorecards.

Stack: current Backstage/TypeScript target; existing YAML catalog/templates/standards and Python contract tests.

Commands: `make test`; future Backstage install/start/build/test commands must be recorded once real.

Rules: template YAML is not a golden path until Scaffolder executes it; no fabricated portal screenshots; validate current Backstage frontend APIs before adoption; no secrets/main pushes; update status/backlog truthfully.

Completion rule: do not mark this repository **PORTFOLIO COMPLETE — LOCAL-FIRST SCOPE** unless the repository-specific gate in `DEFINITION_OF_DONE.md` has executed evidence. Interfaces, mocks, manifests, architecture, unit tests, static validation, and documentation alone are insufficient. The central Backstage story must run end-to-end locally; all unexecuted cloud or production integrations must remain explicitly labeled.

## Clean-room reproducibility

Clean-room reproducibility is a mandatory completion criterion. Do not mark this repository
`PORTFOLIO COMPLETE — LOCAL-FIRST SCOPE` until a new engineer can reproduce the platform from a
clean project state using documented commands, execute the primary and required failure demos, run
validation, and safely tear down only this project's local resources. Do not infer reproducibility
from an existing developer environment; execute it after project-specific cleanup.
