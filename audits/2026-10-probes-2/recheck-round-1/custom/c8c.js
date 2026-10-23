const { scan, cr } = require('./h');
const o = scan(null, { customRules: [{ id: 'circ', meta: {}, runInPage: "(ctx)=>{ const o={summary:'s'}; o.self=o; return {outcome:'fail', occurrences:[o]}; }" }] }, ['circ'], 'inpage');
const r = cr(o.res,'circ'); console.log('self kept', r.occurrences[0].self === r.occurrences[0], r.error);
try { JSON.stringify(o.res); console.log('stringify ok'); } catch (e) { console.log('stringify ERR', e.message.split('\n')[0]); }
try { structuredClone(o.res); console.log('clone ok'); } catch (e) { console.log('clone ERR', e.message); }
const { renderSarifReport } = require('/home/user/core/src/sarif.js'); try { renderSarifReport(o.res); console.log('sarif ok'); } catch (e) { console.log('sarif ERR', e.message.split('\n')[0]); }
