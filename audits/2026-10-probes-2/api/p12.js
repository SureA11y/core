const { setup, core } = require('./h');
const fs=require('fs'); const path=require('path');
const dir='/home/user/core/tests/fixtures';
console.warn = ()=>{};
const variants = [
  { includeHiddenElements: true },
  { locale: 'ja', visibilityMode: 'styleAndGeometry', contrast: { mode: 'auditorAssist' } },
  { fragment: true, includeShadowDom: false, output: { includeSelector: false, includeHtml: false } },
  { optInRules: 'all', mappings: 'en301549', policyContract: 'generic' },
];
for (const f of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(dir,f),'utf8');
  for (const eo of variants) {
    setup(html);
    let a, c;
    try { a = core.runa11yCoreInPage('u', null, eo, null); } catch(e) { console.log(f, 'inpage THROW', e.message); continue; }
    setup(html);
    try { c = core.runDomRulesInPage('u', null, eo, null); } catch(e) { console.log(f, 'node THROW', e.message); continue; }
    if (JSON.stringify(a) !== JSON.stringify(c)) {
      for (let i=0;i<a.checksResults.length;i++) if (JSON.stringify(a.checksResults[i])!==JSON.stringify(c.checksResults[i])) console.log(f, JSON.stringify(eo), 'diff', a.checksResults[i].ruleId, a.checksResults[i].outcome, c.checksResults[i].outcome, a.checksResults[i].error, '|', c.checksResults[i].error);
    }
  }
}
console.log('done');
