// Runs contrast-minimum variants (logoText exempt / semiBold ask) in Chromium through packScript.
import { createRequire } from 'node:module';
import { launch, serve } from './probe.mjs';
import fs from 'node:fs';
const req = createRequire('/home/user/core/package.json');
const { definePack, packScript } = req('/home/user/core/src/pack.js');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const mk = (id, config) => ({ id, from: 'contrast-minimum', config, meta: { title: id, tags: ['probe'], i18n: { titleKey: id.replace(/-(\w)/g, (m, c) => c.toUpperCase()) + '_title', descriptionKey: id.replace(/-(\w)/g, (m, c) => c.toUpperCase()) + '_description' } } });
const pack = definePack({ name: '@probe/vi', version: '0.0.1', namespace: 'probe', core: '>=1.13.0', rules: [mk('probe-exempt', { logoText: 'exempt' }), mk('probe-semibold', { semiBold: 'ask' })] });
const script = packScript([pack]);
const b = await launch();
const P = (body, css = '') => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px Arial;background:#fff}.lo{color:#aaa} ${css}</style></head><body>${body}</body></html>`;
const cases = {
  btnBrand: P('<button class="btn btn-brand lo">Buy now</button>'),
  homeTextNav: P('<header><nav><a href="/" class="lo">Home</a> <a href="/about">About</a></nav></header>'),
  langRoot: P('<header><a href="/fr/" class="lo">Français</a></header>'),
  semibold600_19px: P('<p style="font-weight:600;font-size:19px;color:#949494">Semi bold text</p>'),
  semibold650var: P('<p style="font-variation-settings:\'wght\' 650;font-size:19px;color:#949494">Var text</p>'),
};
for (const [k, html] of Object.entries(cases)) {
  const page = await b.newPage();
  await page.goto(serve('/' + k, html));
  await page.addScriptTag({ content: BUNDLE });
  await page.addScriptTag({ content: script });
  const r = await page.evaluate(async () => { const r = await window.a11ycore.runa11yCoreInPageAsync(location.href, null, { packs: ['@probe/vi@0.0.1'], optInRules: ['probe'] }, ['contrast-minimum', 'probe-exempt', 'probe-semibold']); return { skipped: r.skippedPacks, res: r.checksResults.map((c) => c.ruleId + ':' + c.outcome + ' ' + c.occurrences.map((o) => o.data?.details?.reasonCode).join(',')) }; });
  console.log(k, JSON.stringify(r));
  await page.close();
}
await b.close();
