const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { getChecksForRunOnly } = require('/home/user/core/src/index.js');
const html = `<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>P</h1><p>Download the 2026 pricing guide: <a href="/g">click here</a>.</p></main></body></html>`;
for (const [n, opts] of [
  ['default (no runOnly)', {}],
  ['profile wcag22-aa', { engineOptions: { profile: 'wcag22-aa' } }],
  ['profile wcag22-aaa', { engineOptions: { profile: 'wcag22-aaa' } }],
  ['profile wcag21-aaa', { engineOptions: { profile: 'wcag21-aaa' } }],
  ['profile wcag20-aaa', { engineOptions: { profile: 'wcag20-aaa' } }],
  ['runOnly wcag 2.2 AA', { runOnly: { wcag: { version: '2.2', level: 'AA' } } }],
  ['runOnly wcag 2.2 AAA', { runOnly: { wcag: { version: '2.2', level: 'AAA' } } }],
  ['runOnly tag wcag249', { runOnly: ['wcag249'] }],
  ['profile en301549-v3.2.1', { engineOptions: { profile: 'en301549-v3.2.1' } }],
]) {
  try {
    const res = runa11yCoreOnHtml(html, opts);
    const c = res.checksResults.find(x => x.ruleId === 'link-name-quality-link-only');
    const roll = (res.rulesResults || []).filter(r => /2\.4\.9|2-4-9/.test(r.ruleId)).map(r => r.ruleId + ':' + r.outcome + ':' + JSON.stringify(r.data && r.data.details && r.data.details.checksIds));
    console.log(n.padEnd(28), c ? c.outcome : 'not run', roll.join(' '));
  } catch (e) { console.log(n, 'ERR', e.message.slice(0, 150)); }
}
