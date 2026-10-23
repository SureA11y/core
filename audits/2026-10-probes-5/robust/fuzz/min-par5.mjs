// node min-par5.mjs <seed> <rule>: minimise a generated page on which jsdom and Chromium disagree for one rule.
import { createRequire } from 'node:module'; import fs from 'node:fs';
const req = createRequire(import.meta.url);
const { gen } = req('./gen5.js'); const { minimize } = req('./minimize.js');
const { createDom, runa11yCoreOnDom } = req('/home/user/core/src/testing.js');
const { chromium } = req('/home/user/core/node_modules/playwright');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8'); console.warn = () => {};
const [seed, rule] = [+process.argv[2], process.argv[3]];
const strip = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/ style="[^"]*"/g, '').replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/g, '').replace(/<(marquee|video|audio|embed|object)\b/g, '<span data-was="$1"').replace(/<\/(marquee|video|audio|embed|object)>/g, '</span>').replace(/ aria-modal="true"/g, '').replace(/ shadowrootmode="[^"]*"/g, '');
const f = (c) => c ? c.outcome + '/' + (c.occurrences || []).filter(o => o.tier !== 'pass').map(o => (o.data && o.data.details && o.data.details.reasonCode || '') + '@' + o.selector).sort().join(',') : 'missing';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage();
// The minimiser is synchronous; run Chromium through a synchronous bridge: precompute in batches is complex, so use deasync-free approach: a worker loop.
async function both(html) {
  const j = f(runa11yCoreOnDom(createDom(html), { entryPointParity: false, runOnly: [rule] }).checksResults.find(c => c.ruleId === rule));
  await p.setContent(html); await p.addScriptTag({ content: BUNDLE });
  const c = f(await p.evaluate((r) => window.a11ycore.runa11yCoreInPage(location.href, null, {}, [r]).checksResults.find(c => c.ruleId === r), rule));
  return [j, c];
}
// async delta-debugging over elements (remove, then unwrap), mirroring minimize.js
const { JSDOM } = req('/home/user/core/node_modules/jsdom');
let cur = strip(gen(seed).html);
let [j0, c0] = await both(cur); console.log('start', j0, '|', c0);
if (j0 === c0) { console.log('no disagreement'); process.exit(0); }
for (let round = 0; round < 8; round++) {
  let changed = false;
  for (const op of ['remove', 'unwrap', 'attr']) {
    for (let i = 0; ; i++) {
      const dom = new JSDOM(cur); const doc = dom.window.document;
      const els = [...doc.body.querySelectorAll('*')];
      let target, label;
      if (op === 'attr') { const all = els.flatMap(e => [...e.attributes].map(a => [e, a.name])); if (i >= all.length) break; [target, label] = all[i]; target.removeAttribute(label); }
      else { if (i >= els.length) break; target = els[i]; if (op === 'remove') target.remove(); else target.replaceWith(...target.childNodes); }
      const next = '<!doctype html>' + doc.documentElement.outerHTML;
      const [j, c] = await both(next);
      if (j !== c) { cur = next; changed = true; i--; }
    }
  }
  if (!changed) break;
}
const [j, c] = await both(cur); console.log(cur, '\njsdom   :', j, '\nchromium:', c);
await b.close();
