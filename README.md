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
