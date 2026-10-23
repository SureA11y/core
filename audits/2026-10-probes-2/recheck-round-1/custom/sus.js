const { scan, cr } = require('./h');
const F = "(ctx)=>({outcome:'fail',occurrences:[{message:'m'}]})";
for (const [k, app] of Object.entries({ syntax: 'function(ctx){ return', notFn: '42', body: 'return false;', number: 5, obj: {} })) for (const entry of ['node','inpage']) {
  const o = scan(null, { customRules: [{ id: 'z', meta: {}, applicability: app, runInPage: F }] }, ['z'], entry);
  const r = cr(o.res, 'z'); console.log('applicability', k, entry, r ? r.outcome + ' err=' + JSON.stringify(r.error||null) : 'MISSING', 'skipped=', JSON.stringify(o.res.skippedCustomRules), 'warns=', o.warns.length);
}
for (const [k, unc] of Object.entries({ badCode: { code: 'NOT_A_CODE', message: 'x' }, numCode: { code: 42 }, str: 'oops', lower: { code: 'background_overlap' } })) {
  const o = scan(null, { customRules: [{ id: 'z', meta: {}, runInPage: `(ctx)=>({outcome:'cantTell',occurrences:[{message:'m', uncertainty: ${JSON.stringify(unc)} }]})` }] }, ['z']);
  const r = cr(o.res, 'z'); console.log('uncertainty', k, r.outcome, 'occ.uncertainty=', JSON.stringify(r.occurrences[0].uncertainty), 'err=', JSON.stringify(r.error||null), 'warns=', o.warns.length);
}
