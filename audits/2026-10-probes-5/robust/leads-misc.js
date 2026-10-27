// Remaining round-4 leads: OP-P4, OP-P5, OP-P6, SE whitespace/Kelvin/rollup-in-includeTestIds, RP stored tiers, RP hostile types.
const { capture, scan, pack } = require('./r4/options/h.js');
const { mk } = require('./r4/options/p.js');
const L = require('./r4/reporters/lib.js');
const o = (...a) => console.log(...a);
for (const v of ['inherit', 'currentColor', 'rgb(1,2,3,4,5)', 'rgb(1,2,3,)', 'notacolor', '#fff']) { const r = scan({ contrast: { mode: 'auditorAssist', rootCanvasFallback: v } }); o('OP-P4 rootCanvasFallback', JSON.stringify(v), r.ok ? 'warns=' + JSON.stringify(r.warns.filter(w => /rootCanvas/.test(w))).slice(0, 140) : 'THROWS ' + r.msg.slice(0, 100)); }
{ const p = capture(() => pack.packScript([pack.definePack(mk({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage(ctx) { const s = '<!--<script'; return { outcome: 'pass' }; } }]))])); o('OP-P5 packScript with <!--<script in code:', p.ok ? 'accepted (len ' + p.v.length + ')' : 'refused: ' + p.msg.slice(0, 120)); }
{ const d = capture(() => pack.definePack(mk({}, [, ]))); o('OP-P6 rules:[ , ]', d.ok ? 'accepted' : 'refused: ' + d.msg.slice(0, 100)); const d2 = capture(() => pack.definePack(mk({}, [null]))); o('OP-P6 rules:[null]', d2.ok ? 'accepted' : 'refused: ' + d2.msg.slice(0, 80)); const r = scan({ strictOptions: true, excludeSelectors: [, , 'main'] }); o('OP-P6 strict excludeSelectors holes', r.ok ? 'accepted' : 'throws ' + r.code); }
for (const eo of [{ strictOptions: true, wcagLevel: ' aA ' }, { strictOptions: true, wcagVersion: '2.1 ' }, { strictOptions: true, wcagLevel: null }]) { const r = scan(eo); o('SE-lead strict', JSON.stringify(eo), r.ok ? 'ok' : 'throws ' + r.code); }
{ const r = scan({}, { includeRuleIds: ['linK-name-present'] }); o('SE-lead Kelvin sign', r.ok ? r.v.checksResults.map(c => c.ruleId).join() : r.msg.slice(0, 80)); }
{ const r = scan({}, { includeTestIds: ['wcag-2.4.4-link-purpose-in-context'] }); o('SE-lead rollup id in includeTestIds', r.ok ? 'checks=' + r.v.checksResults.length + ' rollups=' + r.v.rulesResults.map(x => x.ruleId + ':' + x.outcome).join() + ' warns=' + r.warns.length : 'throws ' + r.msg.slice(0, 120)); }
// RP lead: stored result from before the tier fix (cantTell with a fail-tier occurrence)
{ const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
  const r = JSON.parse(JSON.stringify(runa11yCoreOnHtml('<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>', { entryPointParity: false, runOnly: ['img-alt-present'] })));
  const c = r.checksResults[0]; c.outcome = 'cantTell'; c.occurrences.forEach(x => { x.occurrenceOutcome = 'fail'; });
  const sarif = JSON.parse(L.renderSarifReport(r)).runs[0].results.map(x => x.level); const junit = (L.renderJunitReport(r).match(/failures="(\d+)"/) || [])[1];
  const base = L.B.buildBaselineEntries(r).length; const earl = JSON.stringify(L.renderEarlReport(r)).match(/earl:(failed|cantTell)/g);
  o('RP-lead stored cantTell+fail tier: sarif', sarif, 'junit failures', junit, 'baseline entries', base, 'earl', earl);
  for (const [n, mut] of [['normativeMappings object', (q) => { q.checksResults[0].meta.normativeMappings = { a: 1 }; }], ['ruleId number', (q) => { q.checksResults[0].ruleId = 5; }], ['rulesResults object', (q) => { q.rulesResults = { a: 1 }; }], ['selector number', (q) => { q.checksResults[0].occurrences[0].selector = 7; }]]) {
    const q = JSON.parse(JSON.stringify(r)); q.checksResults[0].outcome = 'fail'; mut(q);
    const res = ['renderHtmlReport', 'renderSarifReport', 'renderJunitReport', 'renderEarlReport'].map(f => { try { const out = L[f](q); if (f === 'renderSarifReport') { const e = L.sarifErrors(out); return f + (e.length ? ':INVALID' : ':ok'); } return f + ':ok'; } catch (e) { return f + ':THROWS ' + e.message.slice(0, 50); } });
    o('RP-lead hostile', n, res.join(' | '));
  }
}
