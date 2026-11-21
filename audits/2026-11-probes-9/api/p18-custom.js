const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const html = '<html lang="en"><title>t</title><body><main><h1>x</h1><div onclick="f()">a</div></main></body></html>';
const mk = (id, ret, meta={}) => ({ id, meta: { title: id, ...meta }, runInPage: ret });
const w = console.warn; let warns=[]; console.warn=(...a)=>warns.push(a.join(' '));
const cases = [
  ['doc example', { id: 'org-no-inline-onclick', meta: { title: 'No inline onclick handlers', defaultSeverity: 'moderate' }, runInPage(ctx) { const dom = ctx.helpers.dom; const els = ctx.helpers.queryAllSmart('[onclick]'); const occurrences = els.map((el) => ({ selector: ctx.helpers.buildSelector(el), html: dom.outerHTML(el), summary: 'Inline onclick handler found.', hint: 'Move event handling into an external script.' })); return { ruleId: ctx.rule.ruleId, outcome: occurrences.length ? 'fail' : 'pass', severity: 'moderate', occurrences }; } }],
  ['fail no occ', mk('org-a', (ctx)=>({ruleId: ctx.rule.ruleId, outcome:'fail', occurrences:[]}))],
  ['Outcome Fail case', mk('org-b', (ctx)=>({ruleId: ctx.rule.ruleId, outcome:'Fail', occurrences:[{selector:'div', summary:'s', hint:'h'}]}))],
  ['severity Critical', mk('org-c', (ctx)=>({ruleId: ctx.rule.ruleId, outcome:'fail', severity:'Critical', occurrences:[{selector:'div', html:'<div>', summary:'s', hint:'h'}]}))],
  ['meta severity Critical', mk('org-d', (ctx)=>({ruleId: ctx.rule.ruleId, outcome:'fail', occurrences:[{selector:'div', html:'<div>', summary:'s', hint:'h'}]}), { defaultSeverity: 'Critical' })],
  ['ruleId mismatch', mk('org-e', (ctx)=>({ruleId: 'something-else', outcome:'fail', occurrences:[{selector:'div', html:'<div>', summary:'s', hint:'h'}]}))],
  ['no ruleId', mk('org-f', (ctx)=>({outcome:'pass', occurrences:[]}))],
  ['occurrence no summary', mk('org-g', (ctx)=>({ruleId: ctx.rule.ruleId, outcome:'fail', occurrences:[{__node: ctx.document.querySelector('div')}]}))],
  ['empty id', mk('', (ctx)=>({ruleId: ctx.rule.ruleId, outcome:'pass', occurrences:[]}))],
  ['id with space', mk('org h', (ctx)=>({ruleId: ctx.rule.ruleId, outcome:'pass', occurrences:[]}))],
];
for (const [label, rule] of cases) {
  warns = [];
  try {
    const r = runa11yCoreOnHtml(html, { engineOptions: { customRules: [rule] }, entryPointParity: false });
    const c = r.checksResults.find(c => c.ruleId === rule.id || c.ruleId === 'something-else' || (rule.id && c.ruleId.toLowerCase()===rule.id.toLowerCase()));
    console.log(label, '=>', c ? `${c.ruleId} ${c.outcome} sev=${c.severity} occ=${c.occurrences.length} ${JSON.stringify(c.occurrences[0]||{}).slice(0,160)} err=${(c.error||'').slice(0,140)}` : 'NO RESULT', JSON.stringify(r.skippedCustomRules).slice(0,160), warns.length? 'WARN:'+warns.join('|').slice(0,160):'');
  } catch (e) { console.log(label, 'THROWS', e.message.slice(0, 200)); }
}
console.warn = w;
