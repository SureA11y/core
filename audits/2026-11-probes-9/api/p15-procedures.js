const c = require('@surea11y/core');
const p = c.proceduresFor('1.4.12');
console.log(JSON.stringify({standard:p.standard,id:p.id,title:p.title,locale:p.locale,level:p.level,complete:p.complete,rules:p.rules}), p.facets.map(f=>f.id+':'+f.automation+':'+f.rules.join('/')+':'+f.tools.map(t=>t.id)).join(' | '));
console.log('label', p.facets.find(f=>f.id==='text-spacing-content-loss')?.label);
const ci = c.procedureChecklist({ levels: ['A', 'AA'] }).items[0];
console.log(JSON.stringify({...ci, procedure: undefined, covers: ci.covers?.slice(0,3), rules: ci.rules?.slice(0,3)}));
console.log(JSON.stringify(c.procedureLanguages()));
const l = c.listProcedures(); console.log(l.standard, l.version, l.locale, JSON.stringify(l.scope), l.requirements.length, JSON.stringify(l.groups[0]).slice(0,200));
const l2 = c.listProcedures({ version: '2.1', levels: ['A','AA'] }); console.log('2.1 A/AA', l2.requirements.length, l2.requirements.some(r=>r.id==='4.1.1'), JSON.stringify(l2.scope));
const bp = c.listProcedures({ standard: 'best-practice' }); console.log('bp', bp.standard, bp.version, bp.requirements.length);
console.log(JSON.stringify(c.relatedRequirements('1.4.3')));
// bad inputs
for (const args of [['9.9.9'], ['1.4.3', {locale: 'xx'}], ['1.4.3', {version: '3.0'}], [null], [143]]) { try { const r = c.proceduresFor(...args); console.log('proceduresFor', JSON.stringify(args), r===null?'null':r.id+' '+r.locale+' '+r.title); } catch(e){ console.log('proceduresFor', JSON.stringify(args), 'THROWS', e.message.slice(0,200)); } }
for (const o of [{version:'3.0'}, {levels:['AAA+']}, {levels:'AA'}, {standard:'nope'}, {tools:'screenreader'}, {automation:['manualish']}, {locale:'de-AT'}]) { try { const r = c.listProcedures(o); console.log('listProcedures', JSON.stringify(o), r.version, r.locale, r.requirements.length, JSON.stringify(r.scope)); } catch(e){ console.log('listProcedures', JSON.stringify(o), 'THROWS', e.message.slice(0,200)); } }
