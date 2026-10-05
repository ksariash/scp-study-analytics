CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_event_id TEXT NOT NULL UNIQUE,
  installation_id TEXT NOT NULL,
  cohort TEXT NOT NULL,
  app_version TEXT,
  chabura TEXT,
  chabura_region TEXT,
  client_ts TEXT,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  question_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('study','test')),
  attempt_number INTEGER NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('correct','partial','incorrect')),
  credit REAL NOT NULL,
  selected_json TEXT NOT NULL,
  response_time_bucket TEXT NOT NULL,
  audio_used INTEGER NOT NULL DEFAULT 0,
  glossary_used INTEGER NOT NULL DEFAULT 0,
  country TEXT,
  region TEXT,
  region_code TEXT,
  city TEXT,
  timezone TEXT,
  metro_code TEXT,
  latitude_rounded REAL,
  longitude_rounded REAL
);

CREATE INDEX IF NOT EXISTS idx_events_received_at ON events(received_at);
CREATE INDEX IF NOT EXISTS idx_events_cohort ON events(cohort);
CREATE INDEX IF NOT EXISTS idx_events_chabura ON events(chabura);
CREATE INDEX IF NOT EXISTS idx_events_question ON events(question_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(country, region, city);
CREATE INDEX IF NOT EXISTS idx_events_mode ON events(mode);
CREATE INDEX IF NOT EXISTS idx_events_install_question ON events(installation_id, question_id);


CREATE TABLE IF NOT EXISTS glossary_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_event_id TEXT NOT NULL UNIQUE,
  installation_id TEXT NOT NULL,
  cohort TEXT NOT NULL,
  app_version TEXT,
  chabura TEXT,
  chabura_region TEXT,
  client_ts TEXT,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  term_id TEXT NOT NULL,
  term TEXT NOT NULL,
  source TEXT NOT NULL,
  question_id INTEGER,
  category TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('study','test')),
  country TEXT,
  region TEXT,
  region_code TEXT,
  city TEXT,
  timezone TEXT,
  metro_code TEXT,
  latitude_rounded REAL,
  longitude_rounded REAL
);

CREATE INDEX IF NOT EXISTS idx_glossary_received_at ON glossary_events(received_at);
CREATE INDEX IF NOT EXISTS idx_glossary_cohort ON glossary_events(cohort);
CREATE INDEX IF NOT EXISTS idx_glossary_chabura ON glossary_events(chabura);
CREATE INDEX IF NOT EXISTS idx_glossary_term ON glossary_events(term_id);
CREATE INDEX IF NOT EXISTS idx_glossary_location ON glossary_events(country, region, city);
CREATE INDEX IF NOT EXISTS idx_glossary_category ON glossary_events(category);


CREATE TABLE IF NOT EXISTS resource_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_event_id TEXT NOT NULL UNIQUE,
  installation_id TEXT NOT NULL,
  cohort TEXT NOT NULL,
  app_version TEXT,
  chabura TEXT,
  chabura_region TEXT,
  client_ts TEXT,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('audio','notes')),
  resource_id TEXT NOT NULL,
  resource_label TEXT NOT NULL,
  resource_variant TEXT,
  page INTEGER,
  source TEXT,
  context_kind TEXT,
  context_id TEXT,
  category TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('study','test')),
  country TEXT, region TEXT, region_code TEXT, city TEXT, timezone TEXT, metro_code TEXT,
  latitude_rounded REAL, longitude_rounded REAL
);
CREATE INDEX IF NOT EXISTS idx_resource_received_at ON resource_events(received_at);
CREATE INDEX IF NOT EXISTS idx_resource_cohort ON resource_events(cohort);
CREATE INDEX IF NOT EXISTS idx_resource_chabura ON resource_events(chabura);
CREATE INDEX IF NOT EXISTS idx_resource_type_id ON resource_events(resource_type,resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_location ON resource_events(country,region,city);
CREATE INDEX IF NOT EXISTS idx_resource_category ON resource_events(category);


CREATE TABLE IF NOT EXISTS feedback_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_event_id TEXT NOT NULL UNIQUE,
  installation_id TEXT NOT NULL,
  cohort TEXT NOT NULL,
  app_version TEXT,
  chabura TEXT,
  chabura_region TEXT,
  client_ts TEXT,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  parent_id TEXT,
  title TEXT,
  category TEXT,
  wording TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  source TEXT,
  context_json TEXT,
  country TEXT,
  region TEXT,
  region_code TEXT,
  city TEXT,
  timezone TEXT,
  metro_code TEXT,
  latitude_rounded REAL,
  longitude_rounded REAL
);

CREATE TABLE IF NOT EXISTS feedback_issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  parent_id TEXT,
  title TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  first_report_at TEXT NOT NULL,
  last_report_at TEXT NOT NULL,
  report_count INTEGER NOT NULL DEFAULT 1,
  last_content_hash TEXT,
  last_wording TEXT,
  resolved_at TEXT,
  resolution_note TEXT,
  resolved_content_hash TEXT,
  updated_wording TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(content_type, content_id)
);

CREATE TABLE IF NOT EXISTS feedback_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  source TEXT NOT NULL,
  content_hash TEXT,
  wording TEXT,
  app_version TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_reports_content ON feedback_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_feedback_reports_received ON feedback_reports(received_at);
CREATE INDEX IF NOT EXISTS idx_feedback_reports_reason ON feedback_reports(reason);
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_unique_install_version ON feedback_reports(installation_id, content_type, content_id, content_hash);
CREATE INDEX IF NOT EXISTS idx_feedback_issues_status ON feedback_issues(status, last_report_at);
CREATE INDEX IF NOT EXISTS idx_feedback_revisions_content ON feedback_revisions(content_type, content_id, created_at);


CREATE TABLE IF NOT EXISTS feedback_admin_actions (
  action_id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  command_json TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  result_status TEXT,
  result_note TEXT
);


CREATE TABLE IF NOT EXISTS essay_round_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_event_id TEXT NOT NULL UNIQUE,
  installation_id TEXT NOT NULL,
  cohort TEXT NOT NULL,
  app_version TEXT,
  chabura TEXT,
  chabura_region TEXT,
  client_ts TEXT,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  event_type TEXT NOT NULL CHECK (event_type IN ('essay_round_start','essay_round_complete')),
  round_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  essay_id TEXT NOT NULL,
  source TEXT NOT NULL,
  attempt_in_round INTEGER NOT NULL,
  total_facts INTEGER NOT NULL,
  first_try_correct INTEGER,
  total_wrong INTEGER,
  perfect INTEGER,
  duration_bucket TEXT,
  essay_content_hash TEXT,
  country TEXT,
  region TEXT,
  region_code TEXT,
  city TEXT,
  timezone TEXT,
  metro_code TEXT,
  latitude_rounded REAL,
  longitude_rounded REAL
);
CREATE INDEX IF NOT EXISTS idx_essay_round_received ON essay_round_events(received_at);
CREATE INDEX IF NOT EXISTS idx_essay_round_chabura ON essay_round_events(chabura);
CREATE INDEX IF NOT EXISTS idx_essay_round_essay ON essay_round_events(essay_id, event_type);
CREATE INDEX IF NOT EXISTS idx_essay_round_install_essay ON essay_round_events(installation_id, essay_id);
CREATE INDEX IF NOT EXISTS idx_essay_round_round ON essay_round_events(round_id);

CREATE TABLE IF NOT EXISTS essay_pairing_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_event_id TEXT NOT NULL UNIQUE,
  installation_id TEXT NOT NULL,
  cohort TEXT NOT NULL,
  app_version TEXT,
  chabura TEXT,
  chabura_region TEXT,
  client_ts TEXT,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  round_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  essay_id TEXT NOT NULL,
  fact_id TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  first_try INTEGER NOT NULL,
  presented_choice_ids_json TEXT NOT NULL,
  wrong_choice_ids_json TEXT NOT NULL,
  response_time_bucket TEXT NOT NULL,
  fact_content_hash TEXT,
  audio_used INTEGER NOT NULL DEFAULT 0,
  country TEXT,
  region TEXT,
  region_code TEXT,
  city TEXT,
  timezone TEXT,
  metro_code TEXT,
  latitude_rounded REAL,
  longitude_rounded REAL
);
CREATE INDEX IF NOT EXISTS idx_essay_pair_received ON essay_pairing_events(received_at);
CREATE INDEX IF NOT EXISTS idx_essay_pair_chabura ON essay_pairing_events(chabura);
CREATE INDEX IF NOT EXISTS idx_essay_pair_fact ON essay_pairing_events(essay_id, fact_id);
CREATE INDEX IF NOT EXISTS idx_essay_pair_install_fact ON essay_pairing_events(installation_id, fact_id);
CREATE INDEX IF NOT EXISTS idx_essay_pair_round ON essay_pairing_events(round_id);


CREATE TABLE IF NOT EXISTS learner_profiles (
  installation_id TEXT PRIMARY KEY,
  cohort TEXT NOT NULL,
  chabura TEXT NOT NULL,
  chabura_region TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_learner_profiles_chabura ON learner_profiles(chabura);


-- Runtime terminology calls cohort a Zman. Existing analytics tables retain the
-- legacy column name "cohort" for backward-compatible D1 migrations.
CREATE TABLE IF NOT EXISTS app_notifications (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  zman TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  target_installation_id TEXT,
  content_type TEXT,
  content_id TEXT,
  body_html TEXT,
  action_json TEXT,
  dedupe_key TEXT UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_app_notifications_feed ON app_notifications(zman, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_notifications_target ON app_notifications(target_installation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_state (
  notification_id TEXT NOT NULL, installation_id TEXT NOT NULL, read_at TEXT, archived_at TEXT, updated_at TEXT NOT NULL,
  PRIMARY KEY(notification_id, installation_id)
);
CREATE INDEX IF NOT EXISTS idx_notification_state_install ON notification_state(installation_id, archived_at, read_at);
CREATE TABLE IF NOT EXISTS push_config (
  id INTEGER PRIMARY KEY CHECK (id=1), public_key TEXT NOT NULL, private_key TEXT NOT NULL, subject TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint TEXT PRIMARY KEY, installation_id TEXT NOT NULL, zman TEXT NOT NULL, p256dh TEXT NOT NULL, auth TEXT NOT NULL,
  timezone TEXT NOT NULL, reminder_enabled INTEGER NOT NULL DEFAULT 0, reminder_time TEXT, israel_calendar INTEGER NOT NULL DEFAULT 0,
  last_reminder_local_date TEXT, latitude_rounded REAL, longitude_rounded REAL, device_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_push_installation ON push_subscriptions(installation_id, zman);
CREATE INDEX IF NOT EXISTS idx_push_reminders ON push_subscriptions(reminder_enabled, reminder_time);

CREATE TABLE IF NOT EXISTS sync_accounts (
  learner_id TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sync_devices (
  device_id TEXT PRIMARY KEY, learner_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  created_at TEXT NOT NULL, last_seen_at TEXT NOT NULL, revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sync_devices_learner ON sync_devices(learner_id, revoked_at);
CREATE TABLE IF NOT EXISTS sync_pair_codes (
  code_hash TEXT PRIMARY KEY, learner_id TEXT NOT NULL, created_by_device_id TEXT NOT NULL,
  expires_at TEXT NOT NULL, used_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sync_pair_expiry ON sync_pair_codes(expires_at, used_at);
CREATE TABLE IF NOT EXISTS sync_zman_generations (
  learner_id TEXT NOT NULL, zman TEXT NOT NULL, generation INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL,
  PRIMARY KEY(learner_id, zman)
);
CREATE TABLE IF NOT EXISTS sync_ops (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, learner_id TEXT NOT NULL, zman TEXT NOT NULL, generation INTEGER NOT NULL,
  op_id TEXT NOT NULL, device_id TEXT NOT NULL, kind TEXT NOT NULL, payload_json TEXT NOT NULL,
  client_ts TEXT, created_at TEXT NOT NULL, UNIQUE(learner_id, op_id)
);
CREATE INDEX IF NOT EXISTS idx_sync_ops_learner_seq ON sync_ops(learner_id, seq);
