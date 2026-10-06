const { run } = require('./h');
const html = '<html lang="en"><head><title>t</title></head><body><main><img src="a.png"><button></button></main></body></html>';
const cnt = (r) => { const m={}; for (const c of r.checksResults) m[c.outcome]=(m[c.outcome]||0)+1; return JSON.stringify(m); };
const cntR = (r) => { const m={}; for (const c of r.rulesResults) m[c.outcome]=(m[c.outcome]||0)+1; return JSON.stringify(m); };
let r = run(html, null, { policy: { allowedOutcomes: ['pass','fail'] } });
console.log('no cantTell/NA', cnt(r), cntR(r), r.checksResults.find(c=>c.outcome==='cantTell')?.error);
r = run(html, null, { policyContract: { allowedOutcomes: [] } });
console.log('empty', cnt(r), cntR(r));
r = run(html, null, { policyContract: { allowedOutcomes: ['pass','fail','cantTell'] } });
console.log('no NA', cnt(r), cntR(r));
// custom rule error overwrite
const cr = (ret, meta={}) => ({ customRules: [{ id:'zz', meta, runInPage: new Function('ctx', 'return '+JSON.stringify(ret)) }] });
for (const [label, ret, meta] of [
  ['bad outcome + error', { outcome:'failed', error:'oops', occurrences:[] }, {}],
  ['bad outcome', { outcome:'failed', occurrences:[] }, {}],
  ['manual fail + error', { outcome:'fail', error:'oops', occurrences:[] }, { type:'manual' }],
  ['manual fail', { outcome:'fail', occurrences:[] }, { type:'manual' }],
  ['bad severity + error', { outcome:'pass', severity:'huge', error:'oops', occurrences:[] }, {}],
  ['fail empty occ', { outcome:'fail', occurrences:[] }, {}],
  ['occurrences not array', { outcome:'fail', occurrences: {a:1} }, {}],
  ['confidence bogus', { outcome:'pass', confidence:'certain', occurrences:[] }, {}],
]) {
  const r = run(html, null, cr(ret, meta), ['zz']);
  const c = r.checksResults[0];
  console.log(label, '=>', c.outcome, c.severity, c.confidence, JSON.stringify(c.error), c.occurrences.length);
}
