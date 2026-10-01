const FEEDBACK_TYPES = new Set(['question', 'essay_prompt', 'essay_pairing']);
const FEEDBACK_REASONS = new Set(['confusing', 'inaccurate', 'wording', 'incomplete', 'other']);
const FEEDBACK_STATUSES = new Set(['new', 'tracking', 'resolved', 'reopened']);
let feedbackTablesReady = false;

function feedbackHash(value) {
  let hash = 2166136261;
  const input = String(value || '');
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function feedbackCors(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = text(env.ALLOWED_ORIGIN, 300);
  if (!origin || !allowed || origin !== allowed) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-SCP-Analytics-Version',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function sameOriginMutation(request) {
  const origin = request.headers.get('Origin');
  const url = new URL(request.url);
  return !origin || origin === url.origin;
}

async function ensureFeedbackTables(env) {
  if (feedbackTablesReady) return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS feedback_reports (
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
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS feedback_issues (
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
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS feedback_revisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    source TEXT NOT NULL,
    content_hash TEXT,
    wording TEXT,
    app_version TEXT,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_feedback_reports_content ON feedback_reports(content_type, content_id)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_feedback_reports_received ON feedback_reports(received_at)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_feedback_reports_reason ON feedback_reports(reason)').run();
  await env.DB.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_unique_install_version ON feedback_reports(installation_id, content_type, content_id, content_hash)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_feedback_issues_status ON feedback_issues(status, last_report_at)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_feedback_revisions_content ON feedback_revisions(content_type, content_id, created_at)').run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS feedback_admin_actions (
    action_id TEXT PRIMARY KEY,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    command_json TEXT NOT NULL,
    applied_at TEXT NOT NULL,
    result_status TEXT,
    result_note TEXT
  )`).run();
  feedbackTablesReady = true;
}

function normalizeFeedbackReport(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid feedback');
  const eventId = text(raw.eventId, 100);
  const installationId = text(raw.installationId, 100);
  const cohort = text(raw.cohort, 100);
  const appVersion = text(raw.appVersion, 32);
  const contentType = text(raw.contentType, 32);
  const contentId = text(raw.contentId, 100);
  const parentId = text(raw.parentId, 100);
  const title = text(raw.title, 240);
  const category = text(raw.category, 180);
  const wording = text(raw.wording, 6000);
  const contentHash = text(raw.contentHash, 64) || feedbackHash(wording);
  const reason = text(raw.reason, 32);
  const details = text(raw.details, 500);
  const source = text(raw.source, 40) || 'other';
  let context = {};
  if (raw.context && typeof raw.context === 'object') context = raw.context;
  const contextJson = JSON.stringify(context).slice(0, 5000);
  if (!eventId || !installationId || !cohort || !FEEDBACK_TYPES.has(contentType) || !contentId || !wording || !FEEDBACK_REASONS.has(reason)) {
    throw new Error('Malformed feedback');
  }
  return {
    eventId, installationId, cohort, appVersion, clientTs: validIsoDate(raw.clientTs),
    contentType, contentId, parentId, title, category, wording, contentHash, reason, details, source, contextJson
  };
}

async function ingestFeedbackReport(request, env) {
  const cors = feedbackCors(request, env);
  if (!cors) return jsonResponse({ error: 'Origin not allowed' }, { status: 403 });
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > 25000) return jsonResponse({ error: 'Feedback payload too large' }, { status: 413, headers: cors });
  let body;
  try { body = await request.json(); } catch (_) { return jsonResponse({ error: 'Invalid JSON' }, { status: 400, headers: cors }); }
  let report;
  try { report = normalizeFeedbackReport(body); } catch (err) { return jsonResponse({ error: err.message || 'Invalid feedback' }, { status: 400, headers: cors }); }

  await ensureFeedbackTables(env);
  const cf = request.cf || {};
  const geo = {
    country: text(cf.country, 8), region: text(cf.region, 100), regionCode: text(cf.regionCode, 20), city: text(cf.city, 100),
    timezone: text(cf.timezone, 80), metroCode: text(cf.metroCode, 20), latitude: roundCoord(cf.latitude), longitude: roundCoord(cf.longitude)
  };

  const priorIssue = await env.DB.prepare('SELECT status, resolved_content_hash FROM feedback_issues WHERE content_type=? AND content_id=?')
    .bind(report.contentType, report.contentId).first();
  const shouldAutoReopen = priorIssue?.status === 'resolved';
  const wordingChangedSinceResolution = shouldAutoReopen
    && String(priorIssue?.resolved_content_hash || '') !== String(report.contentHash || '');

  const insert = await env.DB.prepare(`INSERT OR IGNORE INTO feedback_reports (
    client_event_id, installation_id, cohort, app_version, client_ts, content_type, content_id, parent_id, title, category,
    wording, content_hash, reason, details, source, context_json, country, region, region_code, city, timezone, metro_code, latitude_rounded, longitude_rounded
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
    report.eventId, report.installationId, report.cohort, report.appVersion, report.clientTs, report.contentType, report.contentId,
    report.parentId, report.title, report.category, report.wording, report.contentHash, report.reason, report.details, report.source,
    report.contextJson, geo.country, geo.region, geo.regionCode, geo.city, geo.timezone, geo.metroCode, geo.latitude, geo.longitude
  ).run();

  const changed = Number(insert?.meta?.changes || 0) > 0;
  if (changed) {
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO feedback_issues (
      content_type, content_id, parent_id, title, category, status, first_report_at, last_report_at, report_count,
      last_content_hash, last_wording, updated_at
    ) VALUES (?,?,?,?,?,'new',?,?,1,?,?,?)
    ON CONFLICT(content_type, content_id) DO UPDATE SET
      parent_id=excluded.parent_id,
      title=excluded.title,
      category=excluded.category,
      last_report_at=excluded.last_report_at,
      report_count=feedback_issues.report_count + 1,
      status=CASE
        WHEN feedback_issues.status='resolved' THEN 'reopened'
        ELSE feedback_issues.status
      END,
      resolved_at=CASE
        WHEN feedback_issues.status='resolved' THEN NULL
        ELSE feedback_issues.resolved_at
      END,
      last_content_hash=excluded.last_content_hash,
      last_wording=excluded.last_wording,
      updated_at=excluded.updated_at`).bind(
      report.contentType, report.contentId, report.parentId, report.title, report.category,
      now, now, report.contentHash, report.wording, now
    ).run();

    const existingRevision = await env.DB.prepare(`SELECT id FROM feedback_revisions
      WHERE content_type=? AND content_id=? AND source='report' AND content_hash=? LIMIT 1`)
      .bind(report.contentType, report.contentId, report.contentHash).first();
    if (!existingRevision) {
      await env.DB.prepare(`INSERT INTO feedback_revisions
        (content_type, content_id, source, content_hash, wording, app_version, note, created_at)
        VALUES (?,?,'report',?,?,?,?,?)`)
        .bind(report.contentType, report.contentId, report.contentHash, report.wording, report.appVersion, 'Wording reported by a student', now).run();
    }
    if (shouldAutoReopen) {
      await env.DB.prepare(`INSERT INTO feedback_revisions
        (content_type, content_id, source, content_hash, wording, app_version, note, created_at)
        VALUES (?,?,'status:reopened',?,?,?,?,?)`)
        .bind(
          report.contentType, report.contentId, report.contentHash, report.wording, report.appVersion,
          wordingChangedSinceResolution
            ? 'Automatically reopened because feedback was submitted on changed wording'
            : 'Automatically reopened because new feedback arrived after resolution',
          now
        ).run();
    }
  }

  return jsonResponse({ ok: true, accepted: changed ? 1 : 0 }, { headers: cors });
}

function feedbackIssueFilters(url) {
  const clauses = [];
  const params = [];
  const type = text(url.searchParams.get('type'), 32);
  const reason = text(url.searchParams.get('reason'), 32);
  const cohort = text(url.searchParams.get('cohort'), 100);
  const category = text(url.searchParams.get('category'), 180);
  const search = text(url.searchParams.get('search'), 120);
  const from = text(url.searchParams.get('from'), 10);
  const to = text(url.searchParams.get('to'), 10);
  const includeResolved = url.searchParams.get('includeResolved') === '1';
  const status = text(url.searchParams.get('status'), 20);
  if (type && FEEDBACK_TYPES.has(type)) { clauses.push('i.content_type=?'); params.push(type); }
  if (status && FEEDBACK_STATUSES.has(status)) { clauses.push('i.status=?'); params.push(status); }
  else if (!includeResolved) clauses.push("i.status != 'resolved'");
  if (reason && FEEDBACK_REASONS.has(reason)) { clauses.push('r.reason=?'); params.push(reason); }
  if (cohort) { clauses.push('r.cohort=?'); params.push(cohort); }
  if (category) { clauses.push('i.category=?'); params.push(category); }
  if (search) {
    clauses.push('(LOWER(COALESCE(i.title,\'\')) LIKE ? OR LOWER(COALESCE(i.category,\'\')) LIKE ? OR LOWER(i.content_id) LIKE ?)');
    const like = `%${search.toLowerCase()}%`;
    params.push(like, like, like);
  }
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) { clauses.push('r.received_at>=?'); params.push(`${from}T00:00:00.000Z`); }
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    const d = new Date(`${to}T00:00:00.000Z`); d.setUTCDate(d.getUTCDate()+1);
    clauses.push('r.received_at<?'); params.push(d.toISOString());
  }
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

async function feedbackIssues(request, env) {
  await ensureFeedbackTables(env);
  const url = new URL(request.url);
  const { where, params } = feedbackIssueFilters(url);
  const rows = await env.DB.prepare(`SELECT
      i.content_type, i.content_id, i.parent_id, i.title, i.category, i.status,
      i.first_report_at, i.last_report_at, i.report_count total_reports, i.last_wording,
      i.updated_wording, i.resolution_note, i.resolved_at,
      COUNT(r.id) matching_reports,
      COUNT(DISTINCT r.installation_id) learners,
      SUM(CASE WHEN r.reason='confusing' THEN 1 ELSE 0 END) confusing,
      SUM(CASE WHEN r.reason='inaccurate' THEN 1 ELSE 0 END) inaccurate,
      SUM(CASE WHEN r.reason='wording' THEN 1 ELSE 0 END) wording_count,
      SUM(CASE WHEN r.reason='incomplete' THEN 1 ELSE 0 END) incomplete,
      SUM(CASE WHEN r.reason='other' THEN 1 ELSE 0 END) other
    FROM feedback_issues i
    JOIN feedback_reports r ON r.content_type=i.content_type AND r.content_id=i.content_id
    ${where}
    GROUP BY i.content_type, i.content_id
    ORDER BY CASE i.status WHEN 'reopened' THEN 0 WHEN 'new' THEN 1 WHEN 'tracking' THEN 2 ELSE 3 END,
      matching_reports DESC, i.last_report_at DESC`).bind(...params).all();

  return jsonResponse({
    generatedAt: new Date().toISOString(),
    issues: resultsOf(rows).map(r => ({
      contentType: r.content_type,
      contentId: r.content_id,
      parentId: r.parent_id,
      title: r.title,
      category: r.category,
      status: r.status,
      firstReportAt: r.first_report_at,
      lastReportAt: r.last_report_at,
      totalReports: Number(r.total_reports) || 0,
      matchingReports: Number(r.matching_reports) || 0,
      learners: Number(r.learners) || 0,
      lastWording: r.last_wording,
      updatedWording: r.updated_wording,
      resolutionNote: r.resolution_note,
      resolvedAt: r.resolved_at,
      reasons: {
        confusing: Number(r.confusing)||0,
        inaccurate: Number(r.inaccurate)||0,
        wording: Number(r.wording_count)||0,
        incomplete: Number(r.incomplete)||0,
        other: Number(r.other)||0
      }
    }))
  });
}

async function feedbackDetail(request, env) {
  await ensureFeedbackTables(env);
  const url = new URL(request.url);
  const type = text(url.searchParams.get('type'), 32);
  const id = text(url.searchParams.get('id'), 100);
  if (!FEEDBACK_TYPES.has(type) || !id) return jsonResponse({ error: 'Invalid content reference' }, { status: 400 });

  const issue = await env.DB.prepare(`SELECT * FROM feedback_issues WHERE content_type=? AND content_id=?`).bind(type, id).first();
  if (!issue) return jsonResponse({ error: 'Issue not found' }, { status: 404 });
  const [reportsResult, revisionsResult, reasonResult] = await Promise.all([
    env.DB.prepare(`SELECT id, cohort, app_version, client_ts, received_at, reason, details, source, wording, content_hash, context_json,
      country, region, city FROM feedback_reports WHERE content_type=? AND content_id=? ORDER BY received_at DESC`).bind(type,id).all(),
    env.DB.prepare(`SELECT id, source, content_hash, wording, app_version, note, created_at
      FROM feedback_revisions WHERE content_type=? AND content_id=? ORDER BY created_at, id`).bind(type,id).all(),
    env.DB.prepare(`SELECT reason, COUNT(*) count FROM feedback_reports WHERE content_type=? AND content_id=? GROUP BY reason ORDER BY count DESC`).bind(type,id).all()
  ]);
  const learners = await env.DB.prepare(`SELECT COUNT(DISTINCT installation_id) learners FROM feedback_reports WHERE content_type=? AND content_id=?`).bind(type,id).first();

  return jsonResponse({
    issue: {
      contentType: issue.content_type, contentId: issue.content_id, parentId: issue.parent_id, title: issue.title, category: issue.category,
      status: issue.status, firstReportAt: issue.first_report_at, lastReportAt: issue.last_report_at, reportCount: Number(issue.report_count)||0,
      learners: Number(learners?.learners)||0, lastContentHash: issue.last_content_hash, lastWording: issue.last_wording,
      resolvedAt: issue.resolved_at, resolutionNote: issue.resolution_note, resolvedContentHash: issue.resolved_content_hash,
      updatedWording: issue.updated_wording, updatedAt: issue.updated_at
    },
    reasons: resultsOf(reasonResult).map(r => ({ reason:r.reason, count:Number(r.count)||0 })),
    reports: resultsOf(reportsResult).map(r => {
      let context = {};
      try { context = JSON.parse(r.context_json || '{}'); } catch (_) {}
      return {
        id:r.id, cohort:r.cohort, appVersion:r.app_version, clientTs:r.client_ts, receivedAt:r.received_at,
        reason:r.reason, details:r.details, source:r.source, wording:r.wording, contentHash:r.content_hash, context,
        location:[r.city,r.region,r.country].filter(Boolean).join(', ')
      };
    }),
    revisions: resultsOf(revisionsResult).map(r => ({
      id:r.id, source:r.source, contentHash:r.content_hash, wording:r.wording, appVersion:r.app_version, note:r.note, createdAt:r.created_at
    }))
  });
}

async function applyFeedbackStatusChange(env, input, source = 'dashboard') {
  await ensureFeedbackTables(env);
  const type = text(input?.contentType, 32);
  const id = text(input?.contentId, 100);
  const status = text(input?.status, 20);
  const note = text(input?.resolutionNote, 1000);
  const updatedWording = text(input?.updatedWording, 6000);
  if (!FEEDBACK_TYPES.has(type) || !id || !FEEDBACK_STATUSES.has(status)) {
    throw new Error('Invalid status update');
  }
  const issue = await env.DB.prepare('SELECT * FROM feedback_issues WHERE content_type=? AND content_id=?').bind(type,id).first();
  if (!issue) throw new Error('Issue not found');
  const now = new Date().toISOString();
  const resolvedHash = status === 'resolved'
    ? (updatedWording ? feedbackHash(updatedWording) : issue.last_content_hash)
    : issue.resolved_content_hash;

  await env.DB.prepare(`UPDATE feedback_issues SET status=?, resolved_at=?, resolution_note=?, resolved_content_hash=?,
      updated_wording=?, updated_at=? WHERE content_type=? AND content_id=?`).bind(
    status,
    status === 'resolved' ? now : null,
    note || issue.resolution_note || null,
    resolvedHash || null,
    updatedWording || issue.updated_wording || null,
    now, type, id
  ).run();

  await env.DB.prepare(`INSERT INTO feedback_revisions
    (content_type, content_id, source, content_hash, wording, app_version, note, created_at)
    VALUES (?,?,?,?,?,?,?,?)`).bind(
    type, id, source === 'dashboard' ? `status:${status}` : `${source}:${status}`,
    updatedWording ? feedbackHash(updatedWording) : null,
    updatedWording || null, null, note || `Status changed to ${status}`, now
  ).run();

  return { ok:true, status, contentType:type, contentId:id, appliedAt:now };
}

async function updateFeedbackStatus(request, env) {
  if (!sameOriginMutation(request)) return jsonResponse({ error: 'Same-origin request required' }, { status: 403 });
  let body;
  try { body = await request.json(); } catch (_) { return jsonResponse({ error: 'Invalid JSON' }, { status: 400 }); }
  try {
    return jsonResponse(await applyFeedbackStatusChange(env, body, 'dashboard'));
  } catch (err) {
    return jsonResponse({ error: err?.message || 'Could not update feedback issue' }, { status: err?.message === 'Issue not found' ? 404 : 400 });
  }
}

function normalizedAdminActions() {
  const manifest = FEEDBACK_ADMIN_ACTIONS && typeof FEEDBACK_ADMIN_ACTIONS === 'object' ? FEEDBACK_ADMIN_ACTIONS : {};
  const actions = Array.isArray(manifest.actions) ? manifest.actions : [];
  return actions.map(raw => ({
    actionId: text(raw?.actionId, 120),
    contentType: text(raw?.contentType, 32),
    contentId: text(raw?.contentId, 100),
    status: text(raw?.status, 20),
    resolutionNote: text(raw?.resolutionNote, 1000),
    updatedWording: text(raw?.updatedWording, 6000),
    approvedAt: text(raw?.approvedAt, 40),
    approvalRef: text(raw?.approvalRef, 200)
  })).filter(action => action.actionId && FEEDBACK_TYPES.has(action.contentType) && action.contentId && FEEDBACK_STATUSES.has(action.status));
}

async function applyFeedbackAdminActions(env) {
  await ensureFeedbackTables(env);
  const actions = normalizedAdminActions();
  const results = [];
  for (const action of actions) {
    const existing = await env.DB.prepare('SELECT action_id, applied_at, result_status, result_note FROM feedback_admin_actions WHERE action_id=?')
      .bind(action.actionId).first();
    if (existing) {
      results.push({ actionId:action.actionId, state:'already_applied', appliedAt:existing.applied_at, status:existing.result_status });
      continue;
    }
    try {
      const result = await applyFeedbackStatusChange(env, action, 'approved-manifest');
      await env.DB.prepare(`INSERT INTO feedback_admin_actions
        (action_id, content_type, content_id, command_json, applied_at, result_status, result_note)
        VALUES (?,?,?,?,?,?,?)`).bind(
        action.actionId, action.contentType, action.contentId, JSON.stringify(action), result.appliedAt,
        result.status, action.resolutionNote || action.approvalRef || 'Approved via source-controlled manifest'
      ).run();
      results.push({ actionId:action.actionId, state:'applied', status:result.status, contentType:action.contentType, contentId:action.contentId });
    } catch (err) {
      results.push({ actionId:action.actionId, state:'pending', error:text(err?.message || 'Could not apply action', 240) });
    }
  }
  return { ok:true, manifestVersion:Number(FEEDBACK_ADMIN_ACTIONS?.version)||1, actions:results };
}

async function feedbackAdminSync(env) {
  const result = await applyFeedbackAdminActions(env);
  const applied = result.actions.filter(x => x.state === 'applied').length;
  const pending = result.actions.filter(x => x.state === 'pending').length;
  const alreadyApplied = result.actions.filter(x => x.state === 'already_applied').length;
  return jsonResponse({ ok:true, manifestVersion:result.manifestVersion, applied, pending, alreadyApplied });
}

function feedbackDetailPage() {
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>SCP Feedback Detail</title>
<style>
:root{--ink:#18263e;--muted:#6d7a8e;--line:#dfe6ef;--blue:#214d96;--bg:#f4f7fb;--green:#23623a;--red:#9a3440;--amber:#8b6500}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.wrap{max-width:980px;margin:0 auto;padding:22px 16px 60px}.top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:14px}
h1{font-size:1.35rem;margin:4px 0 0}h2{font-size:1rem;margin:0}.sub{color:var(--muted);font-size:.76rem;margin-top:5px}
.badge{display:inline-block;padding:5px 8px;border-radius:999px;background:#eaf0fb;color:#31569a;font-size:.66rem;font-weight:800;text-transform:capitalize}
.card{background:#fff;border:1px solid var(--line);border-radius:15px;padding:15px;margin-top:12px;box-shadow:0 5px 18px rgba(20,40,70,.035)}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.metric{padding:10px;border:1px solid var(--line);border-radius:11px;background:#fbfcfe}.metric b{display:block;font-size:1rem}.metric span{font-size:.65rem;color:var(--muted)}
.reasons{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.reason{padding:5px 7px;border-radius:999px;background:#f1f4f8;font-size:.66rem;font-weight:750}
.report{padding:12px 0;border-top:1px solid var(--line)}.report:first-child{border-top:0;padding-top:0}.report-head{display:flex;justify-content:space-between;gap:10px}.report p{margin:7px 0 0;font-size:.76rem;line-height:1.5}.meta{color:var(--muted);font-size:.65rem}
pre{white-space:pre-wrap;word-break:break-word;padding:10px;border-radius:10px;background:#f8fafc;border:1px solid var(--line);font:inherit;font-size:.7rem;line-height:1.45}
textarea{width:100%;min-height:92px;padding:9px;border:1px solid var(--line);border-radius:10px;font:inherit;font-size:.75rem;resize:vertical}.field{margin-top:10px}.field label{display:block;font-size:.68rem;font-weight:800;margin-bottom:5px}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}button{border:1px solid #ccd7e6;border-radius:10px;padding:8px 11px;background:#fff;color:#31528d;font-weight:800;cursor:pointer}button.primary{background:#214d96;color:#fff;border-color:#214d96}button.danger{color:#8d3340}
.timeline{display:grid;gap:10px}.revision{border-left:3px solid #ccd8ea;padding-left:11px}.revision h3{margin:0;font-size:.78rem}.revision .meta{margin-top:3px}.diff{margin-top:7px;font-size:.71rem;line-height:1.55;padding:9px;border-radius:9px;background:#fbfcfe;border:1px solid var(--line)}ins{background:#dff4e6;text-decoration:none}del{background:#fde4e7;color:#7f2f38}
.empty{padding:18px;text-align:center;color:var(--muted)}.back{color:#31569a;text-decoration:none;font-size:.74rem;font-weight:800}
@media(max-width:650px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.top{flex-direction:column}.wrap{padding:14px 10px 40px}}
</style></head><body><main class="wrap"><a class="back" href="/dashboard">← Analytics dashboard</a><div id="root" class="card"><div class="empty">Loading feedback…</div></div></main>
<script>
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>v?new Date(v).toLocaleString():'—';
const typeLabel=v=>({question:'Question',essay_prompt:'Essay question',essay_pairing:'Essay pairing'}[v]||v);
function diffWords(a,b){
 const A=String(a||'').split(/(\s+)/),B=String(b||'').split(/(\s+)/);if(A.length*B.length>60000)return '<div><b>Before</b><pre>'+esc(a)+'</pre><b>After</b><pre>'+esc(b)+'</pre></div>';
 const dp=Array.from({length:A.length+1},()=>new Uint16Array(B.length+1));
 for(let i=A.length-1;i>=0;i--)for(let j=B.length-1;j>=0;j--)dp[i][j]=A[i]===B[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 let i=0,j=0,out='';while(i<A.length&&j<B.length){if(A[i]===B[j]){out+=esc(A[i]);i++;j++;}else if(dp[i+1][j]>=dp[i][j+1]){out+='<del>'+esc(A[i])+'</del>';i++;}else{out+='<ins>'+esc(B[j])+'</ins>';j++;}}
 while(i<A.length)out+='<del>'+esc(A[i++])+'</del>';while(j<B.length)out+='<ins>'+esc(B[j++])+'</ins>';return out;
}
async function api(path,options){const r=await fetch(path,{cache:'no-store',headers:{'Content-Type':'application/json'},...options});const d=await r.json();if(!r.ok)throw new Error(d.error||('Request failed '+r.status));return d}
async function load(){
 const p=new URLSearchParams(location.search),type=p.get('type'),id=p.get('id'),root=document.getElementById('root');
 try{
  const d=await api('/api/feedback/detail?type='+encodeURIComponent(type)+'&id='+encodeURIComponent(id));const i=d.issue;
  let prev='';const revisions=(d.revisions||[]).map(r=>{let body='';if(r.wording){body=prev?'<div class="diff">'+diffWords(prev,r.wording)+'</div>':'<pre>'+esc(r.wording)+'</pre>';prev=r.wording}return '<div class="revision"><h3>'+esc(r.source.replace('status:','Status: '))+'</h3><div class="meta">'+fmt(r.createdAt)+(r.appVersion?' · app v'+esc(r.appVersion):'')+'</div>'+(r.note?'<p>'+esc(r.note)+'</p>':'')+body+'</div>'}).join('');
  const reports=(d.reports||[]).map(r=>'<div class="report"><div class="report-head"><span class="badge">'+esc(r.reason)+'</span><span class="meta">'+fmt(r.receivedAt)+'</span></div>'+(r.details?'<p>'+esc(r.details)+'</p>':'<p class="meta">No additional details.</p>')+'<div class="meta">'+esc(r.source||'')+(r.appVersion?' · app v'+esc(r.appVersion):'')+(r.location?' · '+esc(r.location):'')+'</div><details><summary class="meta">Wording and context</summary><pre>'+esc(r.wording)+'</pre>'+(Object.keys(r.context||{}).length?'<pre>'+esc(JSON.stringify(r.context,null,2))+'</pre>':'')+'</details></div>').join('');
  root.innerHTML='<div class="top"><div><span class="badge">'+esc(typeLabel(i.contentType))+' · '+esc(i.status)+'</span><h1>'+esc(i.title||i.contentId)+'</h1><div class="sub">'+esc(i.category||'')+' · '+esc(i.contentId)+'</div></div><div class="meta">Last report '+fmt(i.lastReportAt)+'</div></div>'+
  '<div class="grid"><div class="metric"><b>'+i.reportCount+'</b><span>Reports</span></div><div class="metric"><b>'+i.learners+'</b><span>Learners</span></div><div class="metric"><b>'+esc(i.status)+'</b><span>Status</span></div><div class="metric"><b>'+fmt(i.firstReportAt).split(',')[0]+'</b><span>First reported</span></div></div>'+
  '<div class="reasons">'+(d.reasons||[]).map(x=>'<span class="reason">'+esc(x.reason)+' · '+x.count+'</span>').join('')+'</div>'+
  '<section class="card"><h2>Current reported wording</h2><pre>'+esc(i.lastWording||'')+'</pre>'+(i.updatedWording?'<h2>Recorded updated wording</h2><div class="diff">'+diffWords(i.lastWording||'',i.updatedWording)+'</div>':'')+'</section>'+
  '<section class="card"><h2>Tracking & resolution</h2><div class="field"><label>Resolution / tracking note</label><textarea id="note">'+esc(i.resolutionNote||'')+'</textarea></div><div class="field"><label>Updated wording (optional; used for the before/after history)</label><textarea id="wording">'+esc(i.updatedWording||'')+'</textarea></div><div class="actions"><button data-status="new">Mark new</button><button data-status="tracking">Track</button><button data-status="reopened">Reopen</button><button class="primary" data-status="resolved">Resolve</button></div><div id="saveStatus" class="meta"></div></section>'+
  '<section class="card"><h2>Wording & status history</h2><div class="timeline">'+(revisions||'<div class="empty">No revisions yet.</div>')+'</div></section>'+
  '<section class="card"><h2>Student reports</h2>'+(reports||'<div class="empty">No reports.</div>')+'</section>';
  root.querySelectorAll('[data-status]').forEach(btn=>btn.addEventListener('click',async()=>{const status=btn.dataset.status,save=document.getElementById('saveStatus');save.textContent='Saving…';try{await api('/api/feedback/status',{method:'POST',body:JSON.stringify({contentType:i.contentType,contentId:i.contentId,status,resolutionNote:document.getElementById('note').value.slice(0,1000),updatedWording:document.getElementById('wording').value.slice(0,6000)})});save.textContent='Saved.';setTimeout(load,250)}catch(e){save.textContent=e.message}}));
 }catch(e){root.innerHTML='<div class="empty">'+esc(e.message)+'</div>'}
}
load();
</script></body></html>`, {
    headers: {
      'Content-Type':'text/html; charset=utf-8',
      'Cache-Control':'no-cache',
      'X-Robots-Tag':'noindex, nofollow',
      'Referrer-Policy':'no-referrer',
      'X-Content-Type-Options':'nosniff'
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health' && request.method === 'GET') return jsonResponse({ ok:true, service:'scp-study-analytics', version:4, feedback:true });
    if (url.pathname === '/api/feedback/report' && request.method === 'OPTIONS') {
      const cors = feedbackCors(request, env);
      return cors ? new Response(null, { status:204, headers:cors }) : new Response(null, { status:403 });
    }
    if (url.pathname === '/api/feedback/report' && request.method === 'POST') return ingestFeedbackReport(request, env);
    if (url.pathname === '/api/feedback/issues' && request.method === 'GET') return feedbackIssues(request, env);
    if (url.pathname === '/api/feedback/detail' && request.method === 'GET') return feedbackDetail(request, env);
    if (url.pathname === '/api/feedback/status' && request.method === 'POST') return updateFeedbackStatus(request, env);
    if (url.pathname === '/api/admin/feedback-sync' && request.method === 'GET') return feedbackAdminSync(env);
    if (url.pathname === '/feedback-detail' && request.method === 'GET') return feedbackDetailPage();
    return __BASE_WORKER.fetch(request, env);
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(applyFeedbackAdminActions(env));
    if (typeof __BASE_WORKER.scheduled === 'function') return __BASE_WORKER.scheduled(controller, env, ctx);
  }
};
