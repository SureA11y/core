// timeBudget: single and multi profile, reporters, baseline, cap together
const H = require('./h.js');
const html = H.page('<img src="a.png"><a href="/x"></a><p>p</p>');
const slow = H.slowRule('org-slow', 300);
for (const prof of [undefined, ['wcag21-aa', 'wcag22-aa'], ['wcag22-aa', 'wcag21-aa', 'wcag20-a']]) {
  const { r, logs, err } = H.scan(html, Object.assign({ timeBudgetMs: 150, customRules: [slow], output: { maxOccurrencesPerRule: 1 } }, prof ? { profile: prof } : {}));
  if (err) { console.log('ERR', err.message); continue; }
  console.log('== profile', JSON.stringify(prof), 'incomplete', JSON.stringify(r.engine.incomplete), 'profilesNotRun', JSON.stringify(r.engine.profilesNotRun));
  console.log(' notRun', r.notRun && r.notRun.length, JSON.stringify((r.notRun || []).slice(0, 2)), 'checks', r.checksResults.length);
  console.log(' rollups', JSON.stringify(r.rulesResults.reduce((m, x) => (m[x.outcome] = (m[x.outcome] || 0) + 1, m), {})));
  if (r.profiles) console.log(' profiles', JSON.stringify(Object.fromEntries(Object.entries(r.profiles).map(([k, v]) => [k, v && (v.verdict || v.outcome || Object.keys(v))]))));
  console.log(' logs', logs.slice(0, 4));
  const s = JSON.parse(H.sarif.renderSarifReport(r));
  console.log(' sarif exec', s.runs[0].invocations && s.runs[0].invocations.map(i => [i.executionSuccessful, (i.toolExecutionNotifications || []).length]), 'ext', JSON.stringify(s.runs[0].tool.extensions));
  const j = H.junit.renderJunitReport(r); console.log(' junit', (j.match(/<testsuites[^>]*>/) || [])[0], (j.match(/<testsuite [^>]*Rules not run[^>]*>/) || [])[0]);
  const e = JSON.stringify(H.earl.renderEarlReport(r)); console.log(' earl untested', (e.match(/earl:untested/g) || []).length);
  const hr = H.report.renderHtmlReport(r); console.log(' html incomplete', /Incomplete scan/.test(hr), (hr.match(/Incomplete scan[^<]{0,160}/) || [])[0]);
  const mb = H.baseline.matchBaseline(r, H.baseline.buildBaselineEntries(r)); console.log(' baseline', JSON.stringify(mb.incomplete), mb.newCount);
}
