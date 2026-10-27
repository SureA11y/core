// node par-one.mjs <rule> <html...>: one rule in jsdom and in Chromium on small pages.
import { createRequire } from 'node:module'; import fs from 'node:fs';
const req = createRequire(import.meta.url);
const { createDom, runa11yCoreOnDom } = req('/home/user/core/src/testing.js');
const { chromium } = req('/home/user/core/node_modules/playwright');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8'); console.warn = () => {};
const rule = process.argv[2]; const pages = process.argv.slice(3);
const f = (c) => c ? c.outcome + ' ' + (c.occurrences || []).filter(o => o.tier !== 'pass').map(o => (o.data && o.data.details && o.data.details.reasonCode || '') + '@' + o.selector).join(', ') : 'missing';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage();
for (const body of pages) {
  const html = `<!doctype html><html lang="en"><head><title>Parity</title></head><body><main><h1>P</h1>${body}</main></body></html>`;
  const j = runa11yCoreOnDom(createDom(html), { entryPointParity: false, runOnly: [rule] }).checksResults.find(c => c.ruleId === rule);
  await p.setContent(html); await p.addScriptTag({ content: BUNDLE });
  const c = await p.evaluate((r) => window.a11ycore.runa11yCoreInPage(location.href, null, {}, [r]).checksResults.find(c => c.ruleId === r), rule);
  console.log(body.slice(0, 120), '\n   jsdom   :', f(j), '\n   chromium:', f(c));
}
await b.close();
