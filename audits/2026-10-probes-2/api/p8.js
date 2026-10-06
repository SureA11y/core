const { setup, core } = require('./h');
const fs=require('fs'); const path=require('path');
const dir='/home/user/core/tests/fixtures';
console.warn = ()=>{};
const strip = r => JSON.stringify(r);
let diffs = 0;
for (const f of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(dir,f),'utf8');
  setup(html);
  let a,b,c;
  try { a = core.runa11yCoreInPage('u', null, {}, null); b = core.runa11yCoreInPage('u', null, {}, null); c = core.runDomRulesInPage('u', null, {}, null);} catch(e) { console.log(f, 'THROW', e.message); continue; }
  if (strip(a)!==strip(b)) { diffs++; 
    for (let i=0;i<a.checksResults.length;i++) if (strip(a.checksResults[i])!==strip(b.checksResults[i])) console.log(f,'rerun diff', a.checksResults[i].ruleId);
  }
  if (strip(a)!==strip(c)) {
    for (let i=0;i<a.checksResults.length;i++) if (strip(a.checksResults[i])!==strip(c.checksResults[i])) console.log(f,'entry diff', a.checksResults[i].ruleId, c.checksResults[i] && c.checksResults[i].ruleId);
    for (let i=0;i<a.rulesResults.length;i++) if (strip(a.rulesResults[i])!==strip(c.rulesResults[i])) console.log(f,'rollup diff', a.rulesResults[i].ruleId);
  }
}
console.log('done', diffs);
