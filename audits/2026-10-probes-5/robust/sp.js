// Speed helper: time rules on generated pages under jsdom, report curve.
'use strict';
const { createDom, runa11yCoreOnDom } = require('/home/user/core/src/testing.js');
console.warn = () => {};
function timeRules(html, rules, setup) {
  const dom = createDom(html); if (setup) setup(dom.window);
  const t = process.hrtime.bigint();
  const r = runa11yCoreOnDom(dom, { engineOptions: { perfStats: true, profileRules: true }, entryPointParity: false, runOnly: rules ? { includeRuleIds: rules } : null });
  const tot = Number(process.hrtime.bigint() - t) / 1e6;
  const rt = (r.perfStats && r.perfStats.ruleTimings) || {};
  const errs = r.checksResults.filter(c => c.error).map(c => c.ruleId + ':' + String(c.error.message || c.error).slice(0, 80));
  dom.window.close();
  return { tot, rt, errs, r };
}
function curve(name, mk, ns, rules, { setup, top = 4 } = {}) {
  const rows = [];
  for (const n of ns) {
    const { tot, rt, errs } = timeRules(mk(n), rules, setup && (w => setup(w, n)));
    const tops = Object.entries(rt).sort((a, b) => b[1] - a[1]).slice(0, top);
    rows.push({ n, tot, tops, errs });
    console.log(`${name} n=${n} total=${tot.toFixed(0)}ms ${tops.map(([k, v]) => k + '=' + v.toFixed(0)).join(' ')}${errs.length ? ' ERR ' + errs.join(';') : ''}`);
  }
  return rows;
}
const page = (body, head = '') => `<!doctype html><html lang="en"><head><title>Speed page</title>${head}</head><body><main>${body}</main></body></html>`;
module.exports = { timeRules, curve, page };
