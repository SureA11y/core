import { launch } from './probe.mjs';
import fs from 'node:fs';
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const b = await launch();
const cases = {
  C12: `<!doctype html><html lang=en><title>t</title><body style="background:#000;color:#fff"><iframe style="border:0" srcdoc="<!doctype html><html lang=en><title>f</title><body style='color:#333'><p>inner text</p></body></html>"></iframe>`,
  C14: `<!doctype html><html lang=en><title>t</title><body style="background:#fff"><iframe style="border:0" srcdoc="<!doctype html><html lang=en><title>f</title><style>:root{color-scheme:dark}</style><body><p style='color:#333'>inner text</p></body></html>"></iframe>`,
  C13: `<!doctype html><html lang=en><title>t</title><style>:root{color-scheme:dark}</style><body><iframe style="border:0" srcdoc="<!doctype html><html lang=en><title>f</title><body style='color:#222'><p>inner text</p></body></html>"></iframe>`,
};
for (const [k, html] of Object.entries(cases)) {
  const page = await b.newPage();
  await page.goto('data:text/html,' + encodeURIComponent(html));
  await page.waitForTimeout(200);
  const f = page.frames()[1];
  // top-level scan (frames?)
  await page.addScriptTag({ content: BUNDLE });
  const top = await page.evaluate(async () => { const r = await window.a11ycore.runa11yCoreInPageAsync(location.href, null, {}, ['contrast-minimum', 'contrast-computable']); return r.checksResults.map((c) => c.ruleId + ':' + c.outcome + ' ' + c.occurrences.map((o) => o.summary).join(' | ')); });
  await f.addScriptTag({ content: BUNDLE });
  const inner = await f.evaluate(async () => { const r = await window.a11ycore.runa11yCoreInPageAsync(location.href, null, {}, ['contrast-minimum', 'contrast-computable']); return r.checksResults.map((c) => c.ruleId + ':' + c.outcome + ' ' + c.occurrences.map((o) => o.summary).join(' | ')); });
  console.log(k, '\n top:', top.join('\n      '), '\n frame:', inner.join('\n      '));
  await page.close();
}
await b.close();
