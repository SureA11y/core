// EN 301 549 deprecation in the browser bundle: notices, window left as it was, spelling variants, strictOptions.
import { launch, open } from './h.mjs';
const b = await launch();
const { page, ctx } = await open(b, '<!doctype html><html lang=en><title>t</title><main><img src="data:,"></main>');
const cases = [
  ['plain scan', {}],
  ['profile en301549-v4.1.1', { profile: 'en301549-v4.1.1' }],
  ['again (once per page?)', { profile: 'en301549-v4.1.1' }],
  ['profile EN301549-V4.1.1', { profile: 'EN301549-V4.1.1' }],
  ['mappings en301549', { mappings: 'en301549' }],
  ['mappings [EN301549]', { mappings: ['EN301549'] }],
  ['mappings en301549:V3.2.1', { mappings: 'en301549:V3.2.1' }],
  ['mappings en301549:v9', { mappings: 'en301549:v9' }],
  ['strict profile', { strictOptions: true, profile: 'en301549-v4.1.1' }],
  ['strict mappings', { strictOptions: true, mappings: ['en301549'] }],
  ['profile en301549-v3.2.1', { profile: 'en301549-v3.2.1' }]
];
for (const [label, eo] of cases) {
  const r = await page.evaluate(async (eo) => {
    const warns = []; const ow = console.warn; console.warn = (...a) => warns.push(a.join(' ').slice(0, 160));
    const sym = Symbol.for('surea11y.deprecatedStandardsWarned');
    let out; try { const r = a11ycore.runa11yCoreInPage(location.href, null, eo, null); out = { std: (r.standards || []).map((s) => s.standard + ' ' + (s.version || '')).join(','), en: r.rulesResults.filter((x) => /en301549|^9\./.test(x.ruleId)).length, map: ((r.checksResults.find((c) => c.ruleId === 'img-alt-present') || {}).normativeMappings || []).map((m) => (m.standard || '') + ':' + (m.requirement || m.sc || m.version)).slice(0, 3).join(' ') , prof: r.engine.profile }; } catch (e) { out = 'THROW ' + e.message.slice(0, 160); }
    console.warn = ow;
    return { out, warns, symOnWindow: Object.getOwnPropertySymbols(window).map(String).join(','), sym: sym in window };
  }, eo);
  console.log(label.padEnd(26), JSON.stringify(r));
}
await ctx.close(); await b.close();
