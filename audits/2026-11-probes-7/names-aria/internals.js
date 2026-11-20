const { launch, runCase, summarize, NAME_RULES } = require('./harness');
const cs=require('./corpus-shadow.js').filter(c=>/internals|closed/.test(c[0])).map(([id,html,setup])=>({id,html,setup}));
(async () => { const b = await launch(); for (const c of cs) console.log(summarize(c, await runCase(b,c,NAME_RULES))); await b.close(); })();
