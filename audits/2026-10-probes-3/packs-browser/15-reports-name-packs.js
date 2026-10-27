'use strict';
// Whether a report says which packs produced it (engine.packs), which core
// rules they replaced (overriddenBuiltinIds) and which were skipped
// (skippedPacks): a Node scan with one valid pack overriding a core rule and
// one pack skipped for its core range.
const path = require('path');
const L = require('./lib');
const R = (m) => require(path.join(L.ROOT, 'src', m));
const good = L.packApi.definePack({ name: '@g/pack', version: '3.1.4', namespace: 'gg', core: '*', overrides: ['img-alt-present'], rules: [{ id: 'img-alt-present', runInPage: () => ({ outcome: 'pass' }) }, L.rule('gg-a', () => ({ outcome: 'pass' }))] });
const bad = { name: '@s/skipped', version: '1.0.0', namespace: 'ss', core: '^99.0.0' };
const { r, warnings } = L.quiet(() => L.scanNode({ packs: [good, bad] }));
const outputs = {
  html: R('report.js').renderHtmlReport(r),
  sarif: R('sarif.js').renderSarifReport(r),
  junit: R('junit.js').renderJunitReport(r),
  earl: JSON.stringify(R('earl.js').renderEarlReport(r))
};
L.log('result', { packs: r.engine.packs, overriddenBuiltinIds: r.overriddenBuiltinIds, skippedPacks: r.skippedPacks, warnings });
L.log('mentioned in each output', Object.fromEntries(Object.entries(outputs).map(([k, v]) => [k, { packName: v.includes('@g/pack'), packVersion: v.includes('3.1.4'), skipped: v.includes('@s/skipped'), overrideNoted: /overrid/i.test(v) }])));
