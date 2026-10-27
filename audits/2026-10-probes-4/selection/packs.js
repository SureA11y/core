'use strict';
const { definePack, ruleMappedStandard, wcagTags } = require('/home/user/core/src/pack.js');
const VERSIONS = [{ version: '1.0', wcagVersion: '2.1' }, { version: '2.0', wcagVersion: '2.2' }];
const REQS = {
  P1: { title: 'Images', wcagSc: ['1.1.1'] },
  P2: { title: 'Headings in order', wcagSc: [] },
  P3: { title: 'Links named', wcagSc: ['2.4.4', '4.1.2'] },
  P4: { title: 'Ids unique', wcagSc: ['4.1.1'] }
};
const ROWS = {
  'img-alt-present': { requirements: ['P1'], note: 'n' },
  'heading-order': { requirements: ['P2'], note: 'n' },
  'probe-statement': { requirements: ['P2'], note: 'n' },
  'link-name-present': { requirements: ['P3'], note: 'n' },
  'duplicate-id': { requirements: ['P4'], note: 'n' }
};
const { mappingsFor, composites, validate, wcagTagsOf } = ruleMappedStandard({
  standard: 'Probe Standard', tag: 'probe', versions: VERSIONS,
  requirements: { '1.0': { ...REQS }, '2.0': { ...REQS, P4: { title: 'Ids unique', wcagSc: [] } } },
  ruleMap: { '1.0': { ...ROWS }, '2.0': { ...ROWS } }
});
const probeRule = {
  id: 'probe-statement',
  meta: { title: 'Statement link', description: 'd', tags: ['probe'], wcagSc: [] },
  runInPage: function (ctx) { return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [] }; }
};
const standardPack = definePack({
  name: 'probe-pack', version: '1.0.0', namespace: 'probe', core: '*', rules: [probeRule],
  standard: {
    key: 'probe', standard: 'Probe Standard', versions: ['1.0', '2.0'],
    profiles: {
      'probe-1.0': { version: '1.0', tags: ['probe'], mappedRules: true, wcagVersion: '2.1' },
      'probe-2.0': { version: '2.0', tags: ['probe'], mappedRules: true },
      'probe-2.0-plus': { version: '2.0', tags: ['probe'], mappedRules: true, rules: ['link-name-present'] },
      'probe-2.0-wcag': { version: '2.0', tags: wcagTagsOf('2.0').concat(['probe']), mappedRules: true, exclude: { criteria: ['2.4.4'] } }
    },
    ruleTag: 'probe', ruleMapped: true, mappingsFor, composites, validate
  }
});
const waivePack = definePack({
  name: 'waive-pack', version: '1.0.0', namespace: 'wv', title: 'Waive checklist', core: '*',
  profiles: {
    'wv-244': { tags: wcagTags('2.2'), exclude: { criteria: ['2.4.4'] } },
    'wv-412': { tags: wcagTags('2.2'), exclude: { criteria: ['4.1.2', '1.1.1'] } },
    'wv-rules': { tags: [], rules: ['link-name-present', 'contrast-enhanced', 'duplicate-id', 'region'], exclude: { criteria: ['2.4.4'] }, wcagVersion: '2.1' },
    'wv-mixed': { tags: ['wcag2a'], rules: ['contrast-enhanced'] },
    'wv-ruleex': { tags: wcagTags('2.2'), exclude: { rules: ['link-name-quality'] } }
  },
  rollups: [{ id: 'wv-links', title: 'Links', checksIds: ['link-name-present', 'link-name-quality'] }]
});
module.exports = { standardPack, waivePack };
