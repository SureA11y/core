// A custom or pack rule mapped to 4.1.1 Parsing (removed in WCAG 2.2) without the wcag22-removed tag.
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { definePack } = require('/home/user/core-r8/src/pack.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const { renderEarlReport } = require('/home/user/core-r8/src/earl.js');
const html = '<html lang="en"><head><title>t</title></head><body><p>x</p></body></html>';
const meta = (tags) => ({ title: 'Parsing check', description: 'd', tags, wcagSc: ['4.1.1'] });
const run = function () { return { outcome: 'fail', occurrences: [{ selector: 'p' }] }; };
const pack = definePack({ name: 'acme-pack', version: '1.0.0', namespace: 'acme', core: '*', rules: [{ id: 'acme-parse', meta: meta(['wcag2a', 'wcag411']), runInPage: run }] });
(async () => {
  console.warn = () => {}; console.info = () => {};
  for (const [label, eo] of [
    ['custom, no removed tag', { customRules: [{ id: 'org-parse', meta: meta(['wcag2a', 'wcag411']), runInPage: run }] }],
    ['custom, wcag22-removed', { customRules: [{ id: 'org-parse', meta: meta(['wcag2a', 'wcag411', 'wcag22-removed']), runInPage: run }] }],
    ['pack rule', { packs: [pack] }],
  ]) {
    const r = await runa11yCoreOnHtml(html, { engineOptions: { ...eo, profile: 'wcag22-aa' } });
    const id = eo.packs ? 'acme-parse' : 'org-parse';
    const c = r.checksResults.find(c => c.ruleId === id);
    const roll = r.rulesResults.find(x => /4\.1\.1/.test(x.ruleId));
    const j = [...renderJunitReport(r).matchAll(/<testcase[^>]*name="([^"]+)"[^>]*>\s*<failure/g)].map(m => m[1]);
    const earlFailed = renderEarlReport(r)['@graph'][0].assertions.filter(a => a.result.outcome === 'earl:failed').map(a => a.test.title);
    console.log(label.padEnd(24), 'wcagVersion', r.engine.wcagVersion, '| rule', c && c.outcome, 'scope', JSON.stringify(c && c.wcagVersionScope), '| rollup', roll && roll.ruleId + ':' + roll.outcome, '| junit failures', JSON.stringify(j), '| earl failed', JSON.stringify(earlFailed));
  }
})();
