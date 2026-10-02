# Multi-Zman analytics architecture

## Principle

Every content diagnostic operates inside exactly one Zman. Zman identity is stable and machine-oriented; the display name can remain descriptive.

The current Zman is:
- ID: `2026-summer`
- display name: `Nat Bar Nat & Stam Ye'enam - Summer 26`

Existing D1 tables retain the historical column name `cohort`; its values are normalized to Zman IDs.

## Registry and latest-Zman behavior

`analytics-zmanim.json` is the source-controlled allowlist. It defines `defaultZmanId`, `latestZmanId`, display metadata, and legacy aliases.

Ingestion rejects unknown Zman IDs. The dashboard reads `zman` from the URL; when absent, it selects `latestZmanId`. Clear Filters preserves the selected Zman.

## Catalogs

There is currently one question catalog and one essay catalog. Runtime access goes through `catalogForZman()` so a future Zman can map to its own catalog.

Do not register a second live Zman until each Zman has its own question/essay/fact mappings and every content lookup uses the selected Zman.

## Learner profile isolation

The public anonymous installation ID is stable across Zmanim. The `learner_profiles` table has a legacy single-column primary key, so runtime storage uses an internal `zman::installationId` key. Event backfills use the original installation ID plus Zman.

This prevents changing a chabura in one Zman from rewriting another Zman's historical events.

## Feedback identity

Feedback reports store the Zman ID in the legacy `cohort` column. Issue/revision/admin-action tables predate Zman isolation, so their internal `content_id` is `zman::publicContentId`. API responses strip the prefix.

This preserves existing D1 tables while making issue identity effectively:
`zman + content_type + content_id`.

## Notifications

`app_notifications` stores two kinds of notices:
- global/Zman announcements;
- installation-targeted issue-resolution notices.

The Study app polls `GET /api/notifications`. Manual announcement creation is protected by `NOTIFICATION_ADMIN_TOKEN` at `POST /api/admin/notifications`.

## Cross-Zman reporting

Question/topic/essay diagnostics must not aggregate across Zmanim. If a future high-level cross-Zman usage view is added, restrict it to genuinely comparable aggregate measures such as event volume or anonymous learner counts.


## Push and inbox state

`app_notifications` is the canonical current-Zman inbox. `notification_state` stores per-installation read/archive state. `push_subscriptions` stores browser subscriptions and reminder preferences; `push_config` stores a server-only VAPID keypair generated on first use. Push is a delivery channel for inbox objects.

Daily reminders are evaluated by cron in the subscriber's IANA timezone. Saturday and Hebcal `CHAG` dates are suppressed; users choose Diaspora or Israel holiday rules. Notification `kind` and `action_json` are intentionally extensible.
