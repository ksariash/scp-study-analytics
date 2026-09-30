function enhanceDashboardHtml(html) {
  const quickLinks = [
    ["#overview", "Overview"],
    ["#needs-review", "Needs review"],
    ["#heat-map", "Heat map"],
    ["#topics-review", "Topics"],
    ["#locations-review", "Locations"],
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
#overview,#needs-review,#heat-map,#topics-review,#locations-review,#questions-diagnostics,#activity-over-time{scroll-margin-top:18px}
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
}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.scroll-control{transition:none}}
</style>`;

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

  return html
    .replace('<body>', '<body id="top">')
    .replace('<section class="filters" aria-label="Dashboard filters">', '<section class="filters" id="dashboard-filters" aria-label="Dashboard filters">')
    .replace('<h2>Needs review</h2>', '<h2 id="needs-review">Needs review</h2>')
    .replace('<h2>Topic heat map</h2>', '<h2 id="heat-map">Topic heat map</h2>')
    .replace('<h2>Topics needing review</h2>', '<h2 id="topics-review">Topics needing review</h2>')
    .replace('<h2>Where students are studying</h2>', '<h2 id="locations-review">Where students are studying</h2>')
    .replace('<h2>Question diagnostics</h2>', '<h2 id="questions-diagnostics">Question diagnostics</h2>')
    .replace('<h2>Activity over time</h2>', '<h2 id="activity-over-time">Activity over time</h2>')
    .replace('<section class="overview" id="overview"></section>', inlineNav + '<section class="overview" id="overview"></section>')
    .replace('</head>', styles + '</head>')
    .replace('</body>', floatingNav + behavior + '</body>');
}

export const DASHBOARD_HTML = enhanceDashboardHtml(__DASHBOARD_BASE_HTML);
