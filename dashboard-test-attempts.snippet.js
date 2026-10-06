  const testAttemptSection = `
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
  window.setTimeout(() => void loadTestAttempts(), 0);
})();
</script>`;
