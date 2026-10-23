// run() given a list or a string where it takes an options object; unknown option warnings.
import { launch, open } from './h.mjs';
const b = await launch();
const { page, ctx } = await open(b, '<!doctype html><html lang=en><title>t</title><main><img src="data:,"></main>');
for (const f of ["['img-alt-present']", "'img-alt-present'", "{ foo: 1 }", "{ 0: 'x' }", "{ wcag: { version: '2.2', level: 'AA' } }", "{ bestPractices: true }", "{ includeRuleIds: ['img-alt-present'] }"]) {
  console.log(f.padEnd(45), JSON.stringify(await page.evaluate(async (f) => {
    const warns = []; const ow = console.warn; console.warn = (...a) => warns.push(a.join(' ').slice(0, 160));
    let a; try { const r = await a11ycore.run(eval('(' + f + ')')); a = r.checksResults.length + ' rules'; } catch (e) { a = 'THROW ' + e.message.slice(0, 140); }
    console.warn = ow; return { a, warns };
  }, f)));
}
await ctx.close(); await b.close();
