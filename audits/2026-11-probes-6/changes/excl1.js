'use strict';
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const page = (b) => `<!doctype html><html lang="en"><head><title>T</title></head><body>${b}</body></html>`;
function rule(src, extra = {}) {
  return { id: 'probe-rule', meta: { title: 'P', description: 'P', tags: ['best-practice'], wcagSc: [], ...(extra.meta||{}) }, runInPage: src };
}
function run(name, body, src, eo = {}, extra) {
  let r;
  try {
    const res = runa11yCoreOnHtml(page(body), { runOnly: ['probe-rule'], engineOptions: { customRules: [rule(src, extra)], ...eo } });
    r = res.checksResults.find((c) => c.ruleId === 'probe-rule');
    console.log('\n## ' + name);
    console.log(JSON.stringify({ outcome: r.outcome, excl: r.excludedOccurrences, error: r.error, occ: r.occurrences.map((o) => [o.selector, o.occurrenceOutcome]) }));
    return { res, r };
  } catch (e) { console.log('\n## ' + name + ' THREW ' + e.stack); }
}
const B = '<div id="bar"><p id="pb">In bar <span id="sp">x</span></p></div><main><p id="pm">Main</p></main>';
// 1. selector-only occurrence
run('selector-only occurrence in excluded area', B, `function(ctx){return {outcome:'fail',occurrences:[{selector:'#pb',summary:'x'}]};}`, { excludeSelectors: ['#bar'] });
// 2. text node
run('text node __node in excluded area', B, `function(ctx){var t=ctx.document.getElementById('pb').firstChild;return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(t,{summary:'x'})]};}`, { excludeSelectors: ['#bar'] });
// 3. pass with all occurrences excluded
run('pass with only excluded occurrences', B, `function(ctx){var p=ctx.document.getElementById('pb');return {outcome:'pass',occurrences:[ctx.helpers.reportOccurrence(p,{summary:'ok'})]};}`, { excludeSelectors: ['#bar'] });
// 4. fail: excluded fail-tier, remaining pass-tier
run('fail with excluded fail-tier + remaining pass-tier', B, `function(ctx){var d=ctx.document;return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(d.getElementById('pb'),{summary:'bad',occurrenceOutcome:'fail'}),ctx.helpers.reportOccurrence(d.getElementById('pm'),{summary:'ok',occurrenceOutcome:'pass'})]};}`, { excludeSelectors: ['#bar'] });
// 5. fail with excluded fail, remaining untiered
run('fail: excluded fail-tier + remaining untiered', B, `function(ctx){var d=ctx.document;return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(d.getElementById('pb'),{summary:'bad',occurrenceOutcome:'fail'}),ctx.helpers.reportOccurrence(d.getElementById('pm'),{summary:'q'})]};}`, { excludeSelectors: ['#bar'] });
// 6. cantTell: excluded cantTell + remaining pass-tier
run('cantTell: excluded cantTell-tier + remaining pass-tier', B, `function(ctx){var d=ctx.document;return {outcome:'cantTell',occurrences:[ctx.helpers.reportOccurrence(d.getElementById('pb'),{summary:'q',occurrenceOutcome:'cantTell'}),ctx.helpers.reportOccurrence(d.getElementById('pm'),{summary:'ok',occurrenceOutcome:'pass'})]};}`, { excludeSelectors: ['#bar'] });
// 7. document-level occurrence (no element)
run('document-level occurrence, no node', B, `function(ctx){return {outcome:'fail',occurrences:[{summary:'page'}]};}`, { excludeSelectors: ['#bar'] });
// 8. occurrence with node = document
run('occurrence node = document', B, `function(ctx){return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(ctx.document,{summary:'page'})]};}`, { excludeSelectors: ['#bar'] });
// 9. excludeSelectors matching html/body
run('excludeSelectors body, occurrence on documentElement', B, `function(ctx){return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(ctx.document.documentElement,{summary:'page'})]};}`, { excludeSelectors: ['body'] });
// 10. detached node
run('detached element matching selector', B, `function(ctx){var e=ctx.document.createElement('div');e.className='ad';return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(e,{summary:'d'})]};}`, { excludeSelectors: ['.ad'] });
// 11. detached clone of excluded subtree
run('detached child of a detached excluded el', B, `function(ctx){var e=ctx.document.getElementById('bar').cloneNode(true);return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(e.querySelector('p'),{summary:'d'})]};}`, { excludeSelectors: ['#bar'] });
// 12. invalid selector together with valid
run('invalid + valid selectors', B, `function(ctx){var d=ctx.document;return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(d.getElementById('pb'),{summary:'b'}),ctx.helpers.reportOccurrence(d.getElementById('pm'),{summary:'m'})]};}`, { excludeSelectors: ['##bad', '#bar'] });
// 13. only invalid selector
run('only invalid selector', B, `function(ctx){var d=ctx.document;return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(d.getElementById('pb'),{summary:'b'})]};}`, { excludeSelectors: '##bad' });
// 14. descendant span
run('descendant span', B, `function(ctx){var d=ctx.document;return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(d.getElementById('sp'),{summary:'b'})]};}`, { excludeSelectors: '#bar' });
// 15. per-rule exclude for a different rule
run('per-rule exclude for another rule id', B, `function(ctx){var d=ctx.document;return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(d.getElementById('pb'),{summary:'b'})]};}`, { rules: { 'img-alt-present': { excludeSelectors: ['#bar'] } } });
// 16. per-rule exclude case-insensitive id
run('per-rule exclude with id in other case', B, `function(ctx){var d=ctx.document;return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(d.getElementById('pb'),{summary:'b'})]};}`, { rules: { 'PROBE-RULE': { excludeSelectors: ['#bar'] } } });
// 17. rule returns its own excludedOccurrences
run('rule forges excludedOccurrences', B, `function(ctx){return {outcome:'pass',occurrences:[],excludedOccurrences:{dropped:99}};}`, {});
// 18. contextSelector + exclusion
run('contextSelector main, rule reports #pb (out of scope, also excluded)', B, `function(ctx){var d=ctx.document;return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(d.getElementById('pb'),{summary:'b'})]};}`, { excludeSelectors: ['#bar'], contextSelector: 'main' });
