export const DASHBOARD_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="SCP Study Dashboard"><defs><linearGradient id="db-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#143f94"/><stop offset="1" stop-color="#061638"/></linearGradient><linearGradient id="db-blue" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#28a3ff"/><stop offset="1" stop-color="#1762ff"/></linearGradient><linearGradient id="db-gold" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#ffad17"/><stop offset="1" stop-color="#fff27a"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="15" fill="url(#db-bg)" stroke="#2c72ff" stroke-width="2"/><path d="M15 46V35h8v11zm13 0V27h8v19zm13 0V19h8v27z" fill="url(#db-blue)"/><path d="M14 30l10-8 9 4 16-13" fill="none" stroke="url(#db-gold)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M43 13h6v6" fill="none" stroke="#ffe26b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function enhanceDashboardHtml(html) {
  const quickLinks = [
    ["#overview", "Overview"],
    ["#needs-review", "Needs review"],
    ["#heat-map", "Heat map"],
    ["#topics-review", "Topics"],
    ["#locations-review", "Locations"],
    ["#glossary-attention", "Glossary"],
    ["#study-aid-usage", "Study aids"],
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

  const topHeader =
    '<header class="top"><div class="topin">' +
      '<div class="dashboard-title-block"><span class="dashboard-app-mark" aria-hidden="true">' + DASHBOARD_ICON_SVG + '</span><h1>SCP Study — Instructor Dashboard</h1></div>' +
      '<nav class="suite-nav" aria-label="SCP applications">' +
        '<a class="suite-nav-action" href="https://scp-study.ksariash.workers.dev/" target="_blank" rel="noopener" aria-label="Open Study" title="Study">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 6.5c3-1 5.1-.5 7.5 1v11c-2.4-1.5-4.5-2-7.5-1v-11Zm15 0c-3-1-5.1-.5-7.5 1v11c2.4-1.5 4.5-2 7.5-1v-11Z"/></svg><span>Study</span>' +
        '</a>' +
        '<a class="suite-nav-action" href="https://scp-study-announcements.ksariash.workers.dev/" target="_blank" rel="noopener" aria-label="Open Announcements" title="Announcements">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg><span>Announcements</span>' +
        '</a>' +
      '</nav>' +
    '</div></header>';

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
#overview,#needs-review,#heat-map,#topics-review,#locations-review,#glossary-attention,#study-aid-usage,#essay-analytics,#questions-diagnostics,#activity-over-time{scroll-margin-top:18px}
.section-jump{display:flex;align-items:center;gap:9px;margin:0 0 12px;padding:8px 10px;background:#fff;border:1px solid var(--line);border-radius:13px;box-shadow:0 5px 16px rgba(24,41,75,.035);min-width:0}
.section-jump-label{flex:0 0 auto;color:#708096;font-size:.64rem;font-weight:900;text-transform:uppercase;letter-spacing:.055em}
.section-jump-links{display:flex;gap:6px;min-width:0;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.section-jump-links::-webkit-scrollbar{display:none}
.section-jump a,.jump-menu a{color:#294f99;text-decoration:none;font-size:.7rem;font-weight:850;white-space:nowrap}
.section-jump a{padding:6px 8px;border-radius:9px;background:#f3f6fc;border:1px solid #e3e9f4}
.section-jump a:hover,.section-jump a:focus-visible{background:#eaf0fb;outline:none}
.dashboard-title-block{display:flex;align-items:center;gap:10px;min-width:0}
.dashboard-app-mark{display:grid;place-items:center;width:42px;height:42px;flex:0 0 auto;border-radius:11px;box-shadow:0 5px 14px rgba(0,0,0,.2)}
.dashboard-app-mark svg{display:block;width:42px;height:42px}
.topin{align-items:center!important}
.suite-nav{display:flex;align-items:center;justify-content:flex-end;gap:7px;flex:0 0 auto;white-space:nowrap}
.suite-nav-action{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-width:40px;height:40px;padding:0 10px;border:1px solid rgba(255,255,255,.28);border-radius:10px;background:rgba(255,255,255,.08);color:#fff;text-decoration:none;font-size:.72rem;font-weight:850}
.suite-nav-action svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto}
.suite-nav-action:hover,.suite-nav-action:focus-visible{background:rgba(255,255,255,.16);outline:none;border-color:rgba(255,255,255,.46)}
.scroll-control{opacity:0;pointer-events:none;transform:translateY(8px);transition:opacity .16s ease,transform .16s ease}
.scroll-control.visible{opacity:1;pointer-events:auto;transform:translateY(0)}
.jump-fab,.back-top{position:fixed;z-index:30;bottom:max(16px,env(safe-area-inset-bottom));height:42px;border:1px solid rgba(255,255,255,.36);background:#173771;color:#fff;box-shadow:0 10px 28px rgba(15,37,82,.22);font-weight:850;cursor:pointer}
.jump-fab{left:max(14px,env(safe-area-inset-left));padding:0 14px;border-radius:999px;font-size:.72rem}
.back-top{right:max(14px,env(safe-area-inset-right));width:42px;border-radius:50%;display:grid;place-items:center;text-decoration:none;font-size:1.08rem;line-height:1}
.jump-fab:hover,.jump-fab:focus-visible,.back-top:hover,.back-top:focus-visible{background:#214994;outline:none}
.dashboard-app-link:hover,.dashboard-app-link:focus-visible{background:#e1ebfb!important}
@media(max-width:700px){.section-jump{align-items:flex-start;flex-wrap:wrap}.section-jump-links{order:2;flex:1 1 100%}}
@media(max-width:650px){
  .topin{flex-direction:row!important;align-items:flex-start!important;gap:10px!important}
  .dashboard-title-block{flex:1 1 auto}
  .dashboard-app-mark,.dashboard-app-mark svg{width:36px;height:36px}
  .top h1{font-size:1.2rem;line-height:1.18;overflow-wrap:anywhere}
  .suite-nav{margin-left:auto;gap:5px}
  .suite-nav-action{width:38px;min-width:38px;height:38px;padding:0;border-radius:10px}
  .suite-nav-action span{display:none}
  .suite-nav-action svg{width:18px;height:18px}
}
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
.resource-usage-overview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-bottom:12px}
.resource-usage-card{padding:12px;border:1px solid #e1e8f2;border-radius:12px;background:#f9fbff}
.resource-usage-card b{display:block;color:#1f438d;font-size:1.08rem}.resource-usage-card span{display:block;margin-top:2px;color:#66758b;font-size:.66rem;font-weight:750}
.resource-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.resource-panel{min-width:0;padding:12px;border:1px solid #e2e9f2;border-radius:12px;background:#fff}
.resource-panel h3{margin:0 0 3px;font-size:.84rem}.resource-panel-sub{display:block;margin-bottom:9px;color:var(--muted);font-size:.64rem}
.resource-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:8px 0;border-bottom:1px solid #edf1f6}.resource-row:last-child{border-bottom:0}
.resource-row strong{display:block;font-size:.73rem;line-height:1.35}.resource-row small{display:block;margin-top:2px;color:#7a8799;font-size:.6rem}.resource-row b{color:#3156a3;font-size:.72rem;text-align:right}
.resource-reference{display:block;min-width:0;color:inherit;text-decoration:none;border-radius:8px}
.resource-reference:hover strong,.resource-reference:focus-visible strong{color:#274f9d;text-decoration:underline}.resource-reference:focus-visible{outline:2px solid rgba(49,86,163,.28);outline-offset:2px}
.question-study-reference{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;min-height:34px;padding:6px 9px;border:1px solid #d5dfed;border-radius:9px;background:#f6f9fd;color:#274f96;text-decoration:none;font-size:.67rem;font-weight:850}
.question-study-reference:hover,.question-study-reference:focus-visible{background:#edf3fc;outline:none}
.question-study-reference svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
@media(max-width:650px){.question-study-reference span{display:none}.question-study-reference{width:34px;padding:0;justify-content:center}}
.activity-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px;min-width:0}
.activity-panel-head>div{min-width:0}.activity-panel-head .activity-sub{margin-bottom:0}
.range-toggle{flex:0 0 auto;min-height:32px;padding:5px 9px;border:1px solid #d4ddea;border-radius:9px;background:#fff;color:#31569a;font:inherit;font-size:.66rem;font-weight:850;cursor:pointer}
.range-toggle:hover,.range-toggle:focus-visible{background:#eef4ff;border-color:#b7c9e6;outline:none}
.range-toggle[aria-pressed="true"]{background:#dfeaff;border-color:#7597d3;color:#173e88;box-shadow:inset 0 0 0 1px rgba(49,86,183,.08)}
.timeline-size{display:grid;grid-template-columns:auto auto;align-items:center;gap:6px;flex:0 0 auto;color:var(--muted);font-size:.61rem;font-weight:800;white-space:nowrap}
.timeline-size select{min-width:62px;height:32px;padding:5px 7px;border:1px solid #d4ddea;border-radius:9px;background:#fff;color:var(--ink);font:inherit;font-size:.67rem;font-weight:800}
.timeline-pagination{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:9px;padding-top:8px;border-top:1px solid #edf1f6}
.timeline-pagination[hidden]{display:none}.timeline-pagination span{min-width:0;color:var(--muted);font-size:.61rem;font-weight:750;text-align:center}
.timeline-pagination button{min-height:32px;padding:5px 9px;border:1px solid #d4ddea;border-radius:9px;background:#fff;color:#31569a;font:inherit;font-size:.65rem;font-weight:850;cursor:pointer}
.timeline-pagination button:hover:not(:disabled),.timeline-pagination button:focus-visible{background:#eef4ff;outline:none}.timeline-pagination button:disabled{opacity:.42;cursor:default}
@media(max-width:650px){.activity-panel-head{align-items:flex-start}.timeline-size{grid-template-columns:1fr;gap:2px}.range-toggle{min-height:34px}.timeline-pagination button{min-height:34px}}
@media(max-width:700px){.resource-usage-overview{grid-template-columns:1fr}.resource-grid{grid-template-columns:1fr}}
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
#dashboard-filters{grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;padding:10px}
#dashboard-filters .field{min-width:0}
#dashboard-filters .field label{font-size:.59rem;margin-bottom:4px}
#dashboard-filters .field select,#dashboard-filters .field input{width:100%;min-width:0;height:36px;padding:6px 8px;font-size:.7rem;box-sizing:border-box}
#dashboard-filters .clear{grid-column:1 / -1;min-height:36px}
@media(max-width:900px){#dashboard-filters{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;padding:8px}}
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
  #dashboard-filters{grid-template-columns:repeat(2,minmax(0,1fr))}
  #dashboard-filters .field{grid-column:auto!important}
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



  const announcementSection = '';

  const activityPanel =
    '<div class="activity-grid">' +
      '<div class="activity-panel"><div class="activity-panel-head"><div><h3>Peak study times</h3><span class="activity-sub" id="peakRangeLabel">Trailing 90 days · local clock time at each student’s approximate network timezone</span></div>' +
        '<button class="range-toggle" id="peakRangeToggle" type="button" aria-pressed="false">All dates</button></div><div id="peakTimes"></div></div>' +
      '<div class="activity-panel"><div class="activity-panel-head"><div><h3>Answer submissions by day</h3><span class="activity-sub">Newest activity first, grouped by day</span></div>' +
        '<label class="timeline-size" for="timelinePageSize"><span>Days per page</span><select id="timelinePageSize" aria-label="Days per page"><option value="10" selected>10</option><option value="20">20</option><option value="30">30</option><option value="60">60</option><option value="90">90</option></select></label></div>' +
        '<div id="timeline"></div><div class="timeline-pagination" id="timelinePagination"><button type="button" id="timelineNewer">← Newer</button><span id="timelineRange"></span><button type="button" id="timelineOlder">Older →</button></div></div>' +
    '</div>';

  const resourceSection =
    '<section class="section" id="study-aid-usage" style="margin-top:14px">' +
      '<div class="section-head"><div class="headcopy"><h2>Study aid usage</h2><span>How often students open audio reviews, course-note pages, and glossary terms</span></div></div>' +
      '<div id="resourceUsageOverview" class="resource-usage-overview"><div class="feedback-empty">Loading study-aid usage…</div></div>' +
      '<div class="resource-grid">' +
        '<div class="resource-panel"><h3>Most played audio</h3><span class="resource-panel-sub">Individual review files, ranked by play starts</span><div id="audioResourceUsage"></div></div>' +
        '<div class="resource-panel"><h3>Most opened note pages</h3><span class="resource-panel-sub">Concise and full-note pages opened from Study</span><div id="noteResourceUsage"></div></div>' +
      '</div><p id="resourceUsageNote" class="sample-note"></p>' +
    '</section>';

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

  const resourceBehavior = `
<script id="dashboardResourceAnalyticsScript">
(() => {
  const overview=document.getElementById('resourceUsageOverview');
  const audioEl=document.getElementById('audioResourceUsage');
  const notesEl=document.getElementById('noteResourceUsage');
  const noteEl=document.getElementById('resourceUsageNote');
  if(!overview||!audioEl||!notesEl)return;
  const esc=value=>String(value??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  let busy=false;
  function params(){const p=new URLSearchParams();['cohort','chaburaRegion','chabura','category','mode','country','region','city','from','to'].forEach(id=>{const el=document.getElementById(id);if(el?.value)p.set(id==='cohort'?'zman':id,el.value)});return p}
  function card(value,label,learners){return '<div class="resource-usage-card"><b>'+Number(value||0)+'</b><span>'+esc(label)+' · '+Number(learners||0)+' learner'+(Number(learners)===1?'':'s')+'</span></div>'}
  function studyReference(params){const url=new URL('https://scp-study.ksariash.workers.dev/');const zman=document.getElementById('cohort')?.value;if(zman)url.searchParams.set('zman',zman);Object.entries(params||{}).forEach(([key,value])=>{if(value!==null&&value!==undefined&&value!=='')url.searchParams.set(key,String(value))});return url.href}
  function resourceHref(item,type){if(type==='audio'){const id=String(item?.id||'');return /^\d+$/.test(id)?studyReference({audio:id}):''}const variant=String(item?.variant||String(item?.id||'').split(':')[0]||'').toLowerCase();const page=Number(item?.page)||Number(String(item?.id||'').match(/:p(\d+)/)?.[1])||0;return ['compact','full'].includes(variant)&&page>0?studyReference({pdf:variant,page}):''}
  function rows(items,empty,noun,type){if(!items?.length)return '<div class="feedback-empty">'+esc(empty)+'</div>';return items.slice(0,12).map(item=>{const href=resourceHref(item,type);const copy='<div><strong>'+esc(item.label||item.id)+'</strong><small>'+Number(item.learners||0)+' learner'+(Number(item.learners)===1?'':'s')+(item.page?' · page '+Number(item.page):'')+'</small></div>';return '<div class="resource-row">'+(href?'<a class="resource-reference" href="'+esc(href)+'" target="_blank" rel="noopener" title="Open in Study">'+copy+'</a>':copy)+'<b>'+Number(item.uses||0)+' '+noun+(Number(item.uses)===1?'':'s')+'</b></div>'}).join('')}
  async function load(){if(busy)return;busy=true;try{const r=await fetch('/api/resource-summary?'+params().toString(),{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not load study-aid usage');overview.innerHTML=card(d.totals?.audio?.uses,'Audio plays',d.totals?.audio?.learners)+card(d.totals?.notes?.uses,'Notes opens',d.totals?.notes?.learners)+card(d.totals?.glossary?.uses,'Glossary opens',d.totals?.glossary?.learners);audioEl.innerHTML=rows(d.audio,'No detailed audio plays recorded yet.','play','audio');notesEl.innerHTML=rows(d.notes,'No detailed note-page opens recorded yet.','open','notes');if(noteEl)noteEl.textContent=d.note||''}catch(error){const msg='<div class="feedback-empty">'+esc(error.message)+'</div>';overview.innerHTML=msg;audioEl.innerHTML=msg;notesEl.innerHTML=msg}finally{busy=false}}
  ['chaburaRegion','chabura','cohort','category','mode','country','region','city','from','to'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>setTimeout(load,0)));
  document.getElementById('clearFilters')?.addEventListener('click',()=>setTimeout(load,0));
  document.getElementById('refreshData')?.addEventListener('click',()=>setTimeout(load,0));
  load();
})();
</script>`;

  const activityBehavior = `
<script id="dashboardActivityPagingScript">
(() => {
  const peakToggle = document.getElementById('peakRangeToggle');
  const peakLabel = document.getElementById('peakRangeLabel');
  const pageSizeSelect = document.getElementById('timelinePageSize');
  const pagination = document.getElementById('timelinePagination');
  const range = document.getElementById('timelineRange');
  const newer = document.getElementById('timelineNewer');
  const older = document.getElementById('timelineOlder');
  if (!peakToggle || !peakLabel || !pageSizeSelect || !pagination || !range || !newer || !older) return;

  const baseRenderPeakTimes = renderPeakTimes;
  const baseRenderAll = renderAll;
  let timelinePage = 0;
  let timelinePageSize = 10;
  let peakAllDates = false;
  let peakRequest = 0;
  const peakCache = new Map();

  function explicitDateFilter() {
    return !!(document.getElementById('from')?.value || document.getElementById('to')?.value);
  }

  renderTimeline = rows => {
    const target = document.getElementById('timeline');
    const ordered = [...(rows || [])].sort((a,b) => String(b.day || '').localeCompare(String(a.day || '')));
    if (!ordered.length) {
      target.innerHTML = '<div class="empty">No activity for these filters.</div>';
      pagination.hidden = true;
      return;
    }
    const pages = Math.max(1, Math.ceil(ordered.length / timelinePageSize));
    timelinePage = Math.min(Math.max(0, timelinePage), pages - 1);
    const start = timelinePage * timelinePageSize;
    const visible = ordered.slice(start, start + timelinePageSize).reverse();
    const max = Math.max(...visible.map(row => Number(row.submissions) || 0), 1);
    target.innerHTML = visible.map(row => '<div class="barrow"><div class="barlabel">' + esc(row.day) + '</div><div class="track"><div class="fill" style="width:' + (100 * (Number(row.submissions) || 0) / max) + '%"></div></div><div class="barvalue">' + Number(row.submissions || 0) + '<span class="heat-sub">' + Number(row.learners || 0) + ' learners</span></div></div>').join('');
    const end = Math.min(start + timelinePageSize, ordered.length);
    const newest = ordered[start]?.day || '';
    const oldest = ordered[end - 1]?.day || newest;
    range.textContent = oldest + ' – ' + newest + ' · ' + (start + 1) + '–' + end + ' of ' + ordered.length + ' days';
    newer.disabled = timelinePage === 0;
    older.disabled = timelinePage >= pages - 1;
    pagination.hidden = false;
  };

  async function loadPeakTimes() {
    const dated = explicitDateFilter();
    peakToggle.hidden = dated;
    peakToggle.setAttribute('aria-pressed', String(!dated && peakAllDates));
    peakLabel.textContent = (dated ? 'Dashboard date filter' : (peakAllDates ? 'All dates' : 'Trailing 90 days')) + ' · local clock time at each student’s approximate network timezone';
    const params = new URLSearchParams(query());
    if (!dated && peakAllDates) params.set('range', 'all');
    const key = params.toString();
    const cached = peakCache.get(key);
    if (cached) { baseRenderPeakTimes(cached); return; }
    const requestId = ++peakRequest;
    document.getElementById('peakTimes').innerHTML = '<div class="empty">Loading study times…</div>';
    try {
      const response = await fetch('/api/activity-summary' + (key ? '?' + key : ''), { cache:'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load study times');
      if (requestId !== peakRequest) return;
      peakCache.set(key, data.activity);
      baseRenderPeakTimes(data.activity);
    } catch (error) {
      if (requestId !== peakRequest) return;
      document.getElementById('peakTimes').innerHTML = '<div class="empty">Could not load study times: ' + esc(error.message) + '</div>';
    }
  }

  renderPeakTimes = () => { void loadPeakTimes(); };

  renderAll = data => {
    timelinePage = 0;
    peakRequest += 1;
    peakCache.clear();
    baseRenderAll(data);
  };

  pageSizeSelect.addEventListener('change', () => {
    timelinePageSize = Math.max(1, Number(pageSizeSelect.value) || 10);
    timelinePage = 0;
    renderTimeline(currentData?.timeline || []);
  });
  newer.addEventListener('click', () => {
    timelinePage = Math.max(0, timelinePage - 1);
    renderTimeline(currentData?.timeline || []);
  });
  older.addEventListener('click', () => {
    timelinePage += 1;
    renderTimeline(currentData?.timeline || []);
  });
  peakToggle.addEventListener('click', () => {
    peakAllDates = !peakAllDates;
    renderPeakTimes();
  });
})();
</script>`;

  const referenceBehavior = `
<script id="dashboardReferenceLinksScript">
(() => {
  const studyQuestionUrl = qid => {
    const url = new URL('https://scp-study.ksariash.workers.dev/');
    const zman = document.getElementById('cohort')?.value;
    if (zman) url.searchParams.set('zman', zman);
    url.searchParams.set('question', String(qid));
    return url.href;
  };

  function attachQuestionLink(qid) {
    const dialog = document.getElementById('questionDialog');
    const head = dialog?.querySelector('.modal-head');
    const close = document.getElementById('closeQuestionDialog');
    if (!dialog?.open || !head || !close) return;
    let link = document.getElementById('questionStudyReference');
    if (!link) {
      link = document.createElement('a');
      link.id = 'questionStudyReference';
      link.className = 'question-study-reference';
      link.target = '_blank';
      link.rel = 'noopener';
      link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 6.5c3-1 5.1-.5 7.5 1v11c-2.4-1.5-4.5-2-7.5-1v-11Zm15 0c-3-1-5.1-.5-7.5 1v11c2.4-1.5 4.5-2 7.5-1v-11Z"/></svg><span>Open in Study</span>';
      head.insertBefore(link, close);
    }
    link.href = studyQuestionUrl(qid);
    link.setAttribute('aria-label', 'Open question ' + qid + ' in Study');
    link.title = 'Open question ' + qid + ' in Study';
  }

  document.addEventListener('click', event => {
    const target = event.target.closest?.('[data-qid]');
    if (!target) return;
    const qid = target.dataset.qid;
    window.setTimeout(() => attachQuestionLink(qid), 0);
  });
})();
</script>`;

  const originalFilters = /<section class="filters" aria-label="Dashboard filters">[\s\S]*?<\/section>/;
  const reorderedFilters =
    '<section class="filters" id="dashboard-filters" aria-label="Dashboard filters">\n' +
    '    <div class="field cohort"><label for="cohort">Zman</label><select id="cohort" required><option value="" disabled>Select Zman…</option></select></div>\n' +
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


  const announcementBehavior = '';

  return html
    .replace('<body>', '<body id="top">')
    .replace('<header class="top"><div class="topin"><div><h1>SCP Study — Instructor Dashboard</h1></div><a class="study-link" href="https://scp-study.ksariash.workers.dev/" target="_blank" rel="noopener">Open SCP Study ↗</a></div></header>', topHeader)
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
    .replace('<section class="section" style="margin-top:14px"><div class="section-head"><div class="headcopy"><h2>Question diagnostics</h2>', resourceSection + announcementSection + essaySection + feedbackSection + '<section class="section" style="margin-top:14px"><div class="section-head"><div class="headcopy"><h2>Question diagnostics</h2>')
    .replace('<h2>Question diagnostics</h2>', '<h2 id="questions-diagnostics">Question diagnostics</h2>')
    .replace('<h2>Activity over time</h2>', '<h2 id="activity-over-time">Activity over time</h2>')
    .replace('<div class="activity-grid"><div class="activity-panel"><h3>Peak study times</h3><span class="activity-sub">Local clock time at each student’s approximate network timezone</span><div id="peakTimes"></div></div><div class="activity-panel"><h3>Answer submissions by day</h3><span class="activity-sub">Up to the most recent 90 days in the selected filters</span><div id="timeline"></div></div></div>', activityPanel)
    .replace('<section class="overview" id="overview"></section>', inlineNav + '<section class="overview" id="overview"></section>')
    .replace('</head>', '<link rel="icon" type="image/svg+xml" href="/icon.svg?v=29"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=29">' + styles + '</head>')
    .replace('</body>', floatingNav + behavior + feedbackBehavior + resourceBehavior + essayBehavior + activityBehavior + referenceBehavior + announcementBehavior + '</body>');
}

export const DASHBOARD_ICON_PNG_BASE64 = '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';
export const DASHBOARD_HTML = enhanceDashboardHtml(__DASHBOARD_BASE_HTML);
