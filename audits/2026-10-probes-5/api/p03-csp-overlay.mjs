// highlight()/inspect() under a Content-Security-Policy without 'unsafe-inline' styles.
import { launch, open } from './h.mjs';
const html = `<!doctype html><html lang=en><title>t</title><main><h1>Head</h1><img src="data:,"><button style="margin:200px"></button></main>`;
const b = await launch();
for (const csp of [null, "default-src 'self'; img-src data:", "script-src 'self'; style-src 'self'", "require-trusted-types-for 'script'; trusted-types x"]) {
  const { page, ctx } = await open(b, html, { headers: csp ? { 'content-security-policy': csp } : {} , console: false});
  const out = await page.evaluate(async () => {
    const r = await a11ycore.run();
    const n = a11ycore.highlight(r);
    const host = document.querySelector('[data-surea11y-highlights]');
    const box = host && host.shadowRoot.querySelector('.box');
    const cs = box && getComputedStyle(box);
    const tag = box && getComputedStyle(box.querySelector('.tag'));
    let rep;
    try { rep = await a11ycore.openReport(r, { reportScript: '/surea11y.report.js' }); } catch (e) { rep = 'ERR ' + e.constructor.name + ': ' + e.message; }
    return { n, position: cs && cs.position, border: cs && cs.borderTopWidth + ' ' + cs.borderTopStyle, tagBg: tag && tag.backgroundColor, rep: String(rep).slice(0, 120) };
  });
  console.log(JSON.stringify(csp), JSON.stringify(out));
  await ctx.close();
}
await b.close();
