const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
function mk(outcome, tiers, id='org-x') {
  return { id, meta: { title: 'T', description: 'd', tags: ['wcag111','wcag2a'], wcagSc: ['1.1.1'] },
    runInPage: new Function('ctx', `const t=${JSON.stringify(tiers)}; const ids=['a','b','c']; return { outcome: ${JSON.stringify(outcome)}, occurrences: t.map((tier,i)=>({ __node: ctx.document.getElementById(ids[i]), summary: 's'+i, hint: 'h', ...(tier?{occurrenceOutcome: tier}:{}), data:{details:{reasonCode:'R'+i}} })) };`) };
}
const html = '<html lang="en"><head><title>t</title></head><body><main><p id="a">a</p><p id="b">b</p><p id="c">c</p><div class="x"><p>z</p></div></main></body></html>';
(async () => {
  const cases = [['fail',['pass','pass']],['fail',['pass','cantTell']],['pass',['fail']],['cantTell',['pass']],['pass',['cantTell']],['notApplicable',['fail']],['cantTell',['fail']],['fail',[null,'pass']]];
  for (const [o,t] of cases) {
    const r = await runa11yCoreOnHtml(html, { engineOptions: { customRules: [mk(o,t)] }, runOnly: ['org-x'] });
    const c = r.checksResults[0];
    const roll = (r.rulesResults||[]).map(x=>x.id+':'+x.outcome).join(',');
    const s = JSON.parse(renderSarifReport(r)); const j = renderJunitReport(r);
    console.log(o, JSON.stringify(t), '->', c.outcome, '|err:', c.error||'', '| roll', roll, '| sarif', s.runs[0].results.map(x=>x.level).join(','), '| junit fail', (j.match(/<failure/g)||[]).length);
    await new Promise(r=>setImmediate(r));
  }
})();
