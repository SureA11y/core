// inspect('focus-order') vs real Tab order: radio groups, aria-hidden, shadow DOM order, slots, scroller.
import { launch, open } from './h.mjs';
const html = `<!doctype html><html lang=en><title>t</title><body><main>
<button id=A>A</button>
<div id=host></div>
<button id=C>C</button>
<fieldset><legend>g</legend><label><input type=radio name=g id=r1>1</label><label><input type=radio name=g id=r2 checked>2</label><label><input type=radio name=g id=r3>3</label></fieldset>
<fieldset><legend>h</legend><label><input type=radio name=h id=h1>1</label><label><input type=radio name=h id=h2>2</label></fieldset>
<div aria-hidden=true><a href=/x id=ah>hidden from AT, not from Tab</a></div>
<button id=D>D</button>
<div id=host2><button id=slotted slot=s>slotted</button></div>
<button id=E>E</button>
</main>
<script>
document.getElementById('host').attachShadow({mode:'open'}).innerHTML='<button id=B>B</button>';
document.getElementById('host2').attachShadow({mode:'open'}).innerHTML='<button id=S1>S1</button><slot name=s></slot><button id=S2>S2</button>';
</script></body></html>`;
const b = await launch();
for (let run = 0; run < 2; run++) {
  const { page, ctx } = await open(b, html);
  const rows = await page.evaluate(async () => (await a11ycore.inspect('focus-order', { draw: false })).map((r) => r.element));
  const real = [];
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    const id = await page.evaluate(() => { let e = document.activeElement; while (e && e.shadowRoot && e.shadowRoot.activeElement) e = e.shadowRoot.activeElement; return e ? e.id || e.tagName : ''; });
    if (real.includes(id) || id === 'BODY') break; real.push(id);
  }
  const full = await page.evaluate(() => a11ycore.runa11yCoreInPage(location.href, null, {}, null).checksResults.filter((c) => c.outcome !== 'pass' && c.outcome !== 'notApplicable').map((c) => c.ruleId + ':' + c.outcome + ':' + (c.occurrences || []).map((o) => o.selector).join(' ')));
  console.log('inspect:', rows.join(' , '));
  console.log('Tab    :', real.join(' , '));
  if (!run) console.log('engine:', full.filter((s) => /hidden|focus|radio/.test(s)).join('\n        '));
  await ctx.close();
}
await b.close();
