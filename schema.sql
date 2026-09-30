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
