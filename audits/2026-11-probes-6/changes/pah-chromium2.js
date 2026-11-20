const { chromium } = require('/home/user/core/node_modules/playwright');
const cases = [
  ['1.4em in 12px parent', '<div style="font-size:12px"><div style="font-size:1.4em;font-weight:bold">Opening hours</div><p>Monday to Friday.</p></div>'],
  ['150% in 10px parent', '<div style="font-size:10px"><p style="font-size:150%;font-weight:bold">Opening hours</p><p>Monday to Friday.</p></div>'],
];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  for (const [n, body] of cases) {
    await p.setContent(`<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>P</h1>${body}</main></body></html>`);
    await p.addScriptTag({ path: '/home/user/core/surea11y.browser.js' });
    const r = await p.evaluate(() => { const c = window.a11ycore.runa11yCoreInPage(null, null, {}, ['p-as-heading']).checksResults[0]; return c.outcome + ' ' + JSON.stringify(c.occurrences.map(o => o.data.details.reasonCode + '@' + o.data.details.fontSizePx)); });
    console.log('chromium', n.padEnd(24), r);
  }
  await b.close();
})();
