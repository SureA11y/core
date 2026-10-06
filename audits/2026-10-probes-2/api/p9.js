const { run } = require('./h');
const html = '<html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';
const obj = {
  runInPage(ctx) { return { outcome: 'pass', occurrences: [] }; },
  async asyncM(ctx) { return { outcome: 'pass', occurrences: [] }; },
  *gen(ctx) { yield 1; },
  ['comp' + 'uted'](ctx) { return { outcome: 'pass', occurrences: [] }; },
  'quoted-name'(ctx) { return { outcome: 'pass', occurrences: [] }; },
  get getter() { return 1; },
};
class K { static stat(ctx) { return { outcome: 'pass', occurrences: [] }; } #priv() {} m(ctx) { return { outcome:'pass', occurrences:[] }; } }
const srcs = {
  method: obj.runInPage.toString(),
  asyncMethod: obj.asyncM.toString(),
  generator: obj.gen.toString(),
  computed: obj.computed.toString(),
  quoted: obj['quoted-name'].toString(),
  getter: Object.getOwnPropertyDescriptor(obj,'getter').get.toString(),
  staticMethod: K.stat.toString(),
  classMethod: K.prototype.m.toString(),
  arrow: ((ctx) => ({ outcome: 'pass', occurrences: [] })).toString(),
  arrowNoParen: (ctx => ({ outcome: 'pass', occurrences: [] })).toString(),
  asyncArrow: (async (ctx) => ({ outcome: 'pass', occurrences: [] })).toString(),
  fnDecl: (function named(ctx) { return { outcome: 'pass', occurrences: [] }; }).toString(),
  withComment: '// leading comment\n(ctx) => ({ outcome: "pass", occurrences: [] })',
  trailingComment: '(ctx) => ({ outcome: "pass", occurrences: [] }) // trailing',
  blockTrailing: 'function (ctx) { return { outcome: "pass", occurrences: [] }; } /* c */',
  injection: '1); globalThis.__pwned = 1; (function(){ return {outcome:"pass",occurrences:[]} }',
  bound: (function(){}).bind(null).toString(),
  native: Math.max.toString(),
};
for (const [k, src] of Object.entries(srcs)) {
  const eo = { customRules: [{ id: 'zz', meta: {}, runInPage: src }] };
  globalThis.__pwned = 0;
  const r = run(html, null, eo, null);
  const c = r.checksResults.find(c=>c.ruleId==='zz');
  console.log(k.padEnd(16), c ? c.outcome + ' ' + (c.error||'') : 'SKIPPED ' + JSON.stringify(r.skippedCustomRules.map(s=>s.reason)), globalThis.__pwned ? 'PWNED-ran-extra-code':'');
}
