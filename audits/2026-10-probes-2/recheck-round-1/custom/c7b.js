const { scan, cr } = require('./h');
const run = (s, meta={}) => { const o = scan(null, { customRules: [{ id: 'z', meta, runInPage: s }] }, ['z']); return cr(o.res, 'z'); };
let r = run("(ctx)=>({outcome:'fail',type:'manual',occurrences:[{message:'m'}]})"); console.log(JSON.stringify(r,null,0).slice(0,800));
r = run("(ctx)=>({outcome:'fail',severity:'blocker',occurrences:[{message:'m'}]})"); console.log('sev', r.severity, r.outcome, r.error);
r = run("(ctx)=>({outcome:'fail',severity:'critical',occurrences:[{message:'m'}]})"); console.log('sev critical', r.severity, r.outcome, r.error);
r = run("(ctx)=>({outcome:'fail',occurrences:[{message:'m', severity:'critical'}]})"); console.log('occ sev critical', r.severity, r.occurrences[0].severity);
