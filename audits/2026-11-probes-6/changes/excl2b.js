'use strict';
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderEarlReport } = require('/home/user/core/src/earl.js');
const { buildBaselineEntries } = require('/home/user/core/src/baseline.js');
const page = (b) => `<!doctype html><html lang="en"><head><title>T</title></head><body>${b}</body></html>`;
const B = '<div id="bar"><p id="pb">In bar</p></div><main><p id="pm">Main</p></main>';
const rule = (src) => ({ id: 'probe-rule', meta: { title: 'P', description: 'P', tags: ['wcag2a','wcag111'], wcagSc: ['1.1.1'] }, runInPage: src });
const src = `function(ctx){var d=ctx.document;return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(d.getElementById('pb'),{summary:'bad',occurrenceOutcome:'fail'}),ctx.helpers.reportOccurrence(d.getElementById('pm'),{summary:'ok',occurrenceOutcome:'pass'})]};}`;
const res = runa11yCoreOnHtml(page(B), { runOnly: ['probe-rule'], engineOptions: { customRules: [rule(src)], excludeSelectors: [] } });
const r = res.checksResults.find((c) => c.ruleId === 'probe-rule');
console.log('check', r.outcome, JSON.stringify(r.occurrences.map(o=>[o.selector,o.occurrenceOutcome])));
for (const rr of res.rulesResults || []) console.log('rollup', rr.ruleId, rr.outcome);
let s; try { s = renderSarifReport(res); const j = typeof s === 'string' ? JSON.parse(s) : s; console.log('sarif results', JSON.stringify(j.runs[0].results.map(x=>[x.ruleId,x.level,x.kind]))); } catch (e) { console.log('sarif err', e.message); }
try { const x = renderJunitReport(res); const str = typeof x==='string'?x:JSON.stringify(x); console.log('junit failures attr:', (str.match(/failures="\d+"/g)||[]).join(' '), '| <failure count', (str.match(/<failure/g)||[]).length); } catch (e) { console.log('junit err', e.message); }
try { const e = renderEarlReport(res); const str = typeof e==='string'?e:JSON.stringify(e); console.log('earl outcomes', (str.match(/earl:(failed|passed|cantTell|inapplicable)/g)||[]).join(',')); } catch (e) { console.log('earl err', e.message); }
try { const b = buildBaselineEntries(res); console.log('baseline', JSON.stringify(b).slice(0,400)); } catch (e) { console.log('baseline err', e.message); }
