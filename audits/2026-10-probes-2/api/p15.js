const { setup, core } = require('./h');
const fs=require('fs'); const path=require('path');
const dir='/home/user/core/tests/fixtures';
console.warn = ()=>{};
const agg = {};
function prep(html) {
  setup(html);
  const host = document.createElement('div'); host.id = 'host';
  const sr = host.attachShadow({ mode: 'open' });
  const main = document.createElement('main');
  while (document.body.firstChild) main.appendChild(document.body.firstChild);
  sr.appendChild(main);
  document.body.appendChild(host);
}
for (const f of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(dir,f),'utf8');
  for (const [lab, eo] of [['noShadow', { includeShadowDom: false }], ['exclHost', { excludeSelectors: ['#host'] }]]) {
    prep(html);
    let r; try { r = core.runa11yCoreInPage('u', null, eo, null); } catch(e) { console.log(f, e.message); continue; }
    for (const c of r.checksResults) for (const o of c.occurrences) {
      if (o.shadowHostSelectors && o.shadowHostSelectors.length) { const k = lab+' '+c.ruleId; if (!agg[k]) agg[k] = [f, c.outcome, (o.html||'').slice(0,80)]; }
    }
  }
}
for (const [k,v] of Object.entries(agg)) console.log(k, JSON.stringify(v));
console.log('done');
