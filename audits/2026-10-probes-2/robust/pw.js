const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
let browser;
async function open() { if (!browser) browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); return browser; }
const INIT = `window.__o = { stringify: JSON.stringify, parse: JSON.parse };`;
async function scanHtml(html, { runOnly = null, engineOptions = {}, setup = null, contentType = 'text/html', preScript = null, raw = true } = {}) {
  const b = await open();
  const page = await b.newPage();
  await page.route('https://example.test/**', r => r.request().url() === 'https://example.test/' ? r.fulfill({ status: 200, contentType, body: html }) : r.fulfill({ status: 404, body: '' }));
  await page.addInitScript(INIT);
  if (preScript) await page.addInitScript(preScript);
  await page.goto('https://example.test/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(`(function(){ ${bundle}\n; window.__a = (typeof a11ycore!=='undefined'? a11ycore : window.a11ycore); })()`);
  if (setup) await page.evaluate(setup);
  const out = await page.evaluate(`(function(){
    const runOnly = ${JSON.stringify(runOnly)}, engineOptions = ${JSON.stringify(engineOptions)};
    const t = performance.now ? Date.now() : 0;
    let res;
    try {
      const r = window.__a.runa11yCoreInPage(location.href, null, engineOptions, runOnly);
      res = { r };
    } catch (e) { res = { err: String(e && e.stack || e) }; }
    return window.__o.stringify(res);
  })()`);
  await page.close();
  return window_parse(out);
}
function window_parse(s) { return JSON.parse(s); }
module.exports = { scanHtml, close: () => browser && browser.close() };
