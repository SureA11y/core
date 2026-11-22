// Compares the engine's name helpers with Chromium's AX tree for every [data-t] element.
const CORE='/home/user/core-r11';
const { chromium } = require(CORE+'/node_modules/playwright');
const PROBE = {
  id: 'zz-name-probe',
  meta: { title: 'probe', description: 'probe', tags: [], wcagSc: [], defaultSeverity: 'minor', type: 'manual' },
  runInPage: (function (ctx) {
    const h = ctx.helpers; const out = [];
    const all = []; (function walk(root){ root.querySelectorAll('*').forEach(e=>{ all.push(e); if (e.shadowRoot) walk(e.shadowRoot); }); })(document);
    for (const el of all) { if (!el.hasAttribute('data-t')) continue;
      let a, c, r; try { a = h.getAccessibleNameInfo(el, ctx); } catch (e) { a = { err: String(e) }; }
      try { c = h.getNameFromContentInfo(el, ctx); } catch (e) { c = { err: String(e) }; }
      try { r = h.getRoleInfo(el, ctx); } catch (e) { r = { err: String(e) }; }
      out.push({ summary: 'x', data: { details: { t: el.getAttribute('data-t'), acc: a && (a.err || (a.present ? a.value : null)), mech: a && a.mechanism, content: c && (c.err || (c.present ? c.value : null)), role: r && r.role } } });
    }
    return { ruleId: ctx.rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences: out };
  }).toString()
};
async function run(cases) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const res = [];
  for (const [label, body, head] of cases) {
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><html lang="en"><head><title>t</title>${head||''}</head><body>${body}</body></html>`, { waitUntil: 'load' });
    const cdp = await page.context().newCDPSession(page);
    const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
    const axByBe = {};
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    for (const n of nodes) if (n.backendDOMNodeId) axByBe[n.backendDOMNodeId] = n;
    const targets = [];
    (function walk(n){ if (n.attributes) { const i = n.attributes.indexOf('data-t'); if (i >= 0 && i % 2 === 0) targets.push([n.attributes[i+1], n.backendNodeId]); } (n.children||[]).concat(n.shadowRoots||[]).concat(n.contentDocument?[n.contentDocument]:[]).forEach(walk); })(root);
    await page.addScriptTag({ path: CORE+'/surea11y.browser.js' });
    const r = await page.evaluate((p) => window.a11ycore.runa11yCoreInPage(null, null, { customRules: [p], includeShadowDom: true }, ['zz-name-probe']), PROBE);
    const occ = (r.checksResults.find(c => c.ruleId === 'zz-name-probe') || { occurrences: [] }).occurrences.map(o => o.data.details);
    for (const [t, be] of targets) {
      const n = axByBe[be];
      const e = occ.find(o => o.t === t) || {};
      res.push({ label, t, axRole: n && n.role && n.role.value, axName: n ? (n.ignored ? '(ignored)' : (n.name && n.name.value)) : '(none)', acc: e.acc, mech: e.mech, content: e.content, role: e.role });
    }
    await page.close();
  }
  await browser.close();
  return res;
}
module.exports = { run };
