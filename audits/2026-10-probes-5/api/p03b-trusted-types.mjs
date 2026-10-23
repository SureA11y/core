// openReport() on a page that requires Trusted Types for script URLs.
import { launch, open } from './h.mjs';
import fs from 'node:fs';
const src = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const b = await launch();
const { page, ctx } = await open(b, '<!doctype html><html lang=en><title>t</title><main><img src="data:,"></main>', { noBundle: true, headers: { 'content-security-policy': "require-trusted-types-for 'script'; trusted-types x" } });
await page.evaluate(src);
console.log(await page.evaluate(async () => {
  const r = await a11ycore.run();
  try { return await a11ycore.openReport(r, { reportScript: '/surea11y.report.js' }); } catch (e) { return 'ERR ' + e.constructor.name + ': ' + e.message; }
}));
await ctx.close(); await b.close();
