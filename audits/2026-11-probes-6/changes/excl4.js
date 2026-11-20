const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const html = '<!doctype html><html lang="en"><head><title>T</title></head><body><div id="bar"><p id="pb">x</p></div><main><p>y</p></main></body></html>';
const rule = { id: 'probe-parsing', meta: { title: 'P', description: 'P', tags: ['wcag2a', 'wcag411'], wcagSc: ['4.1.1'] },
  runInPage: "function(ctx){return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(ctx.document.getElementById('pb'),{summary:'dup'})]};}" };
const res = runa11yCoreOnHtml(html, { runOnly: { wcag: { version: '2.2', level: 'A' } }, engineOptions: { customRules: [rule], excludeSelectors: ['#bar'] } });
const r = res.checksResults.find(c => c.ruleId === 'probe-parsing');
console.log(JSON.stringify({ outcome: r && r.outcome, wcagVersionScope: r && r.wcagVersionScope, excl: r && r.excludedOccurrences, skipped: res.skippedCustomRules }));
// manual rule returning fail, all excluded
const m = { id: 'probe-manual', meta: { title: 'P', description: 'P', tags: ['best-practice'], wcagSc: [], type: 'manual' },
  runInPage: "function(ctx){return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(ctx.document.getElementById('pb'),{summary:'x'})]};}" };
const r2 = runa11yCoreOnHtml(html, { runOnly: ['probe-manual'], engineOptions: { customRules: [m], excludeSelectors: ['#bar'] } }).checksResults.find(c => c.ruleId === 'probe-manual');
console.log('manual fail all excluded:', JSON.stringify({ outcome: r2.outcome, excl: r2.excludedOccurrences, error: r2.error }));
