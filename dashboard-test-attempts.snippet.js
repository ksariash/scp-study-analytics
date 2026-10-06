  const testAttemptSection = `
<style id="dashboardTestAttemptStyles">
#test-attempts{scroll-margin-top:18px}.test-attempt-list{display:grid;gap:8px}.test-attempt-row{display:grid;grid-template-columns:minmax(130px,.8fr) minmax(180px,1fr) minmax(150px,.8fr);gap:12px;align-items:center;padding:10px 12px;border:1px solid #e1e8f2;border-radius:12px;background:#fff}.test-attempt-row>div{display:grid;gap:2px;min-width:0}.test-attempt-row strong,.test-attempt-row b{color:#244985;font-size:.78rem}.test-attempt-row span{color:#6d7c91;font-size:.63rem;line-height:1.35}@media(max-width:700px){.test-attempt-row{grid-template-columns:1fr 1fr}.test-attempt-row>div:first-child{grid-column:1/-1}.test-attempt-row>div:last-child{text-align:right}}
</style>
<section class="section" id="test-attempts" style="margin-top:14px">
  <div class="section-head"><div class="headcopy"><h2>Practice tests</h2><span>Completed, timed-out, and exited attempts reported by the Study app</span></div></div>
  <div id="testAttemptOverview" class="resource-usage-overview"><div class="resource-usage-card"><b>—</b><span>Attempts</span></div><div class="resource-usage-card"><b>—</b><span>Avg M/C score</span></div><div class="resource-usage-card"><b>—</b><span>Avg essay score</span></div></div>
  <div id="testAttemptList" class="test-attempt-list"><div class="empty">Loading practice tests…</div></div>
</section>`;

  const testAttemptBehavior = `
<script id="dashboardTestAttemptsScript">
(() => {
  const host = document.getElementById('testAttemptList');
  const overview = document.getElementById('testAttemptOverview');
  if (!host || !overview) return;
  const escTest = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const duration = ms => {
    const total = Math.max(0, Math.round(Number(ms || 0) / 60000));
    const h = Math.floor(total / 60), m = total % 60;
    return h ? h + 'h ' + m + 'm' : m + 'm';
  };

  // Keep date inputs human-readable in the URL, but also send their exact UTC
  // instants based on this dashboard browser's local timezone. That prevents a
  // late-evening October 5 session from being bucketed as October 6 merely
  // because the Worker stores UTC timestamps.
  if (typeof query === 'function' && !window.__scpDashboardLocalDateQuery) {
    const baseQuery = query;
    query = function(){
      const q = new URLSearchParams(baseQuery());
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      q.set('tz', tz);
      const from = document.getElementById('from')?.value || '';
      const to = document.getElementById('to')?.value || '';
      if (from) {
        const d = new Date(from + 'T00:00:00');
        if (!Number.isNaN(d.getTime())) q.set('fromTs', d.toISOString());
      }
      if (to) {
        const d = new Date(to + 'T00:00:00');
        if (!Number.isNaN(d.getTime())) { d.setDate(d.getDate() + 1); q.set('toTs', d.toISOString()); }
      }
      return q.toString();
    };
    window.__scpDashboardLocalDateQuery = true;
  }

  async function loadTestAttempts(){
    const mode = document.getElementById('mode')?.value || '';
    if (mode === 'study') {
      overview.innerHTML = '<div class="resource-usage-card"><b>—</b><span>Attempts</span></div><div class="resource-usage-card"><b>—</b><span>Avg M/C score</span></div><div class="resource-usage-card"><b>—</b><span>Avg essay score</span></div>';
      host.innerHTML = '<div class="empty">Practice tests are excluded by the current Mode filter.</div>';
      return;
    }
    const qs = typeof query === 'function' ? query() : '';
    try {
      const response = await fetch('/api/test-attempts' + (qs ? '?' + qs : ''), {cache:'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load practice tests');
      const o = data.overview || {};
      overview.innerHTML = '<div class="resource-usage-card"><b>'+(o.attempts||0)+'</b><span>Attempts · '+(o.learners||0)+' learners</span></div><div class="resource-usage-card"><b>'+Number(o.averageScore||0).toFixed(1)+'%</b><span>Avg M/C score</span></div><div class="resource-usage-card"><b>'+Number(o.averageEssayScore||0).toFixed(1)+'%</b><span>Avg essay score</span></div>';
      const rows = data.attempts || [];
      host.innerHTML = rows.length ? rows.map(row => '<div class="test-attempt-row"><div><strong>'+escTest(row.day || '')+'</strong><span>'+escTest(row.completed ? 'Completed' : row.reason === 'time' ? 'Timed out' : 'Exited early')+' · '+duration(row.durationMs)+'</span></div><div><b>'+Number(row.scorePct||0).toFixed(1)+'%</b><span>M/C '+(row.correct||0)+' correct · '+(row.unanswered||0)+' unanswered</span></div><div><b>'+(row.essayPairTotal ? Number(row.essayScorePct||0).toFixed(1)+'%' : '—')+'</b><span>'+(row.essayPairTotal ? 'Essay '+(row.essayPairCorrect||0)+'/'+row.essayPairTotal : 'No essay pairings')+'</span></div></div>').join('') : '<div class="empty">No practice-test attempts match the selected filters.</div>';
    } catch (error) {
      host.innerHTML = '<div class="empty">Could not load practice tests: '+escTest(error.message)+'</div>';
    }
  }
  if (typeof renderAll !== 'undefined') {
    const base = renderAll;
    renderAll = data => { base(data); void loadTestAttempts(); };
  }
  window.setTimeout(() => {
    if (typeof loadSummary === 'function') void loadSummary();
    else void loadTestAttempts();
  }, 0);
})();
</script>`;