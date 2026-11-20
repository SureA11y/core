const { deriveStandard, base } = require('./lib.js');
const b = base();
b.data[1].ruleMap = { 'aa-rule': { requirements: ['A'] }, 'zz-rule': { requirements: ['A'] }, 'ch-rule': { requirements: ['A'] }, 'h-rule': { requirements: ['A'] }, 'img-alt-present': { requirements: ['A'] } };
const out = deriveStandard([b], { format: 'surea11y-standard/1', key: 'der', standard: 'Der',
  versions: [{ version: '1', wcagVersion: '2.2', basedOn: [{ standard: 'base', version: '1' }] }],
  data: { 1: { requirements: { A: { basedOn: [{ standard: 'base', id: 'A' }] } }, ruleMap: {} } } });
console.log(Intl.DateTimeFormat().resolvedOptions().locale, Object.keys(out.data[1].ruleMap).join(' '));
