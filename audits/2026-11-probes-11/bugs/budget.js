const { js } = require('./h.js');
const html = '<!doctype html><html lang="en"><head><title>Budget test page</title></head><body><main><h1>x</h1><img src="a.png"></main></body></html>';
for (const v of [0, -1, NaN, '100', 1e-9, Infinity, -Infinity, null, 1.5, Number.MAX_VALUE]) {
  const warns = []; const ow = console.warn; console.warn = (...a) => warns.push(a.join(' ').slice(0,150));
  let out;
  try { const r = js(html, null, { timeBudgetMs: v }); out = `notRun=${(r.notRun||[]).length} incomplete=${JSON.stringify(r.engine && r.engine.incomplete)} rules=${r.checksResults.length}`; } catch (e) { out = 'THROW ' + e.message.slice(0,150); }
  console.warn = ow;
  console.log(String(v).padEnd(12), out, warns.join(' || '));
}
