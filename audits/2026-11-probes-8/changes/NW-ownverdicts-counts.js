// After withOwnVerdicts turns a check to fail (pack profile alone), do the result's other places that count/describe outcomes agree?
const pack = require('./namespack.js')();
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const { renderHtmlReport } = require('/home/user/core-r8/src/report.js');
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><div role="grid"><div role="row"><div role="gridcell">1</div></div></div></main></body></html>';
const r = runa11yCoreOnHtml(html, { engineOptions: { packs: [pack], profile: 'names-1.0', perfStats: true } });
const c = r.checksResults.find(x => x.ruleId === 'aria-role-name-present');
console.log('top-level keys', Object.keys(r).join(','));
const hits = []; (function walk(v, p) { if (v && typeof v === 'object') for (const k of Object.keys(v)) { if (/count|summary|total|fail/i.test(k) && typeof v[k] !== 'object') hits.push(p + '.' + k + '=' + JSON.stringify(v[k]).slice(0, 60)); if (p.split('.').length < 4 && k !== 'checksResults' && k !== 'rulesResults') walk(v[k], p + '.' + k); } })(r, 'r');
console.log(hits.join('\n'));
console.log('check', c.outcome, 'policyOutcome', c.policyOutcome, 'confidence', c.confidence, 'occ lean', JSON.stringify(c.occurrences[0].lean || null), 'occ uncertainty', JSON.stringify(c.occurrences[0].uncertainty || null).slice(0, 80));
const j = renderJunitReport(r); console.log('junit testsuite attrs', (j.match(/<testsuite [^>]*>/) || [''])[0].slice(0, 200));
