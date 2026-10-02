SCP STUDY ANALYTICS — GITHUB / CLOUDFLARE DEPLOYMENT
====================================================

Repository:
https://github.com/ksariash/scp-study-analytics

Worker:
scp-study-analytics
https://scp-study-analytics.ksariash.workers.dev/

Study app origin:
https://scp-study.ksariash.workers.dev/

D1 database:
scp-study-analytics-db

The D1 database ID is committed in wrangler.jsonc. A D1 database ID is an identifier, not a secret. Never commit Cloudflare API tokens, passwords, or other credentials.

NORMAL DEPLOYMENT
-----------------
This repository is intended to be connected to the existing Cloudflare Worker through Workers Builds.

Production branch: main
Root directory: /
Build command: npm run build
Deploy command: npx wrangler deploy

The build command reconstructs the Worker source files from the checked-in parts/ directory before Wrangler deploys them.

ONE-TIME CLOUDFLARE SETUP
-------------------------
1. In Cloudflare, open the existing scp-study-analytics Worker.
2. Connect the GitHub repository ksariash/scp-study-analytics.
3. Select main as the production branch.
4. Use npm run build as the build command.
5. Use npx wrangler deploy as the deploy command if Cloudflare asks for one.
6. Confirm the D1 binding named DB points to scp-study-analytics-db.
7. Deploy and verify:
   https://scp-study-analytics.ksariash.workers.dev/api/health

After that, pushes to main can deploy automatically.

DATABASE
--------
The existing database schema is in schema.sql.

For a brand-new database only:
  npm install
  npm run db:init

Dashboard v3 requires no migration when updating the existing database.

PRIVACY
-------
The dashboard is public to anyone with the URL and sends noindex/nofollow headers.
The database stores anonymous installation IDs, question events, broad Cloudflare-derived location, and course metrics.
It does not store names, email addresses, GPS location, free-form notes, search text, or raw IP addresses.


NOTIFICATIONS
-------------
In Cloudflare Worker settings, create the encrypted secret NOTIFICATION_ADMIN_TOKEN.
The Analytics dashboard uses that token to POST announcements to /api/admin/notifications.
Do not commit the token to GitHub or wrangler.jsonc.

Runtime product terminology is Zman/Zmanim. Existing D1 columns named "cohort" are retained for migration compatibility and store Zman IDs.
