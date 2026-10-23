const { scan, cr } = require('./h');
const run = (s, meta) => { const o = scan(null, { customRules: [{ id: 'z', meta, runInPage: s }] }, ['z']); const r = cr(o.res, 'z'); return { r, o }; };
let x;
x = run("(ctx)=>({outcome:'pass',occurrences:[]})", { defaultSeverity: 'blocker' }); console.log('defaultSeverity blocker', x.r ? x.r.severity + ' ' + x.r.outcome : 'skipped ' + JSON.stringify(x.o.res.skippedCustomRules));
x = run("(ctx)=>({outcome:'pass',occurrences:[]})", { defaultConfidence: 'certain' }); console.log('defaultConfidence certain', x.r ? x.r.confidence : 'skipped ' + JSON.stringify(x.o.res.skippedCustomRules));
x = run("(ctx)=>({outcome:'fail',occurrences:[{message:'m'}]})", { type: 'Manual' }); console.log('type Manual', x.r ? x.r.type + ' ' + x.r.outcome : 'skipped ' + JSON.stringify(x.o.res.skippedCustomRules));
x = run("(ctx)=>({outcome:'fail',severity:'blocker',confidence:'certain',occurrences:[{message:'m',severity:'blocker',confidence:'certain'}]})", {}); console.log('returned severity blocker', x.r.severity, x.r.confidence, JSON.stringify(x.r.occurrences[0]).slice(0,300));
x = run("(ctx)=>({outcome:'fail',type:'manual',occurrences:[{message:'m'}]})", {}); console.log('returned type manual', x.r.type, x.r.outcome);
