'use strict';
// Multi-case runner: node m.js cases.js [filter]
const { runa11yCoreOnHtml } = require('/home/user/core-r9/src/testing.js');
const { chromium } = require('/home/user/core-r9/node_modules/playwright');
const wrap = (b, head='') => b.startsWith('<!doctype') ? b : `<!doctype html><html lang="en"><head><title>T</title>${head}</head><body>${b}</body></html>`;
function line(r) {
  const occ = (r.occurrences || []).map((o) => {
    const d = (o.data && o.data.details) || {};
    return `${o.selector}:${d.reasonCode || ''}${o.outcome ? '/' + o.outcome : ''}${d.lean ? '/lean=' + d.lean : ''}`;
  });
  return `${r.outcome}${occ.length ? ' [' + occ.join(', ') + ']' : ''}`;
}
function msgs(r) {
  return (r.occurrences || []).map((o) => `    ${o.selector}: ${o.summary} | ${o.hint || ''}`).join('\n');
}
async function main() {
  const cases = require(require('path').resolve(process.argv[2]));
  const filter = process.argv[3];
  const verbose = process.env.V;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const c of cases) {
    const page = await browser.newPage();
    if (filter && !c.name.includes(filter)) continue;
    const html = wrap(c.html, c.head);
    let j, cr;
    try {
      j = runa11yCoreOnHtml(html, { runOnly: c.rules, entryPointParity: false, engineOptions: c.eo || {} }).checksResults;
    } catch (e) { j = e.message; }
    try {
      await page.setContent(html);
      await page.addScriptTag({ path: '/home/user/core-r9/surea11y.browser.js' });
      if (c.setup) await page.evaluate(c.setup);
      cr = await page.evaluate(async ([rules, eo]) => JSON.parse(JSON.stringify((await window.a11ycore.runa11yCoreInPage(null, null, eo, rules)).checksResults)), [c.rules, c.eo || {}]);
    } catch (e) { cr = e.message; }
    console.log(`== ${c.name}`);
    for (const rule of c.rules) {
      const jr = Array.isArray(j) ? j.find((x) => x.ruleId === rule) : null;
      const cc = Array.isArray(cr) ? cr.find((x) => x.ruleId === rule) : null;
      const jl = jr ? line(jr) : String(j).slice(0, 200);
      const cl = cc ? line(cc) : String(cr).slice(0, 200);
      console.log(`  ${rule}: J=${jl}${jl === cl ? '  (same in C)' : '\n      C=' + cl}`);
      if (verbose) { if (jr) console.log(msgs(jr)); if (cc && cl !== jl) console.log(msgs(cc)); }
    }
    if (c.ax) {
      const cdp = await page.context().newCDPSession(page);
      for (const sel of c.ax) {
        const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
        let nodeId;
        try { ({ nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel })); } catch { }
        if (!nodeId) { console.log(`  AX ${sel}: no node`); continue; }
        const { node } = await cdp.send('DOM.describeNode', { nodeId });
        const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { backendNodeId: node.backendNodeId, fetchRelatives: true });
        const ax = nodes.find((n) => n.backendDOMNodeId === node.backendNodeId);
        const parent = ax && nodes.find((n) => n.nodeId === ax.parentId);
        console.log(`  AX ${sel}: ${ax ? `role=${ax.role && ax.role.value} name=${JSON.stringify(ax.name && ax.name.value)} ignored=${ax.ignored} ${(ax.properties || []).filter(p=>!['focusable','invalid','readonly'].includes(p.name)).map((p) => p.name + '=' + JSON.stringify(p.value.value)).join(' ')} parent=${parent && parent.role && parent.role.value}` : 'none'}`);
      }
      await cdp.detach();
    }
    await page.close();
  }
  await browser.close();
}
main();
