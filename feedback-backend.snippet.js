import webpush from 'web-push';
import { getHolidaysOnDate, flags, GeoLocation, Zmanim } from '@hebcal/core';

const FEEDBACK_TYPES = new Set(['question', 'essay_prompt', 'essay_pairing']);
const FEEDBACK_REASONS = new Set(['inaccurate', 'incomplete', 'confusing', 'typo', 'audio_link', 'notes_link', 'other']);
const LEGACY_FEEDBACK_REASON_MAP = new Map([['wording','typo']]);
const FEEDBACK_STATUSES = new Set(['new', 'tracking', 'resolved', 'reopened']);
let feedbackTablesReady = false;
let notificationTablesReady = false;
let syncTablesReady = false;

function feedbackStorageId(zman, contentId) { return `${zman}::${contentId}`; }
function feedbackPublicId(contentId) {
  const value = String(contentId || '');
  const index = value.indexOf('::');
  return index >= 0 ? value.slice(index + 2) : value;
}

function feedbackHash(value) {
  let hash = 2166136261;
  const input = String(value || '');
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function normalizeFeedbackReasons(raw) {
  const values = Array.isArray(raw?.reasons) ? raw.reasons : [raw?.reason];
  return [...new Set(values.map(value => {
    const reason = text(value, 32);
    return LEGACY_FEEDBACK_REASON_MAP.get(reason) || reason;
  }).filter(reason => FEEDBACK_REASONS.has(reason)))].slice(0, FEEDBACK_REASONS.size);
}
function splitFeedbackReasons(value) {
  return [...new Set(String(value || '').split(',').map(item => LEGACY_FEEDBACK_REASON_MAP.get(item) || item).filter(item => FEEDBACK_REASONS.has(item)))];
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
  for (const legacy of LEGACY_ZMAN_KEYS) {
    if (legacy && legacy !== CURRENT_ZMAN) {
      await env.DB.prepare('UPDATE feedback_reports SET cohort=? WHERE cohort=?').bind(CURRENT_ZMAN, legacy).run();
    }
  }
  const prefix = CURRENT_ZMAN + '::';
  await env.DB.prepare("UPDATE feedback_reports SET content_id=? || content_id WHERE cohort=? AND instr(content_id,'::')=0").bind(prefix, CURRENT_ZMAN).run();
  await env.DB.prepare("UPDATE feedback_issues SET content_id=? || content_id WHERE instr(content_id,'::')=0").bind(prefix).run();
  await env.DB.prepare("UPDATE feedback_revisions SET content_id=? || content_id WHERE instr(content_id,'::')=0").bind(prefix).run();
  await env.DB.prepare("UPDATE feedback_admin_actions SET content_id=? || content_id WHERE instr(content_id,'::')=0").bind(prefix).run();
  feedbackTablesReady = true;
}

function normalizeFeedbackReport(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid feedback');
  const eventId = text(raw.eventId, 100);
  const installationId = text(raw.installationId, 100);
  const cohort = normalizeZman(raw.zman ?? raw.cohort);
  catalogForZman(cohort);
  const appVersion = text(raw.appVersion, 32);
  const contentType = text(raw.contentType, 32);
  const rawContentId = text(raw.contentId, 100);
  const contentId = rawContentId ? feedbackStorageId(cohort, rawContentId) : null;
  const parentId = text(raw.parentId, 100);
  const title = text(raw.title, 240);
  const category = text(raw.category, 180);
  const wording = text(raw.wording, 6000);
  const contentHash = text(raw.contentHash, 64) || feedbackHash(wording);
  const reasons = normalizeFeedbackReasons(raw);
  const reason = reasons.join(',');
  const details = text(raw.details, 500);
  const source = text(raw.source, 40) || 'other';
  let context = {};
  if (raw.context && typeof raw.context === 'object') context = raw.context;
  const contextJson = JSON.stringify(context).slice(0, 5000);
  if (!eventId || !installationId || !cohort || !FEEDBACK_TYPES.has(contentType) || !contentId || !wording || !reasons.length) {
    throw new Error('Malformed feedback');
  }
  return {
    eventId, installationId, cohort, appVersion, clientTs: validIsoDate(raw.clientTs),
    contentType, contentId, parentId, title, category, wording, contentHash, reason, reasons, details, source, contextJson
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
  const cohort = normalizeZman(url.searchParams.get('zman') || url.searchParams.get('cohort'));
  const category = text(url.searchParams.get('category'), 180);
  const search = text(url.searchParams.get('search'), 120);
  const from = text(url.searchParams.get('from'), 10);
  const to = text(url.searchParams.get('to'), 10);
  const includeResolved = url.searchParams.get('includeResolved') === '1';
  const status = text(url.searchParams.get('status'), 20);
  if (type && FEEDBACK_TYPES.has(type)) { clauses.push('i.content_type=?'); params.push(type); }
  if (status && FEEDBACK_STATUSES.has(status)) { clauses.push('i.status=?'); params.push(status); }
  else if (!includeResolved) clauses.push("i.status != 'resolved'");
  if (reason && FEEDBACK_REASONS.has(reason)) { clauses.push(reason === 'typo' ? "(instr(','||r.reason||',', ',typo,')>0 OR r.reason='wording')" : "instr(','||r.reason||',', ','||?||',')>0"); if (reason !== 'typo') params.push(reason); }
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
      r.cohort, i.content_type, i.content_id, i.parent_id, i.title, i.category, i.status,
      i.first_report_at, i.last_report_at, i.report_count total_reports, i.last_wording,
      i.updated_wording, i.resolution_note, i.resolved_at,
      COUNT(r.id) matching_reports,
      COUNT(DISTINCT r.installation_id) learners,
      SUM(CASE WHEN instr(','||r.reason||',', ',confusing,')>0 THEN 1 ELSE 0 END) confusing,
      SUM(CASE WHEN instr(','||r.reason||',', ',inaccurate,')>0 THEN 1 ELSE 0 END) inaccurate,
      SUM(CASE WHEN (instr(','||r.reason||',', ',typo,')>0 OR r.reason='wording') THEN 1 ELSE 0 END) typo,
      SUM(CASE WHEN instr(','||r.reason||',', ',incomplete,')>0 THEN 1 ELSE 0 END) incomplete,
      SUM(CASE WHEN instr(','||r.reason||',', ',notes_link,')>0 THEN 1 ELSE 0 END) notes_link,
      SUM(CASE WHEN instr(','||r.reason||',', ',audio_link,')>0 THEN 1 ELSE 0 END) audio_link,
      SUM(CASE WHEN instr(','||r.reason||',', ',other,')>0 THEN 1 ELSE 0 END) other
    FROM feedback_issues i
    JOIN feedback_reports r ON r.content_type=i.content_type AND r.content_id=i.content_id
    ${where}
    GROUP BY r.cohort, i.content_type, i.content_id
    ORDER BY CASE i.status WHEN 'reopened' THEN 0 WHEN 'new' THEN 1 WHEN 'tracking' THEN 2 ELSE 3 END,
      matching_reports DESC, i.last_report_at DESC`).bind(...params).all();

  return jsonResponse({
    generatedAt: new Date().toISOString(),
    issues: resultsOf(rows).map(r => ({
      contentType: r.content_type,
      contentId: feedbackPublicId(r.content_id),
      zman: normalizeZman(r.cohort || CURRENT_ZMAN),
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
        typo: Number(r.typo)||0,
        incomplete: Number(r.incomplete)||0,
        notes_link: Number(r.notes_link)||0,
        audio_link: Number(r.audio_link)||0,
        other: Number(r.other)||0
      }
    }))
  });
}

async function feedbackDetail(request, env) {
  await ensureFeedbackTables(env);
  const url = new URL(request.url);
  const type = text(url.searchParams.get('type'), 32);
  const zman = normalizeZman(url.searchParams.get('zman') || url.searchParams.get('cohort') || CURRENT_ZMAN);
  const publicId = text(url.searchParams.get('id'), 100);
  const id = publicId ? feedbackStorageId(zman, publicId) : null;
  if (!FEEDBACK_TYPES.has(type) || !id || !SUPPORTED_ZMANIM.has(zman)) {
    return jsonResponse({ error: 'Invalid content reference' }, { status: 400 });
  }

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
      contentType: issue.content_type, contentId: feedbackPublicId(issue.content_id), zman, parentId: issue.parent_id, title: issue.title, category: issue.category,
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
        id:r.id, zman:normalizeZman(r.cohort), cohort:normalizeZman(r.cohort), appVersion:r.app_version, clientTs:r.client_ts, receivedAt:r.received_at,
        reason:splitFeedbackReasons(r.reason).join(', '), reasons:splitFeedbackReasons(r.reason), details:r.details, source:r.source, wording:r.wording, contentHash:r.content_hash, context,
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
  const zman = normalizeZman(input?.zman || input?.cohort || CURRENT_ZMAN);
  const publicId = text(input?.contentId, 100);
  const id = publicId ? feedbackStorageId(zman, publicId) : null;
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

  if (status === 'resolved') {
    await createIssueResolvedNotifications(env, {
      zman,
      contentType: type,
      storageContentId: id,
      publicContentId: publicId,
      title: issue.title,
      note,
      resolvedHash
    });
  }
  return { ok:true, status, zman, contentType:type, contentId:publicId, appliedAt:now };
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
    zman: normalizeZman(raw?.zman || raw?.cohort || CURRENT_ZMAN),
    contentType: text(raw?.contentType, 32),
    contentId: text(raw?.contentId, 100),
    status: text(raw?.status, 20),
    resolutionNote: text(raw?.resolutionNote, 1000),
    updatedWording: text(raw?.updatedWording, 6000),
    approvedAt: text(raw?.approvedAt, 40),
    approvalRef: text(raw?.approvalRef, 200)
  })).filter(action => action.actionId && SUPPORTED_ZMANIM.has(action.zman) && FEEDBACK_TYPES.has(action.contentType) && action.contentId && FEEDBACK_STATUSES.has(action.status));
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
        action.actionId, action.contentType, feedbackStorageId(action.zman, action.contentId), JSON.stringify(action), result.appliedAt,
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



async function ensureNotificationTables(env) {
  if (notificationTablesReady) return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS app_notifications (
    id TEXT PRIMARY KEY, kind TEXT NOT NULL, zman TEXT, title TEXT NOT NULL, body TEXT NOT NULL,
    created_at TEXT NOT NULL, expires_at TEXT, target_installation_id TEXT, content_type TEXT,
    content_id TEXT, body_html TEXT, action_json TEXT, dedupe_key TEXT UNIQUE
  )`).run();
  try { await env.DB.prepare('ALTER TABLE app_notifications ADD COLUMN action_json TEXT').run(); }
  catch (error) { if (!/duplicate column/i.test(String(error?.message || error))) throw error; }
  try { await env.DB.prepare('ALTER TABLE app_notifications ADD COLUMN body_html TEXT').run(); }
  catch (error) { if (!/duplicate column/i.test(String(error?.message || error))) throw error; }
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS notification_state (
    notification_id TEXT NOT NULL, installation_id TEXT NOT NULL, read_at TEXT, archived_at TEXT,
    updated_at TEXT NOT NULL, PRIMARY KEY(notification_id, installation_id)
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS push_config (
    id INTEGER PRIMARY KEY CHECK (id=1), public_key TEXT NOT NULL, private_key TEXT NOT NULL,
    subject TEXT NOT NULL, created_at TEXT NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS push_subscriptions (
    endpoint TEXT PRIMARY KEY, installation_id TEXT NOT NULL, zman TEXT NOT NULL, p256dh TEXT NOT NULL,
    auth TEXT NOT NULL, timezone TEXT NOT NULL, reminder_enabled INTEGER NOT NULL DEFAULT 0,
    reminder_time TEXT, israel_calendar INTEGER NOT NULL DEFAULT 0, last_reminder_local_date TEXT,
    latitude_rounded REAL, longitude_rounded REAL, device_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`).run();
  for (const [column, type] of [['latitude_rounded','REAL'],['longitude_rounded','REAL'],['device_id','TEXT']]) {
    try { await env.DB.prepare(`ALTER TABLE push_subscriptions ADD COLUMN ${column} ${type}`).run(); }
    catch (error) { if (!/duplicate column/i.test(String(error?.message || error))) throw error; }
  }
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_app_notifications_feed ON app_notifications(zman, created_at DESC)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_app_notifications_target ON app_notifications(target_installation_id, created_at DESC)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_notification_state_install ON notification_state(installation_id, archived_at, read_at)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_push_installation ON push_subscriptions(installation_id, zman)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_push_reminders ON push_subscriptions(reminder_enabled, reminder_time)').run();
  notificationTablesReady = true;
}
function notificationCors(request, env, methods='GET, POST, DELETE, OPTIONS') {
  const origin=request.headers.get('Origin'),allowed=text(env.ALLOWED_ORIGIN,300);
  if(!origin||!allowed||origin!==allowed)return null;
  return {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':methods,'Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'86400','Vary':'Origin'};
}

const SYNC_OP_KINDS = new Set([
  'question_baseline','question_shown','question_answer','test_complete',
  'essay_fact_baseline','essay_fact','essay_round_baseline','essay_round',
  'chabura','category_filters','essay_filters','audio_state','reset'
]);
async function syncHash(value){
  const bytes=new TextEncoder().encode(String(value||'')),digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}
function syncRandomToken(bytes=32){
  const data=crypto.getRandomValues(new Uint8Array(bytes));
  let raw='';for(const byte of data)raw+=String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function syncPairCode(){
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',data=crypto.getRandomValues(new Uint8Array(16));
  let code='';for(let i=0;i<16;i++)code+=alphabet[data[i]%alphabet.length];
  return code.match(/.{1,4}/g).join('-');
}
function normalizePairCode(value){return String(value||'').toUpperCase().replace(/[^A-Z2-9]/g,'');}
function syncDeviceName(value){return text(value,80)||'Linked device';}
async function ensureSyncTables(env){
  if(syncTablesReady)return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sync_accounts (
    learner_id TEXT PRIMARY KEY, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sync_devices (
    device_id TEXT PRIMARY KEY, learner_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    created_at TEXT NOT NULL, last_seen_at TEXT NOT NULL, revoked_at TEXT
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sync_pair_codes (
    code_hash TEXT PRIMARY KEY, learner_id TEXT NOT NULL, created_by_device_id TEXT NOT NULL,
    expires_at TEXT NOT NULL, used_at TEXT
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sync_zman_generations (
    learner_id TEXT NOT NULL, zman TEXT NOT NULL, generation INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL,
    PRIMARY KEY(learner_id,zman)
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sync_ops (
    seq INTEGER PRIMARY KEY AUTOINCREMENT, learner_id TEXT NOT NULL, zman TEXT NOT NULL, generation INTEGER NOT NULL,
    op_id TEXT NOT NULL, device_id TEXT NOT NULL, kind TEXT NOT NULL, payload_json TEXT NOT NULL,
    client_ts TEXT, created_at TEXT NOT NULL, UNIQUE(learner_id,op_id)
  )`).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_sync_devices_learner ON sync_devices(learner_id,revoked_at)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_sync_ops_learner_seq ON sync_ops(learner_id,seq)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_sync_pair_expiry ON sync_pair_codes(expires_at,used_at)').run();
  syncTablesReady=true;
}
async function syncAuth(request,env){
  await ensureSyncTables(env);
  const auth=request.headers.get('Authorization')||'';
  if(!auth.startsWith('Bearer '))return null;
  const token=auth.slice(7).trim();if(token.length<32)return null;
  const tokenHash=await syncHash(token),now=new Date().toISOString();
  const device=await env.DB.prepare('SELECT device_id,learner_id,name FROM sync_devices WHERE token_hash=? AND revoked_at IS NULL').bind(tokenHash).first();
  if(!device)return null;
  env.DB.prepare('UPDATE sync_devices SET last_seen_at=? WHERE device_id=?').bind(now,device.device_id).run().catch(()=>{});
  return{deviceId:String(device.device_id),learnerId:String(device.learner_id),name:String(device.name||'Linked device')};
}
async function syncAuthorizeLearner(request,env,learnerId){
  await ensureSyncTables(env);
  const account=await env.DB.prepare('SELECT learner_id FROM sync_accounts WHERE learner_id=?').bind(learnerId).first();
  if(!account)return{ok:true,sync:false,auth:null};
  const auth=await syncAuth(request,env);
  return auth&&auth.learnerId===learnerId?{ok:true,sync:true,auth}:{ok:false,sync:true,auth:null};
}
async function syncIssueDevice(env,learnerId,deviceId,name){
  const token=syncRandomToken(32),tokenHash=await syncHash(token),now=new Date().toISOString();
  await env.DB.prepare(`INSERT INTO sync_devices(device_id,learner_id,token_hash,name,created_at,last_seen_at,revoked_at)
    VALUES(?,?,?,?,?,?,NULL) ON CONFLICT(device_id) DO UPDATE SET learner_id=excluded.learner_id,token_hash=excluded.token_hash,name=excluded.name,last_seen_at=excluded.last_seen_at,revoked_at=NULL`)
    .bind(deviceId,learnerId,tokenHash,syncDeviceName(name),now,now).run();
  return token;
}
async function syncCreateAccount(request,env){
  const cors=notificationCors(request,env);if(!cors)return jsonResponse({error:'Origin not allowed'},{status:403});
  await ensureSyncTables(env);let body;try{body=await request.json()}catch(_){return jsonResponse({error:'Invalid JSON'},{status:400,headers:cors})}
  const learnerId=text(body?.learnerId,100),deviceId=text(body?.deviceId,100),name=syncDeviceName(body?.deviceName);
  if(!learnerId||!deviceId)return jsonResponse({error:'Learner and device IDs are required'},{status:400,headers:cors});
  const existing=await env.DB.prepare('SELECT learner_id FROM sync_accounts WHERE learner_id=?').bind(learnerId).first();
  if(existing)return jsonResponse({error:'Sync is already enabled for this anonymous learner. Link this device from an existing device.'},{status:409,headers:cors});
  const now=new Date().toISOString();
  await env.DB.prepare('INSERT INTO sync_accounts(learner_id,created_at,updated_at) VALUES(?,?,?)').bind(learnerId,now,now).run();
  const token=await syncIssueDevice(env,learnerId,deviceId,name);
  return jsonResponse({ok:true,learnerId,deviceId,deviceToken:token},{headers:cors});
}
async function syncPairStart(request,env){
  const cors=notificationCors(request,env);if(!cors)return jsonResponse({error:'Origin not allowed'},{status:403});
  const auth=await syncAuth(request,env);if(!auth)return jsonResponse({error:'Sync authentication required'},{status:401,headers:cors});
  const code=syncPairCode(),codeHash=await syncHash(normalizePairCode(code)),now=new Date(),expires=new Date(now.getTime()+10*60*1000).toISOString();
  await env.DB.prepare('DELETE FROM sync_pair_codes WHERE created_by_device_id=? OR expires_at<?').bind(auth.deviceId,now.toISOString()).run();
  await env.DB.prepare('INSERT INTO sync_pair_codes(code_hash,learner_id,created_by_device_id,expires_at,used_at) VALUES(?,?,?,?,NULL)').bind(codeHash,auth.learnerId,auth.deviceId,expires).run();
  return jsonResponse({ok:true,code,expiresAt:expires},{headers:cors});
}
async function syncPairFinish(request,env){
  const cors=notificationCors(request,env);if(!cors)return jsonResponse({error:'Origin not allowed'},{status:403});
  await ensureSyncTables(env);let body;try{body=await request.json()}catch(_){return jsonResponse({error:'Invalid JSON'},{status:400,headers:cors})}
  const normalized=normalizePairCode(body?.code),deviceId=text(body?.deviceId,100),name=syncDeviceName(body?.deviceName);
  if(normalized.length!==16||!deviceId)return jsonResponse({error:'Invalid link code'},{status:400,headers:cors});
  const codeHash=await syncHash(normalized),now=new Date().toISOString(),row=await env.DB.prepare('SELECT learner_id,expires_at,used_at FROM sync_pair_codes WHERE code_hash=?').bind(codeHash).first();
  if(!row||row.used_at||row.expires_at<=now)return jsonResponse({error:'That link code is invalid or expired.'},{status:400,headers:cors});
  const claimed=await env.DB.prepare('UPDATE sync_pair_codes SET used_at=? WHERE code_hash=? AND used_at IS NULL AND expires_at>?').bind(now,codeHash,now).run();
  if(Number(claimed?.meta?.changes||0)!==1)return jsonResponse({error:'That link code is invalid or expired.'},{status:400,headers:cors});
  const token=await syncIssueDevice(env,String(row.learner_id),deviceId,name);
  return jsonResponse({ok:true,learnerId:String(row.learner_id),deviceId,deviceToken:token},{headers:cors});
}
async function syncDevices(request,env){
  const cors=notificationCors(request,env);if(!cors)return jsonResponse({error:'Origin not allowed'},{status:403});
  const auth=await syncAuth(request,env);if(!auth)return jsonResponse({error:'Sync authentication required'},{status:401,headers:cors});
  const rows=resultsOf(await env.DB.prepare('SELECT device_id,name,created_at,last_seen_at FROM sync_devices WHERE learner_id=? AND revoked_at IS NULL ORDER BY last_seen_at DESC').bind(auth.learnerId).all());
  return jsonResponse({ok:true,learnerId:auth.learnerId,currentDeviceId:auth.deviceId,devices:rows.map(row=>({deviceId:row.device_id,name:row.name,createdAt:row.created_at,lastSeenAt:row.last_seen_at,current:row.device_id===auth.deviceId}))},{headers:cors});
}
async function syncRevokeDevice(request,env,othersOnly=false){
  const cors=notificationCors(request,env);if(!cors)return jsonResponse({error:'Origin not allowed'},{status:403});
  const auth=await syncAuth(request,env);if(!auth)return jsonResponse({error:'Sync authentication required'},{status:401,headers:cors});
  await ensureNotificationTables(env);
  let target='';if(!othersOnly){let body;try{body=await request.json()}catch(_){return jsonResponse({error:'Invalid JSON'},{status:400,headers:cors})}target=text(body?.deviceId,100);if(!target)return jsonResponse({error:'Device ID required'},{status:400,headers:cors});if(target===auth.deviceId)return jsonResponse({error:'Use Unlink this device for the current device.'},{status:400,headers:cors});}
  const now=new Date().toISOString();
  if(othersOnly){
    const rows=resultsOf(await env.DB.prepare('SELECT device_id FROM sync_devices WHERE learner_id=? AND device_id<>? AND revoked_at IS NULL').bind(auth.learnerId,auth.deviceId).all()),ids=rows.map(row=>String(row.device_id));
    await env.DB.prepare('UPDATE sync_devices SET revoked_at=? WHERE learner_id=? AND device_id<>? AND revoked_at IS NULL').bind(now,auth.learnerId,auth.deviceId).run();
    if(ids.length)await env.DB.prepare(`DELETE FROM push_subscriptions WHERE installation_id=? AND device_id IN (${ids.map(()=>'?').join(',')})`).bind(auth.learnerId,...ids).run();
    return jsonResponse({ok:true,revoked:ids.length},{headers:cors});
  }
  const row=await env.DB.prepare('SELECT device_id FROM sync_devices WHERE learner_id=? AND device_id=? AND revoked_at IS NULL').bind(auth.learnerId,target).first();
  if(!row)return jsonResponse({error:'Device not found'},{status:404,headers:cors});
  await env.DB.batch([env.DB.prepare('UPDATE sync_devices SET revoked_at=? WHERE learner_id=? AND device_id=?').bind(now,auth.learnerId,target),env.DB.prepare('DELETE FROM push_subscriptions WHERE installation_id=? AND device_id=?').bind(auth.learnerId,target)]);
  return jsonResponse({ok:true,revoked:1},{headers:cors});
}
async function syncUnlinkCurrent(request,env){
  const cors=notificationCors(request,env);if(!cors)return jsonResponse({error:'Origin not allowed'},{status:403});
  const auth=await syncAuth(request,env);if(!auth)return jsonResponse({error:'Sync authentication required'},{status:401,headers:cors});
  await ensureNotificationTables(env);
  const now=new Date().toISOString();
  await env.DB.batch([env.DB.prepare('UPDATE sync_devices SET revoked_at=? WHERE learner_id=? AND device_id=?').bind(now,auth.learnerId,auth.deviceId),env.DB.prepare('DELETE FROM push_subscriptions WHERE installation_id=? AND device_id=?').bind(auth.learnerId,auth.deviceId)]);
  return jsonResponse({ok:true},{headers:cors});
}
async function syncGetOps(request,env){
  const cors=notificationCors(request,env);if(!cors)return jsonResponse({error:'Origin not allowed'},{status:403});
  const auth=await syncAuth(request,env);if(!auth)return jsonResponse({error:'Sync authentication required'},{status:401,headers:cors});
  const url=new URL(request.url),cursor=Math.max(0,Number(url.searchParams.get('cursor'))||0),rows=resultsOf(await env.DB.prepare('SELECT seq,zman,generation,op_id,device_id,kind,payload_json,client_ts,created_at FROM sync_ops WHERE learner_id=? AND seq>? ORDER BY seq LIMIT 500').bind(auth.learnerId,cursor).all());
  const generations=resultsOf(await env.DB.prepare('SELECT zman,generation FROM sync_zman_generations WHERE learner_id=?').bind(auth.learnerId).all());
  const ops=rows.map(row=>({seq:Number(row.seq),zman:row.zman,generation:Number(row.generation)||0,opId:row.op_id,deviceId:row.device_id,kind:row.kind,payload:JSON.parse(row.payload_json||'{}'),clientTs:row.client_ts,createdAt:row.created_at}));
  return jsonResponse({ok:true,cursor:ops.length?ops[ops.length-1].seq:cursor,hasMore:ops.length===500,generations:Object.fromEntries(generations.map(row=>[row.zman,Number(row.generation)||0])),ops},{headers:cors});
}
async function syncPostOps(request,env){
  const cors=notificationCors(request,env);if(!cors)return jsonResponse({error:'Origin not allowed'},{status:403});
  const auth=await syncAuth(request,env);if(!auth)return jsonResponse({error:'Sync authentication required'},{status:401,headers:cors});
  let body;try{body=await request.json()}catch(_){return jsonResponse({error:'Invalid JSON'},{status:400,headers:cors})}
  const ops=Array.isArray(body?.ops)?body.ops.slice(0,500):[];if(!ops.length)return jsonResponse({ok:true,accepted:0,stale:0},{headers:cors});
  let accepted=0,stale=0;const now=new Date().toISOString(),generationCache=new Map();
  for(const raw of ops){
    const zman=normalizeZman(raw?.zman||CURRENT_ZMAN),opId=text(raw?.opId,120),kind=text(raw?.kind,40),payload=raw?.payload&&typeof raw.payload==='object'&&!Array.isArray(raw.payload)?raw.payload:{},clientTs=text(raw?.clientTs,80)||null;
    if(!SUPPORTED_ZMANIM.has(zman)||!opId||!SYNC_OP_KINDS.has(kind))continue;
    let current=generationCache.get(zman);if(current===undefined){const row=await env.DB.prepare('SELECT generation FROM sync_zman_generations WHERE learner_id=? AND zman=?').bind(auth.learnerId,zman).first();current=Number(row?.generation)||0;generationCache.set(zman,current);}
    const incoming=Math.max(0,Number(raw?.generation)||0);
    if(kind==='reset'){
      if(incoming<current){stale++;continue;}
      current+=1;generationCache.set(zman,current);
      await env.DB.prepare('INSERT INTO sync_zman_generations(learner_id,zman,generation,updated_at) VALUES(?,?,?,?) ON CONFLICT(learner_id,zman) DO UPDATE SET generation=excluded.generation,updated_at=excluded.updated_at').bind(auth.learnerId,zman,current,now).run();
    }else if(incoming!==current){stale++;continue;}
    const encoded=JSON.stringify(payload);if(encoded.length>20000)continue;
    const result=await env.DB.prepare('INSERT OR IGNORE INTO sync_ops(learner_id,zman,generation,op_id,device_id,kind,payload_json,client_ts,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(auth.learnerId,zman,current,opId,auth.deviceId,kind,encoded,clientTs,now).run();
    accepted+=Number(result?.meta?.changes||0);
  }
  return jsonResponse({ok:true,accepted,stale,generations:Object.fromEntries(generationCache)},{headers:cors});
}
async function syncNudgeDevices(request,env){
  const cors=notificationCors(request,env);if(!cors)return jsonResponse({error:'Origin not allowed'},{status:403});
  await Promise.all([ensureSyncTables(env),ensureNotificationTables(env)]);
  const auth=await syncAuth(request,env);if(!auth)return jsonResponse({error:'Sync authentication required'},{status:401,headers:cors});
  const rows=resultsOf(await env.DB.prepare(`SELECT p.endpoint,p.p256dh,p.auth,p.device_id
    FROM push_subscriptions p
    INNER JOIN sync_devices d ON d.device_id=p.device_id AND d.learner_id=p.installation_id AND d.revoked_at IS NULL
    WHERE p.installation_id=? AND p.device_id<>?`).bind(auth.learnerId,auth.deviceId).all());
  const payload={data:{type:'sync_request'}},results=await Promise.all(rows.map(row=>sendPushSubscription(env,row,payload,{ttl:60}))),devices=new Set(rows.map(row=>String(row.device_id||'')).filter(Boolean)),notifiedDevices=new Set(rows.filter((_,index)=>results[index]).map(row=>String(row.device_id||'')).filter(Boolean));
  return jsonResponse({ok:true,requestedDevices:devices.size,notifiedDevices:notifiedDevices.size},{headers:cors});
}
async function vapidConfig(env){
  await ensureNotificationTables(env);
  let row=await env.DB.prepare('SELECT public_key,private_key,subject FROM push_config WHERE id=1').first();
  if(!row){const keys=webpush.generateVAPIDKeys(),subject='https://scp-study.ksariash.workers.dev';await env.DB.prepare('INSERT OR IGNORE INTO push_config (id,public_key,private_key,subject,created_at) VALUES (1,?,?,?,?)').bind(keys.publicKey,keys.privateKey,subject,new Date().toISOString()).run();row=await env.DB.prepare('SELECT public_key,private_key,subject FROM push_config WHERE id=1').first();}
  return{publicKey:row.public_key,privateKey:row.private_key,subject:row.subject};
}
function parseAction(value){
  if(!value)return null;
  try{const a=typeof value==='string'?JSON.parse(value):value;if(!a||typeof a!=='object'||Array.isArray(a))return null;const type=text(a.type,32),label=text(a.label,80),url=text(a.url,1000),pollId=text(a.pollId,120);return type||label||url||pollId?{type:type||'link',label,url,pollId}:null}catch(_){return null}
}
async function sendPushSubscription(env,row,payload,{ttl=86400}={}){
  const c=await vapidConfig(env);webpush.setVapidDetails(c.subject,c.publicKey,c.privateKey);
  const safeTtl=Math.max(0,Math.min(86400,Number.isFinite(Number(ttl))?Number(ttl):86400));
  try{await webpush.sendNotification({endpoint:row.endpoint,keys:{p256dh:row.p256dh,auth:row.auth}},JSON.stringify(payload),{TTL:safeTtl});return true}catch(error){const statusCode=error instanceof webpush.WebPushError?error.statusCode:Number(error?.statusCode||0);if(statusCode===404||statusCode===410)await env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint=?').bind(row.endpoint).run();return false}
}
async function pushNotificationToAudience(env,n,installationIds=null){
  const clauses=[],params=[];
  if(n.zman){clauses.push('zman=?');params.push(n.zman);}
  if(Array.isArray(installationIds)&&installationIds.length){const ids=[...new Set(installationIds.filter(Boolean))];clauses.push(`installation_id IN (${ids.map(()=>'?').join(',')})`);params.push(...ids);}
  const sql='SELECT endpoint,installation_id,p256dh,auth FROM push_subscriptions'+(clauses.length?' WHERE '+clauses.join(' AND '):'');
  const rows=resultsOf(await env.DB.prepare(sql).bind(...params).all()),action=parseAction(n.actionJson||n.action_json),payload={title:n.title,body:n.body,tag:'scp-'+n.id,data:{notificationId:n.id,zman:n.zman||null,kind:n.kind,url:action?.url||'/?notifications=1'}};
  await Promise.all(rows.map(row=>sendPushSubscription(env,row,payload)));
}
async function createIssueResolvedNotifications(env,input){
  await ensureNotificationTables(env);const reporters=resultsOf(await env.DB.prepare('SELECT DISTINCT installation_id FROM feedback_reports WHERE cohort=? AND content_type=? AND content_id=?').bind(input.zman,input.contentType,input.storageContentId).all());
  const label=input.title||(input.contentType==='question'?'Question '+input.publicContentId:'Reported content'),message=input.note?label+': '+input.note:label+' was marked resolved by the course team.',now=new Date().toISOString();
  for(const row of reporters){const installationId=text(row.installation_id,100);if(!installationId)continue;const dedupe=['resolved',input.zman,input.contentType,input.storageContentId,input.resolvedHash||now,installationId].join(':'),id=crypto.randomUUID(),actionJson=JSON.stringify({type:'open_feedback',label:'View details',url:'/?notifications=1'});const ins=await env.DB.prepare('INSERT OR IGNORE INTO app_notifications (id,kind,zman,title,body,created_at,target_installation_id,content_type,content_id,action_json,dedupe_key) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(id,'issue_resolved',input.zman,'Issue addressed',message,now,installationId,input.contentType,input.publicContentId,actionJson,dedupe).run();if(Number(ins?.meta?.changes||0)>0)await pushNotificationToAudience(env,{id,kind:'issue_resolved',zman:input.zman,title:'Issue addressed',body:message,actionJson},[installationId]);}
}
async function notificationsFeed(request,env){
  await ensureNotificationTables(env);const url=new URL(request.url),zman=normalizeZman(url.searchParams.get('zman')||url.searchParams.get('cohort')||CURRENT_ZMAN),installationId=text(url.searchParams.get('installationId'),100),includeArchived=url.searchParams.get('includeArchived')==='1';
  if(!SUPPORTED_ZMANIM.has(zman)||!installationId)return jsonResponse({error:'Invalid notification request'},{status:400});
  const access=await syncAuthorizeLearner(request,env,installationId),cors=notificationCors(request,env);if(!access.ok)return jsonResponse({error:'This linked device is no longer authorized.'},{status:401,headers:cors||{}});
  const rows=await env.DB.prepare(`SELECT n.id,n.kind,n.zman,n.title,n.body,n.body_html,n.created_at,n.expires_at,n.content_type,n.content_id,n.action_json,s.read_at,s.archived_at FROM app_notifications n LEFT JOIN notification_state s ON s.notification_id=n.id AND s.installation_id=? WHERE (n.zman IS NULL OR n.zman=?) AND (n.target_installation_id IS NULL OR n.target_installation_id=?) AND (n.expires_at IS NULL OR n.expires_at>?) AND (?=1 OR s.archived_at IS NULL) ORDER BY n.created_at DESC LIMIT 100`).bind(installationId,zman,installationId,new Date().toISOString(),includeArchived?1:0).all();
  const notifications=resultsOf(rows).map(r=>({id:r.id,kind:r.kind,zman:r.zman||zman,title:r.title,body:r.body,bodyHtml:r.body_html||null,createdAt:r.created_at,expiresAt:r.expires_at,contentType:r.content_type,contentId:r.content_id,action:parseAction(r.action_json),readAt:r.read_at||null,archivedAt:r.archived_at||null}));
  return jsonResponse({zman,unread:notifications.filter(n=>!n.readAt&&!n.archivedAt).length,notifications},{headers:cors||{}});
}
async function updateNotificationState(request,env){
  const cors=notificationCors(request,env);if(!cors)return jsonResponse({error:'Origin not allowed'},{status:403});
  await ensureNotificationTables(env);
  let body;try{body=await request.json()}catch(_){return jsonResponse({error:'Invalid JSON'},{status:400,headers:cors})}
  const installationId=text(body?.installationId,100),id=text(body?.id,120);if(!installationId||!id)return jsonResponse({error:'Invalid notification state'},{status:400,headers:cors});
  const access=await syncAuthorizeLearner(request,env,installationId);if(!access.ok)return jsonResponse({error:'This linked device is no longer authorized.'},{status:401,headers:cors});
  const now=new Date().toISOString(),current=await env.DB.prepare('SELECT read_at,archived_at FROM notification_state WHERE notification_id=? AND installation_id=?').bind(id,installationId).first(),readAt=body?.read===true?now:(body?.read===false?null:(current?.read_at||null)),archivedAt=body?.archived===true?now:(body?.archived===false?null:(current?.archived_at||null));
  await env.DB.prepare('INSERT INTO notification_state (notification_id,installation_id,read_at,archived_at,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(notification_id,installation_id) DO UPDATE SET read_at=excluded.read_at,archived_at=excluded.archived_at,updated_at=excluded.updated_at').bind(id,installationId,readAt,archivedAt,now).run();
  return jsonResponse({ok:true,id,readAt,archivedAt},{headers:cors});
}
async function pushConfigResponse(request,env){const cors=notificationCors(request,env);if(!cors)return jsonResponse({error:'Origin not allowed'},{status:403});const c=await vapidConfig(env);return jsonResponse({publicKey:c.publicKey},{headers:cors});}
function normalizeSubscription(raw){const endpoint=text(raw?.endpoint,2000),p256dh=text(raw?.keys?.p256dh,1000),auth=text(raw?.keys?.auth,500);return endpoint&&p256dh&&auth?{endpoint,p256dh,auth}:null;}
async function upsertPushSubscription(request,env){
  const cors=notificationCors(request,env);if(!cors)return jsonResponse({error:'Origin not allowed'},{status:403});await ensureNotificationTables(env);let body;try{body=await request.json()}catch(_){return jsonResponse({error:'Invalid JSON'},{status:400,headers:cors})}
  const installationId=text(body?.installationId,100),deviceId=text(body?.deviceId,100)||null,zman=normalizeZman(body?.zman||body?.cohort||CURRENT_ZMAN),sub=normalizeSubscription(body?.subscription),timezone=text(body?.timezone,100)||'UTC',reminderEnabled=body?.reminderEnabled?1:0,reminderTime=/^\d{2}:\d{2}$/.test(String(body?.reminderTime||''))?String(body.reminderTime):null,israelCalendar=body?.israelCalendar?1:0;
  if(!installationId||!SUPPORTED_ZMANIM.has(zman)||!sub)return jsonResponse({error:'Invalid push subscription'},{status:400,headers:cors});
  const access=await syncAuthorizeLearner(request,env,installationId);if(!access.ok||access.sync&&deviceId!==access.auth.deviceId)return jsonResponse({error:'This linked device is no longer authorized.'},{status:401,headers:cors});
  const now=new Date().toISOString(),cf=request.cf||{},latitude=roundCoord(cf.latitude),longitude=roundCoord(cf.longitude);
  await env.DB.prepare(`INSERT INTO push_subscriptions (endpoint,installation_id,zman,p256dh,auth,timezone,reminder_enabled,reminder_time,israel_calendar,latitude_rounded,longitude_rounded,device_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET installation_id=excluded.installation_id,zman=excluded.zman,p256dh=excluded.p256dh,auth=excluded.auth,timezone=excluded.timezone,reminder_enabled=excluded.reminder_enabled,reminder_time=excluded.reminder_time,israel_calendar=excluded.israel_calendar,latitude_rounded=excluded.latitude_rounded,longitude_rounded=excluded.longitude_rounded,device_id=excluded.device_id,updated_at=excluded.updated_at`)
    .bind(sub.endpoint,installationId,zman,sub.p256dh,sub.auth,timezone,reminderEnabled,reminderTime,israelCalendar,latitude,longitude,deviceId,now,now).run();
  return jsonResponse({ok:true,reminderEnabled:!!reminderEnabled,reminderTime,israelCalendar:!!israelCalendar},{headers:cors});
}
async function removePushSubscription(request,env){const cors=notificationCors(request,env);if(!cors)return jsonResponse({error:'Origin not allowed'},{status:403});await ensureNotificationTables(env);let body;try{body=await request.json()}catch(_){return jsonResponse({error:'Invalid JSON'},{status:400,headers:cors})}const installationId=text(body?.installationId,100),endpoint=text(body?.endpoint,2000);if(installationId){const access=await syncAuthorizeLearner(request,env,installationId);if(!access.ok)return jsonResponse({error:'This linked device is no longer authorized.'},{status:401,headers:cors});}if(endpoint)await env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint=?').bind(endpoint).run();else if(installationId)await env.DB.prepare('DELETE FROM push_subscriptions WHERE installation_id=?').bind(installationId).run();else return jsonResponse({error:'Invalid unsubscribe request'},{status:400,headers:cors});return jsonResponse({ok:true},{headers:cors});}
function localClock(date,timezone){try{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date),v=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));return{date:`${v.year}-${v.month}-${v.day}`,time:`${v.hour}:${v.minute}`,year:Number(v.year),month:Number(v.month),day:Number(v.day)}}catch(_){return null}}
function hasChag(events){return(events||[]).some(event=>(event.getFlags()&flags.CHAG)!==0);}
function studyReminderBlockReason(now,clock,row){
  const il=!!Number(row.israel_calendar);
  const civilDate=new Date(Date.UTC(clock.year,clock.month-1,clock.day,12));
  const latitude=Number(row.latitude_rounded),longitude=Number(row.longitude_rounded);
  if(Number.isFinite(latitude)&&Number.isFinite(longitude)){
    try{
      const gloc=new GeoLocation(null,latitude,longitude,0,row.timezone);
      const hdate=Zmanim.makeSunsetAwareHDate(gloc,now,false);
      if(hdate.greg().getDay()===6)return 'shabbat';
      if(hasChag(getHolidaysOnDate(hdate,il)))return 'yom_tov';
      const zmanim=new Zmanim(gloc,civilDate,false),sunset=zmanim.sunset(),tzeit=zmanim.tzeit();
      const twilight=Number.isFinite(sunset?.getTime?.())&&Number.isFinite(tzeit?.getTime?.())&&now>=sunset&&now<tzeit;
      if(twilight){
        if(civilDate.getUTCDay()===6)return 'shabbat';
        if(hasChag(getHolidaysOnDate(civilDate,il)))return 'yom_tov';
      }
      return null;
    }catch(_){}
  }
  if(civilDate.getUTCDay()===6)return 'shabbat';
  return hasChag(getHolidaysOnDate(civilDate,il))?'yom_tov':null;
}
function isStudyReminderBlocked(now,clock,row){return !!studyReminderBlockReason(now,clock,row);}
function localDayOffset(clock,offset){
  const d=new Date(Date.UTC(clock.year,clock.month-1,clock.day+offset,12));
  return{year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate()};
}
function instantForLocalTime(day,time,timezone){
  const match=/^(\d{2}):(\d{2})$/.exec(String(time||''));if(!match)return null;
  const hour=Number(match[1]),minute=Number(match[2]),target=Date.UTC(day.year,day.month-1,day.day,hour,minute);
  let ms=target;
  for(let i=0;i<3;i++){
    const clock=localClock(new Date(ms),timezone);if(!clock)return null;
    const [actualHour,actualMinute]=clock.time.split(':').map(Number);
    const actual=Date.UTC(clock.year,clock.month-1,clock.day,actualHour,actualMinute);
    ms+=target-actual;
  }
  return new Date(ms);
}
async function nextStudyReminder(request,env){
  const cors=notificationCors(request,env);if(!cors)return jsonResponse({error:'Origin not allowed'},{status:403});
  await ensureNotificationTables(env);
  const url=new URL(request.url),installationId=text(url.searchParams.get('installationId'),100),zman=normalizeZman(url.searchParams.get('zman')||CURRENT_ZMAN);
  if(!installationId||!SUPPORTED_ZMANIM.has(zman))return jsonResponse({error:'Invalid reminder request'},{status:400,headers:cors});
  const access=await syncAuthorizeLearner(request,env,installationId);if(!access.ok)return jsonResponse({error:'This linked device is no longer authorized.'},{status:401,headers:cors});
  const row=await env.DB.prepare(`SELECT installation_id,zman,timezone,reminder_enabled,reminder_time,israel_calendar,latitude_rounded,longitude_rounded,updated_at
    FROM push_subscriptions WHERE installation_id=? AND zman=? ORDER BY updated_at DESC LIMIT 1`).bind(installationId,zman).first();
  if(!row||!Number(row.reminder_enabled)||!row.reminder_time)return jsonResponse({enabled:false,reason:'disabled'},{headers:cors});
  const now=new Date(),localNow=localClock(now,row.timezone);if(!localNow)return jsonResponse({enabled:true,reason:'unknown',reminderTime:row.reminder_time},{headers:cors});
  const skipped=[],currentReason=studyReminderBlockReason(now,localNow,row);if(currentReason)skipped.push(currentReason);
  for(let offset=0;offset<15;offset++){
    const day=localDayOffset(localNow,offset),candidate=instantForLocalTime(day,row.reminder_time,row.timezone);
    if(!candidate||candidate<=now)continue;
    const clock=localClock(candidate,row.timezone),blocked=studyReminderBlockReason(candidate,clock,row);
    if(blocked){skipped.push(blocked);continue}
    let reason='future';
    if(offset===0)reason='today';
    else if(skipped.includes('yom_tov'))reason='after_yom_tov';
    else if(skipped.includes('shabbat'))reason='after_shabbat';
    else if(offset===1)reason='tomorrow';
    return jsonResponse({enabled:true,reason,nextAt:candidate.toISOString(),localDate:clock?.date||null,reminderTime:row.reminder_time,timezone:row.timezone},{headers:cors});
  }
  return jsonResponse({enabled:true,reason:'future',reminderTime:row.reminder_time,timezone:row.timezone},{headers:cors});
}
async function sendDailyStudyReminders(env){
  await ensureNotificationTables(env);
  const now=new Date(),rows=resultsOf(await env.DB.prepare('SELECT endpoint,installation_id,zman,p256dh,auth,timezone,reminder_time,israel_calendar,last_reminder_local_date,latitude_rounded,longitude_rounded FROM push_subscriptions WHERE reminder_enabled=1 AND reminder_time IS NOT NULL').all());
  for(const row of rows){
    const clock=localClock(now,row.timezone);
    if(!clock||clock.time!==row.reminder_time||clock.date===row.last_reminder_local_date)continue;
    await env.DB.prepare('UPDATE push_subscriptions SET last_reminder_local_date=?,updated_at=? WHERE endpoint=?').bind(clock.date,now.toISOString(),row.endpoint).run();
    if(isStudyReminderBlocked(now,clock,row))continue;
    await sendPushSubscription(env,row,{title:'Time to study',body:'Your daily SCP Study reminder.',tag:'scp-daily-study-'+clock.date,data:{kind:'study_reminder',zman:row.zman,url:'/'}});
  }
}
function validNotificationAdmin(request,env){const expected=text(env.NOTIFICATION_ADMIN_TOKEN,500),auth=request.headers.get('Authorization')||'',provided=auth.startsWith('Bearer ')?auth.slice(7):'';return!!expected&&provided===expected;}
async function createManualNotification(request,env){
  if(!validNotificationAdmin(request,env))return jsonResponse({error:'Cloudflare Access or NOTIFICATION_ADMIN_TOKEN is required'},{status:401});await ensureNotificationTables(env);let body;try{body=await request.json()}catch(_){return jsonResponse({error:'Invalid JSON'},{status:400})}
  const title=text(body?.title,120),message=text(body?.body,1200),kind=text(body?.kind,40)||'announcement',rawZman=text(body?.zman,100),zman=rawZman&&rawZman!=='all'?normalizeZman(rawZman):null,expiresAt=body?.expiresAt?validIsoDate(body.expiresAt):null,action=parseAction(body?.action);
  if(!title||!message||(zman&&!SUPPORTED_ZMANIM.has(zman)))return jsonResponse({error:'Invalid notification'},{status:400});const createdAt=new Date().toISOString(),id=crypto.randomUUID(),actionJson=action?JSON.stringify(action):null;
  await env.DB.prepare('INSERT INTO app_notifications (id,kind,zman,title,body,created_at,expires_at,target_installation_id,content_type,content_id,action_json,dedupe_key) VALUES (?,?,?,?,?,?,?,NULL,NULL,NULL,?,NULL)').bind(id,kind,zman,title,message,createdAt,expiresAt,actionJson).run();await pushNotificationToAudience(env,{id,kind,zman,title,body:message,actionJson});return jsonResponse({ok:true,id,kind,zman,title,createdAt,expiresAt,action});
}
async function deleteAnonymousServerData(request,env){
  const cors=notificationCors(request,env);if(!cors)return jsonResponse({error:'Origin not allowed'},{status:403});let body;try{body=await request.json()}catch(_){return jsonResponse({error:'Invalid JSON'},{status:400,headers:cors})}const installationId=text(body?.installationId,100);if(!installationId)return jsonResponse({error:'Installation ID required'},{status:400,headers:cors});
  await ensureFeedbackTables(env);await ensureNotificationTables(env);await ensureSyncTables(env);const access=await syncAuthorizeLearner(request,env,installationId);if(!access.ok)return jsonResponse({error:'Sync authentication required to delete this linked learner.'},{status:401,headers:cors});const affected=resultsOf(await env.DB.prepare('SELECT DISTINCT content_type,content_id FROM feedback_reports WHERE installation_id=?').bind(installationId).all());
  await env.DB.batch([env.DB.prepare('DELETE FROM events WHERE installation_id=?').bind(installationId),env.DB.prepare('DELETE FROM glossary_events WHERE installation_id=?').bind(installationId),env.DB.prepare('DELETE FROM resource_events WHERE installation_id=?').bind(installationId),env.DB.prepare('DELETE FROM essay_round_events WHERE installation_id=?').bind(installationId),env.DB.prepare('DELETE FROM essay_pairing_events WHERE installation_id=?').bind(installationId),env.DB.prepare("DELETE FROM learner_profiles WHERE installation_id=? OR installation_id LIKE '%::' || ?").bind(installationId,installationId),env.DB.prepare('DELETE FROM notification_state WHERE installation_id=?').bind(installationId),env.DB.prepare('DELETE FROM push_subscriptions WHERE installation_id=?').bind(installationId),env.DB.prepare('DELETE FROM app_notifications WHERE target_installation_id=?').bind(installationId),env.DB.prepare('DELETE FROM feedback_reports WHERE installation_id=?').bind(installationId),env.DB.prepare('DELETE FROM sync_ops WHERE learner_id=?').bind(installationId),env.DB.prepare('DELETE FROM sync_zman_generations WHERE learner_id=?').bind(installationId),env.DB.prepare('DELETE FROM sync_pair_codes WHERE learner_id=?').bind(installationId),env.DB.prepare('DELETE FROM sync_devices WHERE learner_id=?').bind(installationId),env.DB.prepare('DELETE FROM sync_accounts WHERE learner_id=?').bind(installationId)]);
  for(const item of affected){const latest=await env.DB.prepare('SELECT received_at,content_hash,wording,parent_id,title,category FROM feedback_reports WHERE content_type=? AND content_id=? ORDER BY received_at DESC,id DESC LIMIT 1').bind(item.content_type,item.content_id).first();if(!latest){await env.DB.prepare('DELETE FROM feedback_issues WHERE content_type=? AND content_id=?').bind(item.content_type,item.content_id).run();await env.DB.prepare('DELETE FROM feedback_revisions WHERE content_type=? AND content_id=?').bind(item.content_type,item.content_id).run();}else{const count=await env.DB.prepare('SELECT COUNT(*) n,MIN(received_at) first_at FROM feedback_reports WHERE content_type=? AND content_id=?').bind(item.content_type,item.content_id).first();await env.DB.prepare('UPDATE feedback_issues SET parent_id=?,title=?,category=?,first_report_at=?,last_report_at=?,report_count=?,last_content_hash=?,last_wording=?,updated_at=? WHERE content_type=? AND content_id=?').bind(latest.parent_id,latest.title,latest.category,count.first_at,latest.received_at,Number(count.n)||0,latest.content_hash,latest.wording,new Date().toISOString(),item.content_type,item.content_id).run();}}
  return jsonResponse({ok:true},{headers:cors});
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
.empty{padding:18px;text-align:center;color:var(--muted)}.back{color:#31569a;text-decoration:none;font-size:.74rem;font-weight:800}.source-link{display:inline-flex;align-items:center;margin-top:6px;padding:6px 9px;border:1px solid #d3deec;border-radius:9px;background:#f7f9fd;color:#31569a;text-decoration:none;font-size:.69rem;font-weight:850}.source-link:hover{background:#eef3fb}
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
 const p=new URLSearchParams(location.search),type=p.get('type'),id=p.get('id'),zman=p.get('zman')||'2026-summer',root=document.getElementById('root');
 try{
  const d=await api('/api/feedback/detail?zman='+encodeURIComponent(zman)+'&type='+encodeURIComponent(type)+'&id='+encodeURIComponent(id));const i=d.issue;
  const studySource=i.contentType==='question'&&/^\d+$/.test(String(i.contentId||''))?'https://scp-study.ksariash.workers.dev/?zman='+encodeURIComponent(i.zman||zman)+'&question='+encodeURIComponent(i.contentId):'';
  let prev='';const revisions=(d.revisions||[]).map(r=>{let body='';if(r.wording){body=prev?'<div class="diff">'+diffWords(prev,r.wording)+'</div>':'<pre>'+esc(r.wording)+'</pre>';prev=r.wording}return '<div class="revision"><h3>'+esc(r.source.replace('status:','Status: '))+'</h3><div class="meta">'+fmt(r.createdAt)+(r.appVersion?' · app v'+esc(r.appVersion):'')+'</div>'+(r.note?'<p>'+esc(r.note)+'</p>':'')+body+'</div>'}).join('');
  const reports=(d.reports||[]).map(r=>'<div class="report"><div class="report-head"><span class="badge">'+esc(r.reason)+'</span><span class="meta">'+fmt(r.receivedAt)+'</span></div>'+(r.details?'<p>'+esc(r.details)+'</p>':'<p class="meta">No additional details.</p>')+'<div class="meta">'+esc(r.source||'')+(r.appVersion?' · app v'+esc(r.appVersion):'')+(r.location?' · '+esc(r.location):'')+'</div><details><summary class="meta">Wording and context</summary><pre>'+esc(r.wording)+'</pre>'+(Object.keys(r.context||{}).length?'<pre>'+esc(JSON.stringify(r.context,null,2))+'</pre>':'')+'</details></div>').join('');
  root.innerHTML='<div class="top"><div><span class="badge">'+esc(typeLabel(i.contentType))+' · '+esc(i.status)+'</span><h1>'+esc(i.title||i.contentId)+'</h1><div class="sub">'+esc(i.category||'')+' · '+esc(i.contentId)+'</div>'+(studySource?'<a class="source-link" href="'+esc(studySource)+'" target="_blank" rel="noopener">Open question in Study ↗</a>':'')+'</div><div class="meta">Last report '+fmt(i.lastReportAt)+'</div></div>'+
  '<div class="grid"><div class="metric"><b>'+i.reportCount+'</b><span>Reports</span></div><div class="metric"><b>'+i.learners+'</b><span>Learners</span></div><div class="metric"><b>'+esc(i.status)+'</b><span>Status</span></div><div class="metric"><b>'+fmt(i.firstReportAt).split(',')[0]+'</b><span>First reported</span></div></div>'+
  '<div class="reasons">'+(d.reasons||[]).map(x=>'<span class="reason">'+esc(x.reason)+' · '+x.count+'</span>').join('')+'</div>'+
  '<section class="card"><h2>Current reported wording</h2><pre>'+esc(i.lastWording||'')+'</pre>'+(i.updatedWording?'<h2>Recorded updated wording</h2><div class="diff">'+diffWords(i.lastWording||'',i.updatedWording)+'</div>':'')+'</section>'+
  '<section class="card"><h2>Tracking & resolution</h2><div class="field"><label>Resolution / tracking note</label><textarea id="note">'+esc(i.resolutionNote||'')+'</textarea></div><div class="field"><label>Updated wording (optional; used for the before/after history)</label><textarea id="wording">'+esc(i.updatedWording||'')+'</textarea></div><div class="actions"><button data-status="new">Mark new</button><button data-status="tracking">Track</button><button data-status="reopened">Reopen</button><button class="primary" data-status="resolved">Resolve</button></div><div id="saveStatus" class="meta"></div></section>'+
  '<section class="card"><h2>Wording & status history</h2><div class="timeline">'+(revisions||'<div class="empty">No revisions yet.</div>')+'</div></section>'+
  '<section class="card"><h2>Student reports</h2>'+(reports||'<div class="empty">No reports.</div>')+'</section>';
  root.querySelectorAll('[data-status]').forEach(btn=>btn.addEventListener('click',async()=>{const status=btn.dataset.status,save=document.getElementById('saveStatus');save.textContent='Saving…';try{await api('/api/feedback/status',{method:'POST',body:JSON.stringify({zman:i.zman||zman,contentType:i.contentType,contentId:i.contentId,status,resolutionNote:document.getElementById('note').value.slice(0,1000),updatedWording:document.getElementById('wording').value.slice(0,6000)})});save.textContent='Saved.';setTimeout(load,250)}catch(e){save.textContent=e.message}}));
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
    if (url.pathname === '/api/health' && request.method === 'GET') return jsonResponse({ ok:true, service:'scp-study-analytics', version:25, feedback:true, push:true, sync:true });
    if (url.pathname === '/api/feedback/report' && request.method === 'OPTIONS') {
      const cors = feedbackCors(request, env);
      return cors ? new Response(null, { status:204, headers:cors }) : new Response(null, { status:403 });
    }
    if (url.pathname === '/api/feedback/report' && request.method === 'POST') return ingestFeedbackReport(request, env);
    if (request.method === 'OPTIONS' && (
      url.pathname === '/api/notifications' ||
      url.pathname === '/api/notifications/state' ||
      url.pathname === '/api/push/config' ||
      url.pathname === '/api/push/subscribe' ||
      url.pathname === '/api/push/unsubscribe' ||
      url.pathname === '/api/reminders/next' ||
      url.pathname === '/api/data/delete' ||
      url.pathname.startsWith('/api/sync/')
    )) {
      const cors = notificationCors(request, env);
      return cors ? new Response(null, { status:204, headers:cors }) : new Response(null, { status:403 });
    }
    if (url.pathname === '/api/notifications' && request.method === 'GET') return notificationsFeed(request, env);
    if (url.pathname === '/api/notifications/state' && request.method === 'POST') return updateNotificationState(request, env);
    if (url.pathname === '/api/push/config' && request.method === 'GET') return pushConfigResponse(request, env);
    if (url.pathname === '/api/push/subscribe' && request.method === 'POST') return upsertPushSubscription(request, env);
    if (url.pathname === '/api/push/unsubscribe' && request.method === 'POST') return removePushSubscription(request, env);
    if (url.pathname === '/api/reminders/next' && request.method === 'GET') return nextStudyReminder(request, env);
    if (url.pathname === '/api/data/delete' && request.method === 'POST') return deleteAnonymousServerData(request, env);
    if (url.pathname === '/api/sync/create' && request.method === 'POST') return syncCreateAccount(request,env);
    if (url.pathname === '/api/sync/pair/start' && request.method === 'POST') return syncPairStart(request,env);
    if (url.pathname === '/api/sync/pair/finish' && request.method === 'POST') return syncPairFinish(request,env);
    if (url.pathname === '/api/sync/devices' && request.method === 'GET') return syncDevices(request,env);
    if (url.pathname === '/api/sync/devices/revoke' && request.method === 'POST') return syncRevokeDevice(request,env,false);
    if (url.pathname === '/api/sync/devices/revoke-others' && request.method === 'POST') return syncRevokeDevice(request,env,true);
    if (url.pathname === '/api/sync/unlink' && request.method === 'POST') return syncUnlinkCurrent(request,env);
    if (url.pathname === '/api/sync/ops' && request.method === 'GET') return syncGetOps(request,env);
    if (url.pathname === '/api/sync/ops' && request.method === 'POST') return syncPostOps(request,env);
    if (url.pathname === '/api/sync/nudge' && request.method === 'POST') return syncNudgeDevices(request,env);
    if (url.pathname === '/api/admin/notifications' && request.method === 'POST') return createManualNotification(request, env);
    if (url.pathname === '/api/feedback/issues' && request.method === 'GET') return feedbackIssues(request, env);
    if (url.pathname === '/api/feedback/detail' && request.method === 'GET') return feedbackDetail(request, env);
    if (url.pathname === '/api/feedback/status' && request.method === 'POST') return updateFeedbackStatus(request, env);
    if (url.pathname === '/api/admin/feedback-sync' && request.method === 'GET') return feedbackAdminSync(env);
    if (url.pathname === '/feedback-detail' && request.method === 'GET') return feedbackDetailPage();
    return __BASE_WORKER.fetch(request, env);
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(Promise.all([applyFeedbackAdminActions(env), sendDailyStudyReminders(env)]));
    if (typeof __BASE_WORKER.scheduled === 'function') return __BASE_WORKER.scheduled(controller, env, ctx);
  }
};
