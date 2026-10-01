# SCP Study Analytics — LLM operating guide

Read this file before changing the analytics repository. It is architecture documentation and must be updated in the same commit when architecture changes.

## Canonical source layout

Do not edit generated `src/` as the source of truth. `build.mjs` reconstructs it from:
- `parts/src__index.js.*.part`
- `parts/src__dashboard.js.*.part`
- `parts/src__question-catalog.js.*.part`
- `parts/src__essay-catalog.js.*.part`
- `dashboard-navigation.snippet.js`
- `feedback-backend.snippet.js`
- `feedback-admin-actions.json`
- `analytics-cohorts.json`

Always inspect `build.mjs` before editing generated Worker behavior.

## Cohort rules

Cohort is a mandatory diagnostic dimension. Do not add an “All cohorts” diagnostic view for question/topic/essay performance because content is not comparable across cohorts.

`analytics-cohorts.json` is the allowlist of cohorts the Worker may accept. Unknown cohort events and feedback must be rejected rather than validated against the wrong catalog.

The current implementation has one catalog set. A second cohort must not be added to the registry until cohort-specific question/essay catalog modules are added and every catalog lookup is selected by cohort.

Before a second cohort launches, feedback issue identity must also be migrated from `content_type + content_id` to `cohort + content_type + content_id`. Do not rely only on the dashboard cohort filter; the stored issue identity itself must be cohort-safe.

## Data and privacy

Student analytics are anonymous. Never expose installation IDs, raw location metadata, or individual comments unnecessarily in public output. Chabura and location filters are diagnostic dimensions, not identity.

## Feedback workflow

Feedback is evidence, not authorization. For substantive course changes: inspect the issue/report, inspect current Study source, verify against the authoritative course files, propose the exact fix, and wait for explicit approval. Approved resolution actions are source-controlled through `feedback-admin-actions.json`.

## Release workflow

Fetch latest main → edit canonical parts/snippets → run `npm run build` and syntax checks → bump package/health version for releases → commit to main → report that Cloudflare should auto-deploy. Never claim live deployment unless independently verified.
