const { chromium } = require('/home/user/core-r10/node_modules/playwright');
let browser;
async function scan(html, { width = 640, height = 800, eo = {}, runOnly = null, before, after } = {}) {
  browser = browser || await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width, height } });
  const logs = []; page.on('console', m => { if (m.type()==='warning'||m.type()==='error') logs.push(m.text().slice(0,300)); });
  await page.setContent(html, { waitUntil: 'load' });
  await page.addScriptTag({ path: '/home/user/core-r10/surea11y.browser.js' });
  const pre = before ? await page.evaluate(before) : null;
  const t0 = Date.now();
  const r = await page.evaluate(([eo, runOnly]) => window.a11ycore.runa11yCoreInPage(null, null, eo, runOnly), [eo, runOnly]);
  const ms = Date.now() - t0;
  const post = before ? await page.evaluate(before) : null;
  const extra = after ? await page.evaluate(after) : null;
  await page.close();
  return { r, ms, logs, pre, post, extra };
}
function rule(r, id) { return r.checksResults.find(c => c.ruleId === id); }
function brief(c) { if (!c) return 'absent'; return c.outcome + ' ' + JSON.stringify((c.occurrences||[]).map(o => [o.selector, o.data && o.data.details && o.data.details.reasonCode, o.lean && o.lean.toward, o.data && o.data.details && o.data.details.metrics, (o.summary||'').slice(0,160)])) + (c.data ? ' data=' + JSON.stringify(c.data) : ''); }
async function close() { if (browser) await browser.close(); }
module.exports = { scan, rule, brief, close };
