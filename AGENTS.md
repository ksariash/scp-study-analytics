# SCP Study Analytics — LLM operating guide

Read this before modifying the repository. A user request to implement a change means: edit the canonical source, validate it, commit to `main`, let Cloudflare Workers Builds deploy it, and verify the Cloudflare build check. Do not stop at a branch or pull request unless the user asks for one.

## System vocabulary and identity

A study period is a **Zman**; plural is **Zmanim**. The stable backend identifier for the current Zman is `2026-summer`. Its display name is `Nat Bar Nat & Stam Ye'enam - Summer 26`.

`analytics-zmanim.json` is the source-controlled allowlist and ordering metadata. Zman IDs are permanent once data ships. The D1 schema still uses the legacy column name `cohort` in several tables for migration compatibility; treat the values in that column as Zman IDs. Do not introduce new product/UI language that says cohort.

## Canonical source layout

Do not edit generated `src/` as source of truth; it is ignored by Git. `build.mjs` reconstructs it from:
- `parts/src__index.js.*.part`
- `parts/src__dashboard.js.*.part`
- `parts/src__question-catalog.js.*.part`
- `parts/src__essay-catalog.js.*.part`
- `dashboard-navigation.snippet.js`
- `feedback-backend.snippet.js`
- `feedback-admin-actions.json`
- `analytics-zmanim.json`

Always inspect `build.mjs` before changing generated Worker behavior. The build must syntax-check every generated JavaScript target before deployment.

## Zman isolation

Every diagnostic query operates inside one Zman. The dashboard selects the latest configured Zman when the URL does not specify `zman`; shared URLs persist the selected Zman.

The current implementation has one question/essay catalog set. Do not enable a second Zman until:
1. it has its own question, essay, and essay-fact catalogs;
2. `catalogForZman()` resolves the correct catalog by Zman;
3. categories and chabura choices are filtered to the selected Zman;
4. feedback, learner profiles, admin actions, and notifications remain isolated by Zman.

Feedback issue identity is represented by Zman + content type + content ID. The database preserves older table constraints by storing a Zman-prefixed internal content key; API responses expose the original content ID.

Learner profile backfills must always include both anonymous installation ID and Zman. Never let a chabura selection in one Zman rewrite event rows from another.

## Data, privacy, and notifications

Student analytics are anonymous. Never expose anonymous installation IDs, raw network metadata, or individual comments unnecessarily in public output.

Announcements and issue-resolution notices live in D1 `app_notifications`. The Study app reads them from `/api/notifications`, so announcements do not require a Study release.

Manual announcement creation uses `POST /api/admin/notifications` and the Cloudflare secret `NOTIFICATION_ADMIN_TOKEN`. Never commit that token, echo it in logs, or put it in browser source. The dashboard keeps a supplied token in session storage only.

Resolving a feedback issue creates a targeted notification for anonymous installation IDs that reported that issue. Feedback is evidence, not authorization for course-content changes.

## Database changes

Database migrations are within normal implementation authority. Prefer idempotent migrations that preserve existing data. Keep `schema.sql` accurate for a fresh database, but do not treat `npm run db:init` as a production migration command.

Before destructive transformations or table rebuilds, take a recoverable backup/export when tooling permits. Never silently reinterpret existing Zman/content identity.

## Cross-repository contract

SCP Study sends the Zman ID with analytics and feedback. When changing a shared payload or identifier, make Analytics backward-compatible and deploy it first, then deploy Study.

A new Zman must not become selectable in Study until Analytics accepts its ID and has the matching catalogs.

## Release workflow

Fetch latest `main` → edit canonical sources → update schema/docs when architecture changes → bump package and health versions for a release → run `npm run build` and syntax checks → commit to `main` → inspect the Cloudflare Workers Builds check.

A task is not deployed successfully while the Cloudflare check is pending or failed. Do not claim the live Worker has been directly exercised unless an actual request to the Worker succeeded.


## Push, inbox, and reminders

Web Push uses `web-push`. VAPID keys are generated once and retained only in D1 `push_config`; never expose the private key. The inbox is canonical and push is only a delivery channel. Read/archive state is per anonymous installation.

Daily reminders use the device IANA timezone and chosen HH:MM. Suppress the entire local Saturday and dates with a Hebcal `CHAG` event using the user's Diaspora/Israel choice. Mark the local date processed before attempting delivery to avoid duplicate cron sends.

Notification `kind` and `action_json` are extensible. Unknown kinds must still render safely; unknown actions must be ignored.

Feedback reports may contain multiple tags. Supported UI vocabulary: Inaccurate, Incomplete, Confusing, Typo, Wrong audio, Wrong notes, Other.


## Reminder boundary correctness

Reminder cron runs every minute so any HH:MM selection is reachable. When Cloudflare supplies approximate request coordinates, store only the existing one-decimal rounded latitude/longitude with the push subscription. Use that approximate location plus the IANA timezone for sunset-aware Hebrew dates and tzeit; this prevents Friday-night/Saturday-night and Yom-Tov boundary notifications. Fall back to civil-day suppression only when location is unavailable.
