'use strict';
const { runa11yCoreOnDom, createDom } = require('/home/user/core/src/testing.js');
const { JSDOM } = require('jsdom');
function go(name, html, setup, src, eo, meta) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  setup && setup(dom.window.document);
  const rule = { id: 'probe-rule', meta: { title: 'P', description: 'P', tags: ['best-practice'], wcagSc: [], ...(meta||{}) }, runInPage: src };
  const res = runa11yCoreOnDom(dom, { runOnly: ['probe-rule'], engineOptions: { customRules: [rule], ...eo } });
  const r = res.checksResults.find((c) => c.ruleId === 'probe-rule');
  console.log('## ' + name + '\n  ' + JSON.stringify({ outcome: r.outcome, excl: r.excludedOccurrences, wvs: r.wcagVersionScope, occ: r.occurrences.map(o => [o.selector, o.shadowHostSelectors, o.occurrenceOutcome]) }));
}
const H = '<!doctype html><html lang="en"><head><title>T</title></head><body><div id="host"></div><x-w id="host2"></x-w><iframe id="ad"></iframe><main><p id="pm">m</p></main></body></html>';
const setup = (d) => {
  const sr = d.getElementById('host').attachShadow({ mode: 'open' });
  sr.innerHTML = '<div class="inner"><p id="sp">shadow p</p></div><p id="sp2">other</p>';
  const sr2 = d.getElementById('host2').attachShadow({ mode: 'closed' });
  sr2.innerHTML = '<p id="cp">closed</p>'; d.__closed = sr2;
  const fd = d.getElementById('ad').contentDocument; fd.open(); fd.write('<p id="fp">frame p</p>'); fd.close();
};
go('shadow p under excluded host', H, setup, `function(ctx){var p=ctx.document.getElementById('host').shadowRoot.getElementById('sp');return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(p,{summary:'s'})]};}`, { excludeSelectors: ['#host'] });
go('shadow p, selector matching inside shadow (.inner)', H, setup, `function(ctx){var sr=ctx.document.getElementById('host').shadowRoot;return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(sr.getElementById('sp'),{summary:'s'}),ctx.helpers.reportOccurrence(sr.getElementById('sp2'),{summary:'s2'})]};}`, { excludeSelectors: ['.inner'] });
go('frame p under excluded iframe', H, setup, `function(ctx){var p=ctx.document.getElementById('ad').contentDocument.getElementById('fp');return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(p,{summary:'f'})]};}`, { excludeSelectors: ['#ad'] });
go('excluded iframe element itself', H, setup, `function(ctx){var p=ctx.document.getElementById('ad');return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(p,{summary:'f'})]};}`, { excludeSelectors: ['iframe'] });
go('wcag 4.1.1 rule, all excluded', H, setup, `function(ctx){var p=ctx.document.getElementById('ad');return {outcome:'fail',occurrences:[ctx.helpers.reportOccurrence(p,{summary:'f'})]};}`, { excludeSelectors: ['iframe'] }, { tags: ['wcag2a','wcag411'], wcagSc: ['4.1.1'] });
