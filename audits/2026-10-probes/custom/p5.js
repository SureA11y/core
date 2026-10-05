const { run, pick } = require('./h');
const docEx = function runInPage(ctx) {
      const els = ctx.helpers.queryAll('[onclick]');
      const occurrences = els.map((el) => ({ selector: ctx.helpers.buildSelector(el), html: el.outerHTML, summary: 'Inline onclick handler found.', hint: 'Move.' }));
      return { ruleId: ctx.rule.ruleId, outcome: occurrences.length ? 'fail' : 'pass', severity: 'moderate', occurrences };
};
const smart = (ctx)=>{ const els=ctx.helpers.queryAllSmart('[onclick]'); return {outcome: els.length?'fail':'pass', occurrences: els.map(el=>({__node:el}))}; };
const html = `<!doctype html><html lang="en"><head><title>T</title></head><body><main><div id="a" onclick="x()">a</div><div class="skip" onclick="y()">b</div><div hidden onclick="z()">h</div><section id="ctx"><div onclick="w()">in</div></section></main></body></html>`;
for (const [n,f] of [['docExample',docEx],['smart',smart]]) {
  for (const [lab, eo, cs] of [['global excl',{excludeSelectors:['.skip']},null],['rule excl',{rules:{'z':{excludeSelectors:['.skip']}}},null],['contextSelector',{},'#ctx']]) {
    const o = run({...eo, customRules:[{id:'z', meta:{}, runInPage:f}]}, ['z'], cs, html);
    const r = pick(o.res,'z'); console.log(n, lab, r.outcome, r.occurrences.map(x=>x.selector).join(' | '));
  }
}
