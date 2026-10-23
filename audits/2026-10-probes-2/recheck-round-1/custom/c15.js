const core = require('/home/user/core/src/index.js');
const eo = { customRules: [{ id: 'z', meta: { title: 'Z', helpUrl: 'https://x.test/z', tags: ['org-tag'] }, runInPage: (ctx) => ({ outcome: 'pass', occurrences: [] }) }] };
const cat = core.getChecksCatalog(eo); console.log('getChecksCatalog has z', cat.some(d => (d.ruleId||d.id) === 'z'), cat.length);
let d; try { d = core.getCheckDefById('z', eo); } catch (e) { d = 'THROW ' + e.message; } console.log('getCheckDefById', d);
let r; try { r = core.getChecksForRunOnly(['z'], eo); } catch (e) { r = 'THROW ' + e.message; } console.log('getChecksForRunOnly', Array.isArray(r) ? r.length + ' ' + JSON.stringify(r.map(x=>x.ruleId||x)).slice(0,100) : r);
try { console.log('getRulesCatalog has z', core.getRulesCatalog(eo).some(d => (d.ruleId||d.id)==='z')); } catch(e) { console.log('getRulesCatalog throw', e.message); }
