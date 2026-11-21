'use strict';
// Harness: node h.js <file.html> rule1,rule2 [--ax sel1,sel2]
const fs = require('fs');
const { runa11yCoreOnHtml } = require('/home/user/core-r9/src/testing.js');
const { chromium } = require('/home/user/core-r9/node_modules/playwright');
function summarize(r) {
  return {
    rule: r.ruleId, outcome: r.outcome, n: (r.occurrences||[]).length,
    occ: (r.occurrences || []).map((o) => ({
      o: o.outcome, sel: o.selector, code: o.data && o.data.details && o.data.details.reasonCode,
      lean: o.lean || (o.data && o.data.details && o.data.details.lean),
      msg: ((o.summary||'')+' | '+(o.hint||'')).slice(0, 300), d: o.data && o.data.details && JSON.stringify(Object.fromEntries(Object.entries(o.data.details).filter(([k])=>!['metrics','refs','reasonCode'].includes(k)))).slice(0,300)
    }))
  };
}
async function run(html, rules, axSels, opts = {}) {
  const out = {};
  let jr;
  try {
    jr = runa11yCoreOnHtml(html, { runOnly: rules, entryPointParity: false, engineOptions: opts.engineOptions || {} });
    out.jsdom = jr.checksResults.map(summarize);
  } catch (e) { out.jsdom = 'THROW ' + e.stack; }
  if (opts.noChrome) return out;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  try {
    const page = await browser.newPage();
    await page.setContent(html);
    await page.addScriptTag({ path: '/home/user/core-r9/surea11y.browser.js' });
    const cr = await page.evaluate(async ([rules, eo]) => {
      const r = await window.a11ycore.runa11yCoreInPage(null, null, eo, rules);
      return JSON.parse(JSON.stringify(r.checksResults));
    }, [rules, opts.engineOptions || {}]);
    out.chromium = cr.map(summarize);
    if (axSels && axSels.length) {
      const cdp = await page.context().newCDPSession(page);
      out.ax = {};
      for (const sel of axSels) {
        const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
        const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel });
        if (!nodeId) { out.ax[sel] = 'no node'; continue; }
        const { node } = await cdp.send('DOM.describeNode', { nodeId });
        const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { backendNodeId: node.backendNodeId, fetchRelatives: false });
        const ax = nodes.find((n) => n.backendDOMNodeId === node.backendNodeId);
        out.ax[sel] = ax ? { role: ax.role && ax.role.value, name: ax.name && ax.name.value, ignored: ax.ignored, props: (ax.properties||[]).map(p=>p.name+'='+JSON.stringify(p.value.value)).join(' ') } : null;
      }
    }
  } finally { await browser.close(); }
  return out;
}
module.exports = run;
if (require.main === module) {
  const [file, rules, ...rest] = process.argv.slice(2);
  const html = fs.readFileSync(file, 'utf8');
  const axi = rest.indexOf('--ax');
  const ax = axi >= 0 ? rest[axi + 1].split(';') : [];
  run(html, rules.split(','), ax).then((o) => console.log(JSON.stringify(o, null, 1)));
}
