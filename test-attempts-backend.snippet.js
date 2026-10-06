let testAttemptsReady = false;

async function ensureTestAttemptsTable(env) {
  if (testAttemptsReady) return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS test_attempts (
    event_id TEXT PRIMARY KEY,
    installation_id TEXT NOT NULL,
    cohort TEXT NOT NULL,
    app_version TEXT,
    client_ts TEXT,
    started_at TEXT,
    ended_at TEXT,
    received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    reason TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    question_total INTEGER NOT NULL DEFAULT 0,
    question_answered INTEGER NOT NULL DEFAULT 0,
    correct INTEGER NOT NULL DEFAULT 0,
    partial INTEGER NOT NULL DEFAULT 0,
    incorrect INTEGER NOT NULL DEFAULT 0,
    unanswered INTEGER NOT NULL DEFAULT 0,
    score_pct REAL NOT NULL DEFAULT 0,
    essay_total INTEGER NOT NULL DEFAULT 0,
    essay_answered INTEGER NOT NULL DEFAULT 0,
    essay_pair_correct INTEGER NOT NULL DEFAULT 0,
    essay_pair_total INTEGER NOT NULL DEFAULT 0,
    essay_score_pct REAL NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    followup_questions INTEGER NOT NULL DEFAULT 0,
    followup_essays INTEGER NOT NULL DEFAULT 0,
    followup_pairings INTEGER NOT NULL DEFAULT 0,
    timezone TEXT,
    country TEXT,
    region TEXT,
    region_code TEXT,
    city TEXT
  )`).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_test_attempts_received ON test_attempts(received_at)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_test_attempts_cohort ON test_attempts(cohort, received_at)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_test_attempts_installation ON test_attempts(installation_id, received_at)').run();
  testAttemptsReady = true;
}

function finiteInt(value, min = 0, max = 1000000) {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
}
function finitePct(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}
function normalizeTestAttempt(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid test attempt');
  const eventId = text(raw.eventId, 140);
  const installationId = text(raw.installationId, 100);
  const cohort = normalizeZman(raw.zman ?? raw.cohort);
  catalogForZman(cohort);
  const reason = text(raw.reason, 20) || 'completed';
  if (!['completed','time','exited'].includes(reason)) throw new Error('Invalid test completion reason');
  if (!eventId || !installationId || !cohort) throw new Error('Malformed test attempt');
  return {
    eventId,
    installationId,
    cohort,
    appVersion:text(raw.appVersion, 32),
    clientTs:validIsoDate(raw.clientTs),
    startedAt:validIsoDate(raw.startedAt),
    endedAt:validIsoDate(raw.endedAt) || validIsoDate(raw.clientTs),
    reason,
    completed:boolInt(raw.completed),
    questionTotal:finiteInt(raw.questionTotal, 0, 10000),
    questionAnswered:finiteInt(raw.questionAnswered, 0, 10000),
    correct:finiteInt(raw.correct, 0, 10000),
    partial:finiteInt(raw.partial, 0, 10000),
    incorrect:finiteInt(raw.incorrect, 0, 10000),
    unanswered:finiteInt(raw.unanswered, 0, 10000),
    scorePct:finitePct(raw.scorePct),
    essayTotal:finiteInt(raw.essayTotal, 0, 1000),
    essayAnswered:finiteInt(raw.essayAnswered, 0, 1000),
    essayPairCorrect:finiteInt(raw.essayPairCorrect, 0, 10000),
    essayPairTotal:finiteInt(raw.essayPairTotal, 0, 10000),
    essayScorePct:finitePct(raw.essayScorePct),
    durationMs:finiteInt(raw.durationMs, 0, 24 * 60 * 60 * 1000),
    followUpQuestionCount:finiteInt(raw.followUpQuestionCount, 0, 10000),
    followUpEssayCount:finiteInt(raw.followUpEssayCount, 0, 1000),
    followUpPairingCount:finiteInt(raw.followUpPairingCount, 0, 10000),
    timezone:text(raw.timezone, 80)
  };
}

async function ingestTestAttempt(request, env) {
  const cors = eventCors(request, env);
  if (!cors) return jsonResponse({ error:'Origin not allowed' }, { status:403 });
  let body;
  try { body = await request.json(); } catch (_) { return jsonResponse({ error:'Invalid JSON' }, { status:400, headers:cors }); }
  let test;
  try { test = normalizeTestAttempt(body); } catch (error) { return jsonResponse({ error:error.message || 'Invalid test attempt' }, { status:400, headers:cors }); }
  await ensureTestAttemptsTable(env);
  const cf = request.cf || {};
  const timezone = test.timezone || text(cf.timezone, 80);
  const result = await env.DB.prepare(`INSERT OR IGNORE INTO test_attempts (
    event_id,installation_id,cohort,app_version,client_ts,started_at,ended_at,reason,completed,
    question_total,question_answered,correct,partial,incorrect,unanswered,score_pct,
    essay_total,essay_answered,essay_pair_correct,essay_pair_total,essay_score_pct,duration_ms,
    followup_questions,followup_essays,followup_pairings,timezone,country,region,region_code,city
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
    test.eventId,test.installationId,test.cohort,test.appVersion,test.clientTs,test.startedAt,test.endedAt,test.reason,test.completed,
    test.questionTotal,test.questionAnswered,test.correct,test.partial,test.incorrect,test.unanswered,test.scorePct,
    test.essayTotal,test.essayAnswered,test.essayPairCorrect,test.essayPairTotal,test.essayScorePct,test.durationMs,
    test.followUpQuestionCount,test.followUpEssayCount,test.followUpPairingCount,timezone,
    text(cf.country,8),text(cf.region,100),text(cf.regionCode,20),text(cf.city,100)
  ).run();
  return jsonResponse({ ok:true, accepted:Number(result?.meta?.changes || 0) }, { headers:cors });
}

function testAttemptFilter(url) {
  const clauses = [];
  const params = [];
  const cohort = normalizeZman(url.searchParams.get('zman') || url.searchParams.get('cohort') || CURRENT_ZMAN);
  if (cohort) { clauses.push('cohort=?'); params.push(cohort); }
  for (const [param,column] of [['country','country'],['region','region'],['city','city']]) {
    const value = text(url.searchParams.get(param), 160);
    if (value) { clauses.push(`${column}=?`); params.push(value); }
  }
  const fromTs = validIsoDate(url.searchParams.get('fromTs'));
  const toTs = validIsoDate(url.searchParams.get('toTs'));
  if (fromTs) { clauses.push('COALESCE(ended_at,client_ts,received_at)>=?'); params.push(fromTs); }
  if (toTs) { clauses.push('COALESCE(ended_at,client_ts,received_at)<?'); params.push(toTs); }
  return { where:clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

function localDayForAttempt(row, overrideTimeZone) {
  const raw = row.ended_at || row.client_ts || row.received_at;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const tz = overrideTimeZone || row.timezone || 'UTC';
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone:tz, year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(date);
    const get = type => parts.find(part => part.type === type)?.value;
    const year=get('year'), month=get('month'), day=get('day');
    return year && month && day ? `${year}-${month}-${day}` : null;
  } catch (_) {
    return date.toISOString().slice(0,10);
  }
}

async function testAttemptSummary(request, env) {
  await ensureTestAttemptsTable(env);
  const url = new URL(request.url);
  const { where, params } = testAttemptFilter(url);
  const rows = resultsOf(await stmt(env, `SELECT * FROM test_attempts ${where} ORDER BY COALESCE(ended_at,client_ts,received_at) DESC LIMIT 250`, params).all());
  const tz = text(url.searchParams.get('tz'),80);
  const attempts = rows.map(row => ({
    id:row.event_id,
    installationId:row.installation_id,
    day:localDayForAttempt(row,tz),
    endedAt:row.ended_at || row.client_ts || row.received_at,
    reason:row.reason,
    completed:!!row.completed,
    questionTotal:Number(row.question_total)||0,
    questionAnswered:Number(row.question_answered)||0,
    correct:Number(row.correct)||0,
    partial:Number(row.partial)||0,
    incorrect:Number(row.incorrect)||0,
    unanswered:Number(row.unanswered)||0,
    scorePct:Number(row.score_pct)||0,
    essayTotal:Number(row.essay_total)||0,
    essayAnswered:Number(row.essay_answered)||0,
    essayPairCorrect:Number(row.essay_pair_correct)||0,
    essayPairTotal:Number(row.essay_pair_total)||0,
    essayScorePct:Number(row.essay_score_pct)||0,
    durationMs:Number(row.duration_ms)||0,
    followUpQuestions:Number(row.followup_questions)||0,
    followUpEssays:Number(row.followup_essays)||0,
    followUpPairings:Number(row.followup_pairings)||0
  }));
  const completed = attempts.filter(row => row.completed);
  return jsonResponse({
    generatedAt:new Date().toISOString(),
    attempts,
    overview:{
      attempts:attempts.length,
      learners:new Set(attempts.map(row => row.installationId)).size,
      completed:completed.length,
      averageScore:completed.length ? completed.reduce((sum,row)=>sum+row.scorePct,0)/completed.length : 0,
      averageEssayScore:completed.filter(row=>row.essayPairTotal).length
        ? completed.filter(row=>row.essayPairTotal).reduce((sum,row)=>sum+row.essayScorePct,0)/completed.filter(row=>row.essayPairTotal).length : 0
    }
  });
}
