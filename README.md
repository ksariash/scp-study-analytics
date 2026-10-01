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
- Tracking and resolution actions can include a note and optional updated wording; new feedback on a changed content hash automatically reopens a resolved issue.
- Duplicate reports from the same anonymous installation for the same unchanged content version are rejected server-side.
