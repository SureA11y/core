const { sd, deriveStandard, base, mkPack, pack, index } = require('./lib.js');
const tryIt = (label, fn) => { try { const r = fn(); console.log(label, '->', typeof r === 'string' ? r : JSON.stringify(r)); } catch (e) { console.log(label, '-> THROWS', e.constructor.name, e.message.slice(0, 250)); } };
const own = (id) => ({ format: 'surea11y-standard/1', key: 'der', standard: 'Der',
  versions: [{ version: '1', wcagVersion: '2.2', basedOn: [{ standard: 'base', version: '1' }] }],
  data: { 1: { requirements: { X: { basedOn: [{ standard: 'base', id }] } }, ruleMap: {} } } });
for (const id of ['toString', 'hasOwnProperty', 'valueOf', '__proto__', 'constructor', 'A']) tryIt(`basedOn id "${id}"`, () => deriveStandard([base()], own(id)).data[1].requirements.X);
tryIt('version basedOn version "toString"', () => { const o = own('A'); o.versions[0].basedOn = [{ standard: 'base', version: 'toString' }]; return deriveStandard([base()], o).data[1].requirements.X; });
tryIt('entry basedOn standard "toString"', () => { const o = own('A'); o.data[1].requirements.X.basedOn = [{ standard: 'toString', version: '1', id: 'A' }]; return deriveStandard([base()], o); });
// lawOf / profile law named like a prototype member
tryIt('profile law "tostring"-like valid id hasOwn ok', () => { const d = base(); d.laws = { l: { name: 'L', jurisdiction: 'FR' } }; d.profiles['base-1'].law = 'valueOf'; return sd.checkStandardData(d); });
// rule ids / requirement ids named like prototype members in a valid standard
tryIt('requirement "toString" + row naming it', () => { const d = base(); d.data[1].requirements.toString = { title: 'ts', wcagSc: ['1.1.1'] }; d.data[1].ruleMap['img-alt-present'] = { requirements: ['toString'] }; const p = mkPack(sd.standardFromData(d)); return p.standard.composites().map((r) => r.id); });
tryIt('groups referencing "hasOwnProperty" requirement that does not exist', () => { const d = base(); d.data[1].groups = [{ id: 'g', title: 'G', requirements: ['hasOwnProperty'] }]; return sd.checkStandardData(d); });
tryIt('test naming requirement "valueOf" (missing)', () => { const d = base(); d.data[1].tests = { t: { title: 't', requirements: ['valueOf'] } }; return sd.checkStandardData(d); });
tryIt('rule map naming requirement "valueOf" (missing) -> definePack', () => { const d = base(); d.data[1].ruleMap['img-alt-present'] = { requirements: ['valueOf'] }; mkPack(sd.standardFromData(d)); return 'accepted'; });
