/* Shared probe harness: run the engine on HTML in jsdom or Chromium. */
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..');
const BUNDLE = process.env.BUNDLE || path.join(ROOT, 'surea11y.browser.js');

function summarize(r) {
  const out = {};
  for (const c of r.checksResults || []) {
    out[c.ruleId] = c.outcome + (c.error ? ' ERR:' + String(c.error).slice(0, 80) : '') +
      ' #' + (c.occurrences || []).length;
  }
  return out;
}
function digest(r) {
  // stable digest of outcomes + occurrence selectors
  return (r.checksResults || []).map(c => c.ruleId + '=' + c.outcome + '[' +
    (c.occurrences || []).map(o => (o.selector || '') + ':' + (o.outcome || o.result || '')).join(',') + ']' +
    (c.error ? '!' + c.error : '')).join('\n');
}

function runJsdom(html, opts = {}, { setup, url = 'https://example.test/' } = {}) {
  const { runa11yCoreOnHtml, createDom, runa11yCoreOnDom } = require(path.join(ROOT, 'src/testing.js'));
  if (setup) {
    const dom = createDom(html, { url });
    setup(dom);
    const t = Date.now();
    const r = runa11yCoreOnDom(dom, { url, engineOptions: opts, entryPointParity: false });
    return { ms: Date.now() - t, r, dom };
  }
  const t = Date.now();
  const r = runa11yCoreOnHtml(html, { url, engineOptions: opts, entryPointParity: false });
  return { ms: Date.now() - t, r };
}

let _browser;
async function browser() {
  if (!_browser) {
    const { chromium } = require(path.join(ROOT, 'node_modules/playwright'));
    _browser = await chromium.launch({ args: ['--js-flags=--stack-size=4000'].slice(0, 0) });
  }
  return _browser;
}
async function closeBrowser() { if (_browser) await _browser.close(); _browser = null; }

/** Load html into a page (via a local file), inject bundle and run the scan
 * through CDP Runtime.evaluate, so a page that patches builtins can't break the
 * driver's own in-page helpers. */
async function cdpEval(cdp, expression, timeoutMs) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, timeout: timeoutMs });
  if (r.exceptionDetails) {
    const d = r.exceptionDetails;
    throw new Error('EVAL: ' + ((d.exception && d.exception.description) || d.text));
  }
  return r.result.value;
}
const bundleSrcCache = {};
async function runChromium(html, opts = {}, { pre, post, timeoutMs = 120000, bundle = BUNDLE, viewport, keepPage, runOnly = null, scans = 1 } = {}) {
  const b = await browser();
  const ctx = await b.newContext(viewport ? { viewport } : {});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  const tmp = path.join(__dirname, 'tmp');
  fs.mkdirSync(tmp, { recursive: true });
  const f = path.join(tmp, 'p' + process.pid + '-' + Math.random().toString(36).slice(2) + '.html');
  fs.writeFileSync(f, html);
  const cdp = await ctx.newCDPSession(page);
  let res = {};
  try {
    await page.goto('file://' + f, { timeout: timeoutMs });
    if (!bundleSrcCache[bundle]) bundleSrcCache[bundle] = fs.readFileSync(bundle, 'utf8');
    await cdpEval(cdp, bundleSrcCache[bundle] + '\n;void 0', timeoutMs);
    if (pre) await cdpEval(cdp, '(' + pre.toString() + ')()', timeoutMs);
    const call = `(function(){var o=${JSON.stringify(opts)},ro=${JSON.stringify(runOnly)};var t=performance.now();var r,err;
      try{r=window.a11ycore.runa11yCoreInPage(location.href,null,o,ro);}catch(e){err=String(e&&e.stack||e);}
      return {ms:performance.now()-t,r:r,err:err};})()`;
    const runs = [];
    for (let i = 0; i < scans; i++) {
      const p = cdpEval(cdp, call, timeoutMs);
      const one = await Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT ' + timeoutMs + 'ms')), timeoutMs + 2000))]);
      runs.push(one);
    }
    res = runs[0];
    if (scans > 1) res.runs = runs;
    if (post) res.post = await cdpEval(cdp, '(' + post.toString() + ')()', timeoutMs).catch((e) => 'post-error ' + e);
  } catch (e) {
    res = { err: String(e.message || e), hung: /TIMEOUT|Timeout|timed out|Execution was terminated/i.test(String(e)) };
  }
  res.pageErrors = errors;
  try { fs.unlinkSync(f); } catch {}
  if (keepPage) { res.page = page; res.ctx = ctx; res.cdp = cdp; } else await Promise.race([ctx.close().catch(() => {}), new Promise((r) => setTimeout(r, 5000))]);
  return res;
}
module.exports = { cdpEval, summarize, digest, runJsdom, runChromium, browser, closeBrowser, ROOT, BUNDLE };
