const L = require('./lib'); const { core } = L;
const show = (label, ro, eo) => {
  const s = L.scan(ro, eo);
  const g = L.capture(() => core.getRulesForRunOnly(ro, eo));
  const gc = L.capture(() => core.getChecksForRunOnly(ro, eo));
  const sr = s.value ? s.value.rulesResults.map((r) => r.ruleId + ':' + r.outcome) : [];
  const listed = g.value ? g.value.map((r) => r.id) : ['THROW ' + (g.error && g.error.message)];
  const scanIds = sr.map((x) => x.split(':')[0]);
  console.log(label, '\n   scan:', s.error ? 'THROW ' + s.error.message : 'checks=' + s.value.checksResults.map((c) => c.ruleId + ':' + c.outcome).join(',') + ' rollups=' + sr.join(','),
    '\n   list-same:', JSON.stringify(listed) === JSON.stringify(scanIds), listed.join(','), '| checks-list', gc.value ? gc.value.map((c) => c.ruleId).join(',') : 'THROW',
    '\n   warn:', s.warned.map((w) => w.slice(0, 220)));
};
const C = L.custom;
show('1 custom Org-X named org-x', { includeRuleIds: ['org-x'] }, { customRules: [C('Org-X', { wcagSc: ['1.1.1'], tags: ['org'] })] });
show('2 custom ORG-X and org-x both', { includeRuleIds: ['org-x'] }, { customRules: [C('ORG-X', { wcagSc: ['1.1.1'] }, 'pass'), C('org-x', { wcagSc: ['4.1.2'] }, 'fail')] });
show('2b custom ORG-X and org-x both, name ORG-X', { includeRuleIds: ['ORG-X'] }, { customRules: [C('ORG-X', { wcagSc: ['1.1.1'] }, 'pass'), C('org-x', { wcagSc: ['4.1.2'] }, 'fail')] });
show('3 custom IMG-ALT-PRESENT override', { includeRuleIds: ['img-alt-present'] }, { customRules: [C('IMG-ALT-PRESENT', { wcagSc: ['1.1.1'] }, 'pass')] });
show('3b override, unmapped', { includeRuleIds: ['IMG-ALT-PRESENT'] }, { customRules: [C('img-alt-present', {}, 'fail')] });
show('4 custom named like rollup case', { includeRuleIds: ['WCAG-1.1.1-NON-TEXT-CONTENT'] }, { customRules: [C('Wcag-1.1.1-Non-Text-Content', { wcagSc: ['1.1.1'] }, 'fail')] });
show('5 custom a11ycore-prefixed', { includeRuleIds: ['org-y'] }, { customRules: [C('a11ycore-org-y', { wcagSc: ['1.1.1'] }, 'fail')] });
show('6 exclude custom by upper', { tags: ['org'], excludeRuleIds: ['ORG-Z'] }, { customRules: [C('org-z', { wcagSc: ['1.1.1'], tags: ['org'] }), C('org-w', { wcagSc: ['4.1.2'], tags: ['org'] }, 'pass')] });
show('7 custom Kelvin id', { includeRuleIds: ['org-k'] }, { customRules: [C('org-K', { wcagSc: ['1.1.1'] })] });
