const { scan, capture, pack } = require('./h.js');
const { mk } = require('./p.js');
const J = JSON.parse;
const cases = {
  dictProtoKey: mk({ dictionaries: J('{"en": {"__proto__": "x", "acmeR_title": "T"}}') }),
  dictProtoLocale: mk({ dictionaries: J('{"__proto__": {"acmeR_title": "T"}}') }),
  dictCtorLocale: mk({ dictionaries: { constructor: { acmeR_title: 'T' } } }),
  dictToStringKey: mk({ dictionaries: { en: { toString: 'x', hasOwnProperty: 'y' } } }),
  dictValueNonString: mk({ dictionaries: { en: { acmeR_title: 5 } } }),
  dictValueObj: mk({ dictionaries: { en: { acmeR_title: { a: 1 } } } }),
  sevProto: mk({ profiles: { 'acme-p': { tags: [], rules: ['img-alt-present'], severity: J('{"__proto__": "critical"}') } } }),
  sevCtor: mk({ profiles: { 'acme-p': { tags: [], rules: ['img-alt-present'], severity: { constructor: 'critical' } } } }),
  sevNullProto: mk({ profiles: { 'acme-p': { tags: [], rules: ['img-alt-present'], severity: Object.assign(Object.create(null), { 'img-alt-present': 'critical' }) } } }),
  profileNullProto: mk({ profiles: Object.assign(Object.create(null), { 'acme-p': { tags: [] } }) }),
  profilesProtoKey: mk({ profiles: J('{"__proto__": {"tags": []}, "acme-p": {"tags": []}}') }),
  overridesCtor: mk({ overrides: ['constructor'] }),
  overridesProto: mk({ overrides: ['__proto__'] }),
  rollupProtoChecks: mk({ profiles: { 'acme-p': { tags: [] } }, rollups: [{ id: 'acme-x', title: 'X', checksIds: ['__proto__', 'constructor'] }] }),
  probesProto: mk({ probes: J('{"__proto__": {"description": "x", "readBy": ["acme-r"]}}') }),
  probesCtor: mk({ probes: { constructor: { description: 'x', readBy: ['acme-r'] } } }),
  excludeProto: mk({ profiles: { 'acme-p': { tags: [], exclude: J('{"__proto__": ["x"]}') } } }),
  profileTagsHoles: mk({ profiles: { 'acme-p': { tags: [, 'wcag2a'] } } }),
  profileRulesHoles: mk({ profiles: { 'acme-p': { tags: [], rules: [, 'img-alt-present'] } } }),
  versionProtoStd: mk({ version: '1.0.0-__proto__' }),
  nameProto: mk({ name: '@acme/__proto__' }),
  profileWcagVersionNum: mk({ profiles: { 'acme-p': { tags: [], wcagVersion: 2.1 } } }),
  profileWcagVersionProto: mk({ profiles: { 'acme-p': { tags: [], wcagVersion: '__proto__' } } }),
  coreRangeHuge: mk({ core: '>=1.0.0 '.repeat(20000) }),
  coreRangeOrs: mk({ core: Array(20000).fill('^1.11.0').join(' || ') }),
  coreRangeWeird: mk({ core: '^1.11.0 || ||' }),
  coreRangeX: mk({ core: '1.x.3' }),
  coreRangeSpaces: mk({ core: '>= 1.11.0' }),
  coreRangeHyphenNoSpace: mk({ core: '1.0.0-2.0.0' }),
};
for (const [name, p] of Object.entries(cases)) {
  const t = Date.now();
  const d = capture(() => pack.definePack(p));
  const r = scan({ packs: [d.ok ? d.v : p], profile: 'acme-p' }, null);
  const ms = Date.now() - t;
  const sev = r.ok ? (r.v.checksResults.find((c) => c.ruleId === 'img-alt-present') || {}).severity : '';
  const title = r.ok ? (r.v.checksResults.find((c) => c.ruleId === 'acme-r') || {}).title : '';
  console.log(name, ms + 'ms', '| define:', d.ok ? 'ok' : d.msg.slice(0, 150), '| scan:', r.ok ? JSON.stringify({ packs: r.v.engine.packs, skipped: r.v.skippedPacks && r.v.skippedPacks.map((s) => s.reason.slice(0, 150)), profile: r.v.engine.profile, sev, title }) : 'THROW[' + r.code + '] ' + r.msg.slice(0, 200));
}
console.log('pollution', ({}).critical, ({}).tags, Object.prototype.acmeR_title);
