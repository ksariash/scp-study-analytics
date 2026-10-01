CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_event_id TEXT NOT NULL UNIQUE,
  installation_id TEXT NOT NULL,
  cohort TEXT NOT NULL,
  app_version TEXT,
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
CREATE INDEX IF NOT EXISTS idx_glossary_term ON glossary_events(term_id);
CREATE INDEX IF NOT EXISTS idx_glossary_location ON glossary_events(country, region, city);
CREATE INDEX IF NOT EXISTS idx_glossary_category ON glossary_events(category);


CREATE TABLE IF NOT EXISTS feedback_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_event_id TEXT NOT NULL UNIQUE,
  installation_id TEXT NOT NULL,
  cohort TEXT NOT NULL,
  app_version TEXT,
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
CREATE INDEX IF NOT EXISTS idx_essay_round_essay ON essay_round_events(essay_id, event_type);
CREATE INDEX IF NOT EXISTS idx_essay_round_install_essay ON essay_round_events(installation_id, essay_id);
CREATE INDEX IF NOT EXISTS idx_essay_round_round ON essay_round_events(round_id);

CREATE TABLE IF NOT EXISTS essay_pairing_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_event_id TEXT NOT NULL UNIQUE,
  installation_id TEXT NOT NULL,
  cohort TEXT NOT NULL,
  app_version TEXT,
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
CREATE INDEX IF NOT EXISTS idx_essay_pair_fact ON essay_pairing_events(essay_id, fact_id);
CREATE INDEX IF NOT EXISTS idx_essay_pair_install_fact ON essay_pairing_events(installation_id, fact_id);
CREATE INDEX IF NOT EXISTS idx_essay_pair_round ON essay_pairing_events(round_id);
