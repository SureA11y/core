const { runa11yCoreOnHtml } = require('/home/user/core-r10/src/testing.js');
const html = '<!doctype html><html lang="en"><head><title>p</title></head><body><main><h1>h</h1><img src=a><img src=b></main></body></html>';
const tries = [ ['timeBudgetMs', Infinity], ['timeBudgetMs', 1e-300], ['timeBudgetMs', '100'], ['timeBudgetMs', -0], ['timeBudgetMs', null], ['timeBudgetMs', 2**60],
 ['output.maxOccurrencesPerRule', 1.5], ['output.maxOccurrencesPerRule', '3'], ['output.maxOccurrencesPerRule', Infinity], ['output.maxOccurrencesPerRule', 2**53], ['output.maxOccurrencesPerRule', null], ['output.maxOccurrencesPerRule', 0]];
for (const strict of [false, true]) for (const [k, v] of tries) {
  const eo = { strictOptions: strict }; if (k.startsWith('output.')) eo.output = { [k.slice(7)]: v }; else eo[k] = v;
  const warns = []; const W = console.warn; console.warn = (...a) => warns.push(a.join(' '));
  let out;
  try { const r = runa11yCoreOnHtml(html, { entryPointParity: false, engineOptions: eo }); out = `ok notRun=${(r.notRun||[]).length} incomplete=${JSON.stringify(r.engine.incomplete)} cap=${JSON.stringify(r.engine.occurrenceCap)} img-omitted=${(r.checksResults.find(c=>c.ruleId==='img-alt-present')||{}).occurrencesOmitted}`; }
  catch (e) { out = 'THROW ' + e.code + ' ' + e.message.slice(0,140); }
  console.warn = W;
  console.log(strict ? 'S' : '-', k, String(v), '=>', out, '| warns:', warns.filter(w=>/timeBudget|maxOcc|time budget/i.test(w)).map(w=>w.slice(0,140)));
}
