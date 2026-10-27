// Scan the ten new rules' fixtures in Chromium with the hooks on, plus a hostile-strings page, in five locales;
// write compact results to the scratchpad for the reporter probes.
import { launch, open } from './h.mjs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire('/home/user/core/package.json');
const core = req('/home/user/core/src/index.js');
const S = process.env.AUDIT_SCRATCH || '/tmp/surea11y-audit';
fs.mkdirSync(S, { recursive: true });
const init = core.listenerHookScript() + ';\n' + core.liveRegionHookScript();
const ids = ['aria-owns-valid', 'label-for-valid', 'widget-keyboard-focusable', 'aria-expanded-state-mismatch', 'invalid-field-error-message', 'focus-not-removed-by-script', 'click-handler-keyboard-operable', 'control-name-title-only', 'live-region-announcements', 'moving-content-pausable'];
const hostile = `<!doctype html><html lang=en><head><title>Hostile ]]> &amp; <x> "q" \u0000\u0007 \ud800</title></head><body><main>
<button aria-label="</script><script>alert(1)</script>" title="x"></button>
<img src="data:," data-x="]]>&lt;!--">
<div id="h-]]>&quot;" role=button onclick="1">]]&gt; \u0001 bell \u0007 lone \ud83d end</div>
<p style="color:#767676;background:#fff">Near threshold</p>
<div id=sh></div><script>document.getElementById('sh').attachShadow({mode:'open'}).innerHTML='<button></button><a href="#">‮evil‬</a>';</script>
</main></body></html>`;
const b = await launch();
const pages = ids.map((id) => [id, fs.readFileSync('/home/user/core/tests/fixtures/' + id + '-all-scenarios.html', 'utf8')]).concat([['hostile', hostile]]);
const out = {};
for (const [id, html] of pages) {
  const { page, ctx } = await open(b, html, { initScript: init });
  await page.waitForTimeout(300);
  for (const locale of ['en', 'de', 'es', 'fr', 'ja']) {
    if (locale !== 'en') await page.evaluate(fs.readFileSync('/home/user/core/surea11y.i18n.' + locale + '.js', 'utf8'));
    const r = await page.evaluate(async (l) => JSON.parse(JSON.stringify(await a11ycore.runa11yCoreInPageAsync(location.href, null, { locale: l }, null))), locale);
    out[id + '.' + locale] = r;
  }
  await ctx.close();
}
await b.close();
for (const [k, r] of Object.entries(out)) fs.writeFileSync(S + '/' + k + '.json', JSON.stringify(r));
console.log('wrote', Object.keys(out).length, 'results to', S);
const sum = (r) => r.checksResults.filter((c) => ids.includes(c.ruleId) && c.outcome !== 'notApplicable').map((c) => c.ruleId + ':' + c.outcome + ':' + c.occurrences.length).join(' ');
for (const id of ids) console.log(id, '=>', sum(out[id + '.en']));
