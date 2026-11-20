const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
function mk(outcome, tiers, id='org-x') {
  return { id, meta: { title: 'T', description: 'd', tags: ['wcag111','wcag2a'], wcagSc: ['1.1.1'] },
    runInPage: new Function('ctx', `const t=${JSON.stringify(tiers)}; const ids=['a','b','c']; return { outcome: ${JSON.stringify(outcome)}, occurrences: t.map((tier,i)=>({ __node: ctx.document.getElementById(ids[i]), summary: 's'+i, hint: 'h', ...(tier?{occurrenceOutcome: tier}:{}), data:{details:{reasonCode:'R'+i}} })) };`) };
}
const html = '<html lang="en"><head><title>t</title></head><body><main><p id="a">a</p><p id="b">b</p><p id="c">c</p></main></body></html>';
(async () => {
  for (const [o,t] of [['pass',['cantTell']],['notApplicable',['fail']],['fail',['pass','pass']]]) {
    const r = await runa11yCoreOnHtml(html, { engineOptions: { customRules: [mk(o,t)] }, runOnly: ['org-x'] });
    const c = r.checksResults[0];
    console.log(o, t, '-> check', c.outcome, 'rollups', JSON.stringify(r.rulesResults.map(x=>({id:x.ruleId||x.compositeId||x.id, o:x.outcome, keys:Object.keys(x), contributors: x.contributors||x.data&&x.data.details}))).slice(0,900));
    await new Promise(r=>setImmediate(r));
  }
})();
