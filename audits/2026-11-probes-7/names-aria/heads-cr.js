const { launch } = require('./harness'); const fs=require('fs');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js','utf8');
const cases=[
 ['lvl', `<h1>A</h1><div role=heading aria-level=10 data-t=a>B</div><div role=heading aria-level="2e1" data-t=b>C</div><div role=heading aria-level="0" data-t=c>D</div><h2 aria-level="10" data-t=d>E</h2><h3 aria-level="-1" data-t=e>F</h3><div role=heading aria-level=" 3" data-t=f>G</div><div role=heading aria-level="3px" data-t=g>H</div><h4 aria-level="+2" data-t=h>I</h4><div role=heading aria-level="9" data-t=i>J</div>`],
 ['shadow-h1', `<x-h></x-h><h2>b</h2>`, ()=>customElements.define('x-h', class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<h1>Shadow title</h1>';}})],
 ['h-ws', `<h1>a</h1><h2 aria-level=" 3">b</h2>`],
];
(async()=>{ const b=await launch(); for (const [id,h,setup] of cases){ const p=await b.newPage(); await p.setContent(`<!doctype html><html lang=en><head><title>t</title></head><body><main>${h}</main></body></html>`); if(setup) await p.evaluate(setup);
 const cdp=await p.context().newCDPSession(p); const {nodes}=await cdp.send('Accessibility.getFullAXTree');
 console.log('==',id, nodes.filter(n=>n.role&&n.role.value==='heading').map(n=>`${n.name&&n.name.value}:L${(n.properties||[]).filter(x=>x.name==='level').map(x=>x.value.value)}`).join(' '));
 await p.addScriptTag({content:BUNDLE});
 const r=await p.evaluate(async()=>{const r=await window.a11ycore.runa11yCoreInPage(null,null,{rules:{include:['heading-order','page-has-heading-one']}},null); return r.checksResults.map(c=>c.ruleId+':'+c.outcome+' '+(c.occurrences||[]).map(o=>o.summary).join(' / '));});
 console.log(r.join('\n')); await p.close(); } await b.close(); })();
