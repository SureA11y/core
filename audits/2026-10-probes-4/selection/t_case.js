const L = require('./lib'); const { core } = L;
const variants = {
  upper: 'LINK-NAME-PRESENT',
  kelvin: 'linK-name-present',          // KELVIN SIGN lowercases to k
  longS: 'link-name-preſent',           // long s: toLowerCase stays ſ; toUpperCase -> S
  dotlessI: 'lınk-name-present',         // dotless i
  dottedI: 'LİNK-NAME-PRESENT',          // İ lowercases to i + U+0307
  fullwidth: 'ｌｉｎｋ-name-present',
  prefixedUpper: 'A11YCORE-LINK-NAME-PRESENT',
  spaced: ' link-name-present ',
  rollupUpper: 'WCAG-2.4.4-LINK-PURPOSE-IN-CONTEXT',
  rollupPrefixed: 'a11ycore-WCAG-2.4.4-link-purpose-in-context',
};
const forms = {
  includeRuleIds: (id) => [{ includeRuleIds: [id] }, {}],
  shorthandArr: (id) => [[id], {}],
  shorthandStr: (id) => [id, {}],
  typeRule: (id) => [{ type: 'rule', values: [id] }, {}],
  includeTestIds: (id) => [{ includeTestIds: [id] }, {}],
  rulesInclude: (id) => [null, { rules: { include: [id] } }],
  rulesBare: (id) => [null, { rules: [id] }],
  testsInclude: (id) => [null, { tests: { include: [id] } }],
  excludeRuleIds: (id) => [{ tags: ['links'], excludeRuleIds: [id] }, {}],
  excludeTestIds: (id) => [{ tags: ['links'], excludeTestIds: [id] }, {}],
  rulesExclude: (id) => [null, { tags: { include: ['links'] }, rules: { exclude: [id] } }],
  testsExclude: (id) => [null, { tags: { include: ['links'] }, tests: { exclude: [id] } }],
};
for (const [vn, id] of Object.entries(variants)) {
  const row = [];
  for (const [fn, f] of Object.entries(forms)) {
    const [ro, eo] = f(id);
    const s = L.scan(ro, eo);
    const g = L.capture(() => core.getChecksForRunOnly(ro, eo));
    const gr = L.capture(() => core.getRulesForRunOnly(ro, eo));
    let r;
    if (s.error) r = 'THROW';
    else {
      const ran = s.value.checksResults.map((c) => c.ruleId);
      r = (ran.includes('link-name-present') ? '+lnp' : '-lnp') + '/' + ran.length + (s.warned.length ? '/W' : '');
      const lc = g.value ? g.value.map((x) => x.ruleId) : null;
      if (!lc || JSON.stringify(lc.sort()) !== JSON.stringify(ran.slice().sort())) r += '/CHK-DIFF';
      if (!gr.value || JSON.stringify(gr.value.map((x) => x.id)) !== JSON.stringify(s.value.rulesResults.map((x) => x.ruleId))) r += '/RUL-DIFF';
    }
    if ((g.error ? 1 : 0) !== (s.error ? 1 : 0)) r += '/THROWDIFF';
    row.push(fn + '=' + r);
  }
  console.log(vn.padEnd(15), row.join(' '));
}
// rules[ruleId] config with odd case
for (const key of ['LINK-NAME-PRESENT', 'linK-name-present', 'LİNK-NAME-PRESENT']) {
  const s = L.scan({ includeRuleIds: ['link-name-present'] }, { rules: { [key]: { severity: 'minor' } } });
  const c = s.value && s.value.checksResults.find((x) => x.ruleId === 'link-name-present');
  console.log('config', JSON.stringify(key), c && c.severity, s.warned.map((w) => w.slice(0, 160)));
}
