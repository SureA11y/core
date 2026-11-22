const H = require('./h.js');
const html = H.page('<img src="a.png">');
const opts = ["strictOptions","locale","wcagVersion","wcagLevel","profile","mappings","optInRules","logUntestedWcag","messages","includeHiddenElements","includeShadowDom","fragment","embeddedAriaHidden","embeddedInert","topLevelDocument","assumeModal","excludeSelectors","styleSheetTexts","timestamp","contrast","visibilityMode","includeMode","policyContract","policy","output","rules","tags","tests","customRules","packs","probes","perfStats","profileRules","timeBudgetMs","pingWaitTime","frameWaitTime"];
const throwing = new Proxy({}, { get() { throw new Error('PROXY-GET'); }, ownKeys() { throw new Error('PROXY-KEYS'); } });
const vals = { null: null, zero: 0, neg: -1, nan: NaN, inf: Infinity, empty: '', str: 'x', true: true, arr: [], obj: {}, arrNull: [null], fn: () => 1, big: 10n, date: new Date(), nullproto: Object.create(null), proxy: throwing, sym: Symbol('s'), hugeStr: 'a'.repeat(1e6) };
const rows = [];
for (const strict of [false, true]) for (const o of opts) for (const [vn, v] of Object.entries(vals)) {
  if (o === 'strictOptions' && strict) continue;
  const eo = { [o]: v }; if (strict) eo.strictOptions = true;
  const t0 = Date.now();
  const { r, logs, err } = H.scan(html, eo, ['img-alt-present']);
  const ms = Date.now() - t0;
  const res = err ? (err.code === 'INVALID_ENGINE_OPTIONS' || err.code === 'INVALID_RUN_ONLY' ? 'REFUSED' : 'THROW ' + (err.code || '') + ' ' + String(err.message).slice(0, 120)) : (r && r.checksResults ? 'ran:' + (r.checksResults[0] || {}).outcome : 'noresult');
  rows.push([strict ? 'S' : '-', o, vn, res, logs.length, ms]);
}
for (const x of rows) if (!/^REFUSED|^ran:fail$/.test(x[3]) || x[5] > 2000) console.log(x.join(' | '));
// strict: values accepted silently (ran without warning)
console.log('--- strict accepted with no warning (non-default-ish values):');
for (const x of rows) if (x[0] === 'S' && x[3].startsWith('ran') && x[4] === 0 && !['null'].includes(x[2])) console.log(x.slice(0, 4).join(' | '));
