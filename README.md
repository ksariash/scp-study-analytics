# SCP Study Analytics

Cloudflare Worker + D1 backend and public instructor dashboard for SCP Study.

- Worker: `scp-study-analytics`
- Dashboard/API: `https://scp-study-analytics.ksariash.workers.dev/`
- Study app origin: `https://scp-study.ksariash.workers.dev`
- D1 binding: `DB` -> `scp-study-analytics-db`

## Cloudflare deployment

Connect this repository's `main` branch to the existing **scp-study-analytics** Worker using Cloudflare Workers Builds. The checked-in `wrangler.jsonc` contains the D1 database binding.

For a first-time database only, run `npm install` then `npm run db:init`. Existing deployments do not need a migration for dashboard v3.

See `README_DEPLOY.txt` and `PRIVACY_AND_METRICS.txt` for operational and privacy details.


## Release 4

- Added Content Feedback reporting for student questions, essay prompts, and essay pairings.
- Added D1-backed grouped feedback issues with New, Tracking, Reopened, and Resolved states.
- Resolved issues are hidden from the dashboard by default and can be included with a toggle or status filter.
- Added a Content Feedback dashboard section with report counts, unique learner counts, reason breakdowns, filters, and links to a dedicated detail window.
- The detail window shows anonymous student comments, exact reported wording, context, wording/status history, and before/after diffs.
- Tracking and resolution actions can include a note and optional updated wording; any new feedback after resolution automatically reopens the issue, with changed wording called out in the history.
- Duplicate reports from the same anonymous installation for the same unchanged content version are rejected server-side.


## Release 5

- Added a source-controlled admin bridge for approved Content Feedback resolutions.
- Approved actions live in `feedback-admin-actions.json`; only actions committed to the deployed `main` branch can change feedback status through the bridge.
- The Worker applies new approved actions idempotently and records each applied action in D1.
- A five-minute Cron Trigger processes newly deployed approved actions automatically.
- `GET /api/admin/feedback-sync` can trigger the same idempotent sync immediately; it accepts no mutation payload and can only execute actions already embedded in the deployed manifest.
- Resolution notes and updated wording are written into the existing feedback revision timeline, so the dashboard continues to show how wording changed in response to feedback.
- This avoids storing a reusable admin bearer token in the public repository while still allowing ChatGPT to prepare approved changes through GitHub.


## Release 7

- Adds anonymous chabura and chabura-region dimensions to question, glossary, and essay analytics.
- Accepts a profile event that immediately associates an anonymous installation with its selected chabura and backfills that installation's earlier analytics rows.
- Adds a Chabura filter to the dashboard and exposes observed chaburos through the dashboard filter-options endpoint.


## Release 8

- Fixes the chabura schema migration order: existing D1 tables are altered before indexes are created on the new chabura columns, preventing dashboard/API 500s on upgraded databases.
- Splits the dashboard chabura filter into Chabura Location and Chabura Rav, with the Rav list cascading from the selected location.
- Reorders filters to Chabura Location, Chabura Rav, Zman, Topic, Mode, Country, Region, City, From, Through.


## Release 9

- Replaces the wide Essay Performance table with responsive cards so essay analytics stay within the viewport on phones and narrow windows.
- Each essay card shows learners, rounds, completion, first-try accuracy, perfect-round rate, and retries without horizontal overflow.


## Release 10

- Renames the Summer 2026 Zman to `Nat Bar Nat & Stam Ye'enam - Summer 26` and migrates existing analytics rows from the prior Zman label.


## Release 11

- Accepts and reports two additional learner feedback reasons: incorrect notes connection and incorrect audio connection.


## Release 12

- Makes Zman the first and mandatory dashboard dimension. The dashboard always selects a specific Zman; “All Zmans” is removed because cross-Zman question/topic diagnostics are not comparable.
- Clearing filters preserves the selected Zman.
- This is the analytics-side foundation for the Study app's Zman package migration.


## Release 13

- Adds a source-controlled analytics Zman registry and rejects events/feedback for unconfigured Zmans instead of interpreting them through the current Zman catalog.
- Makes the summary and essay-summary APIs require a supported Zman, matching the mandatory dashboard Zman selector.
- Returns configured Zmans from the options API even before a Zman has activity.
- Adds LLM maintenance and multi-Zman analytics guides, including an explicit gate that feedback issue identity must become Zman-scoped before a second Zman is enabled.


## Release 14

- Renames the study-period architecture to Zman/Zmanim and uses `2026-summer` as the current backend ID while preserving the full topic/date display name.
- Normalizes prior Summer 2026 identifiers to `2026-summer`.
- Fixes the generated-dashboard quoting failure that prevented Analytics v11–v13 from deploying and adds generated JavaScript syntax checks to the build.
- Isolates chabura profile backfills and feedback issue identity by Zman.
- Adds D1-backed in-app announcements and targeted issue-resolution notices.
- Makes the dashboard select the latest configured Zman whenever the URL does not specify one.


## Release 15

- Adds Web Push delivery, read/archive inbox state, daily study reminders, anonymous server-data deletion, generic notification actions, and multi-tag feedback.
