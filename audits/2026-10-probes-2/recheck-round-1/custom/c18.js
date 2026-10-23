const { scan, cr } = require('./h');
const P = "(ctx)=>({outcome:'pass',occurrences:[]})";
for (const entry of ['node','inpage']) for (const ro of [['z'], [' z '], ['org-tag'], [' org-tag ']]) {
  const o = scan(null, { customRules: [{ id: ' z ', meta: { tags: [' org-tag '] }, runInPage: P }] }, ro, entry);
  console.log(entry, JSON.stringify(ro), o.err ? 'THROW ' + o.err.message : 'n=' + o.res.checksResults.length + ' ids=' + o.res.checksResults.map(r=>JSON.stringify(r.ruleId)).join(','));
}
const o = scan(null, { customRules: [{ id: 'z', meta: { tags: [' org-tag '] }, runInPage: P }] }, null);
console.log('tag stored as', JSON.stringify(cr(o.res,'z') && cr(o.res,'z').meta));
