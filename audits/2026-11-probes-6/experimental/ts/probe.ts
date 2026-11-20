import { StandardData, standardFromData, standardDataOf, deriveStandard, lawOf, ruleMappedStandard, checkStandardData } from '/home/user/core/src/pack';

// T1: data with laws, top-level texts, per-version notes/review/texts, profile law: all valid per checkStandardData
const data: StandardData = {
  format: 'surea11y-standard/1', key: 'city', standard: 'City', lang: 'en',
  versions: [{ version: '1', wcagVersion: '2.2' }],
  data: { '1': {
    requirements: { A: { title: 'Images', laws: ['pub'] } },
    ruleMap: {},
  } },
  profiles: { 'city-1': { version: '1', law: 'pub' } },
  texts: { fr: { 'laws.pub.name': 'Loi' } }
};

// T2: standardDataOf result is frozen at runtime but typed mutable
const back = standardDataOf(standardFromData(data));
if (back) back.key = 'mutated';

// T3: deriveStandard own data is untyped: a typo is accepted
const d = deriveStandard([data], { formt: 'oops', anything: 1 });

// T4: StandardData.versions wcagVersion literal; schema/check accept any string
const v: StandardData['versions'][0] = { version: '1', wcagVersion: '2.2' };

// T5: ruleMappedStandard row 'asks' allowed without tests (no type error; runtime silently ignores)
ruleMappedStandard({ standard: 'S', tag: 's', versions: [{ version: '1', wcagVersion: '2.2' }], requirements: { '1': { A: { title: 'a' } } }, ruleMap: { '1': { r: { requirements: ['A'], asks: ['A'] } } } });
