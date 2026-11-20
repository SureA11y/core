const Ajv = require('/home/user/core/node_modules/ajv');
const { checkStandardData } = require('/home/user/core/src/standard-data.js');
const schema = require('/home/user/core/src/schemas/standard.schema.json');
const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
const twoLevel = {
  format: 'surea11y-standard/1', key: 'two', standard: 'Two', lang: 'en',
  versions: [{ version: '1', wcagVersion: '2.1', published: '2026-02', basedOn: [{ standard: 'other', version: '3' }] }],
  options: { wcagCorrespondence: true },
  data: { 1: {
    groups: [{ id: 'img', title: 'Images', requirements: ['1.1'] }],
    requirements: { 1.1: { title: 'Images have an alternative', wcagSc: ['1.1.1'], tests: ['1.1.1'], basedOn: [{ standard: 'other', id: '9.1.1.1' }], partial: true, note: 'n', procedure: { steps: ['a'], passWhen: 'p', failWhen: 'f' } } },
    tests: { '1.1.1': { title: 'An <img> has alt', requirements: ['1.1'], scope: 'page' } },
    ruleMap: { 'img-alt-present': { requirements: ['1.1.1'], note: 'presence', reasonCodes: { IMG_ALT_MISSING: { outcome: 'fail' } } } },
    texts: { fr: { 'requirements.1.1.title': 'Images ont une alternative' } },
  } },
  profiles: { 'two-1': { version: '1', tags: ['wcag2a', 'two'], mappedRules: true, law: 'two-law' } },
  laws: { 'two-law': { name: 'L', jurisdiction: 'FR', sources: [{ title: 't', url: 'https://x.org' }] } },
  texts: { de: { 'laws.two-law.name': 'G' } },
};
const copy = (v) => JSON.parse(JSON.stringify(v));
console.log('base: checker', checkStandardData(twoLevel), 'schema', validate(twoLevel), JSON.stringify(validate.errors));
const paths = [];
(function walk(o, p) { if (o && typeof o === 'object') { for (const k of Object.keys(o)) { paths.push(p.concat(k)); walk(o[k], p.concat(k)); } } })(twoLevel, []);
const values = [null, 0, 1.5, -1, '', ' ', 'x', 'X Y', true, [], [''], ['x', 'x'], {}, { a: 1 }, '2.3', '2026-13', '2026-02-30', '1e3', 'http://x', 'https://', 'fr_FR', 'EN', '\u0000', 'a'.repeat(5000)];
let disagreements = [];
for (const p of paths) {
  for (const v of values.concat(['__delete__', '__extra__'])) {
    const d = copy(twoLevel);
    let o = d; for (const k of p.slice(0, -1)) o = o[k];
    const last = p[p.length - 1];
    if (v === '__delete__') delete o[last]; else if (v === '__extra__') { if (o[last] && typeof o[last] === 'object' && !Array.isArray(o[last])) o[last].zzExtra = 1; else continue; } else o[last] = v;
    let c; try { c = checkStandardData(d); } catch (e) { c = ['THROW ' + e.message]; }
    const s = validate(d);
    if (!s && c.length === 0) disagreements.push(p.join('.') + ' = ' + JSON.stringify(v).slice(0, 30) + ' :: schema says ' + validate.errors.map(e => e.instancePath + ' ' + e.message).slice(0, 2).join('; '));
    if (c.some(x => String(x).startsWith('THROW'))) disagreements.push('THROW ' + p.join('.') + ' ' + c[0]);
  }
}
console.log('schema refuses, checker accepts:', disagreements.length); for (const d of disagreements.slice(0, 40)) console.log('  ', d);
