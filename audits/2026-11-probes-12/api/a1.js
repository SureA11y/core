const H = require('./h.js');
const html = H.page('<img src="a.png">');
const run = (ctx) => ({ ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [ctx.helpers.reportOccurrence(document.querySelector('img'), { summary: 'x' })] });
const cases = { t: () => true, f: () => false, undef: () => undefined, zero: () => 0, one: () => 1, nul: () => null, sfalse: () => 'false', strue: () => 'true', objT: () => ({ applicable: true }), objF: () => ({ applicable: false }), objU: () => ({ applicable: 'yes' }), objEmpty: () => ({}), prom: () => Promise.resolve(true), thr: () => { throw new Error('boom'); }, boolObj: () => new Boolean(false), getter: () => ({ get applicable() { throw new Error('getter'); } }), thenable: () => ({ then() {} }), arr: () => [true] };
const rules = Object.entries(cases).map(([k, fn]) => ({ id: 'org-ap-' + k.toLowerCase(), meta: { title: k, tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] }, applicability: fn, runInPage: run }));
const { r, logs, err } = H.scan(html, { customRules: rules }, { type: 'rules', values: rules.map(x => x.id) });
if (err) console.log('ERR', err.message);
for (const c of r.checksResults) console.log(c.ruleId.padEnd(18), c.outcome.padEnd(14), (c.error || '').slice(0, 170));
console.log(logs.slice(0, 5));
