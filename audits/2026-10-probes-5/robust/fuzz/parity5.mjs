// jsdom vs Chromium parity on generated pages, non-layout rules only.
// node parity5.mjs <from> <to> > out.jsonl
import { createRequire } from 'node:module';
import fs from 'node:fs';
const req = createRequire(import.meta.url);
const { gen } = req('./gen5.js');
const { createDom, runa11yCoreOnDom } = req('/home/user/core/src/testing.js');
const { chromium } = req('/home/user/core/node_modules/playwright');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
console.warn = () => {};
// Rules that read layout, pixels, focus behaviour or animations: left out of parity.
const LAYOUT = new Set(['contrast-computable', 'contrast-minimum', 'contrast-enhanced', 'target-size-minimum', 'link-in-text-block', 'text-spacing-content-loss',
  'css-hidden-focus', 'css-focus-indicator-suppressed', 'css-orientation-lock', 'scrollable-region-focusable', 'p-as-heading', 'moving-content-pausable', 'skip-link',
  'avoid-inline-spacing', 'img-alt-decorative', 'aria-hidden-focus', 'manual-review', 'bypass-blocks-present', 'identical-iframes-same-purpose', 'iframe-focusable-content',
  'meta-viewport-large', 'focus-order-semantics', 'no-autoplay-audio', 'video-caption', 'media-alternative-transcript-evidence', 'canvas-text-alternative-present', 'canvas-text-alternative-quality',
  'svg-image-text-alternative-present', 'embed-text-alternative-present', 'object-text-alternative-present']);
const strip = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/ style="[^"]*"/g, '').replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/g, '').replace(/<(marquee|video|audio|embed|object)\b/g, '<span data-was="$1"').replace(/<\/(marquee|video|audio|embed|object)>/g, '</span>')
  // documented differences left out: jsdom takes <dialog open aria-modal> as modal (LIMITATIONS), and has no declarative shadow DOM
  .replace(/ aria-modal="true"/g, '').replace(/ shadowrootmode="[^"]*"/g, '');
const summ = (r) => { const o = {}; for (const c of r.checksResults) { if (LAYOUT.has(c.ruleId)) continue; const occ = (c.occurrences || []).filter((x) => x.tier !== 'pass'); o[c.ruleId] = c.outcome + '/' + occ.length + '/' + [...new Set(occ.map((x) => x.data && x.data.details && x.data.details.reasonCode || x.i18n && x.i18n.summaryKey || ''))].sort().join(','); } return o; };
const [from, to] = [+process.argv[2], +process.argv[3]];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
for (let s = from; s < to; s++) {
  const g = gen(s); if (g.shadows.length) continue;
  const html = strip(g.html);
  if (html.length > 60000) continue;
  let j; try { const dom = createDom(html, { url: 'https://example.test/' }); j = summ(runa11yCoreOnDom(dom, { entryPointParity: false })); } catch (e) { console.log(JSON.stringify({ seed: s, jsdomThrow: String(e).slice(0, 200) })); continue; }
  const p = await ctx.newPage();
  let c;
  try {
    await p.setContent(html, { waitUntil: 'load', timeout: 20000 });
    await p.addScriptTag({ content: BUNDLE });
    c = await p.evaluate(() => JSON.parse(JSON.stringify(window.a11ycore.runa11yCoreInPage(location.href, null, {}, null))));
    c = summ(c);
  } catch (e) { console.log(JSON.stringify({ seed: s, chromeThrow: String(e).slice(0, 200) })); await p.close(); continue; }
  await p.close();
  const diffs = [];
  for (const k of new Set([...Object.keys(j), ...Object.keys(c)])) if (j[k] !== c[k]) diffs.push({ rule: k, jsdom: j[k], chromium: c[k] });
  console.log(JSON.stringify({ seed: s, diffs }));
}
await b.close();
