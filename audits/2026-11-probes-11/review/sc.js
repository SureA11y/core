const { chromium } = require('/home/user/core-r11/node_modules/playwright');
const R = { before: '/home/user/core-r11', after: '/home/user/r11-review' };
let browser;
function js(root, html, ids) { return require(root + '/src/testing.js').runa11yCoreOnHtml(html, { runOnly: ids, entryPointParity: false }); }
async function cr(root, html, ids) {
  browser = browser || (await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
  const p = await browser.newPage(); await p.setContent(html, { waitUntil: 'load' });
  await p.addScriptTag({ path: root + '/surea11y.browser.js' });
  const r = await p.evaluate((ids) => window.a11ycore.runa11yCoreInPage(null, null, {}, ids), ids);
  await p.close(); return r;
}
function brief(r, id) { const c = r.checksResults.find((c) => c.ruleId === id); if (!c) return 'absent';
  return c.outcome + ' ' + JSON.stringify((c.occurrences || []).filter(o=>o.outcome!=='pass'||1).map((o) => [o.outcome, o.selector, (o.summary || '').slice(0, 110)])); }
const page = (b, h = '', ba='') => `<!doctype html><html lang="en"><head><title>Test page</title>${h}</head><body${ba}><main>${b}</main></body></html>`;
async function run(cases) {
  for (const [label, html, id] of cases) {
    const out = {};
    for (const k of ['before', 'after']) {
      try { out['js-' + k] = brief(js(R[k], html, [id]), id); } catch (e) { out['js-' + k] = 'ERR ' + e.message.slice(0, 100); }
      try { out['cr-' + k] = brief(await cr(R[k], html, [id]), id); } catch (e) { out['cr-' + k] = 'ERR ' + e.message.slice(0, 100); }
    }
    console.log(`### ${label} [${id}]`); for (const k in out) console.log('  ' + k.padEnd(10) + out[k].slice(0, 400));
  }
  if (browser) await browser.close();
}
module.exports = { run, page };
// Cases with a setup script (run in the page in both engines).
function jsSetup(root, html, ids, setup) {
  const t = require(root + '/src/testing.js');
  const dom = t.createDom(html);
  if (setup) new dom.window.Function(setup)();
  return t.runa11yCoreOnDom(dom, { runOnly: ids, entryPointParity: false });
}
async function crSetup(root, html, ids, setup) {
  browser = browser || (await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
  const p = await browser.newPage(); await p.setContent(html, { waitUntil: 'load' });
  if (setup) await p.evaluate(setup);
  await p.addScriptTag({ path: root + '/surea11y.browser.js' });
  const r = await p.evaluate((ids) => window.a11ycore.runa11yCoreInPage(null, null, {}, ids), ids);
  await p.close(); return r;
}
async function runS(cases) {
  for (const [label, html, id, setup] of cases) {
    const out = {};
    for (const k of ['before', 'after']) {
      try { out['js-' + k] = brief(jsSetup(R[k], html, [id], setup), id); } catch (e) { out['js-' + k] = 'ERR ' + e.message.slice(0, 100); }
      try { out['cr-' + k] = brief(await crSetup(R[k], html, [id], setup), id); } catch (e) { out['cr-' + k] = 'ERR ' + e.message.slice(0, 100); }
    }
    console.log(`### ${label} [${id}]`); for (const k in out) console.log('  ' + k.padEnd(10) + out[k].slice(0, 300));
  }
  if (browser) await browser.close();
}
module.exports.runS = runS;
