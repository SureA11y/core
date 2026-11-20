const cases = require('./pah-cases.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const html = '<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>Page</h1>' + cases.map(([n, m], i) => `<section id="c${i}">${m}</section>`).join('') + '</main></body></html>';
fs.writeFileSync(__dirname + '/pah.html', html);
function summarize(r) {
  const by = {};
  for (const o of r.occurrences) { const m = /#c(\d+)/.exec(o.selector) || /section:nth-of-type\((\d+)\)/.exec(o.selector); const k = m ? (o.selector.includes('#c') ? +m[1] : +m[1] - 1) : o.selector; (by[k] ||= []).push(o.data.details.reasonCode + (o.data.details.fontSizePx ? '@' + Math.round(o.data.details.fontSizePx*10)/10 : '')); }
  return by;
}
(async () => {
  const j = summarize(runa11yCoreOnHtml(html, { runOnly: ['p-as-heading'] }).checksResults[0]);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.setContent(html);
  await p.addScriptTag({ path: '/home/user/core/surea11y.browser.js' });
  const cr = await p.evaluate(() => window.a11ycore.runa11yCoreInPage(null, null, {}, ['p-as-heading']).checksResults[0]);
  const c = summarize(cr);
  cases.forEach(([n], i) => console.log(`${String(i).padStart(2)} ${n.padEnd(48)} jsdom=${JSON.stringify(j[i] || [])} chromium=${JSON.stringify(c[i] || [])}`));
  const other = Object.keys(c).filter(k => isNaN(+k)); if (other.length) console.log('unmapped', other);
  await b.close();
})();
