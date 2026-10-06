const run = require('/home/user/core/tests/helpers/runa11yCoreOnHtml.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const r = run('<!doctype html><html lang="en"><head><title>Criterion outcome page</title></head><body><main><h1>Hi</h1><button aria-pressed="banana">OK</button><div role="combobox" aria-label="c" tabindex="0"></div></main></body></html>', { url: 'https://example.test/' });
const bySc = {};
for (const c of r.rulesResults) { const m = c.meta.normativeMappings[0]; (bySc[m.requirement] = bySc[m.requirement] || []).push(c.ruleId + '=' + c.outcome); }
for (const [k, v] of Object.entries(bySc)) if (v.length > 1) console.log(k, v);
const j = renderJunitReport(r);
const i = j.indexOf('name="WCAG 4.1.2'); console.log(j.slice(i - 14, i + 900).split('\n').filter(l => /testsuite|criterionOutcome|failure /.test(l)).join('\n'));
