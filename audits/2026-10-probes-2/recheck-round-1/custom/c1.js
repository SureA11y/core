const { scan, cr } = require('./h');
const f = (ctx) => ({ outcome: 'pass', occurrences: [] });
for (const meta of [{ deprecated: true }, { i18n: {} }]) {
  for (const entry of ['node', 'inpage']) {
    const o = scan(null, { customRules: [{ id: 'z', meta, runInPage: f }] }, null, entry);
    console.log(entry, JSON.stringify(meta), 'err=', o.err && o.err.message, 'n=', o.res && o.res.checksResults.length, 'skipped=', JSON.stringify(o.res && o.res.skippedCustomRules), o.warns.filter(w=>/customRules/.test(w)));
  }
}
