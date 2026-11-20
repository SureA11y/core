const { launch, runCase } = require('./harness');
const cs=require('./corpus-shadow.js').filter(c=>/internals/.test(c[0])).map(([id,html,setup])=>({id,html,setup}));
(async () => { const b = await launch(); for (const c of cs) { const o=await runCase(b,c,['button-name-present','binary-control-name-present','slider-name-present','form-control-programmatic-label-present']); console.log(c.id, o.res.map(r=>r.ruleId+':'+r.outcome).join(' ')); }
 // inspect on unnamed internals button
 const p=await b.newPage(); await p.setContent('<x-u tabindex=0></x-u>'); await p.evaluate(()=>customElements.define('x-u', class extends HTMLElement{constructor(){super(); this.attachInternals().role='button';}}));
 await p.addScriptTag({content:require('./harness').BUNDLE}); console.log(JSON.stringify(await p.evaluate(async()=>{console.table=()=>{}; return [await window.a11ycore.inspect('names',{draw:false}), (await window.a11ycore.runa11yCoreInPage(null,null,{rules:{include:['button-name-present']}},null)).checksResults[0].outcome];})));
 await b.close(); })();
