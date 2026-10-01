function enhanceDashboardHtml(html) {
  const quickLinks = [
    ["#overview", "Overview"],
    ["#needs-review", "Needs review"],
    ["#heat-map", "Heat map"],
    ["#topics-review", "Topics"],
    ["#locations-review", "Locations"],
    ["#glossary-attention", "Glossary"],
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
#overview,#needs-review,#heat-map,#topics-review,#locations-review,#glossary-attention,#questions-diagnostics,#activity-over-time{scroll-margin-top:18px}
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
.feedback-controls select{min-height:34px;padding:6px 8px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--ink);font:inherit;font-size:.68rem;font-weight:750}
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
  .feedback-controls select{flex:1 1 130px}
}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.scroll-control{transition:none}}
</style>`;

  const feedbackSection =
    '<section class="section" id="content-feedback" style="margin-top:14px">' +
      '<div class="section-head"><div class="headcopy"><h2>Content feedback</h2><span>Flagged questions and essay pairings, grouped for tracking and resolution</span></div>' +
      '<div class="section-actions feedback-controls">' +
        '<select id="feedbackTypeFilter" aria-label="Feedback content type"><option value="">All content</option><option value="question">Questions</option><option value="essay_prompt">Essay questions</option><option value="essay_pairing">Essay pairings</option></select>' +
        '<select id="feedbackReasonFilter" aria-label="Feedback reason"><option value="">All reasons</option><option value="confusing">Confusing</option><option value="inaccurate">May be inaccurate</option><option value="wording">Wording / typo</option><option value="incomplete">Missing / incomplete</option><option value="other">Other</option></select>' +
        '<label class="feedback-resolved-toggle"><input id="feedbackShowResolved" type="checkbox"> Show resolved</label>' +
      '</div></div><div id="feedbackIssues"><div class="feedback-empty">Loading feedback…</div></div>' +
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
  const typeFilter = document.getElementById('feedbackTypeFilter');
  const reasonFilter = document.getElementById('feedbackReasonFilter');
  const showResolved = document.getElementById('feedbackShowResolved');
  const target = document.getElementById('feedbackIssues');
  if (!typeFilter || !reasonFilter || !showResolved || !target) return;

  const escFeedback = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const typeLabel = value => ({ question:'Question', essay_prompt:'Essay question', essay_pairing:'Essay pairing' }[value] || value);
  const when = value => value ? new Date(value).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) : '—';
  let feedbackBusy = false;

  function feedbackParams() {
    const p = new URLSearchParams();
    if (typeFilter.value) p.set('type', typeFilter.value);
    if (reasonFilter.value) p.set('reason', reasonFilter.value);
    if (showResolved.checked) p.set('includeResolved', '1');
    [['cohort','cohort'],['category','category'],['from','from'],['to','to']].forEach(([id,key]) => {
      const el = document.getElementById(id);
      if (el?.value) p.set(key, el.value);
    });
    return p;
  }

  function reasonChips(reasons) {
    const labels = { confusing:'confusing', inaccurate:'inaccurate', wording:'wording', incomplete:'incomplete', other:'other' };
    return Object.entries(reasons || {}).filter(([,n]) => Number(n) > 0)
      .map(([key,n]) => '<span>' + escFeedback(labels[key] || key) + ' ' + Number(n) + '</span>').join('');
  }

  function detailUrl(issue) {
    return '/feedback-detail?type=' + encodeURIComponent(issue.contentType) + '&id=' + encodeURIComponent(issue.contentId);
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

  [typeFilter, reasonFilter, showResolved].forEach(el => el.addEventListener('change', loadFeedbackIssues));
  ['cohort','category','from','to'].forEach(id => document.getElementById(id)?.addEventListener('change', () => setTimeout(loadFeedbackIssues, 0)));
  document.getElementById('clearFilters')?.addEventListener('click', () => setTimeout(loadFeedbackIssues, 0));
  document.getElementById('refreshData')?.addEventListener('click', () => setTimeout(loadFeedbackIssues, 0));
  loadFeedbackIssues();
})();
</script>`;

  return html
    .replace('<body>', '<body id="top">')
    .replace('<section class="filters" aria-label="Dashboard filters">', '<section class="filters" id="dashboard-filters" aria-label="Dashboard filters">')
    .replace('<h2>Needs review</h2>', '<h2 id="needs-review">Needs review</h2>')
    .replace('<h2>Topic heat map</h2>', '<h2 id="heat-map">Topic heat map</h2>')
    .replace('<h2>Topics needing review</h2>', '<h2 id="topics-review">Topics needing review</h2>')
    .replace('<h2>Where students are studying</h2>', '<h2 id="locations-review">Where students are studying</h2>')
    .replace('<h2>Glossary term attention</h2>', '<h2 id="glossary-attention">Glossary term attention</h2>')
    .replace('<section class="section" style="margin-top:14px"><div class="section-head"><div class="headcopy"><h2>Question diagnostics</h2>', feedbackSection + '<section class="section" style="margin-top:14px"><div class="section-head"><div class="headcopy"><h2>Question diagnostics</h2>')
    .replace('<h2>Question diagnostics</h2>', '<h2 id="questions-diagnostics">Question diagnostics</h2>')
    .replace('<h2>Activity over time</h2>', '<h2 id="activity-over-time">Activity over time</h2>')
    .replace('<section class="overview" id="overview"></section>', inlineNav + '<section class="overview" id="overview"></section>')
    .replace('</head>', styles + '</head>')
    .replace('</body>', floatingNav + behavior + feedbackBehavior + '</body>');
}

export const DASHBOARD_HTML = enhanceDashboardHtml(__DASHBOARD_BASE_HTML);
