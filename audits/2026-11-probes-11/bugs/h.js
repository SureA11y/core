const CORE='/home/user/core-r11';
const { chromium } = require(CORE+'/node_modules/playwright');
let browser;
async function cr(html, ruleIds, { width = 1280, height = 800, eo = {} } = {}) {
  browser = browser || await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.addScriptTag({ path: CORE+'/surea11y.browser.js' });
  const r = await page.evaluate(([eo, ids]) => window.a11ycore.runa11yCoreInPage(null, null, eo, ids), [eo, ruleIds]);
  await page.close();
  return r;
}
function js(html, ruleIds, eo = {}) {
  const { runa11yCoreOnHtml } = require(CORE+'/src/testing.js');
  return runa11yCoreOnHtml(html, { engineOptions: eo, runOnly: ruleIds, entryPointParity: false });
}
function rule(r, id) { return r.checksResults.find(c => c.ruleId === id); }
function brief(c) { if (!c) return 'absent'; return c.outcome + ' ' + JSON.stringify((c.occurrences||[]).map(o => [o.selector, o.data && o.data.details && o.data.details.reasonCode, o.lean && o.lean.toward, (o.summary||'').slice(0,200)])); }
function page(body, head='') { return `<!doctype html><html lang="en"><head><title>Test page</title>${head}</head><body><main>${body}</main></body></html>`; }
async function both(label, html, id, opts) {
  let a, b;
  try { a = brief(rule(await js(html, [id]), id)); } catch (e) { a = 'JSDOM ERR ' + e.message; }
  try { b = brief(rule(await cr(html, [id], opts), id)); } catch (e) { b = 'CR ERR ' + e.message; }
  console.log('### ' + label + '\n  jsdom : ' + a + '\n  chrome: ' + b);
}
async function close() { if (browser) await browser.close(); }
module.exports = { cr, js, rule, brief, page, both, close };
