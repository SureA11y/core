// openReport(): after a reportScript that loads but defines no report, can a second call with the right URL succeed?
import { launch, open, serve } from './h.mjs';
serve('window.x = 1;', { path: '/empty.js', type: 'text/javascript' });
const b = await launch();
for (let i = 0; i < 2; i++) {
  const { page, ctx } = await open(b, '<!doctype html><html lang=en><title>t</title><main><img src="data:,"></main>');
  console.log(await page.evaluate(async () => {
    const r = await a11ycore.run({ runOnly: ['img-alt-present'] });
    const out = [];
    for (const u of ['/empty.js', '/surea11y.report.js']) {
      try { out.push('ok ' + (await a11ycore.openReport(r, { reportScript: u })).slice(0, 10)); } catch (e) { out.push('ERR ' + e.message.slice(0, 90)); }
    }
    return out;
  }));
  await ctx.close();
}
await b.close();
