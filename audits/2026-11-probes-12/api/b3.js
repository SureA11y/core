const H = require('./h.js');
const html = H.page('<img src="a.png"><p>p</p>');
for (const budget of [1, 150]) {
const { r } = H.scan(html, { timeBudgetMs: budget, profile: ['wcag22-aa', 'wcag21-aa', 'wcag20-a'] });
const ids = new Set(r.notRun.map(n => n.ruleId));
console.log('budget', budget, 'notRun', r.notRun.length, 'unique', ids.size, 'incomplete', JSON.stringify(r.engine.incomplete), 'profilesNotRun', JSON.stringify(r.engine.profilesNotRun));
const t = H.report.renderHtmlReport(r).replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
console.log(' chip:', (t.match(/\d+ rules not run/) || [])[0], ' text:', (t.match(/Not run \(\d+\)/) || [])[0], (t.match(/wcag2[01]-a+[^,]*,? ?[^ ]* These/) || [])[0]);
const j = H.junit.renderJunitReport(r); console.log(' junit errors', (j.match(/errors="(\d+)"/) || [])[1]);
const s = JSON.parse(H.sarif.renderSarifReport(r)); console.log(' sarif notes', s.runs[0].invocations[0].toolExecutionNotifications.length, JSON.stringify(s.runs[0].invocations[0].toolExecutionNotifications.slice(-1)).slice(0, 300));
}
