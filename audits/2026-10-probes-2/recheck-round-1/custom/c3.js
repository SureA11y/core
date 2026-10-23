const { scan, cr } = require('./h');
const ok = (ctx) => ({ outcome: 'pass', occurrences: [] });
const cases = {
  missingId: [{ meta: {}, runInPage: ok }],
  syntaxErr: [{ id: 'z', meta: {}, runInPage: 'function (ctx) { return {' }],
  str42: [{ id: 'z', meta: {}, runInPage: '42' }],
  bodyOnly: [{ id: 'z', meta: {}, runInPage: "return { outcome: 'pass', occurrences: [] };" }],
  objectNotArray: { id: 'z', meta: {}, runInPage: ok },
  objectMap: { z: { id: 'z', meta: {}, runInPage: ok } },
};
for (const [k, c] of Object.entries(cases)) {
  for (const ro of [null, ['z']]) {
    const o = scan(null, { customRules: c }, ro);
    console.log(k, 'runOnly=', JSON.stringify(ro), '->', o.err ? 'THROW ' + (o.err.code||'') + ' ' + o.err.message.slice(0,150) : ('n=' + o.res.checksResults.length + ' skipped=' + JSON.stringify(o.res.skippedCustomRules) + ' warns=' + o.warns.length + ' ' + o.warns.join(' | ').slice(0,200)));
  }
}
