const { scan, capture, pack } = require('./h.js');
const { mk } = require('./p.js');
const fail = (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body }] });
const ids = ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf', '', ' ', 'a b', 'x'.repeat(10000), 'Ünïcode', 'a b', '</script>', 'img-alt-present ', 'IMG-ALT-PRESENT', 'wcag2a', 'best-practice', 'a11ycore-img-alt-present', 'region'];
const custom = ids.map((id) => ({ id, meta: { tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] }, runInPage: fail }));
const r = scan({ customRules: custom, timestamp: 't' });
if (!r.ok) console.log('THROW', r.msg, r.stack);
else {
  const v = r.v;
  console.log('skipped', JSON.stringify(v.skippedCustomRules).slice(0, 1500));
  console.log('overridden', v.overriddenBuiltinIds);
  for (const id of ids) { const c = v.checksResults.filter((c) => c.ruleId === id || c.ruleId === id.toLowerCase()); console.log(JSON.stringify(id.slice(0, 30)), c.map((x) => x.outcome + (x.error ? ' err:' + String(x.error).slice(0, 100) : '')).join('|')); }
  const roll = v.rulesResults.find((x) => /1\.1\.1/.test(x.ruleId) || (x.ruleId || '').includes('111'));
  console.log('rollup', roll && roll.ruleId, roll && roll.outcome, roll && JSON.stringify(roll.data && roll.data.details && roll.data.details.customChecksIds).slice(0, 300));
  console.log('proto pollution?', ({}).polluted, Object.prototype.hasOwnProperty('outcome'), typeof ({}).outcome);
  console.log('warns', r.warns.slice(0, 5).map((w) => w.slice(0, 200)));
}
