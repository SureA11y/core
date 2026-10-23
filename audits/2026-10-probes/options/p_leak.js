const fs=require('fs'),path=require('path');
const {run,core}=require('./h.js');
const dir='/home/user/core/tests/fixtures';
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.html'));
const same=JSON.parse(fs.readFileSync('/home/user/core/src/i18n-same-as-english.json','utf8'));
const leaks={}; let errs=0;
function collect(r){ const out={}; for(const c of [...r.checksResults,...r.rulesResults]){ out[c.ruleId+'#title']=c.title; out[c.ruleId+'#desc']=c.description; (c.occurrences||[]).forEach((o,i)=>{ out[c.ruleId+'#'+i+'#summary']=o.summary; out[c.ruleId+'#'+i+'#hint']=o.hint; }); } return out; }
for (const f of files){
  const html=fs.readFileSync(path.join(dir,f),'utf8');
  const en=run({html}); if(en.err){errs++;continue;}
  const E=collect(en.r);
  for (const loc of ['de','es','fr','ja']){
    const x=run({html,eo:{locale:loc}}); if(x.err){errs++;continue;}
    const L=collect(x.r);
    for (const k of Object.keys(E)){ if(E[k] && typeof E[k]==='string' && E[k].length>12 && L[k]===E[k]) { const key=loc+' '+k.replace(/#\d+#/,'#*#'); (leaks[key]=leaks[key]||new Set()).add(E[k].slice(0,90)); } }
  }
}
console.log('errs',errs);
for (const [k,v] of Object.entries(leaks)) console.log(k, '=>', [...v].slice(0,2).join(' || '));
