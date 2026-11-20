const { sd, base, mkPack, runa11yCoreOnHtml } = require('./lib.js');
const d = base(); d.data[1].ruleMap['img-alt-present'] = { requirements: ['valueOf'] };
const st = sd.standardFromData(d);
console.log('validate():', JSON.stringify(st.validate(require('/home/user/core/src/index.js').CHECK_DEFS.map((c) => ({ ruleId: c.ruleId, wcagSc: c.wcagSc || [] })))));
const p = mkPack(st);
console.log('composites:', p.standard.composites().map((r) => r.id).join(' '));
console.log('mappingsFor img-alt-present:', JSON.stringify(p.standard.mappingsFor({ id: 'img-alt-present', wcagSc: ['1.1.1'] })).slice(0, 300));
const two = base(); two.data[1].tests = { 'A.1': { title: 'a', requirements: ['A'] } }; two.data[1].ruleMap = { 'img-alt-present': { requirements: ['valueOf'] } };
try { mkPack(sd.standardFromData(two)); console.log('two-level: accepted'); } catch (e) { console.log('two-level:', e.message.slice(0, 200)); }
