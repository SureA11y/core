const { run, pick } = require('./h');
const body = function(ctx){ const els = ctx.helpers.queryAll('[onclick]'); return { outcome: els.length?'fail':'pass', occurrences: els.map(el=>({__node: el, summary:'x'})) }; };
const variants = {
  fn: body,
  str: body.toString(),
  arrowStr: "(ctx)=>({outcome:'pass',occurrences:[]})",
  asyncFn: async function(ctx){ return {outcome:'fail', occurrences:[]}; },
  asyncStr: "async (ctx)=>({outcome:'fail',occurrences:[]})",
  methodShorthand: ({ runInPage(ctx){ return {outcome:'pass',occurrences:[]}; } }).runInPage,
  methodShorthandStr: ({ runInPage(ctx){ return {outcome:'pass',occurrences:[]}; } }).runInPage.toString(),
  asyncMethodStr: ({ async runInPage(ctx){ return {outcome:'pass',occurrences:[]}; } }).runInPage.toString(),
  classMethodStr: (class A { static runInPage(ctx){ return {outcome:'pass',occurrences:[]}; } }).runInPage.toString(),
  minified: "function(n){return{outcome:'pass',occurrences:[]}}",
  fnDeclNamed: "function named(ctx){return{outcome:'pass',occurrences:[]}}",
  bodyOnly: "return {outcome:'pass',occurrences:[]}",
  closure: (()=>{ const SEL='[onclick]'; return (ctx)=>({outcome: ctx.helpers.queryAll(SEL).length?'fail':'pass', occurrences:[]}); })(),
  closureStr: (()=>{ const SEL='[onclick]'; return ((ctx)=>({outcome: ctx.helpers.queryAll(SEL).length?'fail':'pass', occurrences:[]})).toString(); })(),
  syntaxErr: "function(ctx){ return {",
  notFnStr: "42",
  generator: function*(ctx){ yield 1; },
};
for (const [k,v] of Object.entries(variants)) {
  const id='c-'+k.toLowerCase();
  const { res, err, warns } = run({ customRules:[{ id, meta:{title:k}, runInPage: v }] }, { includeRuleIds:[id] });
  const r = pick(res,id);
  console.log(k.padEnd(20), err? 'THROW '+err.message : (r? `outcome=${r.outcome} err=${r.error||''} occ=${r.occurrences.length} keys=${Object.keys(r).filter(x=>!['ruleId','title','description','i18n','outcome','outcomeNormalized','severity','confidence','type','meta','schemaVersion','occurrences','engineOptions','rollupIds'].includes(x))}` : `ABSENT (checks=${res.checksResults.length})`), warns.length? 'WARN:'+warns.join('|'):'');
}
