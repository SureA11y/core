const { scan, rule, brief, close } = require('./harness.js');
const RO = ['resize-text-content-loss'];
const doc = b => `<!doctype html><html lang="en"><head><title>t</title></head><body>${b}</body></html>`;
function deep(depth, leaves) { let open='', close=''; for (let i=0;i<depth;i++){ open+=`<div style="overflow:${i%50==0?'hidden':'visible'}">`; close+='</div>'; } return open + Array.from({length:leaves},(_,i)=>`<span>t${i} </span>`).join('') + close; }
function cards(n) { return Array.from({length:n},(_,i)=>`<div style="height:40px;overflow:hidden;width:300px"><span style="white-space:nowrap">Card ${i} with a title long enough to overflow its box surely</span></div>`).join(''); }
(async () => {
  for (const [name, html] of [['deep200x1000', deep(200,1000)], ['deep200x3000', deep(200,3000)], ['deep400x3000', deep(400,3000)], ['cards1000', cards(1000)], ['cards4000', cards(4000)]]) {
    const { r, ms } = await scan(doc(html), { runOnly: RO, eo: { perfStats: true } });
    const c = rule(r, RO[0]);
    console.log(name, 'scan ms', ms, c.outcome, (c.occurrences||[]).length, JSON.stringify(c.data||{}));
  }
  await close();
})();
