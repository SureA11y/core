const { setup, core } = require('./h');
const fs=require('fs'); const path=require('path');
const dir='/home/user/core/tests/fixtures';
console.warn = ()=>{};
const agg = {};
for (const f of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(dir,f),'utf8');
  setup(html);
  let r;
  try { r = core.runa11yCoreInPage('u', null, { excludeSelectors: ['body *'] }, null); } catch(e) { continue; }
  for (const c of r.checksResults) {
    for (const o of c.occurrences) {
      // locate element: does selector resolve to something inside body (not body itself)?
      let el = null; try { el = o.selector ? document.querySelector(o.selector) : null; } catch {}
      if (el && el !== document.body && document.body.contains(el)) {
        const k = c.ruleId; if (!agg[k]) agg[k] = [f, c.outcome, o.selector, (o.html||'').slice(0,80)];
      }
    }
  }
}
for (const [k,v] of Object.entries(agg)) console.log(k, JSON.stringify(v));
console.log('done');
