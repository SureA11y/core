const fs = require('fs');
const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const core = require('/home/user/core/src/index.js');
const { chromium } = require('/home/user/core/node_modules/playwright');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');

function wrap(c) {
  if (c.html) return c.html;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Probe page</title></head><body><main><h1>Probe</h1>${c.body}</main></body></html>`;
}

function summarize(r) {
  const o = {};
  for (const c of r.checksResults) {
    o[c.ruleId] = { outcome: c.outcome, occ: (c.occurrences || []).map((x) => (x.html || '').slice(0, 120) + ' :: ' + (x.summary || '').slice(0, 140)), error: c.error || null };
  }
  return o;
}

function runJsdom(c, engineOptions = {}) {
  const dom = new JSDOM(wrap(c), { url: 'https://example.test/', pretendToBeVisual: true, runScripts: 'outside-only', contentType: c.contentType || 'text/html' });
  global.window = dom.window; global.document = dom.window.document;
  if (c.setup) { try { dom.window.eval(c.setup); } catch (e) { /* ignore */ } }
  const t = Date.now();
  const r = core.runDomRulesInPage('https://example.test/', null, engineOptions, null);
  const s = summarize(r);
  s.__ms = Date.now() - t;
  dom.window.close();
  return s;
}

let browser;
async function getBrowser() {
  if (!browser) browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  return browser;
}
async function runChromium(c, engineOptions = {}) {
  const b = await getBrowser();
  const p = await b.newPage();
  await p.setContent(wrap(c));
  if (c.setup) await p.evaluate((code) => { try { (0, eval)(code); } catch (e) {} }, c.setup);
  await p.addScriptTag({ content: BUNDLE });
  const out = await p.evaluate((eo) => {
    const r = window.a11ycore.runa11yCoreInPage(location.href, null, eo, null);
    const o = {};
    for (const c of r.checksResults) o[c.ruleId] = { outcome: c.outcome, occ: (c.occurrences || []).map((x) => (x.html || '').slice(0, 120) + ' :: ' + (x.summary || '').slice(0, 140)), error: c.error || null };
    return o;
  }, engineOptions);
  await p.close();
  return out;
}
async function close() { if (browser) await browser.close(); }
module.exports = { wrap, runJsdom, runChromium, close, core };
module.exports.runChromiumTimed = async function (c) {
  const b = await getBrowser();
  const p = await b.newPage();
  await p.setContent(wrap(c));
  await p.addScriptTag({ content: BUNDLE });
  const out = await p.evaluate(() => {
    const t = performance.now();
    const r = window.a11ycore.runa11yCoreInPage(location.href, null, { profileRules: true, perfStats: true }, null);
    const ms = Math.round(performance.now() - t);
    const tm = (r.perfStats && r.perfStats.ruleTimings) || {};
    const top = Object.entries(tm).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => k + ':' + Math.round(v)).join(' ');
    const fails = r.checksResults.filter((c) => c.outcome === 'fail').map((c) => c.ruleId).join(',');
    const errs = r.checksResults.filter((c) => c.error).map((c) => c.ruleId).join(',');
    return { ms, top, fails, errs };
  });
  await p.close();
  return out;
};
