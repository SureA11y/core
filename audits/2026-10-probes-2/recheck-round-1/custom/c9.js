const { scan, cr } = require('./h');
const cases = {
  passWithOcc: "(ctx)=>({outcome:'pass',occurrences:[{message:'m'}]})",
  naWithOcc: "(ctx)=>({outcome:'notApplicable',occurrences:[{message:'m'}]})",
  failEmpty: "(ctx)=>({outcome:'fail',occurrences:[]})",
  failNoArr: "(ctx)=>({outcome:'fail',occurrences:'oops'})",
  nonObjOcc: "(ctx)=>({outcome:'fail',occurrences:[1,'s',null]})",
  textNode: "(ctx)=>({outcome:'fail',occurrences:[{__node: document.querySelector('p').firstChild}]})",
  docNode: "(ctx)=>({outcome:'fail',occurrences:[{__node: document}]})",
  plainObjNode: "(ctx)=>({outcome:'fail',occurrences:[{__node: {}}]})",
};
for (const [k, s] of Object.entries(cases)) for (const entry of ['node','inpage']) {
  const o = scan(null, { customRules: [{ id: 'z', meta: {}, runInPage: s }] }, ['z'], entry);
  const r = cr(o.res, 'z');
  console.log(k, entry, r.outcome, JSON.stringify(r.error||null), 'occ=', JSON.stringify(r.occurrences.map(x=>({sel:x.selector,sp:x.structuralPath, keys:Object.keys(x).length}))));
}
