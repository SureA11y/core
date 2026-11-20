const { definePack, standardFromData } = require('@surea11y/core/pack');
const data = {
  format: 'surea11y-standard/1', key: 'basepk', standard: 'Base Pack Std', lang: 'en',
  versions: [{ version: '1', wcagVersion: '2.2' }, { version: '2', wcagVersion: '2.2' }],
  data: {
    1: { requirements: { A: { title: 'Images v1', wcagSc: ['1.1.1'] } }, tests: { 'A.1': { title: 'alt', requirements: ['A'] } }, ruleMap: { 'img-alt-present': { requirements: ['A.1'] } } },
    2: { requirements: { A: { title: 'Images', wcagSc: ['1.1.1'] }, B: { title: 'Titles', wcagSc: ['2.4.2'] } },
         tests: { 'A.1': { title: 'alt', requirements: ['A'] }, 'B.1': { title: 'title', requirements: ['B'] } },
         ruleMap: { 'img-alt-present': { requirements: ['A.1'] }, 'page-title-present': { requirements: ['B.1'] } } }
  },
  profiles: { 'basepk-2': { version: '2', tags: ['basepk'], mappedRules: true } }
};
module.exports = definePack({ name: 'base-pack', version: '2.3.4', namespace: 'basepk', core: '~1.17.0', standard: standardFromData(data) });
