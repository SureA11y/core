process.env.PLAYWRIGHT_BROWSERS_PATH='/tmp/scratch/pw1234';
const ROOTS = { main: '/home/user/core', br: '/home/user/r12-contrast', r8: '/home/user/core-r8', v117: '/home/user/core-v117' };
const { chromium } = require('/home/user/r12-contrast/node_modules/playwright');
let browser;
async function cr(root, html, ids, { width = 1280, height = 800, eo = {} } = {}) {
  browser = browser || await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.addScriptTag({ path: ROOTS[root] + '/surea11y.browser.js' });
  const r = await page.evaluate(([eo, ids]) => window.a11ycore.runa11yCoreInPage(null, null, eo, ids), [eo, ids]);
  await page.close();
  return r;
}
const T = {};
function js(root, html, ids, eo = {}) {
  T[root] = T[root] || require(ROOTS[root] + '/src/testing.js');
  const W = console.warn; console.warn = () => {};
  try { return T[root].runa11yCoreOnHtml(html, { engineOptions: eo, runOnly: ids, entryPointParity: false }); } finally { console.warn = W; }
}
function rule(r, id) { return r.checksResults.find(c => c.ruleId === id); }
function occ(o) { const d = (o.data && o.data.details) || {}; return [o.outcome || '', o.selector, d.reasonCode || '', d.contrastRatio || d.ratio || '', o.lean ? o.lean.toward : ''].filter(x => x !== '').join('|'); }
function brief(c) { if (!c) return 'absent'; const os = (c.occurrences || []).filter(o => o.outcome !== 'pass' || process.env.PASSES).map(occ); return c.outcome + (os.length ? ' ' + os.join(' ; ') : ''); }
function page(body, head = '', lang = 'en') { return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>Test page</title>${head}</head><body><main>${body}</main></body></html>`; }
async function four(label, html, ids, opts = {}, roots = ['main', 'br']) {
  console.log('### ' + label);
  for (const id of ids) {
    const line = [];
    for (const root of roots) {
      let a, b;
      try { a = brief(rule(await js(root, html, [id], opts.eo), id)); } catch (e) { a = 'ERR ' + e.message.slice(0, 120); }
      try { b = brief(rule(await cr(root, html, [id], opts), id)); } catch (e) { b = 'ERR ' + e.message.slice(0, 120); }
      line.push(`    ${root.padEnd(4)} jsdom : ${a.slice(0, 400)}\n    ${root.padEnd(4)} chrome: ${b.slice(0, 400)}`);
    }
    console.log('  [' + id + ']\n' + line.join('\n'));
  }
}
async function close() { if (browser) await browser.close(); }
module.exports = { cr, js, rule, brief, page, four, close };
