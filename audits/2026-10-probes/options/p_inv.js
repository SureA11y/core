const fs=require('fs'),path=require('path');
const {run}=require('./h.js');
const dir='/home/user/core/tests/fixtures';
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.html'));
const ALLOWED=['fail','pass','cantTell','notApplicable'];
const combos=[{eo:{}},{eo:{wcagVersion:'2.1'}},{eo:{profile:'section508'}},{eo:{locale:'ja'}},{eo:{policyContract:'generic'}},{eo:{includeHiddenElements:true,includeShadowDom:false}},{eo:{fragment:true}},{ctx:'body'},{ctx:'#nope'},{eo:{output:{includeSelector:false,includeHtml:false}}},{eo:{excludeSelectors:'div'}}];
const viol={}; const add=(k,v)=>{(viol[k]=viol[k]||[]).push(v)};
let runs=0, nondet=0;
for (const f of files) {
  const html=fs.readFileSync(path.join(dir,f),'utf8');
  for (const [ci,c] of combos.entries()) {
    const x=run({...c,html, eo:{timestamp:'t',...(c.eo||{})}}); runs++;
    if (x.err) { add('throw', f+'#'+ci+' '+x.err.message.slice(0,80)); continue; }
    const r=x.r;
    for (const cr of [...r.checksResults, ...r.rulesResults]) {
      const tag=f+'#'+ci+' '+cr.ruleId;
      if (!ALLOWED.includes(cr.outcome)) add('badOutcome', tag+' '+cr.outcome);
      const expN = cr.outcome==='notApplicable'?'inapplicable':cr.outcome;
      if (cr.outcomeNormalized!==expN) add('normMismatch', tag+' '+cr.outcome+'/'+cr.outcomeNormalized);
      const occ=cr.occurrences||[];
      if (cr.outcome==='fail' && !occ.length && !cr.error && !r.rulesResults.includes(cr)) add('failNoOcc', tag);
      if ((cr.outcome==='pass'||cr.outcome==='notApplicable') && occ.length) add('passWithOcc', tag+' '+cr.outcome+' n='+occ.length+' '+(occ[0].summary||'').slice(0,50));
      if (cr.error) add('error', tag+' '+String(cr.error).slice(0,100));
      if (!['high','medium','low'].includes(cr.confidence)) add('badConf', tag+' '+cr.confidence);
      if (cr.engineOptions && cr.engineOptions.messages) add('echoMessages', tag);
      if (cr.type==='manual' && cr.outcome==='fail' && ci!==4) add('manualFail', tag);
    }
    if (r.contextMatch && r.contextMatch.elementCount===0 && [...r.checksResults,...r.rulesResults].some(c=>c.outcome!=='notApplicable')) add('emptyScopeNonNA', f+'#'+ci);
    if (ci===0) { const y=run({...c,html,eo:{timestamp:'t'}}); if (JSON.stringify(y.r)!==JSON.stringify(r)) { nondet++; add('nondet', f); } }
    try { structuredClone(r); } catch(e){ add('noclone', f+'#'+ci); }
  }
}
console.log('runs',runs,'nondet',nondet);
for (const [k,v] of Object.entries(viol)) { const u=[...new Set(v.map(s=>s.split(" ").slice(1,3).join(" ")))]; console.log('==',k,v.length,'unique',u.length); console.log('  '+u.slice(0,12).join('\n  ')); }
