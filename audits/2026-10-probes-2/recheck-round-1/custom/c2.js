const { scan, cr } = require('./h');
const srcs = {
  shorthand: ({ runInPage(ctx) { return { outcome: 'fail', occurrences: [{ message: 'm' }] }; } }).runInPage.toString(),
  asyncShorthand: ({ async runInPage(ctx) { return { outcome: 'pass', occurrences: [] }; } }).runInPage.toString(),
  classMethod: (class { runInPage(ctx) { return { outcome: 'pass', occurrences: [] }; } }).prototype.runInPage.toString(),
  staticMethod: (class { static runInPage(ctx) { return { outcome: 'pass', occurrences: [] }; } }).runInPage.toString(),
  computedName: ({ ['run' + 'InPage'](ctx) { return { outcome: 'pass', occurrences: [] }; } }).runInPage.toString(),
  generator: ({ *runInPage(ctx) { } }).runInPage.toString(),
  getterLike: ({ get(ctx) { return { outcome: 'pass', occurrences: [] }; } }).get.toString(),
};
for (const [k, s] of Object.entries(srcs)) for (const entry of ['node','inpage']) {
  const o = scan(null, { customRules: [{ id: 'z', meta: { title: 'Z' }, runInPage: s }] }, ['z'], entry);
  const r = o.res && cr(o.res, 'z');
  console.log(k, entry, JSON.stringify(s.slice(0,40)), '->', o.err ? 'ERR ' + o.err.message : (r ? r.outcome + ' ' + (r.error||'') : 'MISSING, skipped=' + JSON.stringify(o.res.skippedCustomRules)+ ' n=' + o.res.checksResults.length));
}
