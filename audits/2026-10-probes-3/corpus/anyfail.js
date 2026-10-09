'use strict';
// Runs all rules on a snippet in Chromium (old and new bundle) and lists which
// rules report the element #t, plus Chromium's own role and name for #t.
// usage: node anyfail.js <oldBundle> <newBundle> '<html>'
const fs = require('node:fs');
const { chromium } = require('playwright');
const [oldB, newB, html] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const p0 = await b.newPage();
  await p0.setContent(html);
  const cdp = await p0.context().newCDPSession(p0);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const tId = await p0.evaluate(() => {
    const find = (root) => root.querySelector('#t') || [...root.querySelectorAll('*')].map((e) => e.shadowRoot && find(e.shadowRoot)).find(Boolean);
    const t = find(document);
    if (t) t.setAttribute('data-probe-t', '1');
    return !!t;
  });
  let ax = null;
  if (tId) {
    const doc = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
    const stack = [doc.root];
    let be = null;
    while (stack.length) {
      const n = stack.pop();
      if (n.attributes && n.attributes.includes('data-probe-t')) { be = n.backendNodeId; break; }
      for (const k of [...(n.children || []), ...(n.shadowRoots || [])]) stack.push(k);
    }
    const a = nodes.find((n) => n.backendDOMNodeId === be);
    ax = a ? { role: a.role && a.role.value, name: a.name && a.name.value, ignored: a.ignored } : 'no ax node';
  }
  console.log('chromium', JSON.stringify(ax));
  for (const [label, bundle] of [['old', oldB], ['new', newB]]) {
    const p = await b.newPage();
    await p.setContent(html);
    await p.addScriptTag({ content: fs.readFileSync(bundle, 'utf8') });
    const r = await p.evaluate(() => {
      const r = window.a11ycore.runa11yCoreInPage(location.href, null, { optInRules: 'all' }, null);
      const out = [];
      for (const c of r.checksResults) {
        for (const o of c.occurrences) {
          if (/#t\b/.test(o.selector || '') || /id="t"/.test(o.html || '')) out.push(c.ruleId + ':' + c.outcome + ':' + ((o.summary || '').slice(0, 90)));
        }
        if (c.error && !c.occurrences.length) out.push(c.ruleId + ':ERROR:' + c.error.slice(0, 80));
      }
      return out;
    });
    console.log(label, JSON.stringify(r, null, 0));
    await p.close();
  }
  await b.close();
})();
