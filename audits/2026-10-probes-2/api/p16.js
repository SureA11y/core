const { setup, core } = require('./h');
const fs=require('fs'); const path=require('path');
const dir='/home/user/core/tests/fixtures';
console.warn = ()=>{};
const agg = {};
for (const f of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(dir,f),'utf8');
  setup(html);
  const scope = document.createElement('div'); scope.id = 'scope-x'; scope.innerHTML = '<p>Fine text</p>';
  document.body.appendChild(scope);
  let r; try { r = core.runa11yCoreInPage('u', '#scope-x', {}, null); } catch(e) { console.log(f, e.message); continue; }
  for (const c of r.checksResults) for (const o of c.occurrences) {
    let el = null; try { el = o.selector ? document.querySelector(o.selector) : null; } catch {}
    const k = c.ruleId; if (!agg[k]) agg[k] = [f, c.outcome, o.selector, (o.html||'').slice(0,80), el && scope.contains(el)];
  }
}
for (const [k,v] of Object.entries(agg)) console.log(k, JSON.stringify(v));
console.log('done');
