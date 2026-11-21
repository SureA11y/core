const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const r = runa11yCoreOnHtml('<html lang="en"><title>t</title><main><h1>x</h1></main></html>', { engineOptions: { output: { detail: 'findings' } }, entryPointParity: false });
const c = r.checksResults.find(c => c.outcome === 'pass');
console.log(r.engine.outputDetail, JSON.stringify(c), 'occurrences:', c.occurrences);
try { console.log(r.checksResults.map(c => c.occurrences.length).length); } catch (e) { console.log('TypeError:', e.message); }
