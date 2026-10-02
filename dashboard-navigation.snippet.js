function enhanceDashboardHtml(html) {
  const quickLinks = [
    ["#overview", "Overview"],
    ["#needs-review", "Needs review"],
    ["#heat-map", "Heat map"],
    ["#topics-review", "Topics"],
    ["#locations-review", "Locations"],
    ["#glossary-attention", "Glossary"],
    ["#essay-analytics", "Essays"],
    ["#content-feedback", "Feedback"],
    ["#questions-diagnostics", "Questions"],
    ["#activity-over-time", "Activity"],
  ];

  const links = quickLinks
    .map(([href, label]) => '<a href="' + href + '">' + label + '</a>')
    .join("");

  const inlineNav =
    '<nav class="section-jump" aria-label="Dashboard sections">' +
      '<span class="section-jump-label">Jump to</span>' +
      '<div class="section-jump-links">' + links + '</div>' +
    '</nav>';

  const floatingNav =
    '<button id="jumpMenuButton" class="jump-fab scroll-control" type="button" aria-expanded="false" aria-controls="jumpMenu">Sections</button>' +
    '<div id="jumpMenu" class="jump-menu" hidden>' +
      '<div class="jump-menu-title">Jump to</div>' + links +
    '</div>' +
    '<a id="backToTop" class="back-top scroll-control" href="#top" aria-label="Back to top" title="Back to top">↑</a>';

  const styles = `
<style id="dashboardNavigationStyles">
html{scroll-behavior:smooth}
body[id="top"]{scroll-margin-top:0}
#overview,#needs-review,#heat-map,#topics-review,#locations-review,#glossary-attention,#essay-analytics,#questions-diagnostics,#activity-over-time{scroll-margin-top:18px}
.section-jump{display:flex;align-items:center;gap:9px;margin:0 0 12px;padding:8px 10px;background:#fff;border:1px solid var(--line);border-radius:13px;box-shadow:0 5px 16px rgba(24,41,75,.035);min-width:0}
.section-jump-label{flex:0 0 auto;color:#708096;font-size:.64rem;font-weight:900;text-transform:uppercase;letter-spacing:.055em}
.section-jump-links{display:flex;gap:6px;min-width:0;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.section-jump-links::-webkit-scrollbar{display:none}
.section-jump a,.jump-menu a{color:#294f99;text-decoration:none;font-size:.7rem;font-weight:850;white-space:nowrap}
.section-jump a{padding:6px 8px;border-radius:9px;background:#f3f6fc;border:1px solid #e3e9f4}
.section-jump a:hover,.section-jump a:focus-visible{background:#eaf0fb;outline:none}
.scroll-control{opacity:0;pointer-events:none;transform:translateY(8px);transition:opacity .16s ease,transform .16s ease}
.scroll-control.visible{opacity:1;pointer-events:auto;transform:translateY(0)}
.jump-fab,.back-top{position:fixed;z-index:30;bottom:max(16px,env(safe-area-inset-bottom));height:42px;border:1px solid rgba(255,255,255,.36);background:#173771;color:#fff;box-shadow:0 10px 28px rgba(15,37,82,.22);font-weight:850;cursor:pointer}
.jump-fab{left:max(14px,env(safe-area-inset-left));padding:0 14px;border-radius:999px;font-size:.72rem}
.back-top{right:max(14px,env(safe-area-inset-right));width:42px;border-radius:50%;display:grid;place-items:center;text-decoration:none;font-size:1.08rem;line-height:1}
.jump-fab:hover,.jump-fab:focus-visible,.back-top:hover,.back-top:focus-visible{background:#214994;outline:none}
.jump-menu{position:fixed;z-index:31;left:max(14px,env(safe-area-inset-left));bottom:calc(max(16px,env(safe-area-inset-bottom)) + 50px);width:min(230px,calc(100vw - 28px));padding:8px;background:#fff;border:1px solid #dce5f1;border-radius:14px;box-shadow:0 18px 48px rgba(15,31,69,.24)}
.foot{padding-bottom:84px}
.glossary-term-id{display:block;margin-top:2px;color:#8995a8;font-size:.58rem;font-weight:650}
.glossary-analytics-cards{display:none}
.glossary-analytics-card{border:1px solid #e2e9f2;border-radius:12px;background:#fff;padding:10px}
.glossary-analytics-card+.glossary-analytics-card{margin-top:8px}
.glossary-analytics-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
.glossary-analytics-top strong{font-size:.8rem;line-height:1.35}
.glossary-analytics-top span{flex:0 0 auto;color:#3156a3;font-size:.68rem;font-weight:900}
.glossary-recent{margin-top:8px;color:var(--muted);font-size:.65rem;font-weight:750}
.glossary-note{margin-top:10px}
.feedback-controls{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
.feedback-controls select,.feedback-controls input[type="search"]{min-height:34px;padding:6px 8px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--ink);font:inherit;font-size:.68rem;font-weight:750}
.feedback-resolved-toggle{display:flex;align-items:center;gap:5px;color:var(--muted);font-size:.66rem;font-weight:800;white-space:nowrap}
.feedback-table-title{max-width:410px}
.feedback-title-link{color:#264d94;font-weight:850;text-decoration:none}
.feedback-title-link:hover{text-decoration:underline}
.feedback-status{display:inline-block;padding:4px 7px;border-radius:999px;font-size:.6rem;font-weight:900;text-transform:capitalize}
.feedback-status.new{background:#eef3ff;color:#3159a2}.feedback-status.tracking{background:#fff5dc;color:#856000}.feedback-status.reopened{background:#fff0f1;color:#9a3340}.feedback-status.resolved{background:#eaf7ef;color:#28643d}
.feedback-reasons-mini{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}.feedback-reasons-mini span{padding:3px 5px;border-radius:999px;background:#f1f4f8;color:#66758b;font-size:.56rem;font-weight:800}
.feedback-cards{display:none}.feedback-card{display:block;padding:11px;border:1px solid #e1e8f1;border-radius:12px;background:#fff;text-decoration:none;color:inherit}.feedback-card+.feedback-card{margin-top:8px}
.feedback-card-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.feedback-card-title{font-size:.76rem;font-weight:850;line-height:1.35;color:#243d6a}
.feedback-card-meta{margin-top:6px;color:var(--muted);font-size:.62rem}.feedback-card-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px}.feedback-card-metrics div{padding:7px;border-radius:9px;background:#f7f9fc}.feedback-card-metrics b{display:block;font-size:.76rem}.feedback-card-metrics span{font-size:.57rem;color:var(--muted)}
.feedback-empty{padding:18px;text-align:center;color:var(--muted);font-size:.72rem}
.essay-analytics-overview{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-bottom:14px}
.essay-analytics-card{padding:11px;border:1px solid #e4eaf3;border-radius:11px;background:#fbfcfe}
.essay-analytics-card b{display:block;font-size:1.2rem}.essay-analytics-card span{display:block;margin-top:2px;color:var(--muted);font-size:.61rem;font-weight:750}
.essay-performance-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;min-width:0}
.essay-performance-card{min-width:0;padding:11px;border:1px solid #e2e9f2;border-radius:12px;background:#fbfcfe}
.essay-performance-card-title{font-size:.75rem;font-weight:900;line-height:1.35;color:var(--ink);overflow-wrap:anywhere}
.essay-performance-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:9px}
.essay-performance-metric{min-width:0;padding:7px;border-radius:9px;background:#fff;border:1px solid #edf1f6}
.essay-performance-metric b{display:block;font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.essay-performance-metric span{display:block;margin-top:2px;color:var(--muted);font-size:.55rem;font-weight:750}
.essay-subsection{min-width:0}.essay-subsection h3{margin:0 0 3px;font-size:.8rem}.essay-subsection .subcopy{display:block;margin-bottom:8px;color:var(--muted);font-size:.63rem}
.essay-fact-btn{appearance:none;border:0;background:none;padding:0;color:#274d9a;font:inherit;font-weight:850;text-align:left;cursor:pointer}.essay-fact-btn:hover{text-decoration:underline}
.essay-needs-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.essay-need{border:1px solid #e3e9f2;border-radius:10px;background:#fbfcfe;padding:9px;text-align:left;color:inherit;cursor:pointer}
.essay-need strong{display:block;font-size:.72rem;line-height:1.35}.essay-need span{display:block;margin-top:4px;color:var(--muted);font-size:.61rem}.essay-need b{color:var(--bad)}
.essay-fact-cards{display:none}.essay-fact-card{border:1px solid #e2e9f2;border-radius:11px;background:#fff;padding:10px}.essay-fact-card+.essay-fact-card{margin-top:7px}
.essay-fact-card-top{display:flex;justify-content:space-between;gap:8px}.essay-fact-card .mini{margin-top:5px;color:var(--muted);font-size:.61rem}
.essay-content-current{font-size:.58rem;font-weight:850;color:var(--good)}.essay-content-old{font-size:.58rem;font-weight:850;color:var(--warn)}
.essay-detail-pairing{padding:11px;border:1px solid #e4eaf3;border-radius:11px;background:#f8fafc;line-height:1.45;font-size:.78rem}.essay-detail-pairing strong{display:block;margin-bottom:3px}
.essay-confusion-row{display:grid;grid-template-columns:minmax(0,1fr) 78px 78px;gap:8px;padding:7px 0;border-bottom:1px solid #edf1f6;font-size:.69rem}.essay-confusion-row:last-child{border-bottom:0}
.essay-confusion-row .num{text-align:right}
#dashboard-filters{grid-template-columns:repeat(5,minmax(130px,1fr))}
#dashboard-filters .clear{grid-column:1 / -1}
@media(max-width:1100px){#dashboard-filters{grid-template-columns:repeat(4,minmax(120px,1fr))}}
@media(max-width:900px){.essay-analytics-overview{grid-template-columns:repeat(3,1fr)}.essay-performance-cards{grid-template-columns:1fr}}

.jump-menu-title{padding:5px 7px 7px;color:#748198;font-size:.61rem;font-weight:900;text-transform:uppercase;letter-spacing:.055em}
.jump-menu a{display:block;padding:9px 10px;border-radius:9px}
.jump-menu a:hover,.jump-menu a:focus-visible{background:#eef3fb;outline:none}
@media(max-width:650px){
  .section-jump{padding:7px 8px;margin-bottom:9px}
  .section-jump-label{font-size:.59rem}
  .section-jump a{font-size:.66rem;padding:6px 7px}
  .jump-fab,.back-top{height:40px}
  .back-top{width:40px}
  .foot{padding-bottom:76px}
  .glossary-analytics-cards{display:block}
  #glossaryAnalytics .desktop-table{display:none}
  .feedback-cards{display:block}
  #feedbackIssues .desktop-table{display:none}
  .feedback-controls{width:100%}
  .feedback-controls select,.feedback-controls input[type="search"]{flex:1 1 130px}
  .essay-analytics-overview{grid-template-columns:repeat(2,1fr)}
  .essay-performance-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}
  #dashboard-filters{grid-template-columns:1fr 1fr}
  #dashboard-filters .chabura-region{grid-column:1}
  #dashboard-filters .chabura{grid-column:2}
  #dashboard-filters .cohort{grid-column:1}
  #dashboard-filters .category{grid-column:2}
  #dashboard-filters .mode{grid-column:1}
  #dashboard-filters .country{grid-column:2}
  #dashboard-filters .region{grid-column:1}
  #dashboard-filters .city{grid-column:2}
  #dashboard-filters .from{grid-column:1}
  #dashboard-filters .to{grid-column:2}
  #dashboard-filters .clear{grid-column:1 / -1}
  .essay-needs-grid{grid-template-columns:1fr}
  .essay-fact-cards{display:block}
  #essayFactDiagnostics .desktop-table{display:none}
}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.scroll-control{transition:none}}
</style>`;

  const feedbackSection =
    '<section class="section" id="content-feedback" style="margin-top:14px">' +
      '<div class="section-head"><div class="headcopy"><h2>Content feedback</h2><span>Flagged questions and essay pairings, grouped for tracking and resolution</span></div>' +
      '<div class="section-actions feedback-controls">' +
        '<input id="feedbackSearchFilter" type="search" placeholder="Search topic or content" aria-label="Search feedback topics">' +
        '<select id="feedbackTypeFilter" aria-label="Feedback content type"><option value="">All content</option><option value="question">Questions</option><option value="essay_prompt">Essay questions</option><option value="essay_pairing">Essay pairings</option></select>' +
        '<select id="feedbackReasonFilter" aria-label="Feedback tag"><option value="">All tags</option><option value="inaccurate">Inaccurate</option><option value="incomplete">Incomplete</option><option value="confusing">Confusing</option><option value="typo">Typo</option><option value="audio_link">Wrong audio</option><option value="notes_link">Wrong notes</option><option value="other">Other</option></select>' +
        '<select id="feedbackStatusFilter" aria-label="Feedback status"><option value="">All unresolved</option><option value="new">New</option><option value="tracking">Tracking</option><option value="reopened">Reopened</option><option value="resolved">Resolved</option></select>' +
        '<label class="feedback-resolved-toggle"><input id="feedbackShowResolved" type="checkbox"> Include resolved</label>' +
      '</div></div><div id="feedbackIssues"><div class="feedback-empty">Loading feedback…</div></div>' +
    '</section>';



  const announcementSection =
    '<section class="section" id="announcements-admin" style="margin-top:14px">' +
      '<div class="section-head"><div class="headcopy"><h2>Announcements</h2><span>Send in-app notices without rebuilding SCP Study</span></div></div>' +
      '<div style="display:grid;gap:8px"><input id="announcementToken" type="password" placeholder="Notification admin token"><select id="announcementZman"><option value="all">All Zmanim</option></select><select id="announcementKind"><option value="announcement">Announcement</option><option value="link">Link</option><option value="feedback_request">Feedback request</option><option value="poll">Poll / survey link</option></select><input id="announcementTitle" maxlength="120" placeholder="Notification title"><textarea id="announcementBody" maxlength="1200" placeholder="Notification text" style="min-height:76px"></textarea><input id="announcementActionUrl" maxlength="1000" placeholder="Optional action URL"><input id="announcementActionLabel" maxlength="80" placeholder="Optional action label"><div><button class="primary" id="sendAnnouncement" type="button">Send announcement</button> <span id="announcementStatus"></span></div></div></section>';

  const essaySection =
    '<section class="section" id="essay-analytics" style="margin-top:14px">' +
      '<div class="section-head"><div class="headcopy"><h2>Essay analytics</h2><span>Practice diagnostics for essay rounds and atomic name/concept → position pairings</span></div></div>' +
      '<div id="essayAnalyticsOverview" class="essay-analytics-overview"><div class="feedback-empty">Loading essay analytics…</div></div>' +
      '<div class="grid2">' +
        '<div class="essay-subsection"><h3>Essay performance</h3><span class="subcopy">Round completion, first-try pairing accuracy, and repeat practice</span><div id="essayPerformance"><div class="feedback-empty">Loading…</div></div></div>' +
        '<div class="essay-subsection"><h3>Facts needing review</h3><span class="subcopy">Low first-try recognition after a minimum sample; adaptive selection affects exposure</span><div id="essayNeeds"><div class="feedback-empty">Loading…</div></div></div>' +
      '</div>' +
      '<div class="essay-subsection" style="margin-top:14px"><h3>Fact diagnostics</h3><span class="subcopy">See which real positions students confuse with each authority/concept. Confusion rate is wrong selections divided by times that alternative was offered.</span><div id="essayFactDiagnostics"><div class="feedback-empty">Loading…</div></div></div>' +
      '<p class="sample-note" id="essayAnalyticsNote"></p>' +
      '<dialog id="essayFactDialog"><div class="modal-head"><div><h2 id="essayFactDialogTitle">Essay fact</h2><p id="essayFactDialogSub"></p></div><button class="modal-close" id="essayFactDialogClose" type="button" aria-label="Close">×</button></div><div class="modal-body" id="essayFactDialogBody"></div></dialog>' +
    '</section>';

  const behavior = `
<script id="dashboardNavigationScript">
(() => {
  const menuButton = document.getElementById('jumpMenuButton');
  const menu = document.getElementById('jumpMenu');
  const backTop = document.getElementById('backToTop');
  if (!menuButton || !menu || !backTop) return;

  const closeMenu = () => {
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
  };

  const setControls = () => {
    const visible = window.scrollY > 360;
    menuButton.classList.toggle('visible', visible);
    backTop.classList.toggle('visible', visible);
    if (!visible) closeMenu();
  };

  menuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const opening = menu.hidden;
    menu.hidden = !opening;
    menuButton.setAttribute('aria-expanded', String(opening));
  });

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('click', (event) => {
    if (!menu.hidden && !menu.contains(event.target) && event.target !== menuButton) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  window.addEventListener('scroll', setControls, { passive: true });
  setControls();
})();
</script>`;

  const feedbackBehavior = `
<script id="dashboardFeedbackScript">
(() => {
  const searchFilter = document.getElementById('feedbackSearchFilter');
  const typeFilter = document.getElementById('feedbackTypeFilter');
  const reasonFilter = document.getElementById('feedbackReasonFilter');
  const statusFilter = document.getElementById('feedbackStatusFilter');
  const showResolved = document.getElementById('feedbackShowResolved');
  const target = document.getElementById('feedbackIssues');
  if (!searchFilter || !typeFilter || !reasonFilter || !statusFilter || !showResolved || !target) return;

  const escFeedback = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const typeLabel = value => ({ question:'Question', essay_prompt:'Essay question', essay_pairing:'Essay pairing' }[value] || value);
  const when = value => value ? new Date(value).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) : '—';
  let feedbackBusy = false;

  function feedbackParams() {
    const p = new URLSearchParams();
    if (searchFilter.value.trim()) p.set('search', searchFilter.value.trim());
    if (typeFilter.value) p.set('type', typeFilter.value);
    if (reasonFilter.value) p.set('reason', reasonFilter.value);
    if (statusFilter.value) p.set('status', statusFilter.value);
    if (showResolved.checked || statusFilter.value === 'resolved') p.set('includeResolved', '1');
    [['cohort','cohort'],['category','category'],['from','from'],['to','to']].forEach(([id,key]) => {
      const el = document.getElementById(id);
      if (el?.value) p.set(key==='cohort'?'zman':key, el.value);
    });
    return p;
  }

  function reasonChips(reasons) {
    const labels = { confusing:'confusing', inaccurate:'inaccurate', wording:'wording', incomplete:'incomplete', other:'other' };
    return Object.entries(reasons || {}).filter(([,n]) => Number(n) > 0)
      .map(([key,n]) => '<span>' + escFeedback(labels[key] || key) + ' ' + Number(n) + '</span>').join('');
  }

  function detailUrl(issue) {
    return '/feedback-detail?zman=' + encodeURIComponent(issue.zman || document.getElementById('cohort')?.value || '') + '&type=' + encodeURIComponent(issue.contentType) + '&id=' + encodeURIComponent(issue.contentId);
  }

  function renderFeedbackIssues(issues) {
    if (!issues.length) {
      target.innerHTML = '<div class="feedback-empty">No feedback issues match these filters.</div>';
      return;
    }
    const rows = issues.map(issue => '<tr>' +
      '<td><span class="feedback-status ' + escFeedback(issue.status) + '">' + escFeedback(issue.status) + '</span></td>' +
      '<td class="feedback-table-title"><a class="feedback-title-link" target="_blank" rel="noopener" href="' + detailUrl(issue) + '">' + escFeedback(issue.title || issue.contentId) + '</a><div class="feedback-reasons-mini">' + reasonChips(issue.reasons) + '</div></td>' +
      '<td><span class="pill">' + escFeedback(typeLabel(issue.contentType)) + '</span></td>' +
      '<td>' + escFeedback(issue.category || '—') + '</td>' +
      '<td class="num">' + Number(issue.totalReports || 0) + '</td>' +
      '<td class="num">' + Number(issue.learners || 0) + '</td>' +
      '<td>' + escFeedback(when(issue.lastReportAt)) + '</td>' +
      '<td><a class="feedback-title-link" target="_blank" rel="noopener" href="' + detailUrl(issue) + '">Open ↗</a></td>' +
    '</tr>').join('');
    const cards = issues.map(issue => '<a class="feedback-card" target="_blank" rel="noopener" href="' + detailUrl(issue) + '">' +
      '<div class="feedback-card-top"><div class="feedback-card-title">' + escFeedback(issue.title || issue.contentId) + '</div><span class="feedback-status ' + escFeedback(issue.status) + '">' + escFeedback(issue.status) + '</span></div>' +
      '<div class="feedback-card-meta">' + escFeedback(typeLabel(issue.contentType)) + (issue.category ? ' · ' + escFeedback(issue.category) : '') + ' · last ' + escFeedback(when(issue.lastReportAt)) + '</div>' +
      '<div class="feedback-card-metrics"><div><b>' + Number(issue.totalReports || 0) + '</b><span>Reports</span></div><div><b>' + Number(issue.learners || 0) + '</b><span>Learners</span></div><div><b>' + Number(issue.matchingReports || 0) + '</b><span>In filters</span></div></div>' +
      '<div class="feedback-reasons-mini">' + reasonChips(issue.reasons) + '</div>' +
    '</a>').join('');
    target.innerHTML = '<div class="tablewrap desktop-table"><table><thead><tr><th>Status</th><th>Content</th><th>Type</th><th>Topic</th><th class="num">Reports</th><th class="num">Learners</th><th>Last report</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div><div class="feedback-cards">' + cards + '</div>';
  }

  async function loadFeedbackIssues() {
    if (feedbackBusy) return;
    feedbackBusy = true;
    try {
      const r = await fetch('/api/feedback/issues?' + feedbackParams().toString(), { cache:'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not load feedback');
      renderFeedbackIssues(d.issues || []);
    } catch (error) {
      target.innerHTML = '<div class="feedback-empty">' + escFeedback(error.message) + '</div>';
    } finally {
      feedbackBusy = false;
    }
  }

  [typeFilter, reasonFilter, statusFilter, showResolved].forEach(el => el.addEventListener('change', loadFeedbackIssues));
  let searchTimer = null;
  searchFilter.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadFeedbackIssues, 180); });
  ['cohort','category','from','to'].forEach(id => document.getElementById(id)?.addEventListener('change', () => setTimeout(loadFeedbackIssues, 0)));
  document.getElementById('clearFilters')?.addEventListener('click', () => setTimeout(loadFeedbackIssues, 0));
  document.getElementById('refreshData')?.addEventListener('click', () => setTimeout(loadFeedbackIssues, 0));
  loadFeedbackIssues();
})();
</script>`;


  const essayBehavior = `
<script id="dashboardEssayAnalyticsScript">
(() => {
  const overviewEl = document.getElementById('essayAnalyticsOverview');
  const performanceEl = document.getElementById('essayPerformance');
  const needsEl = document.getElementById('essayNeeds');
  const factsEl = document.getElementById('essayFactDiagnostics');
  const noteEl = document.getElementById('essayAnalyticsNote');
  const dialog = document.getElementById('essayFactDialog');
  const dialogTitle = document.getElementById('essayFactDialogTitle');
  const dialogSub = document.getElementById('essayFactDialogSub');
  const dialogBody = document.getElementById('essayFactDialogBody');
  const dialogClose = document.getElementById('essayFactDialogClose');
  if (!overviewEl || !performanceEl || !needsEl || !factsEl) return;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pct = value => Number.isFinite(Number(value)) ? Math.round(Number(value) * 100) + '%' : '—';
  const dec = value => Number.isFinite(Number(value)) ? Number(value).toFixed(2) : '—';
  let data = null;
  let busy = false;

  function params() {
    const p = new URLSearchParams();
    ['cohort','chaburaRegion','chabura','country','region','city','from','to'].forEach(id => {
      const el = document.getElementById(id);
      if (el?.value) p.set(id==='cohort'?'zman':id, el.value);
    });
    return p;
  }

  function overviewCard(value, label) {
    return '<div class="essay-analytics-card"><b>' + esc(value) + '</b><span>' + esc(label) + '</span></div>';
  }

  function renderOverview(o) {
    overviewEl.innerHTML =
      overviewCard(o.learners || 0, 'Essay learners') +
      overviewCard((o.completions || 0) + ' / ' + (o.starts || 0), 'Rounds completed / started') +
      overviewCard(pct(o.completionRate || 0), 'Round completion') +
      overviewCard(pct(o.firstTryRate || 0), 'Pairings correct first try') +
      overviewCard(pct(o.perfectRate || 0), 'Perfect completed rounds');
  }

  function renderPerformance(essays) {
    const used = (essays || []).filter(e => Number(e.starts) || Number(e.pairings));
    if (!used.length) { performanceEl.innerHTML = '<div class="feedback-empty">No essay-practice data for these filters yet.</div>'; return; }
    const metric = (value, label) => '<div class="essay-performance-metric"><b>' + esc(value) + '</b><span>' + esc(label) + '</span></div>';
    performanceEl.innerHTML = '<div class="essay-performance-cards">' + used.map(e =>
      '<article class="essay-performance-card">' +
        '<div class="essay-performance-card-title">' + esc(e.title) + '</div>' +
        '<div class="essay-performance-metrics">' +
          metric(Number(e.learners||0), 'Learners') +
          metric(Number(e.completions||0) + ' / ' + Number(e.starts||0), 'Rounds') +
          metric(pct(e.completionRate||0), 'Completion') +
          metric(pct(e.firstTryRate||0), 'First try') +
          metric(pct(e.perfectRate||0), 'Perfect') +
          metric(Number(e.sources?.retry||0), 'Retries') +
        '</div>' +
      '</article>'
    ).join('') + '</div>';
  }

  function factLabel(f) {
    return (f.name || f.label || f.factId) + ' → ' + (f.position || '');
  }

  function renderNeeds(facts) {
    const needs = (facts || []).filter(f => Number(f.exposures) >= 5 && Number(f.learners) >= 3)
      .sort((a,b) => Number(a.firstTryRate) - Number(b.firstTryRate) || Number(b.exposures) - Number(a.exposures))
      .slice(0,8);
    if (!needs.length) { needsEl.innerHTML = '<div class="feedback-empty">Not enough repeated exposure yet to surface stable fact-level patterns.</div>'; return; }
    needsEl.innerHTML = '<div class="essay-needs-grid">' + needs.map(f =>
      '<button class="essay-need" type="button" data-essay-fact="' + esc(f.factId) + '"><strong>' + esc(f.name || f.label) + '</strong><span><b>' + pct(f.firstTryRate||0) + '</b> first try · ' + Number(f.exposures||0) + ' exposures · ' + Number(f.learners||0) + ' learners</span><span>' + esc(f.essayTitle) + '</span></button>'
    ).join('') + '</div>';
  }

  function confusionText(f) {
    const c = f.mostConfusedWith;
    if (!c || !c.wrong) return '—';
    return (c.name || c.factId) + ' · ' + pct(c.rate || 0);
  }

  function renderFacts(facts) {
    const used = (facts || []).filter(f => Number(f.exposures) > 0)
      .sort((a,b) => Number(a.firstTryRate) - Number(b.firstTryRate) || Number(b.exposures) - Number(a.exposures));
    if (!used.length) { factsEl.innerHTML = '<div class="feedback-empty">No pairing events for these filters yet.</div>'; return; }
    const rows = used.map(f => '<tr><td><button class="essay-fact-btn" type="button" data-essay-fact="' + esc(f.factId) + '">' + esc(f.name || f.label) + '</button><div class="sample-note">' + esc(f.position) + '</div></td><td>' + esc(f.essayTitle) + '</td><td class="num">' + Number(f.learners||0) + '</td><td class="num">' + Number(f.exposures||0) + '</td><td class="num">' + pct(f.firstTryRate||0) + '</td><td class="num">' + dec(f.avgWrong||0) + '</td><td>' + esc(confusionText(f)) + '</td><td>' + (Number(f.olderExposures)>0 ? '<span class="essay-content-old">' + Number(f.olderExposures) + ' older</span>' : '<span class="essay-content-current">current</span>') + '</td></tr>').join('');
    const cards = used.map(f => '<div class="essay-fact-card"><div class="essay-fact-card-top"><button class="essay-fact-btn" type="button" data-essay-fact="' + esc(f.factId) + '">' + esc(f.name || f.label) + '</button><b>' + pct(f.firstTryRate||0) + '</b></div><div class="mini">' + esc(f.essayTitle) + ' · ' + Number(f.exposures||0) + ' exposures · ' + Number(f.learners||0) + ' learners</div><div class="mini">Most confused: ' + esc(confusionText(f)) + '</div></div>').join('');
    factsEl.innerHTML = '<div class="tablewrap desktop-table"><table><thead><tr><th>Pairing</th><th>Essay</th><th class="num">Learners</th><th class="num">Exposure</th><th class="num">First try</th><th class="num">Avg wrong</th><th>Most confused with</th><th>Version</th></tr></thead><tbody>' + rows + '</tbody></table></div><div class="essay-fact-cards">' + cards + '</div>';
  }

  function openFact(id) {
    const f = data?.facts?.find(x => String(x.factId) === String(id));
    if (!f || !dialog) return;
    dialogTitle.textContent = f.name || f.label || f.factId;
    dialogSub.textContent = f.essayTitle || '';
    const confusions = (f.confusion || []).filter(c => Number(c.offered) > 0);
    dialogBody.innerHTML =
      '<div class="essay-detail-pairing"><strong>' + esc(f.name || f.label) + '</strong>' + esc(f.position || '') + '</div>' +
      '<div class="modal-metrics" style="margin-top:12px">' +
        '<div class="modal-metric"><b>' + Number(f.learners||0) + '</b><span>Learners</span></div>' +
        '<div class="modal-metric"><b>' + Number(f.exposures||0) + '</b><span>Exposures</span></div>' +
        '<div class="modal-metric"><b>' + pct(f.firstTryRate||0) + '</b><span>First try</span></div>' +
        '<div class="modal-metric"><b>' + dec(f.avgWrong||0) + '</b><span>Avg wrong</span></div>' +
      '</div>' +
      '<div class="dist-title">Confusion opportunities</div>' +
      (confusions.length ? confusions.map(c => '<div class="essay-confusion-row"><div><strong>' + esc(c.name || c.factId) + '</strong><div class="sample-note">' + esc(c.position || '') + '</div></div><div class="num"><b>' + Number(c.wrong||0) + '</b><div class="sample-note">wrong / ' + Number(c.offered||0) + ' offered</div></div><div class="num"><b>' + pct(c.rate||0) + '</b><div class="sample-note">confusion</div></div></div>').join('') : '<div class="feedback-empty">No alternative-position confusion has been recorded for this fact.</div>') +
      (Number(f.olderExposures)>0 ? '<p class="sample-note">' + Number(f.olderExposures) + ' exposure(s) used older wording/content; current-content exposures: ' + Number(f.currentExposures||0) + '.</p>' : '');
    if (!dialog.open) dialog.showModal();
  }

  function render(d) {
    data = d;
    renderOverview(d.overview || {});
    renderPerformance(d.essays || []);
    renderNeeds(d.facts || []);
    renderFacts(d.facts || []);
    if (noteEl) noteEl.textContent = d.note || '';
  }

  async function load() {
    if (busy) return;
    busy = true;
    try {
      const r = await fetch('/api/essay-summary?' + params().toString(), { cache:'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not load essay analytics');
      render(d);
    } catch (error) {
      const message = '<div class="feedback-empty">' + esc(error.message) + '</div>';
      overviewEl.innerHTML = message; performanceEl.innerHTML = message; needsEl.innerHTML = message; factsEl.innerHTML = message;
    } finally { busy = false; }
  }

  [performanceEl, needsEl, factsEl].forEach(el => el.addEventListener('click', e => {
    const button = e.target.closest('[data-essay-fact]');
    if (button) openFact(button.dataset.essayFact);
  }));
  dialogClose?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  ['chaburaRegion','chabura','cohort','country','region','city','from','to'].forEach(id => document.getElementById(id)?.addEventListener('change', () => setTimeout(load, 0)));
  document.getElementById('clearFilters')?.addEventListener('click', () => setTimeout(load, 0));
  document.getElementById('refreshData')?.addEventListener('click', () => setTimeout(load, 0));
  load();
})();
</script>`;

  const originalFilters =
    '<section class="filters" aria-label="Dashboard filters">\n' +
    '    <div class="field cohort"><label for="cohort">Cohort</label><select id="cohort"><option value="">All cohorts</option></select></div>\n' +
    '    <div class="field mode"><label for="mode">Mode</label><select id="mode"><option value="">Study + Test</option><option value="study">Study</option><option value="test">Practice test</option></select></div>\n' +
    '    <div class="field country"><label for="country">Country</label><select id="country"><option value="">All countries</option></select></div>\n' +
    '    <div class="field region"><label for="region">Region</label><select id="region"><option value="">All regions</option></select></div>\n' +
    '    <div class="field city"><label for="city">City</label><select id="city"><option value="">All cities</option></select></div>\n' +
    '    <div class="field category"><label for="category">Topic</label><select id="category"><option value="">All topics</option></select></div>\n' +
    '    <div class="field from"><label for="from">From</label><input id="from" type="date" /></div>\n' +
    '    <div class="field to"><label for="to">Through</label><input id="to" type="date" /></div>\n' +
    '    <button class="clear" id="clearFilters" type="button">Clear filters</button>\n' +
    '  </section>';
  const reorderedFilters =
    '<section class="filters" id="dashboard-filters" aria-label="Dashboard filters">\n' +
    '    <div class="field cohort"><label for="cohort">Cohort</label><select id="cohort" required><option value="" disabled>Select cohort…</option></select></div>\n' +
    '    <div class="field chabura-region"><label for="chaburaRegion">Chabura Location</label><select id="chaburaRegion"><option value="">All chabura locations</option></select></div>\n' +
    '    <div class="field chabura"><label for="chabura">Chabura Rav</label><select id="chabura"><option value="">All chabura rabbanim</option></select></div>\n' +
    '    <div class="field category"><label for="category">Topic</label><select id="category"><option value="">All topics</option></select></div>\n' +
    '    <div class="field mode"><label for="mode">Mode</label><select id="mode"><option value="">Study + Test</option><option value="study">Study</option><option value="test">Practice test</option></select></div>\n' +
    '    <div class="field country"><label for="country">Country</label><select id="country"><option value="">All countries</option></select></div>\n' +
    '    <div class="field region"><label for="region">Region</label><select id="region"><option value="">All regions</option></select></div>\n' +
    '    <div class="field city"><label for="city">City</label><select id="city"><option value="">All cities</option></select></div>\n' +
    '    <div class="field from"><label for="from">From</label><input id="from" type="date" /></div>\n' +
    '    <div class="field to"><label for="to">Through</label><input id="to" type="date" /></div>\n' +
    '    <button class="clear" id="clearFilters" type="button">Clear filters</button>\n' +
    '  </section>';


  const announcementBehavior = `
<script id="dashboardAnnouncementScript">
(async function(){
  const token=document.getElementById('announcementToken');
  const zman=document.getElementById('announcementZman');
  const title=document.getElementById('announcementTitle');
  const body=document.getElementById('announcementBody');
  const kind=document.getElementById('announcementKind');
  const actionUrl=document.getElementById('announcementActionUrl');
  const actionLabel=document.getElementById('announcementActionLabel');
  const send=document.getElementById('sendAnnouncement');
  const status=document.getElementById('announcementStatus');
  token.value=sessionStorage.getItem('scpNotificationAdminToken')||'';
  token.addEventListener('change',function(){sessionStorage.setItem('scpNotificationAdminToken',token.value)});
  try {
    const response=await fetch('/api/options',{cache:'no-store'});
    const data=await response.json();
    (data.zmanOptions||[]).forEach(function(item){const option=document.createElement('option');option.value=item.id;option.textContent=item.name||item.id;zman.appendChild(option)});
    if(data.latestZmanId) zman.value=data.latestZmanId;
  } catch (_) {}
  send.addEventListener('click', async function(){
    status.textContent='Sending…';
    try {
      const response=await fetch('/api/admin/notifications',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token.value},body:JSON.stringify({zman:zman.value,kind:kind.value,title:title.value,body:body.value,action:actionUrl.value?{type:'link',url:actionUrl.value,label:actionLabel.value||'Open'}:null})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||'Could not send');
      status.textContent='Sent.'; title.value=''; body.value='';
    } catch (error) { status.textContent=error.message; }
  });
})();
</script>`;

  return html
    .replace('<body>', '<body id="top">')
    .replace(originalFilters, reorderedFilters)
    .replace("const filters=['cohort','country','region','city','category','mode','from','to'];", "const filters=['cohort','chaburaRegion','chabura','category','mode','country','region','city','from','to'];")
    .replace("function query(){const q=new URLSearchParams();filters.forEach(id=>{const v=$(id).value;if(v)q.set(id,v)});return q.toString()}", "function cascadeChabura(){if(!options)return;const location=$('chaburaRegion').value,rav=$('chabura').value;const profiles=options.chaburaProfiles||[];const ravs=[...new Set(profiles.filter(x=>!location||x.location===location).map(x=>x.rav).filter(Boolean))].sort();fillSelect('chabura',ravs);if(rav&&ravs.includes(rav))$('chabura').value=rav};function query(){const q=new URLSearchParams();filters.forEach(id=>{const v=$(id).value;if(v)q.set(id==='cohort'?'zman':id,v)});return q.toString()}")
    .replace("function applyUrlFilters(){const p=new URLSearchParams(location.search);filters.forEach(id=>{const v=p.get(id);if(v!==null)$(id).value=v});cascadeLocation();", "function applyUrlFilters(){const p=new URLSearchParams(location.search);filters.forEach(id=>{const v=id==='cohort'?(p.get('zman')||p.get('cohort')):p.get(id);if(v!==null)$(id).value=v});cascadeChabura();cascadeLocation();")
    .replace("async function init(){try{options=await getJSON('/api/options');fillSelect('cohort',options.cohorts||[]);fillSelect('country'", "async function init(){try{options=await getJSON('/api/options');fillSelect('chaburaRegion',options.chaburaLocations||[]);cascadeChabura();fillSelect('cohort',options.zmanOptions||[],x=>x.name||x.id,x=>x.id);const p=new URLSearchParams(location.search),requested=p.get('zman')||p.get('cohort');if(requested&&[...$('cohort').options].some(o=>o.value===requested))$('cohort').value=requested;else if(options.latestZmanId)$('cohort').value=options.latestZmanId;fillSelect('country'")
    .replace("filters.forEach(id=>$(id).addEventListener('change',()=>{if(id==='country'||id==='region')cascadeLocation();loadSummary()}));", "filters.forEach(id=>$(id).addEventListener('change',()=>{if(id==='chaburaRegion')cascadeChabura();if(id==='country'||id==='region')cascadeLocation();loadSummary()}));")
    .replace("$('clearFilters').addEventListener('click',()=>{filters.forEach(id=>$(id).value='');cascadeLocation();loadSummary()});", "$('clearFilters').addEventListener('click',()=>{filters.filter(id=>id!=='cohort').forEach(id=>$(id).value='');cascadeChabura();cascadeLocation();loadSummary()});")
    .replace('<h2>Needs review</h2>', '<h2 id="needs-review">Needs review</h2>')
    .replace('<h2>Topic heat map</h2>', '<h2 id="heat-map">Topic heat map</h2>')
    .replace('<h2>Topics needing review</h2>', '<h2 id="topics-review">Topics needing review</h2>')
    .replace('<h2>Where students are studying</h2>', '<h2 id="locations-review">Where students are studying</h2>')
    .replace('<h2>Glossary term attention</h2>', '<h2 id="glossary-attention">Glossary term attention</h2>')
    .replace('<section class="section" style="margin-top:14px"><div class="section-head"><div class="headcopy"><h2>Question diagnostics</h2>', announcementSection + essaySection + feedbackSection + '<section class="section" style="margin-top:14px"><div class="section-head"><div class="headcopy"><h2>Question diagnostics</h2>')
    .replace('<h2>Question diagnostics</h2>', '<h2 id="questions-diagnostics">Question diagnostics</h2>')
    .replace('<h2>Activity over time</h2>', '<h2 id="activity-over-time">Activity over time</h2>')
    .replace('<section class="overview" id="overview"></section>', inlineNav + '<section class="overview" id="overview"></section>')
    .replace('</head>', styles + '</head>')
    .replace('</body>', floatingNav + behavior + feedbackBehavior + essayBehavior + announcementBehavior + '</body>');
}

export const DASHBOARD_HTML = enhanceDashboardHtml(__DASHBOARD_BASE_HTML);
