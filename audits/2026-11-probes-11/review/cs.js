// Compare computedStyle (jsdom, before/after) against Chromium getComputedStyle.
const { JSDOM } = require('/home/user/r11-review/node_modules/jsdom');
const { chromium } = require('/home/user/core-r11/node_modules/playwright');
const ROOTS = { before: '/home/user/core-r11', after: '/home/user/r11-review' };
function jsdomCS(root, html, sel, props) {
  const { createDomHelpers } = require(root + '/src/core/dom-helpers.js');
  const d = new JSDOM(html, { pretendToBeVisual: true, runScripts: 'dangerously' });
  const document = d.window.document;
  const h = createDomHelpers({ document, window: d.window, root: [document], includeShadowDom: true });
  const el = sel.split(' >>> ').reduce((ctx, s, i) => (i ? ctx.shadowRoot : ctx).querySelector(s), document);
  const cs = h.computedStyle(el);
  return props.map((p) => cs[p] ?? cs.getPropertyValue(p));
}
let browser;
async function crCS(html, sel, props) {
  browser = browser || (await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
  const p = await browser.newPage();
  await p.setContent(html);
  const r = await p.evaluate(([sel, props]) => {
    const el = sel.split(' >>> ').reduce((ctx, s, i) => (i ? ctx.shadowRoot : ctx).querySelector(s), document);
    const cs = getComputedStyle(el);
    return props.map((q) => cs[q] ?? cs.getPropertyValue(q));
  }, [sel, props]);
  await p.close();
  return r;
}
module.exports = async function run(cases) {
  for (const [label, html, sel, props] of cases) {
    let b, a;
    try { b = jsdomCS(ROOTS.before, html, sel, props); } catch (e) { b = 'ERR ' + e.message; }
    try { a = jsdomCS(ROOTS.after, html, sel, props); } catch (e) { a = 'ERR ' + e.message; }
    const c = await crCS(html, sel, props);
    const flag = JSON.stringify(a) === JSON.stringify(c) ? 'OK ' : 'DIFF';
    console.log(`${flag} ${label}\n   before ${JSON.stringify(b)}\n   after  ${JSON.stringify(a)}\n   chrome ${JSON.stringify(c)}`);
  }
  if (browser) await browser.close();
};
