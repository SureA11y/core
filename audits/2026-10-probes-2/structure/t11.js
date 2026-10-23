const fs=require('fs'),path=require('path');
const run=require('/home/user/core/tests/helpers/runa11yCoreOnHtml.js');
const dir='/home/user/core/src/checks/manual';
const ids=fs.readdirSync(process.argv[2]||dir).map(f=>require(path.join(process.argv[2]||dir,f)).id);
const fx='/home/user/core/tests/fixtures';
const files=fs.readdirSync(fx).filter(f=>f.endsWith('.html'));
const bad={}; const FAILCHK=!process.argv[2];
for (const f of files) {
  const html=fs.readFileSync(path.join(fx,f),'utf8');
  let r; try { r=run(html,{runOnly:ids, entryPointParity:false}); } catch(e){ console.log('THROW',f,e.message); continue; }
  for (const x of r.checksResults) {
    if (FAILCHK && x.outcome==='fail' || x.error || (x.occurrences||[]).some(o=>o.occurrenceOutcome==='fail'||o.outcome==='fail')) { const k=x.ruleId+':'+x.outcome+(x.error?':'+x.error:''); (bad[k]=bad[k]||[]).push(f); }
  }
}
console.log(files.length, JSON.stringify(bad,null,1));
