// Round 6 re-check of the register's open items on main (c1bb82de), in Chromium
// and jsdom: R5:VI-12 (rest), R5:KH-5 (rest), R5:AP-4 (rest), and the round-5
// decision leads NR 2, NR 4 and the AP lead.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const listenerHook = (() => { try { return fs.readFileSync('/home/user/core/surea11y.listener-hook.js', 'utf8'); } catch { return null; } })();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--force-color-profile=srgb'] });
async function scan(html, opts, { hook = false } = {}) {
  const p = await b.newPage();
  
  await p.setContent(html);
  await p.addScriptTag({ content: bundle });
  const r = await p.evaluate((o) => window.a11ycore.runa11yCoreInPage(null, null, o, null), opts);
  await p.close();
  return r;
}
const one = (r, id) => { const c = r.checksResults.find((x) => x.ruleId === id); return c ? `${c.outcome} ${c.occurrences.map((o) => o.data && o.data.details && o.data.details.reasonCode).join(',')}` : 'absent'; };
const page = (body, head = '') => `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body><main><h1>h</h1>${body}</main></body></html>`;

// R5:VI-12 (rest): generated text moved off the page by text-indent.
let r = await scan(page('<p id="a">Real text that passes</p>', '<style>body{background:#fff} #a::before{content:"Hidden";display:inline-block;text-indent:-9999px;color:#eee}</style>'), { rules: { include: 'contrast-minimum' } });
console.log('R5:VI-12 ::before text-indent:', one(r, 'contrast-minimum'));

// R5:AP-4 (rest): an unknown top-level key given to the console's run().
{
  const p = await b.newPage();
  await p.setContent(page('<img src="a.png">'));
  await p.addScriptTag({ content: bundle });
  const out = await p.evaluate(async () => {
    const warns = []; const ow = console.warn; console.warn = (...a) => warns.push(a.join(' '));
    const res = {};
    for (const [k, o] of [['foo', { foo: 1 }], ['engineOptions string', { engineOptions: 'x' }]]) {
      try { const x = await window.a11ycore.run(o); res[k] = `ran ${x && x.checksResults ? x.checksResults.length : '?'} rules, warns=${warns.length}`; }
      catch (e) { res[k] = 'throws ' + (e.code || e.message); }
      warns.length = 0;
    }
    console.warn = ow; return res;
  });
  console.log('R5:AP-4', JSON.stringify(out));
  await p.close();
}

// R5 NR lead 2: <li> in <ul role=group> / <ul role=navigation>.
r = await scan(page('<ul role="group"><li>One</li></ul><ul role="navigation"><li>Two</li></ul>'), { rules: { include: 'listitem-parent-valid' } });
console.log('NR lead 2 listitem-parent-valid:', one(r, 'listitem-parent-valid'));
// R5 NR lead 4: input whose list names no datalist, with aria-expanded.
r = await scan(page('<label>City <input list="nope" aria-expanded="false"></label>'), { rules: { include: 'aria-allowed-attr' } });
console.log('NR lead 4 aria-allowed-attr:', one(r, 'aria-allowed-attr'));
await b.close();

// AP lead: focus-not-removed-by-script's criteria.
const core = require('/home/user/core/src/index.js');
const meta = (core.listRules ? core.listRules() : []).find((x) => x.id === 'focus-not-removed-by-script' || x.ruleId === 'focus-not-removed-by-script');
console.log('AP lead focus-not-removed-by-script wcagSc:', meta && JSON.stringify(meta.wcagSc || (meta.meta && meta.meta.wcagSc)));
