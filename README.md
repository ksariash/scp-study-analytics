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
- Reorders filters to Chabura Location, Chabura Rav, Cohort, Topic, Mode, Country, Region, City, From, Through.


## Release 9

- Replaces the wide Essay Performance table with responsive cards so essay analytics stay within the viewport on phones and narrow windows.
- Each essay card shows learners, rounds, completion, first-try accuracy, perfect-round rate, and retries without horizontal overflow.
