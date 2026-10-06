const { scan, cr } = require('./h');
for (const code of ['not-computable', 'Not-Computable', 'NOT_COMPUTABLE']) {
  const o = scan(null, { customRules: [{ id: 'z', meta: {}, runInPage: `(ctx)=>({outcome:'cantTell',occurrences:[{message:'m', uncertainty:{code:'${code}'}}]})` }] }, ['z']);
  const r = cr(o.res, 'z'); console.log(code, JSON.stringify(r.occurrences[0].uncertainty), JSON.stringify(r.error||null), o.warns.length);
}
