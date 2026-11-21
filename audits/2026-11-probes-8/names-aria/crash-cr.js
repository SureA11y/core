const { launch, runCase } = require('./harness');
const pieces = require('fs').readFileSync(__dirname+'/crash.js','utf8');
(async()=>{ const b=await launch(); const src = pieces.match(/const pieces = (\[[\s\S]*?\n\]);/)[1]; const P = eval(src);
 const t0=Date.now(); const out = await runCase(b, { id:'all', html: P.join('\n') });
 for (const r of out.res) if (r.error) console.log('ERR', r.ruleId, r.error.slice(0,300));
 console.log('rules', out.res.length, 'ms', Date.now()-t0); await b.close(); })();
